import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  Itinerary,
  Place,
  nameRegex,
  slugRegex,
  urlRegex,
  SUPPORTED_CURRENCIES,
} from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

/* ================================================================
   CONSTANTS
================================================================ */

const MAX_TITLE_LENGTH = 150;
const MAX_SLUG_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_DAY_TITLE_LENGTH = 150;
const MAX_ACTIVITY_TITLE_LENGTH = 150;
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 2000;
const MAX_ACTIVITY_TIME_LENGTH = 50;
const MAX_DAYS = 60;
const MAX_ACTIVITIES_PER_DAY = 50;
const MAX_GALLERY_IMAGES = 30;

/* ================================================================
   RESPONSE HELPER
================================================================ */

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

/* ================================================================
   OBJECT ID
================================================================ */

function isValidObjectId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

/* ================================================================
   STRING
================================================================ */

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ================================================================
   BOOLEAN
================================================================ */

function normalizeBoolean(value, fieldName, defaultValue) {
  if (value === undefined) {
    return {
      valid: true,
      value: defaultValue,
    };
  }

  if (typeof value === "boolean") {
    return {
      valid: true,
      value,
    };
  }

  return {
    valid: false,
    message: `${fieldName} must be a boolean.`,
  };
}

/* ================================================================
   TITLE
================================================================ */

function validateTitle(title) {
  const value = normalizeString(title);

  if (!value) {
    return {
      valid: false,
      message: "Title is required.",
    };
  }

  if (value.length < 2 || value.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      message: `Title must be between 2 and ${MAX_TITLE_LENGTH} characters.`,
    };
  }

  if (!nameRegex.test(value)) {
    return {
      valid: false,
      message: "Title must contain alphabets and spaces only.",
    };
  }

  return {
    valid: true,
    value,
  };
}

/* ================================================================
   SLUG
================================================================ */

function validateSlug(slug) {
  const value = normalizeString(slug).toLowerCase();

  if (!value) {
    return {
      valid: false,
      message: "Slug is required.",
    };
  }

  if (value.length > MAX_SLUG_LENGTH) {
    return {
      valid: false,
      message: `Slug cannot exceed ${MAX_SLUG_LENGTH} characters.`,
    };
  }

  if (!slugRegex.test(value)) {
    return {
      valid: false,
      message: "Slug may contain lowercase letters, numbers, and hyphens only.",
    };
  }

  return {
    valid: true,
    value,
  };
}

/* ================================================================
   DESCRIPTION
================================================================ */

function validateDescription(description) {
  const value = normalizeString(description);

  if (value.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
    };
  }

  return {
    valid: true,
    value,
  };
}

/* ================================================================
   CURRENCY
================================================================ */

function validateCurrency(currency) {
  const value = normalizeString(currency).toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(value)) {
    return {
      valid: false,
      message: "Currency must be INR or USD.",
    };
  }

  return {
    valid: true,
    value,
  };
}

/* ================================================================
   DURATION
================================================================ */

function validateDuration(duration) {
  if (!duration || typeof duration !== "object") {
    return {
      valid: false,
      message: "Duration is required.",
    };
  }

  const days = Number(duration.days);
  const nights = Number(duration.nights);

  if (!Number.isInteger(days) || days < 1) {
    return {
      valid: false,
      message: "Duration days must be a whole number of at least 1.",
    };
  }

  if (!Number.isInteger(nights) || nights < 0) {
    return {
      valid: false,
      message: "Duration nights must be a whole number of 0 or greater.",
    };
  }

  return {
    valid: true,
    value: {
      days,
      nights,
    },
  };
}

/* ================================================================
   IMAGE
================================================================ */

function normalizeImage(image, fieldName = "Image") {
  if (!image || typeof image !== "object") {
    return {
      valid: false,
      message: `${fieldName} is required.`,
    };
  }

  const url = normalizeString(image.url);
  const publicId = normalizeString(image.publicId);

  if (!url) {
    return {
      valid: false,
      message: `${fieldName} URL is required.`,
    };
  }

  if (!urlRegex.test(url)) {
    return {
      valid: false,
      message: `${fieldName} must contain a valid HTTP or HTTPS URL.`,
    };
  }

  if (!publicId) {
    return {
      valid: false,
      message: `${fieldName} publicId is required.`,
    };
  }

  return {
    valid: true,
    value: {
      url,
      publicId,
    },
  };
}

/* ================================================================
   GALLERY
================================================================ */

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return {
      valid: false,
      message: "Gallery must be an array.",
    };
  }

  if (gallery.length > MAX_GALLERY_IMAGES) {
    return {
      valid: false,
      message: `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images.`,
    };
  }

  const normalized = [];

  for (let index = 0; index < gallery.length; index += 1) {
    const result = normalizeImage(gallery[index], `Gallery image ${index + 1}`);

    if (!result.valid) {
      return result;
    }

    normalized.push(result.value);
  }

  return {
    valid: true,
    value: normalized,
  };
}

/* ================================================================
   BUDGET
================================================================ */

function normalizeEstimatedBudget(budget) {
  if (budget === undefined || budget === null || budget === "") {
    return {
      valid: true,
      value: undefined,
    };
  }

  if (typeof budget !== "object") {
    return {
      valid: false,
      message: "Estimated budget must be an object.",
    };
  }

  const min = Number(budget.min);
  const max = Number(budget.max);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {
      valid: false,
      message: "Estimated budget values must be valid numbers.",
    };
  }

  if (min < 0 || max < 0) {
    return {
      valid: false,
      message: "Estimated budget cannot be negative.",
    };
  }

  if (max < min) {
    return {
      valid: false,
      message: "Maximum budget cannot be less than minimum budget.",
    };
  }

  return {
    valid: true,
    value: {
      min,
      max,
    },
  };
}

/* ================================================================
   DAYS VALIDATION + NORMALIZATION
================================================================ */

async function validateAndNormalizeDays(days, destinationId) {
  if (!Array.isArray(days)) {
    return {
      valid: false,
      message: "Days must be an array.",
    };
  }

  if (days.length === 0) {
    return {
      valid: false,
      message: "At least one itinerary day is required.",
    };
  }

  if (days.length > MAX_DAYS) {
    return {
      valid: false,
      message: `Itinerary cannot contain more than ${MAX_DAYS} days.`,
    };
  }

  const normalizedDays = [];
  const usedDayNumbers = new Set();

  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const day = days[dayIndex];

    if (!day || typeof day !== "object") {
      return {
        valid: false,
        message: `Day ${dayIndex + 1} is invalid.`,
      };
    }

    const dayNumber =
      day.dayNumber === undefined ? dayIndex + 1 : Number(day.dayNumber);

    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      return {
        valid: false,
        message: `Day ${dayIndex + 1} must have a valid day number.`,
      };
    }

    if (usedDayNumbers.has(dayNumber)) {
      return {
        valid: false,
        message: `Day number ${dayNumber} is duplicated.`,
      };
    }

    usedDayNumbers.add(dayNumber);

    const title = normalizeString(day.title);

    if (!title) {
      return {
        valid: false,
        message: `Day ${dayIndex + 1} must have a title.`,
      };
    }

    if (title.length > MAX_DAY_TITLE_LENGTH) {
      return {
        valid: false,
        message: `Day ${dayIndex + 1} title cannot exceed ${MAX_DAY_TITLE_LENGTH} characters.`,
      };
    }

    if (!Array.isArray(day.activities)) {
      return {
        valid: false,
        message: `Activities for Day ${dayIndex + 1} must be an array.`,
      };
    }

    if (day.activities.length > MAX_ACTIVITIES_PER_DAY) {
      return {
        valid: false,
        message: `Day ${dayIndex + 1} cannot contain more than ${MAX_ACTIVITIES_PER_DAY} activities.`,
      };
    }

    const normalizedActivities = [];

    for (
      let activityIndex = 0;
      activityIndex < day.activities.length;
      activityIndex += 1
    ) {
      const activity = day.activities[activityIndex];

      if (!activity || typeof activity !== "object") {
        return {
          valid: false,
          message: `Activity ${activityIndex + 1} in Day ${
            dayIndex + 1
          } is invalid.`,
        };
      }

      const activityTitle = normalizeString(activity.title);

      if (!activityTitle) {
        return {
          valid: false,
          message: `Activity ${activityIndex + 1} in Day ${
            dayIndex + 1
          } must have a title.`,
        };
      }

      if (activityTitle.length > MAX_ACTIVITY_TITLE_LENGTH) {
        return {
          valid: false,
          message: `Activity ${activityIndex + 1} in Day ${
            dayIndex + 1
          } title cannot exceed ${MAX_ACTIVITY_TITLE_LENGTH} characters.`,
        };
      }

      const normalizedActivity = {
        title: activityTitle,
      };

      /* ----------------------------------------------------------
         TIME
      ---------------------------------------------------------- */

      if (activity.time !== undefined && activity.time !== null) {
        const time = normalizeString(activity.time);

        if (time.length > MAX_ACTIVITY_TIME_LENGTH) {
          return {
            valid: false,
            message: `Activity ${activityIndex + 1} in Day ${
              dayIndex + 1
            } has an invalid time.`,
          };
        }

        if (time) {
          normalizedActivity.time = time;
        }
      }

      /* ----------------------------------------------------------
         DESCRIPTION
      ---------------------------------------------------------- */

      if (activity.description !== undefined && activity.description !== null) {
        const activityDescription = normalizeString(activity.description);

        if (activityDescription.length > MAX_ACTIVITY_DESCRIPTION_LENGTH) {
          return {
            valid: false,
            message: `Activity ${activityIndex + 1} in Day ${
              dayIndex + 1
            } description cannot exceed ${MAX_ACTIVITY_DESCRIPTION_LENGTH} characters.`,
          };
        }

        if (activityDescription) {
          normalizedActivity.description = activityDescription;
        }
      }

      /* ----------------------------------------------------------
         PLACE
      ---------------------------------------------------------- */

      if (activity.place !== undefined && activity.place !== null) {
        const placeId = String(activity.place);

        if (!isValidObjectId(placeId)) {
          return {
            valid: false,
            message: `Invalid place ID in Activity ${
              activityIndex + 1
            } of Day ${dayIndex + 1}.`,
          };
        }

        const place = await Place.findById(placeId)
          .select("destination")
          .lean();

        if (!place) {
          return {
            valid: false,
            message: `Place not found: ${placeId}.`,
          };
        }

        if (
          place.destination &&
          place.destination.toString() !== destinationId.toString()
        ) {
          return {
            valid: false,
            message:
              "Selected place does not belong to the itinerary destination.",
          };
        }

        normalizedActivity.place = placeId;
      }

      normalizedActivities.push(normalizedActivity);
    }

    normalizedDays.push({
      dayNumber,
      title,
      activities: normalizedActivities,
    });
  }

  normalizedDays.sort((a, b) => a.dayNumber - b.dayNumber);

  return {
    valid: true,
    value: normalizedDays,
  };
}

/* ================================================================
   POPULATE
================================================================ */

function populateItinerary(query) {
  return query
    .populate("destination", "name slug")
    .populate("days.activities.place", "name slug category");
}

/* ================================================================
   MONGOOSE ERROR
================================================================ */

function getMongooseErrorMessage(error) {
  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors || {})
      .map((item) => item?.message)
      .filter(Boolean);

    return messages.length
      ? messages.join(" ")
      : "Itinerary validation failed.";
  }

  if (error?.name === "CastError") {
    return `Invalid value for ${error.path || "a field"}.`;
  }

  return error?.message || "Request failed.";
}

/* ================================================================
   CLOUDINARY DELETE
================================================================ */

async function deleteCloudinaryImage(image) {
  if (!image?.publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(image.publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.error(
      `Failed to delete Cloudinary image ${image.publicId}:`,
      error,
    );
  }
}

/* ================================================================
   COLLECT ITINERARY IMAGES
================================================================ */

function getItineraryImages(itinerary) {
  const images = [];

  if (itinerary?.coverImage?.publicId) {
    images.push(itinerary.coverImage);
  }

  if (Array.isArray(itinerary?.gallery)) {
    for (const image of itinerary.gallery) {
      if (image?.publicId) {
        images.push(image);
      }
    }
  }

  return images;
}

/* ================================================================
   DELETE ITINERARY IMAGES
================================================================ */

async function deleteItineraryImages(itinerary) {
  const images = getItineraryImages(itinerary);

  await Promise.all(images.map(deleteCloudinaryImage));
}

/* ================================================================
   GET ONE ITINERARY
================================================================ */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return errorResponse("Invalid itinerary ID.", 400);
    }

    await connectDB();

    const itinerary = await populateItinerary(Itinerary.findById(id)).lean();

    if (!itinerary) {
      return errorResponse("Itinerary not found.", 404);
    }

    return NextResponse.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    console.error("GET itinerary error:", error);

    return errorResponse("Failed to fetch itinerary.", 500);
  }
}

/* ================================================================
   PUT
   EDIT ITINERARY
================================================================ */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return errorResponse("Invalid itinerary ID.", 400);
    }

    await connectDB();

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body.", 400);
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid request body.", 400);
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return errorResponse("Itinerary not found.", 404);
    }

    /* ============================================================
       STATUS-ONLY UPDATE
    ============================================================ */

    if (
      Object.prototype.hasOwnProperty.call(body, "isActive") &&
      Object.keys(body).length === 1
    ) {
      const activeValidation = normalizeBoolean(
        body.isActive,
        "isActive",
        itinerary.isActive,
      );

      if (!activeValidation.valid) {
        return errorResponse(activeValidation.message, 400);
      }

      itinerary.isActive = activeValidation.value;

      await itinerary.save();

      const updated = await populateItinerary(Itinerary.findById(id)).lean();

      return NextResponse.json({
        success: true,
        message: itinerary.isActive
          ? "Itinerary activated successfully."
          : "Itinerary deactivated successfully.",
        data: updated,
      });
    }

    /* ============================================================
       DESTINATION
    ============================================================ */

    let destinationId = itinerary.destination?.toString();

    if (Object.prototype.hasOwnProperty.call(body, "destination")) {
      if (!body.destination || !isValidObjectId(String(body.destination))) {
        return errorResponse("Invalid destination ID.", 400);
      }

      const destinationExists = await Destination.exists({
        _id: body.destination,
      });

      if (!destinationExists) {
        return errorResponse("Destination not found.", 404);
      }

      destinationId = String(body.destination);

      itinerary.destination = body.destination;
    }

    /* ============================================================
       TITLE
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      const titleValidation = validateTitle(body.title);

      if (!titleValidation.valid) {
        return errorResponse(titleValidation.message, 400);
      }

      itinerary.title = titleValidation.value;
    }

    /* ============================================================
       SLUG
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "slug")) {
      const slugValidation = validateSlug(body.slug);

      if (!slugValidation.valid) {
        return errorResponse(slugValidation.message, 400);
      }

      const duplicate = await Itinerary.findOne({
        slug: slugValidation.value,
        _id: {
          $ne: itinerary._id,
        },
      }).lean();

      if (duplicate) {
        return errorResponse(
          "An itinerary with this slug already exists.",
          409,
        );
      }

      itinerary.slug = slugValidation.value;
    }

    /* ============================================================
       DESCRIPTION
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "description")) {
      const descriptionValidation = validateDescription(body.description);

      if (!descriptionValidation.valid) {
        return errorResponse(descriptionValidation.message, 400);
      }

      itinerary.description = descriptionValidation.value;
    }

    /* ============================================================
       DURATION
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "duration")) {
      const durationValidation = validateDuration(body.duration);

      if (!durationValidation.valid) {
        return errorResponse(durationValidation.message, 400);
      }

      itinerary.duration = durationValidation.value;
    }

    /* ============================================================
       CURRENCY
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "currency")) {
      const currencyValidation = validateCurrency(body.currency);

      if (!currencyValidation.valid) {
        return errorResponse(currencyValidation.message, 400);
      }

      itinerary.currency = currencyValidation.value;
    }

    /* ============================================================
       DAYS
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "days")) {
      const daysValidation = await validateAndNormalizeDays(
        body.days,
        destinationId,
      );

      if (!daysValidation.valid) {
        return errorResponse(daysValidation.message, 400);
      }

      itinerary.days = daysValidation.value;
    } else if (
      Object.prototype.hasOwnProperty.call(body, "destination") &&
      Array.isArray(itinerary.days)
    ) {
      /*
       * Destination changed but days were not
       * explicitly submitted. Revalidate the
       * existing places against the new destination.
       */
      const existingDays = itinerary.days.map((day) => ({
        dayNumber: day.dayNumber,
        title: day.title,
        activities: Array.isArray(day.activities)
          ? day.activities.map((activity) => ({
              title: activity.title,
              time: activity.time,
              description: activity.description,
              place: activity.place?.toString?.() || activity.place,
            }))
          : [],
      }));

      const daysValidation = await validateAndNormalizeDays(
        existingDays,
        destinationId,
      );

      if (!daysValidation.valid) {
        return errorResponse(daysValidation.message, 400);
      }

      itinerary.days = daysValidation.value;
    }

    /* ============================================================
       ESTIMATED BUDGET
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "estimatedBudget")) {
      const budgetValidation = normalizeEstimatedBudget(body.estimatedBudget);

      if (!budgetValidation.valid) {
        return errorResponse(budgetValidation.message, 400);
      }

      itinerary.estimatedBudget = budgetValidation.value;
    }

    /* ============================================================
       COVER IMAGE
    ============================================================ */

    let oldCoverImage = null;

    if (Object.prototype.hasOwnProperty.call(body, "coverImage")) {
      const imageValidation = normalizeImage(body.coverImage, "Cover image");

      if (!imageValidation.valid) {
        return errorResponse(imageValidation.message, 400);
      }

      oldCoverImage = itinerary.coverImage;

      itinerary.coverImage = imageValidation.value;
    }

    /* ============================================================
       GALLERY
    ============================================================ */

    let oldGallery = null;

    if (Object.prototype.hasOwnProperty.call(body, "gallery")) {
      const galleryValidation = normalizeGallery(body.gallery);

      if (!galleryValidation.valid) {
        return errorResponse(galleryValidation.message, 400);
      }

      oldGallery = Array.isArray(itinerary.gallery) ? itinerary.gallery : [];

      itinerary.gallery = galleryValidation.value;
    }

    /* ============================================================
       FEATURED
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "isFeatured")) {
      const featuredValidation = normalizeBoolean(
        body.isFeatured,
        "isFeatured",
        itinerary.isFeatured,
      );

      if (!featuredValidation.valid) {
        return errorResponse(featuredValidation.message, 400);
      }

      itinerary.isFeatured = featuredValidation.value;
    }

    /* ============================================================
       ACTIVE
    ============================================================ */

    if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
      const activeValidation = normalizeBoolean(
        body.isActive,
        "isActive",
        itinerary.isActive,
      );

      if (!activeValidation.valid) {
        return errorResponse(activeValidation.message, 400);
      }

      itinerary.isActive = activeValidation.value;
    }

    /* ============================================================
       SAVE
       Mongoose performs document/subdocument validation here.
    ============================================================ */

    await itinerary.save();

    /* ============================================================
       DELETE REMOVED CLOUDINARY IMAGES
    ============================================================ */

    const imagesToDelete = [];

    if (
      oldCoverImage?.publicId &&
      oldCoverImage.publicId !== itinerary.coverImage?.publicId
    ) {
      imagesToDelete.push(oldCoverImage);
    }

    if (oldGallery) {
      const currentGalleryIds = new Set(
        (itinerary.gallery || [])
          .map((image) => image?.publicId)
          .filter(Boolean),
      );

      for (const image of oldGallery) {
        if (image?.publicId && !currentGalleryIds.has(image.publicId)) {
          imagesToDelete.push(image);
        }
      }
    }

    await Promise.all(imagesToDelete.map(deleteCloudinaryImage));

    /* ============================================================
       RETURN UPDATED DOCUMENT
    ============================================================ */

    const updated = await populateItinerary(Itinerary.findById(id)).lean();

    return NextResponse.json({
      success: true,
      message: "Itinerary updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("PUT itinerary error:", error);

    if (error?.code === 11000) {
      return errorResponse("An itinerary with this slug already exists.", 409);
    }

    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return errorResponse(getMongooseErrorMessage(error), 400);
    }

    return errorResponse("Failed to update itinerary.", 500);
  }
}

/* ================================================================
   PATCH
   STATUS-ONLY UPDATE
================================================================ */

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return errorResponse("Invalid itinerary ID.", 400);
    }

    await connectDB();

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.isActive !== "boolean"
    ) {
      return errorResponse("isActive must be a boolean.", 400);
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return errorResponse("Itinerary not found.", 404);
    }

    itinerary.isActive = body.isActive;

    await itinerary.save();

    const updated = await populateItinerary(Itinerary.findById(id)).lean();

    return NextResponse.json({
      success: true,
      message: body.isActive
        ? "Itinerary activated successfully."
        : "Itinerary deactivated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("PATCH itinerary error:", error);

    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return errorResponse(getMongooseErrorMessage(error), 400);
    }

    return errorResponse("Failed to update itinerary status.", 500);
  }
}

/* ================================================================
   DELETE
   PERMANENT DATABASE + CLOUDINARY DELETE
================================================================ */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return errorResponse("Invalid itinerary ID.", 400);
    }

    await connectDB();

    /* ------------------------------------------------------------
       FIND FIRST
       Images are needed before MongoDB deletion.
    ------------------------------------------------------------ */

    const itinerary = await Itinerary.findById(id).lean();

    if (!itinerary) {
      return errorResponse("Itinerary not found.", 404);
    }

    /* ------------------------------------------------------------
       DELETE MONGODB FIRST
       Cloudinary cleanup is independent and should not prevent
       successful database deletion.
    ------------------------------------------------------------ */

    await Itinerary.findByIdAndDelete(id);

    /* ------------------------------------------------------------
       DELETE CLOUDINARY IMAGES
    ------------------------------------------------------------ */

    await deleteItineraryImages(itinerary);

    return NextResponse.json({
      success: true,
      message:
        "Itinerary permanently deleted from the database and Cloudinary.",
    });
  } catch (error) {
    console.error("DELETE itinerary error:", error);

    if (error?.name === "CastError") {
      return errorResponse(getMongooseErrorMessage(error), 400);
    }

    return errorResponse("Failed to permanently delete itinerary.", 500);
  }
}

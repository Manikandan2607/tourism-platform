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
   RESPONSE HELPERS
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
   STRING HELPERS
================================================================ */

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ================================================================
   BOOLEAN VALIDATION
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
   TITLE VALIDATION
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
   SLUG VALIDATION
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
   DESCRIPTION VALIDATION
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
   CURRENCY VALIDATION
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
   DURATION VALIDATION
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
   IMAGE VALIDATION
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
   GALLERY VALIDATION
================================================================ */

function normalizeGallery(gallery) {
  if (gallery === undefined) {
    return {
      valid: true,
      value: [],
    };
  }

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
   BUDGET VALIDATION
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

      if (activity.place !== undefined && activity.place !== null) {
        if (!isValidObjectId(String(activity.place))) {
          return {
            valid: false,
            message: `Invalid place ID in Activity ${
              activityIndex + 1
            } of Day ${dayIndex + 1}.`,
          };
        }

        const placeId = String(activity.place);

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
   POPULATE HELPER
================================================================ */

function populateItinerary(query) {
  return query
    .populate("destination", "name slug")
    .populate("days.activities.place", "name slug category");
}

/* ================================================================
   MONGOOSE ERROR HELPER
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
   GET ALL ITINERARIES
================================================================ */

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const itineraries = await populateItinerary(
      Itinerary.find({}).sort({ createdAt: -1 }),
    ).lean();

    return NextResponse.json({
      success: true,
      count: itineraries.length,
      data: itineraries,
    });
  } catch (error) {
    console.error("GET itineraries error:", error);

    return errorResponse("Failed to fetch itineraries.", 500);
  }
}

/* ================================================================
   CREATE ITINERARY
================================================================ */

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
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

    const {
      destination,
      title,
      slug,
      duration,
      description,
      days,
      estimatedBudget,
      coverImage,
      gallery,
      currency = "INR",
      isFeatured,
      isActive,
    } = body;

    /* ------------------------------------------------------------
       DESTINATION
    ------------------------------------------------------------ */

    if (!destination) {
      return errorResponse("Destination is required.", 400);
    }

    if (!isValidObjectId(String(destination))) {
      return errorResponse("Invalid destination ID.", 400);
    }

    const destinationExists = await Destination.exists({
      _id: destination,
    });

    if (!destinationExists) {
      return errorResponse("Destination not found.", 404);
    }

    /* ------------------------------------------------------------
       TITLE
    ------------------------------------------------------------ */

    const titleValidation = validateTitle(title);

    if (!titleValidation.valid) {
      return errorResponse(titleValidation.message, 400);
    }

    /* ------------------------------------------------------------
       SLUG
    ------------------------------------------------------------ */

    const slugValidation = validateSlug(slug);

    if (!slugValidation.valid) {
      return errorResponse(slugValidation.message, 400);
    }

    const normalizedSlug = slugValidation.value;

    const existingItinerary = await Itinerary.findOne({
      slug: normalizedSlug,
    }).lean();

    if (existingItinerary) {
      return errorResponse("Itinerary slug already exists.", 409);
    }

    /* ------------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------------ */

    const descriptionValidation = validateDescription(description);

    if (!descriptionValidation.valid) {
      return errorResponse(descriptionValidation.message, 400);
    }

    /* ------------------------------------------------------------
       DURATION
    ------------------------------------------------------------ */

    const durationValidation = validateDuration(duration);

    if (!durationValidation.valid) {
      return errorResponse(durationValidation.message, 400);
    }

    /* ------------------------------------------------------------
       CURRENCY
    ------------------------------------------------------------ */

    const currencyValidation = validateCurrency(currency);

    if (!currencyValidation.valid) {
      return errorResponse(currencyValidation.message, 400);
    }

    /* ------------------------------------------------------------
       DAYS
    ------------------------------------------------------------ */

    const daysValidation = await validateAndNormalizeDays(days, destination);

    if (!daysValidation.valid) {
      return errorResponse(daysValidation.message, 400);
    }

    /* ------------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------------ */

    const coverImageValidation = normalizeImage(coverImage, "Cover image");

    if (!coverImageValidation.valid) {
      return errorResponse(coverImageValidation.message, 400);
    }

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    const galleryValidation = normalizeGallery(gallery);

    if (!galleryValidation.valid) {
      return errorResponse(galleryValidation.message, 400);
    }

    /* ------------------------------------------------------------
       ESTIMATED BUDGET
    ------------------------------------------------------------ */

    const budgetValidation = normalizeEstimatedBudget(estimatedBudget);

    if (!budgetValidation.valid) {
      return errorResponse(budgetValidation.message, 400);
    }

    /* ------------------------------------------------------------
       FEATURED
    ------------------------------------------------------------ */

    const featuredValidation = normalizeBoolean(
      isFeatured,
      "isFeatured",
      false,
    );

    if (!featuredValidation.valid) {
      return errorResponse(featuredValidation.message, 400);
    }

    /* ------------------------------------------------------------
       ACTIVE
    ------------------------------------------------------------ */

    const activeValidation = normalizeBoolean(isActive, "isActive", true);

    if (!activeValidation.valid) {
      return errorResponse(activeValidation.message, 400);
    }

    /* ------------------------------------------------------------
       CREATE
    ------------------------------------------------------------ */

    const itinerary = await Itinerary.create({
      destination,

      title: titleValidation.value,

      slug: normalizedSlug,

      duration: durationValidation.value,

      description: descriptionValidation.value,

      days: daysValidation.value,

      estimatedBudget: budgetValidation.value,

      currency: currencyValidation.value,

      coverImage: coverImageValidation.value,

      gallery: galleryValidation.value,

      isFeatured: featuredValidation.value,

      isActive: activeValidation.value,
    });

    /* ------------------------------------------------------------
       RETURN POPULATED DOCUMENT
    ------------------------------------------------------------ */

    const populatedItinerary = await populateItinerary(
      Itinerary.findById(itinerary._id),
    ).lean();

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary created successfully.",
        data: populatedItinerary,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST itinerary error:", error);

    if (error?.code === 11000) {
      return errorResponse("An itinerary with this slug already exists.", 409);
    }

    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return errorResponse(getMongooseErrorMessage(error), 400);
    }

    return errorResponse("Failed to create itinerary.", 500);
  }
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  Restaurant,
  SUPPORTED_CURRENCIES,
  nameRegex,
  phoneRegex,
  slugRegex,
  urlRegex,
} from "@/utils/schema";

import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

/* ================================================================
   CONSTANTS
================================================================ */

const ALLOWED_PRICE_RANGES = ["budget", "moderate", "expensive", "luxury"];

const ALLOWED_FOOD_TYPES = ["veg", "non-veg", "both"];

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
   JSON HELPER
================================================================ */

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/* ================================================================
   STRING HELPERS
================================================================ */

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* ================================================================
   IMAGE HELPERS
================================================================ */

function normalizeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  const url = normalizeString(image.url);
  const publicId = normalizeString(image.publicId);

  if (!url || !publicId) {
    return null;
  }

  return {
    url,
    publicId,
  };
}

function validateImage(image, fieldName = "Image") {
  const normalizedImage = normalizeImage(image);

  if (!normalizedImage) {
    return {
      value: null,
      error: `${fieldName} must contain a valid URL and Cloudinary publicId.`,
    };
  }

  if (!urlRegex.test(normalizedImage.url)) {
    return {
      value: null,
      error: `${fieldName} must contain a valid HTTP or HTTPS URL.`,
    };
  }

  if (normalizedImage.publicId.length > 500) {
    return {
      value: null,
      error: `${fieldName} publicId is too long.`,
    };
  }

  return {
    value: normalizedImage,
    error: null,
  };
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return {
      value: [],
      error: "Gallery must be an array.",
    };
  }

  const normalizedGallery = [];

  for (let index = 0; index < gallery.length; index += 1) {
    const result = validateImage(gallery[index], `Gallery image ${index + 1}`);

    if (result.error) {
      return {
        value: [],
        error: result.error,
      };
    }

    normalizedGallery.push(result.value);
  }

  return {
    value: normalizedGallery,
    error: null,
  };
}

/* ================================================================
   STRING ARRAY HELPERS
================================================================ */

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    return {
      value: [],
      error: `${fieldName} must be an array.`,
    };
  }

  const normalized = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return {
        value: [],
        error: `${fieldName} must contain text values only.`,
      };
    }

    const text = item.trim();

    if (!text) {
      continue;
    }

    normalized.push(text);
  }

  return {
    value: normalized,
    error: null,
  };
}

/* ================================================================
   COORDINATE HELPER
================================================================ */

function parseCoordinate(value, fieldName, min, max) {
  if (value === undefined || value === null || value === "") {
    return {
      value: undefined,
      error: null,
    };
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return {
      value: undefined,
      error: `${fieldName} must be a valid number.`,
    };
  }

  if (number < min || number > max) {
    return {
      value: undefined,
      error: `${fieldName} must be between ${min} and ${max}.`,
    };
  }

  return {
    value: number,
    error: null,
  };
}

/* ================================================================
   PHONE HELPER
================================================================ */

function normalizePhone(value) {
  if (value === undefined || value === null || value === "") {
    return {
      value: "",
      error: null,
    };
  }

  if (typeof value !== "string") {
    return {
      value: "",
      error: "Contact phone must be a string.",
    };
  }

  const raw = value.trim();

  if (!/^\+?[0-9\s().-]+$/.test(raw)) {
    return {
      value: "",
      error: "Contact phone contains invalid characters.",
    };
  }

  const digits = raw.replace(/\D/g, "");

  if (!phoneRegex.test(digits)) {
    return {
      value: "",
      error: "Contact phone must contain 7 to 15 digits.",
    };
  }

  return {
    value: digits,
    error: null,
  };
}

/* ================================================================
   BOOLEAN HELPER
================================================================ */

function validateBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    return `${fieldName} must be true or false.`;
  }

  return null;
}

/* ================================================================
   TIME HELPER
================================================================ */

function validateTime(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return {
      value: "",
      error: null,
    };
  }

  const normalized = normalizeString(value);

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
    return {
      value: "",
      error: `${fieldName} must be a valid time in HH:MM format.`,
    };
  }

  return {
    value: normalized,
    error: null,
  };
}

/* ================================================================
   CLOUDINARY PUBLIC IDS
================================================================ */

function getImagePublicIds(restaurant) {
  const publicIds = [];

  if (restaurant?.coverImage?.publicId) {
    publicIds.push(restaurant.coverImage.publicId);
  }

  if (Array.isArray(restaurant?.gallery)) {
    for (const image of restaurant.gallery) {
      if (image?.publicId) {
        publicIds.push(image.publicId);
      }
    }
  }

  return [...new Set(publicIds)];
}

/* ================================================================
   CLOUDINARY CLEANUP
================================================================ */

async function deleteCloudinaryImages(publicIds) {
  if (!publicIds.length) {
    return;
  }

  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (error) {
      console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
    }
  }
}

/* ================================================================
   GET SINGLE RESTAURANT
================================================================ */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid restaurant ID.");
    }

    await connectDB();

    const restaurant = await Restaurant.findById(id)
      .populate("destination", "name slug")
      .lean();

    if (!restaurant) {
      return errorResponse("Restaurant not found.", 404);
    }

    return NextResponse.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error("GET restaurant error:", error);

    return errorResponse("Failed to fetch restaurant.", 500);
  }
}

/* ================================================================
   UPDATE RESTAURANT
================================================================ */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid restaurant ID.");
    }

    await connectDB();

    const existingRestaurant = await Restaurant.findById(id);

    if (!existingRestaurant) {
      return errorResponse("Restaurant not found.", 404);
    }

    const body = await parseJsonBody(request);

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid JSON request body.");
    }

    /* ------------------------------------------------------------
       ALLOWED FIELDS
    ------------------------------------------------------------ */

    const allowedFields = [
      "destination",
      "name",
      "slug",
      "description",
      "cuisines",
      "foodType",
      "priceRange",
      "currency",
      "popularDishes",
      "openingTime",
      "closingTime",
      "address",
      "latitude",
      "longitude",
      "contactPhone",
      "website",
      "coverImage",
      "gallery",
      "rating",
      "isFeatured",
      "isActive",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields were provided for update.");
    }

    /* ------------------------------------------------------------
       DESTINATION
    ------------------------------------------------------------ */

    if (updateData.destination !== undefined) {
      const destinationId = normalizeString(updateData.destination);

      if (!mongoose.isValidObjectId(destinationId)) {
        return errorResponse("Invalid destination ID.");
      }

      const destinationExists = await Destination.exists({
        _id: destinationId,
      });

      if (!destinationExists) {
        return errorResponse("Destination not found.", 404);
      }

      updateData.destination = destinationId;
    }

    /* ------------------------------------------------------------
       NAME
    ------------------------------------------------------------ */

    if (updateData.name !== undefined) {
      const name = normalizeString(updateData.name);

      if (!name) {
        return errorResponse("Restaurant name is required.");
      }

      if (name.length < 2 || name.length > 150) {
        return errorResponse(
          "Restaurant name must be between 2 and 150 characters.",
        );
      }

      if (!nameRegex.test(name)) {
        return errorResponse(
          "Restaurant name can contain alphabets and spaces only.",
        );
      }

      updateData.name = name;
    }

    /* ------------------------------------------------------------
       SLUG
    ------------------------------------------------------------ */

    if (updateData.slug !== undefined) {
      const slug = normalizeString(updateData.slug).toLowerCase();

      if (!slug) {
        return errorResponse("Restaurant slug is required.");
      }

      if (slug.length > 150) {
        return errorResponse("Restaurant slug cannot exceed 150 characters.");
      }

      if (!slugRegex.test(slug)) {
        return errorResponse(
          "Slug can contain lowercase letters, numbers, and hyphens only.",
        );
      }

      const duplicate = await Restaurant.findOne({
        slug,
        _id: {
          $ne: id,
        },
      }).lean();

      if (duplicate) {
        return errorResponse("Restaurant slug already exists.", 409);
      }

      updateData.slug = slug;
    }

    /* ------------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------------ */

    if (updateData.description !== undefined) {
      const description = normalizeString(updateData.description);

      if (!description) {
        return errorResponse("Restaurant description is required.");
      }

      if (description.length < 10 || description.length > 5000) {
        return errorResponse(
          "Restaurant description must be between 10 and 5000 characters.",
        );
      }

      updateData.description = description;
    }

    /* ------------------------------------------------------------
       CUISINES
    ------------------------------------------------------------ */

    if (updateData.cuisines !== undefined) {
      const result = normalizeStringArray(updateData.cuisines, "Cuisines");

      if (result.error) {
        return errorResponse(result.error);
      }

      if (result.value.length > 30) {
        return errorResponse("You can add a maximum of 30 cuisines.");
      }

      for (const cuisine of result.value) {
        if (cuisine.length > 100) {
          return errorResponse("Each cuisine cannot exceed 100 characters.");
        }
      }

      updateData.cuisines = result.value;
    }

    /* ------------------------------------------------------------
       FOOD TYPE
    ------------------------------------------------------------ */

    if (updateData.foodType !== undefined) {
      const foodType = normalizeString(updateData.foodType);

      if (!ALLOWED_FOOD_TYPES.includes(foodType)) {
        return errorResponse("Food type must be veg, non-veg or both.");
      }

      updateData.foodType = foodType;
    }

    /* ------------------------------------------------------------
       PRICE RANGE
    ------------------------------------------------------------ */

    if (updateData.priceRange !== undefined) {
      const priceRange = normalizeString(updateData.priceRange);

      if (!ALLOWED_PRICE_RANGES.includes(priceRange)) {
        return errorResponse(
          "Price range must be budget, moderate, expensive or luxury.",
        );
      }

      updateData.priceRange = priceRange;
    }

    /* ------------------------------------------------------------
       CURRENCY
    ------------------------------------------------------------ */

    if (updateData.currency !== undefined) {
      const currency = normalizeString(updateData.currency).toUpperCase();

      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return errorResponse("Currency must be INR or USD.");
      }

      updateData.currency = currency;
    }

    /* ------------------------------------------------------------
       POPULAR DISHES
    ------------------------------------------------------------ */

    if (updateData.popularDishes !== undefined) {
      const result = normalizeStringArray(
        updateData.popularDishes,
        "Popular dishes",
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      if (result.value.length > 50) {
        return errorResponse("You can add a maximum of 50 popular dishes.");
      }

      for (const dish of result.value) {
        if (dish.length > 150) {
          return errorResponse(
            "Each popular dish cannot exceed 150 characters.",
          );
        }
      }

      updateData.popularDishes = result.value;
    }

    /* ------------------------------------------------------------
       TIMES
    ------------------------------------------------------------ */

    if (updateData.openingTime !== undefined) {
      const result = validateTime(updateData.openingTime, "Opening time");

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.openingTime = result.value;
    }

    if (updateData.closingTime !== undefined) {
      const result = validateTime(updateData.closingTime, "Closing time");

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.closingTime = result.value;
    }

    /* ------------------------------------------------------------
       ADDRESS
    ------------------------------------------------------------ */

    if (updateData.address !== undefined) {
      const address = normalizeString(updateData.address);

      if (address.length > 500) {
        return errorResponse("Address cannot exceed 500 characters.");
      }

      updateData.address = address;
    }

    /* ------------------------------------------------------------
       PHONE
    ------------------------------------------------------------ */

    if (updateData.contactPhone !== undefined) {
      const result = normalizePhone(updateData.contactPhone);

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.contactPhone = result.value;
    }

    /* ------------------------------------------------------------
       WEBSITE
    ------------------------------------------------------------ */

    if (updateData.website !== undefined) {
      const website = normalizeString(updateData.website);

      if (website) {
        if (!urlRegex.test(website)) {
          return errorResponse("Website must be a valid HTTP or HTTPS URL.");
        }

        if (website.length > 500) {
          return errorResponse("Website cannot exceed 500 characters.");
        }
      }

      updateData.website = website;
    }

    /* ------------------------------------------------------------
       LATITUDE
    ------------------------------------------------------------ */

    if (updateData.latitude !== undefined) {
      const result = parseCoordinate(updateData.latitude, "Latitude", -90, 90);

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.latitude = result.value;
    }

    /* ------------------------------------------------------------
       LONGITUDE
    ------------------------------------------------------------ */

    if (updateData.longitude !== undefined) {
      const result = parseCoordinate(
        updateData.longitude,
        "Longitude",
        -180,
        180,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.longitude = result.value;
    }

    /* ------------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------------ */

    if (updateData.coverImage !== undefined) {
      const result = validateImage(updateData.coverImage, "Cover image");

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.coverImage = result.value;
    }

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    if (updateData.gallery !== undefined) {
      const result = normalizeGallery(updateData.gallery);

      if (result.error) {
        return errorResponse(result.error);
      }

      updateData.gallery = result.value;
    }

    /* ------------------------------------------------------------
       RATING
    ------------------------------------------------------------ */

    if (updateData.rating !== undefined) {
      const rating = Number(updateData.rating);

      if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
        return errorResponse("Rating must be between 0 and 5.");
      }

      updateData.rating = rating;
    }

    /* ------------------------------------------------------------
       BOOLEAN VALUES
    ------------------------------------------------------------ */

    if (updateData.isFeatured !== undefined) {
      const booleanError = validateBoolean(
        updateData.isFeatured,
        "Featured status",
      );

      if (booleanError) {
        return errorResponse(booleanError);
      }
    }

    if (updateData.isActive !== undefined) {
      const booleanError = validateBoolean(
        updateData.isActive,
        "Active status",
      );

      if (booleanError) {
        return errorResponse(booleanError);
      }
    }

    /* ------------------------------------------------------------
       DATABASE UPDATE
    ------------------------------------------------------------ */

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedRestaurant) {
      return errorResponse("Restaurant not found.", 404);
    }

    /* ------------------------------------------------------------
       FIND REMOVED CLOUDINARY IMAGES
    ------------------------------------------------------------ */

    const oldPublicIds = getImagePublicIds(existingRestaurant);

    const newPublicIds = getImagePublicIds(updatedRestaurant);

    const newPublicIdSet = new Set(newPublicIds);

    const removedPublicIds = oldPublicIds.filter(
      (publicId) => !newPublicIdSet.has(publicId),
    );

    /* ------------------------------------------------------------
       CLOUDINARY CLEANUP
    ------------------------------------------------------------ */

    await deleteCloudinaryImages(removedPublicIds);

    return NextResponse.json({
      success: true,
      message: "Restaurant updated successfully.",
      data: updatedRestaurant,
    });
  } catch (error) {
    console.error("PUT restaurant error:", error);

    if (error?.code === 11000) {
      return errorResponse("Restaurant slug already exists.", 409);
    }

    if (error?.name === "ValidationError") {
      return errorResponse(
        Object.values(error.errors)
          .map((item) => item.message)
          .join(" "),
        400,
      );
    }

    return errorResponse("Failed to update restaurant.", 500);
  }
}

/* ================================================================
   PATCH - ACTIVATE / DEACTIVATE
================================================================ */

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid restaurant ID.");
    }

    await connectDB();

    const body = await parseJsonBody(request);

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid JSON request body.");
    }

    if (typeof body.isActive !== "boolean") {
      return errorResponse("isActive must be true or false.");
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      {
        isActive: body.isActive,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!restaurant) {
      return errorResponse("Restaurant not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: body.isActive
        ? "Restaurant activated successfully."
        : "Restaurant deactivated successfully.",
      data: restaurant,
    });
  } catch (error) {
    console.error("PATCH restaurant error:", error);

    if (error?.name === "ValidationError") {
      return errorResponse(
        Object.values(error.errors)
          .map((item) => item.message)
          .join(" "),
        400,
      );
    }

    return errorResponse("Failed to update restaurant status.", 500);
  }
}

/* ================================================================
   PERMANENT DELETE RESTAURANT
================================================================ */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid restaurant ID.");
    }

    await connectDB();

    /* ------------------------------------------------------------
       FIND RESTAURANT
    ------------------------------------------------------------ */

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return errorResponse("Restaurant not found.", 404);
    }

    /* ------------------------------------------------------------
       COLLECT CLOUDINARY IDS
    ------------------------------------------------------------ */

    const publicIds = getImagePublicIds(restaurant);

    /* ------------------------------------------------------------
       DELETE DATABASE RECORD
    ------------------------------------------------------------ */

    await Restaurant.findByIdAndDelete(id);

    /* ------------------------------------------------------------
       DELETE CLOUDINARY IMAGES
    ------------------------------------------------------------ */

    await deleteCloudinaryImages(publicIds);

    return NextResponse.json({
      success: true,
      message: "Restaurant deleted permanently.",
    });
  } catch (error) {
    console.error("DELETE restaurant error:", error);

    return errorResponse("Failed to delete restaurant.", 500);
  }
}

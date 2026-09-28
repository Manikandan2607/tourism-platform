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
  if (gallery === undefined) {
    return {
      value: [],
      error: null,
    };
  }

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
  if (value === undefined) {
    return {
      value: [],
      error: null,
    };
  }

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
   COORDINATE HELPERS
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

  /*
   * Allow common formatting:
   * +91 98765 43210
   * +91-9876543210
   * (044) 12345678
   */
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

function normalizeBoolean(value, fieldName, defaultValue) {
  if (value === undefined) {
    return {
      value: defaultValue,
      error: null,
    };
  }

  if (typeof value !== "boolean") {
    return {
      value: defaultValue,
      error: `${fieldName} must be true or false.`,
    };
  }

  return {
    value,
    error: null,
  };
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
   GET ALL RESTAURANTS
================================================================ */

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const restaurants = await Restaurant.find({})
      .populate("destination", "name slug")
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error("GET restaurants error:", error);

    return errorResponse("Failed to fetch restaurants.", 500);
  }
}

/* ================================================================
   CREATE RESTAURANT
================================================================ */

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const body = await parseJsonBody(request);

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const {
      destination,
      name,
      slug,
      description,
      cuisines,
      foodType,
      priceRange,
      currency,
      popularDishes,
      openingTime,
      closingTime,
      address,
      latitude,
      longitude,
      contactPhone,
      website,
      coverImage,
      gallery,
      rating,
      isFeatured,
      isActive,
    } = body;

    /* ------------------------------------------------------------
       DESTINATION
    ------------------------------------------------------------ */

    const normalizedDestination = normalizeString(destination);

    if (!normalizedDestination) {
      return errorResponse("Destination is required.");
    }

    if (!mongoose.isValidObjectId(normalizedDestination)) {
      return errorResponse("Invalid destination ID.");
    }

    const destinationExists = await Destination.exists({
      _id: normalizedDestination,
    });

    if (!destinationExists) {
      return errorResponse("Destination not found.", 404);
    }

    /* ------------------------------------------------------------
       NAME
    ------------------------------------------------------------ */

    const normalizedName = normalizeString(name);

    if (!normalizedName) {
      return errorResponse("Restaurant name is required.");
    }

    if (normalizedName.length < 2 || normalizedName.length > 150) {
      return errorResponse(
        "Restaurant name must be between 2 and 150 characters.",
      );
    }

    if (!nameRegex.test(normalizedName)) {
      return errorResponse(
        "Restaurant name can contain alphabets and spaces only.",
      );
    }

    /* ------------------------------------------------------------
       SLUG
    ------------------------------------------------------------ */

    const normalizedSlug = normalizeString(slug).toLowerCase();

    if (!normalizedSlug) {
      return errorResponse("Restaurant slug is required.");
    }

    if (normalizedSlug.length > 150) {
      return errorResponse("Restaurant slug cannot exceed 150 characters.");
    }

    if (!slugRegex.test(normalizedSlug)) {
      return errorResponse(
        "Slug can contain lowercase letters, numbers, and hyphens only.",
      );
    }

    const duplicateRestaurant = await Restaurant.findOne({
      slug: normalizedSlug,
    }).lean();

    if (duplicateRestaurant) {
      return errorResponse("Restaurant slug already exists.", 409);
    }

    /* ------------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------------ */

    const normalizedDescription = normalizeString(description);

    if (!normalizedDescription) {
      return errorResponse("Restaurant description is required.");
    }

    if (
      normalizedDescription.length < 10 ||
      normalizedDescription.length > 5000
    ) {
      return errorResponse(
        "Restaurant description must be between 10 and 5000 characters.",
      );
    }

    /* ------------------------------------------------------------
       FOOD TYPE
    ------------------------------------------------------------ */

    const normalizedFoodType =
      foodType === undefined || foodType === null || foodType === ""
        ? "both"
        : normalizeString(foodType);

    if (!ALLOWED_FOOD_TYPES.includes(normalizedFoodType)) {
      return errorResponse("Food type must be veg, non-veg or both.");
    }

    /* ------------------------------------------------------------
       PRICE RANGE
    ------------------------------------------------------------ */

    const normalizedPriceRange = normalizeString(priceRange);

    if (!ALLOWED_PRICE_RANGES.includes(normalizedPriceRange)) {
      return errorResponse(
        "Price range must be budget, moderate, expensive or luxury.",
      );
    }

    /* ------------------------------------------------------------
       CURRENCY
    ------------------------------------------------------------ */

    const normalizedCurrency = normalizeString(currency || "INR").toUpperCase();

    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return errorResponse("Currency must be INR or USD.");
    }

    /* ------------------------------------------------------------
       CUISINES
    ------------------------------------------------------------ */

    const cuisinesResult = normalizeStringArray(cuisines, "Cuisines");

    if (cuisinesResult.error) {
      return errorResponse(cuisinesResult.error);
    }

    if (cuisinesResult.value.length > 30) {
      return errorResponse("You can add a maximum of 30 cuisines.");
    }

    for (const cuisine of cuisinesResult.value) {
      if (cuisine.length > 100) {
        return errorResponse("Each cuisine cannot exceed 100 characters.");
      }
    }

    /* ------------------------------------------------------------
       POPULAR DISHES
    ------------------------------------------------------------ */

    const dishesResult = normalizeStringArray(popularDishes, "Popular dishes");

    if (dishesResult.error) {
      return errorResponse(dishesResult.error);
    }

    if (dishesResult.value.length > 50) {
      return errorResponse("You can add a maximum of 50 popular dishes.");
    }

    for (const dish of dishesResult.value) {
      if (dish.length > 150) {
        return errorResponse("Each popular dish cannot exceed 150 characters.");
      }
    }

    /* ------------------------------------------------------------
       TIMES
    ------------------------------------------------------------ */

    const openingTimeResult = validateTime(openingTime, "Opening time");

    if (openingTimeResult.error) {
      return errorResponse(openingTimeResult.error);
    }

    const closingTimeResult = validateTime(closingTime, "Closing time");

    if (closingTimeResult.error) {
      return errorResponse(closingTimeResult.error);
    }

    /* ------------------------------------------------------------
       ADDRESS
    ------------------------------------------------------------ */

    const normalizedAddress = normalizeString(address);

    if (normalizedAddress.length > 500) {
      return errorResponse("Address cannot exceed 500 characters.");
    }

    /* ------------------------------------------------------------
       CONTACT PHONE
    ------------------------------------------------------------ */

    const phoneResult = normalizePhone(contactPhone);

    if (phoneResult.error) {
      return errorResponse(phoneResult.error);
    }

    /* ------------------------------------------------------------
       WEBSITE
    ------------------------------------------------------------ */

    const normalizedWebsite = normalizeString(website);

    if (normalizedWebsite) {
      if (!urlRegex.test(normalizedWebsite)) {
        return errorResponse("Website must be a valid HTTP or HTTPS URL.");
      }

      if (normalizedWebsite.length > 500) {
        return errorResponse("Website cannot exceed 500 characters.");
      }
    }

    /* ------------------------------------------------------------
       LATITUDE
    ------------------------------------------------------------ */

    const latitudeResult = parseCoordinate(latitude, "Latitude", -90, 90);

    if (latitudeResult.error) {
      return errorResponse(latitudeResult.error);
    }

    /* ------------------------------------------------------------
       LONGITUDE
    ------------------------------------------------------------ */

    const longitudeResult = parseCoordinate(longitude, "Longitude", -180, 180);

    if (longitudeResult.error) {
      return errorResponse(longitudeResult.error);
    }

    /* ------------------------------------------------------------
       RATING
    ------------------------------------------------------------ */

    const normalizedRating =
      rating === undefined || rating === null || rating === ""
        ? 0
        : Number(rating);

    if (
      !Number.isFinite(normalizedRating) ||
      normalizedRating < 0 ||
      normalizedRating > 5
    ) {
      return errorResponse("Rating must be between 0 and 5.");
    }

    /* ------------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------------ */

    const coverImageResult = validateImage(coverImage, "Cover image");

    if (coverImageResult.error) {
      return errorResponse(coverImageResult.error);
    }

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    const galleryResult = normalizeGallery(gallery);

    if (galleryResult.error) {
      return errorResponse(galleryResult.error);
    }

    /* ------------------------------------------------------------
       BOOLEANS
    ------------------------------------------------------------ */

    const featuredResult = normalizeBoolean(
      isFeatured,
      "Featured status",
      false,
    );

    if (featuredResult.error) {
      return errorResponse(featuredResult.error);
    }

    const activeResult = normalizeBoolean(isActive, "Active status", true);

    if (activeResult.error) {
      return errorResponse(activeResult.error);
    }

    /* ------------------------------------------------------------
       CREATE
    ------------------------------------------------------------ */

    const restaurant = await Restaurant.create({
      destination: normalizedDestination,

      name: normalizedName,

      slug: normalizedSlug,

      description: normalizedDescription,

      cuisines: cuisinesResult.value,

      foodType: normalizedFoodType,

      priceRange: normalizedPriceRange,

      currency: normalizedCurrency,

      popularDishes: dishesResult.value,

      openingTime: openingTimeResult.value,

      closingTime: closingTimeResult.value,

      address: normalizedAddress,

      latitude: latitudeResult.value,

      longitude: longitudeResult.value,

      contactPhone: phoneResult.value,

      website: normalizedWebsite,

      coverImage: coverImageResult.value,

      gallery: galleryResult.value,

      rating: normalizedRating,

      isFeatured: featuredResult.value,

      isActive: activeResult.value,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Restaurant created successfully.",
        data: restaurant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST restaurant error:", error);

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

    return errorResponse("Failed to create restaurant.", 500);
  }
}

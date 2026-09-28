import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  Hotel,
  SUPPORTED_CURRENCIES,
  nameRegex,
  slugRegex,
  phoneRegex,
  urlRegex,
} from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeImage(image) {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    const url = image.trim();

    if (!url) {
      return null;
    }

    return {
      url,
      publicId: "",
    };
  }

  if (typeof image === "object" && image.url) {
    return {
      url: String(image.url).trim(),
      publicId: String(image.publicId || "").trim(),
    };
  }

  return null;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map(normalizeImage).filter(Boolean);
}

function normalizeAmenities(amenities) {
  if (!Array.isArray(amenities)) {
    return [];
  }

  return amenities.map((item) => normalizeString(item)).filter(Boolean);
}

function normalizeBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function validateImage(image, fieldName = "Image") {
  if (!image?.url) {
    return `${fieldName} is required`;
  }

  if (!urlRegex.test(image.url)) {
    return `${fieldName} URL must be a valid HTTP or HTTPS URL`;
  }

  if (!image.publicId) {
    return `${fieldName} public ID is required`;
  }

  return "";
}

function validateGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return "Gallery must be an array";
  }

  for (let index = 0; index < gallery.length; index += 1) {
    const error = validateImage(gallery[index], `Gallery image ${index + 1}`);

    if (error) {
      return error;
    }
  }

  return "";
}

function validateCoordinate(value, fieldName, min, max) {
  if (value === undefined) {
    return "";
  }

  if (!Number.isFinite(value)) {
    return `${fieldName} must be a valid number`;
  }

  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }

  return "";
}

function validatePriceRange(pricePerNight) {
  if (
    !pricePerNight ||
    typeof pricePerNight !== "object" ||
    Array.isArray(pricePerNight)
  ) {
    return {
      error: "Price per night must contain minimum and maximum values",
    };
  }

  if (
    pricePerNight.min === undefined ||
    pricePerNight.min === null ||
    pricePerNight.min === ""
  ) {
    return {
      error: "Minimum price is required",
    };
  }

  if (
    pricePerNight.max === undefined ||
    pricePerNight.max === null ||
    pricePerNight.max === ""
  ) {
    return {
      error: "Maximum price is required",
    };
  }

  const min = Number(pricePerNight.min);
  const max = Number(pricePerNight.max);

  if (!Number.isFinite(min) || min < 0) {
    return {
      error: "Minimum price must be a valid non-negative number",
    };
  }

  if (!Number.isFinite(max) || max < 0) {
    return {
      error: "Maximum price must be a valid non-negative number",
    };
  }

  if (min > max) {
    return {
      error: "Minimum price cannot be greater than maximum price",
    };
  }

  return {
    min,
    max,
  };
}

/* -------------------------------------------------------------------------- */
/* GET ALL HOTELS                                                             */
/* -------------------------------------------------------------------------- */

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const hotels = await Hotel.find({})
      .populate("destination", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    console.error("GET hotels error:", error);

    return errorResponse("Failed to fetch hotels", 500);
  }
}

/* -------------------------------------------------------------------------- */
/* CREATE HOTEL                                                               */
/* -------------------------------------------------------------------------- */

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
      return errorResponse("Invalid JSON request body");
    }

    const {
      destination,
      name,
      slug,
      description,
      category,
      pricePerNight,
      currency,
      amenities,
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
    } = body || {};

    /* ---------------------------------------------------------------------- */
    /* REQUIRED FIELDS                                                        */
    /* ---------------------------------------------------------------------- */

    if (!destination) {
      return errorResponse("Destination is required");
    }

    if (!name) {
      return errorResponse("Hotel name is required");
    }

    if (!slug) {
      return errorResponse("Hotel slug is required");
    }

    if (!description) {
      return errorResponse("Hotel description is required");
    }

    if (!category) {
      return errorResponse("Hotel category is required");
    }

    if (pricePerNight === undefined || pricePerNight === null) {
      return errorResponse("Price per night is required");
    }

    if (!coverImage) {
      return errorResponse("Cover image is required");
    }

    /* ---------------------------------------------------------------------- */
    /* DESTINATION                                                             */
    /* ---------------------------------------------------------------------- */

    if (!mongoose.isValidObjectId(destination)) {
      return errorResponse("Invalid destination ID");
    }

    const destinationExists = await Destination.exists({
      _id: destination,
    });

    if (!destinationExists) {
      return errorResponse("Destination not found", 404);
    }

    /* ---------------------------------------------------------------------- */
    /* NAME                                                                    */
    /* ---------------------------------------------------------------------- */

    const normalizedName = normalizeString(name);

    if (!normalizedName) {
      return errorResponse("Hotel name is required");
    }

    if (normalizedName.length < 2) {
      return errorResponse("Hotel name must be at least 2 characters");
    }

    if (normalizedName.length > 150) {
      return errorResponse("Hotel name cannot exceed 150 characters");
    }

    if (!nameRegex.test(normalizedName)) {
      return errorResponse("Hotel name can contain alphabets and spaces only");
    }

    /* ---------------------------------------------------------------------- */
    /* SLUG                                                                    */
    /* ---------------------------------------------------------------------- */

    const normalizedSlug = normalizeString(slug).toLowerCase();

    if (!normalizedSlug) {
      return errorResponse("Hotel slug is required");
    }

    if (normalizedSlug.length > 150) {
      return errorResponse("Slug cannot exceed 150 characters");
    }

    if (!slugRegex.test(normalizedSlug)) {
      return errorResponse(
        "Slug can contain lowercase letters, numbers, and hyphens only",
      );
    }

    const existingHotel = await Hotel.findOne({
      slug: normalizedSlug,
    }).lean();

    if (existingHotel) {
      return errorResponse("Hotel slug already exists", 409);
    }

    /* ---------------------------------------------------------------------- */
    /* DESCRIPTION                                                             */
    /* ---------------------------------------------------------------------- */

    const normalizedDescription = normalizeString(description);

    if (normalizedDescription.length < 10) {
      return errorResponse("Hotel description must be at least 10 characters");
    }

    if (normalizedDescription.length > 5000) {
      return errorResponse("Hotel description cannot exceed 5000 characters");
    }

    /* ---------------------------------------------------------------------- */
    /* CATEGORY                                                                */
    /* ---------------------------------------------------------------------- */

    const allowedCategories = [
      "budget",
      "standard",
      "premium",
      "luxury",
      "resort",
      "homestay",
      "hostel",
    ];

    if (!allowedCategories.includes(category)) {
      return errorResponse("Invalid hotel category");
    }

    /* ---------------------------------------------------------------------- */
    /* PRICE                                                                   */
    /* ---------------------------------------------------------------------- */

    const priceResult = validatePriceRange(pricePerNight);

    if (priceResult.error) {
      return errorResponse(priceResult.error);
    }

    /* ---------------------------------------------------------------------- */
    /* CURRENCY                                                                */
    /* ---------------------------------------------------------------------- */

    const normalizedCurrency = normalizeString(currency || "INR").toUpperCase();

    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return errorResponse("Currency must be INR or USD");
    }

    /* ---------------------------------------------------------------------- */
    /* AMENITIES                                                               */
    /* ---------------------------------------------------------------------- */

    const normalizedAmenities = normalizeAmenities(amenities);

    if (normalizedAmenities.length > 50) {
      return errorResponse("Hotel cannot have more than 50 amenities");
    }

    for (const amenity of normalizedAmenities) {
      if (amenity.length > 100) {
        return errorResponse("Each amenity cannot exceed 100 characters");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* ADDRESS                                                                 */
    /* ---------------------------------------------------------------------- */

    const normalizedAddress = normalizeString(address);

    if (normalizedAddress.length > 500) {
      return errorResponse("Address cannot exceed 500 characters");
    }

    /* ---------------------------------------------------------------------- */
    /* CONTACT PHONE                                                           */
    /* ---------------------------------------------------------------------- */

    const normalizedPhone = normalizeString(contactPhone);

    if (
      normalizedPhone &&
      !phoneRegex.test(normalizedPhone.replace(/\D/g, ""))
    ) {
      return errorResponse(
        "Contact phone must contain between 7 and 15 digits",
      );
    }

    /* ---------------------------------------------------------------------- */
    /* WEBSITE                                                                 */
    /* ---------------------------------------------------------------------- */

    const normalizedWebsite = normalizeString(website);

    if (normalizedWebsite) {
      if (normalizedWebsite.length > 500) {
        return errorResponse("Website cannot exceed 500 characters");
      }

      if (!urlRegex.test(normalizedWebsite)) {
        return errorResponse("Website must be a valid HTTP or HTTPS URL");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* COORDINATES                                                             */
    /* ---------------------------------------------------------------------- */

    const normalizedLatitude = normalizeOptionalNumber(latitude);
    const normalizedLongitude = normalizeOptionalNumber(longitude);

    if (normalizedLatitude === null) {
      return errorResponse("Latitude must be a valid number");
    }

    if (normalizedLongitude === null) {
      return errorResponse("Longitude must be a valid number");
    }

    const latitudeError = validateCoordinate(
      normalizedLatitude,
      "Latitude",
      -90,
      90,
    );

    if (latitudeError) {
      return errorResponse(latitudeError);
    }

    const longitudeError = validateCoordinate(
      normalizedLongitude,
      "Longitude",
      -180,
      180,
    );

    if (longitudeError) {
      return errorResponse(longitudeError);
    }

    /* ---------------------------------------------------------------------- */
    /* COVER IMAGE                                                             */
    /* ---------------------------------------------------------------------- */

    const normalizedCoverImage = normalizeImage(coverImage);

    const coverImageError = validateImage(normalizedCoverImage, "Cover image");

    if (coverImageError) {
      return errorResponse(coverImageError);
    }

    /* ---------------------------------------------------------------------- */
    /* GALLERY                                                                 */
    /* ---------------------------------------------------------------------- */

    const normalizedGallery = normalizeGallery(gallery);

    const galleryError = validateGallery(normalizedGallery);

    if (galleryError) {
      return errorResponse(galleryError);
    }

    /* ---------------------------------------------------------------------- */
    /* RATING                                                                  */
    /* ---------------------------------------------------------------------- */

    const normalizedRating =
      rating === undefined || rating === null || rating === ""
        ? 0
        : Number(rating);

    if (
      !Number.isFinite(normalizedRating) ||
      normalizedRating < 0 ||
      normalizedRating > 5
    ) {
      return errorResponse("Rating must be between 0 and 5");
    }

    /* ---------------------------------------------------------------------- */
    /* BOOLEAN VALUES                                                          */
    /* ---------------------------------------------------------------------- */

    const normalizedFeatured = normalizeBoolean(isFeatured, false);

    if (normalizedFeatured === null) {
      return errorResponse("isFeatured must be a boolean");
    }

    const normalizedActive = normalizeBoolean(isActive, true);

    if (normalizedActive === null) {
      return errorResponse("isActive must be a boolean");
    }

    /* ---------------------------------------------------------------------- */
    /* CREATE                                                                  */
    /* ---------------------------------------------------------------------- */

    const hotel = await Hotel.create({
      destination,

      name: normalizedName,

      slug: normalizedSlug,

      description: normalizedDescription,

      category,

      pricePerNight: {
        min: priceResult.min,
        max: priceResult.max,
      },

      currency: normalizedCurrency,

      amenities: normalizedAmenities,

      address: normalizedAddress || undefined,

      latitude: normalizedLatitude,

      longitude: normalizedLongitude,

      contactPhone: normalizedPhone ? normalizedPhone : undefined,

      website: normalizedWebsite ? normalizedWebsite : undefined,

      coverImage: normalizedCoverImage,

      gallery: normalizedGallery,

      rating: normalizedRating,

      isFeatured: normalizedFeatured,

      isActive: normalizedActive,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hotel created successfully",
        data: hotel,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST hotel error:", error);

    if (error?.code === 11000) {
      return errorResponse("Hotel slug already exists", 409);
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0];

      return errorResponse(firstError?.message || "Hotel validation failed");
    }

    return errorResponse("Failed to create hotel", 500);
  }
}
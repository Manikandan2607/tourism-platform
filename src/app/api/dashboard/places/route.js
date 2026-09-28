import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  Place,
  SUPPORTED_CURRENCIES,
  nameRegex,
  slugRegex,
  urlRegex,
} from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";

/* ================================================================
   HELPERS
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

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  return {
    url: normalizeString(image.url),
    publicId: normalizeString(image.publicId),
  };
}

function validateImage(image, fieldName = "Image") {
  if (!image || typeof image !== "object") {
    return `${fieldName} is required.`;
  }

  const url = normalizeString(image.url);
  const publicId = normalizeString(image.publicId);

  if (!url) {
    return `${fieldName} URL is required.`;
  }

  if (!urlRegex.test(url)) {
    return `${fieldName} URL must be a valid HTTP or HTTPS URL.`;
  }

  if (!publicId) {
    return `${fieldName} must contain a valid Cloudinary public ID.`;
  }

  return null;
}

function normalizeGallery(gallery) {
  if (gallery === undefined) {
    return [];
  }

  if (!Array.isArray(gallery)) {
    return null;
  }

  return gallery.map((image) => normalizeImage(image));
}

function validateGallery(gallery) {
  if (gallery === undefined) {
    return null;
  }

  if (!Array.isArray(gallery)) {
    return "Gallery must be an array.";
  }

  for (let index = 0; index < gallery.length; index += 1) {
    const error = validateImage(gallery[index], `Gallery image ${index + 1}`);

    if (error) {
      return error;
    }
  }

  return null;
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function validateCoordinate(value, min, max, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${fieldName} must be a valid number.`;
  }

  if (number < min || number > max) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }

  return null;
}

function normalizeEntryFee(entryFee) {
  if (entryFee === undefined || entryFee === null || entryFee === "") {
    return {
      adult: 0,
      child: 0,
      foreigner: 0,
    };
  }

  if (typeof entryFee !== "object" || Array.isArray(entryFee)) {
    return null;
  }

  const adult = normalizeNumber(entryFee.adult);
  const child = normalizeNumber(entryFee.child);
  const foreigner = normalizeNumber(entryFee.foreigner);

  if (adult === null || child === null || foreigner === null) {
    return null;
  }

  if (
    (adult !== undefined && adult < 0) ||
    (child !== undefined && child < 0) ||
    (foreigner !== undefined && foreigner < 0)
  ) {
    return null;
  }

  return {
    adult: adult ?? 0,
    child: child ?? 0,
    foreigner: foreigner ?? 0,
  };
}

function validateBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    return `${fieldName} must be true or false.`;
  }

  return null;
}

/* ================================================================
   GET ALL PLACES
   GET /api/dashboard/places
================================================================ */

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const places = await Place.find({})
      .populate("destination", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: places.length,
        data: places,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET places error:", error);

    return errorResponse("Failed to fetch places.", 500);
  }
}

/* ================================================================
   CREATE PLACE
   POST /api/dashboard/places
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
      return errorResponse("Invalid JSON request body.");
    }

    const destination = normalizeString(body.destination);
    const name = normalizeString(body.name);
    const slug = normalizeString(body.slug).toLowerCase();
    const category = normalizeString(body.category);
    const description = normalizeString(body.description);
    const shortDescription = normalizeString(body.shortDescription);

    const openingTime = normalizeString(body.openingTime);

    const closingTime = normalizeString(body.closingTime);

    const closedOn = normalizeString(body.closedOn);

    const bestTimeToVisit = normalizeString(body.bestTimeToVisit);

    const visitDuration = normalizeString(body.visitDuration);

    const address = normalizeString(body.address);

    const currency = normalizeString(body.currency).toUpperCase();

    /* ------------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------------ */

    if (!destination) {
      return errorResponse("Destination is required.");
    }

    if (!name) {
      return errorResponse("Place name is required.");
    }

    if (!slug) {
      return errorResponse("Place slug is required.");
    }

    if (!category) {
      return errorResponse("Place category is required.");
    }

    if (!description) {
      return errorResponse("Place description is required.");
    }

    if (!body.coverImage) {
      return errorResponse("Cover image is required.");
    }

    /* ------------------------------------------------------------
       DESTINATION VALIDATION
    ------------------------------------------------------------ */

    if (!mongoose.isValidObjectId(destination)) {
      return errorResponse("Invalid destination ID.");
    }

    const destinationExists = await Destination.exists({
      _id: destination,
    });

    if (!destinationExists) {
      return errorResponse("Destination not found.", 404);
    }

    /* ------------------------------------------------------------
       NAME VALIDATION
    ------------------------------------------------------------ */

    if (!nameRegex.test(name)) {
      return errorResponse("Place name can contain alphabets and spaces only.");
    }

    if (name.length < 2 || name.length > 150) {
      return errorResponse("Place name must be between 2 and 150 characters.");
    }

    /* ------------------------------------------------------------
       SLUG VALIDATION
    ------------------------------------------------------------ */

    if (!slugRegex.test(slug)) {
      return errorResponse(
        "Slug can contain lowercase letters, numbers, and hyphens only.",
      );
    }

    if (slug.length > 150) {
      return errorResponse("Slug cannot exceed 150 characters.");
    }

    /* ------------------------------------------------------------
       CATEGORY
    ------------------------------------------------------------ */

    const allowedCategories = [
      "historical",
      "beach",
      "temple",
      "museum",
      "waterfall",
      "hill-station",
      "wildlife",
      "adventure",
      "park",
      "lake",
      "viewpoint",
      "other",
    ];

    if (!allowedCategories.includes(category)) {
      return errorResponse("Invalid place category.");
    }

    /* ------------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------------ */

    if (description.length < 10 || description.length > 5000) {
      return errorResponse(
        "Description must be between 10 and 5000 characters.",
      );
    }

    if (shortDescription.length > 500) {
      return errorResponse("Short description cannot exceed 500 characters.");
    }

    if (openingTime.length > 50) {
      return errorResponse("Opening time cannot exceed 50 characters.");
    }

    if (closingTime.length > 50) {
      return errorResponse("Closing time cannot exceed 50 characters.");
    }

    if (closedOn.length > 100) {
      return errorResponse("Closed on cannot exceed 100 characters.");
    }

    if (bestTimeToVisit.length > 200) {
      return errorResponse("Best time to visit cannot exceed 200 characters.");
    }

    if (visitDuration.length > 100) {
      return errorResponse("Visit duration cannot exceed 100 characters.");
    }

    if (address.length > 500) {
      return errorResponse("Address cannot exceed 500 characters.");
    }

    /* ------------------------------------------------------------
       CURRENCY
    ------------------------------------------------------------ */

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return errorResponse("Currency must be INR or USD.");
    }

    /* ------------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------------ */

    const coverImageError = validateImage(body.coverImage, "Cover image");

    if (coverImageError) {
      return errorResponse(coverImageError);
    }

    const normalizedCoverImage = normalizeImage(body.coverImage);

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    const galleryError = validateGallery(body.gallery);

    if (galleryError) {
      return errorResponse(galleryError);
    }

    const normalizedGallery = normalizeGallery(body.gallery);

    /* ------------------------------------------------------------
       ENTRY FEE
    ------------------------------------------------------------ */

    const normalizedEntryFee = normalizeEntryFee(body.entryFee);

    if (!normalizedEntryFee) {
      return errorResponse(
        "Entry fee values must be valid non-negative numbers.",
      );
    }

    /* ------------------------------------------------------------
       LATITUDE
    ------------------------------------------------------------ */

    const latitudeError = validateCoordinate(
      body.latitude,
      -90,
      90,
      "Latitude",
    );

    if (latitudeError) {
      return errorResponse(latitudeError);
    }

    const normalizedLatitude = normalizeNumber(body.latitude);

    if (normalizedLatitude === null) {
      return errorResponse("Latitude must be a valid number.");
    }

    /* ------------------------------------------------------------
       LONGITUDE
    ------------------------------------------------------------ */

    const longitudeError = validateCoordinate(
      body.longitude,
      -180,
      180,
      "Longitude",
    );

    if (longitudeError) {
      return errorResponse(longitudeError);
    }

    const normalizedLongitude = normalizeNumber(body.longitude);

    if (normalizedLongitude === null) {
      return errorResponse("Longitude must be a valid number.");
    }

    /* ------------------------------------------------------------
       BOOLEAN FIELDS
    ------------------------------------------------------------ */

    const isFeatured = body.isFeatured === undefined ? false : body.isFeatured;

    const isActive = body.isActive === undefined ? true : body.isActive;

    const featuredError = validateBoolean(isFeatured, "isFeatured");

    if (featuredError) {
      return errorResponse(featuredError);
    }

    const activeError = validateBoolean(isActive, "isActive");

    if (activeError) {
      return errorResponse(activeError);
    }

    /* ------------------------------------------------------------
       DUPLICATE SLUG
    ------------------------------------------------------------ */

    const existingPlace = await Place.findOne({
      slug,
    }).lean();

    if (existingPlace) {
      return errorResponse("Place slug already exists.", 409);
    }

    /* ------------------------------------------------------------
       CREATE
    ------------------------------------------------------------ */

    const place = await Place.create({
      destination,
      name,
      slug,
      category,
      description,

      shortDescription: shortDescription || undefined,

      entryFee: normalizedEntryFee,

      openingTime: openingTime || undefined,

      closingTime: closingTime || undefined,

      closedOn: closedOn || undefined,

      bestTimeToVisit: bestTimeToVisit || undefined,

      visitDuration: visitDuration || undefined,

      address: address || undefined,

      latitude: normalizedLatitude,

      longitude: normalizedLongitude,

      currency,

      coverImage: normalizedCoverImage,

      gallery: normalizedGallery,

      isFeatured,
      isActive,
    });

    const populatedPlace = await Place.findById(place._id)
      .populate("destination", "name slug")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Place created successfully.",
        data: populatedPlace,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST place error:", error);

    if (error?.code === 11000) {
      return errorResponse("Place slug already exists.", 409);
    }

    if (error?.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return errorResponse(message || "Validation failed.", 400);
    }

    return errorResponse("Failed to create place.", 500);
  }
}

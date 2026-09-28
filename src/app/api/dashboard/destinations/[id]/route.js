import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import { Destination } from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  nameRegex,
  slugRegex,
  urlRegex,
} from "@/utils/schema";

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
    return `${fieldName} public ID is required.`;
  }

  return null;
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

function validateGallery(gallery) {
  if (gallery === undefined) {
    return [];
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

function isBoolean(value) {
  return typeof value === "boolean";
}

/* ================================================================
   GET SINGLE DESTINATION
   GET /api/dashboard/destinations/:id
================================================================ */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid destination ID.", 400);
    }

    const destination = await Destination.findById(id).lean();

    if (!destination) {
      return errorResponse("Destination not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        data: destination,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get Destination Error:", error);

    return errorResponse("Failed to fetch destination.", 500);
  }
}

/* ================================================================
   PUT UPDATE DESTINATION
   PUT /api/dashboard/destinations/:id
================================================================ */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid destination ID.", 400);
    }

    const existingDestination = await Destination.findById(id);

    if (!existingDestination) {
      return errorResponse("Destination not found.", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body.");
    }

    /* ------------------------------------------------------------
       VALUES
    ------------------------------------------------------------ */

    const name = normalizeString(body.name);
    const slug = normalizeString(body.slug).toLowerCase();
    const type = normalizeString(body.type).toLowerCase();
    const country = normalizeString(body.country);
    const state = normalizeString(body.state);
    const description = normalizeString(body.description);
    const shortDescription = normalizeString(body.shortDescription);
    const bestTimeToVisit = normalizeString(body.bestTimeToVisit);
    const language = normalizeString(body.language);
    const currency = normalizeString(body.currency).toUpperCase();
    const address = normalizeString(body.address);

    /* ------------------------------------------------------------
       REQUIRED
    ------------------------------------------------------------ */

    if (!name) {
      return errorResponse("Destination name is required.");
    }

    if (!slug) {
      return errorResponse("Destination slug is required.");
    }

    if (!type) {
      return errorResponse("Destination type is required.");
    }

    if (!country) {
      return errorResponse("Country is required.");
    }

    if (!description) {
      return errorResponse("Description is required.");
    }

    if (!body.coverImage) {
      return errorResponse("Cover image is required.");
    }

    /* ------------------------------------------------------------
       NAME
    ------------------------------------------------------------ */

    if (!nameRegex.test(name)) {
      return errorResponse(
        "Destination name can contain alphabets and spaces only.",
      );
    }

    if (!nameRegex.test(country)) {
      return errorResponse("Country can contain alphabets and spaces only.");
    }

    if (state && !nameRegex.test(state)) {
      return errorResponse("State can contain alphabets and spaces only.");
    }

    /* ------------------------------------------------------------
       LENGTH
    ------------------------------------------------------------ */

    if (name.length < 2 || name.length > 100) {
      return errorResponse(
        "Destination name must be between 2 and 100 characters.",
      );
    }

    if (country.length < 2 || country.length > 100) {
      return errorResponse("Country must be between 2 and 100 characters.");
    }

    if (state.length > 100) {
      return errorResponse("State cannot exceed 100 characters.");
    }

    if (description.length < 10 || description.length > 5000) {
      return errorResponse(
        "Description must be between 10 and 5000 characters.",
      );
    }

    if (shortDescription.length > 500) {
      return errorResponse("Short description cannot exceed 500 characters.");
    }

    if (bestTimeToVisit.length > 200) {
      return errorResponse("Best time to visit cannot exceed 200 characters.");
    }

    if (address.length > 500) {
      return errorResponse("Address cannot exceed 500 characters.");
    }

    /* ------------------------------------------------------------
       SLUG
    ------------------------------------------------------------ */

    if (!slugRegex.test(slug)) {
      return errorResponse(
        "Slug can contain lowercase letters, numbers, and hyphens only.",
      );
    }

    /* ------------------------------------------------------------
       TYPE
    ------------------------------------------------------------ */

    const allowedTypes = ["country", "state", "city", "region"];

    if (!allowedTypes.includes(type)) {
      return errorResponse("Invalid destination type.");
    }

    /* ------------------------------------------------------------
       LANGUAGE
    ------------------------------------------------------------ */

    if (language && !SUPPORTED_LANGUAGES.includes(language)) {
      return errorResponse(
        "Language must be Tamil, English, Hindi, or Malayalam.",
      );
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

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    const galleryError = validateGallery(body.gallery);

    if (galleryError) {
      return errorResponse(galleryError);
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

    /* ------------------------------------------------------------
       BOOLEAN
    ------------------------------------------------------------ */

    const isFeatured =
      body.isFeatured === undefined
        ? existingDestination.isFeatured
        : body.isFeatured;

    const isActive =
      body.isActive === undefined
        ? existingDestination.isActive
        : body.isActive;

    if (!isBoolean(isFeatured)) {
      return errorResponse("isFeatured must be true or false.");
    }

    if (!isBoolean(isActive)) {
      return errorResponse("isActive must be true or false.");
    }

    /* ------------------------------------------------------------
       DUPLICATE SLUG
    ------------------------------------------------------------ */

    const duplicateDestination = await Destination.findOne({
      slug,
      _id: { $ne: id },
    }).lean();

    if (duplicateDestination) {
      return errorResponse("A destination with this slug already exists.", 409);
    }

    /* ------------------------------------------------------------
       UPDATE
    ------------------------------------------------------------ */

    const updateData = {
      name,
      slug,
      type,
      country,
      state: state || undefined,
      description,
      shortDescription: shortDescription || undefined,
      bestTimeToVisit: bestTimeToVisit || undefined,
      language: language || undefined,
      currency,
      address: address || undefined,

      latitude:
        body.latitude === undefined ||
        body.latitude === null ||
        body.latitude === ""
          ? undefined
          : Number(body.latitude),

      longitude:
        body.longitude === undefined ||
        body.longitude === null ||
        body.longitude === ""
          ? undefined
          : Number(body.longitude),

      coverImage: normalizeImage(body.coverImage),

      gallery: Array.isArray(body.gallery)
        ? body.gallery.map(normalizeImage)
        : [],

      isFeatured,
      isActive,
    };

    const updatedDestination = await Destination.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDestination) {
      return errorResponse("Destination not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Destination updated successfully.",
        data: updatedDestination,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Destination Error:", error);

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return errorResponse(messages || "Validation failed.", 400);
    }

    if (error?.code === 11000) {
      return errorResponse("A destination with this slug already exists.", 409);
    }

    return errorResponse("Failed to update destination.", 500);
  }
}

/* ================================================================
   DELETE DESTINATION
   DELETE /api/dashboard/destinations/:id

   Permanent delete + Cloudinary cleanup
================================================================ */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid destination ID.", 400);
    }

    const destination = await Destination.findById(id);

    if (!destination) {
      return errorResponse("Destination not found.", 404);
    }

    /* ------------------------------------------------------------
       COLLECT CLOUDINARY PUBLIC IDS
    ------------------------------------------------------------ */

    const publicIds = [];

    if (destination.coverImage?.publicId) {
      publicIds.push(destination.coverImage.publicId);
    }

    if (Array.isArray(destination.gallery)) {
      for (const image of destination.gallery) {
        if (image?.publicId) {
          publicIds.push(image.publicId);
        }
      }
    }

    /* ------------------------------------------------------------
       DELETE DATABASE RECORD
    ------------------------------------------------------------ */

    await Destination.findByIdAndDelete(id);

    /* ------------------------------------------------------------
       DELETE CLOUDINARY IMAGES
    ------------------------------------------------------------ */

    if (publicIds.length > 0) {
      await Promise.allSettled(
        publicIds.map((publicId) =>
          cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
          }),
        ),
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Destination deleted permanently.",
        data: {
          _id: destination._id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete Destination Error:", error);

    return errorResponse("Failed to delete destination.", 500);
  }
}

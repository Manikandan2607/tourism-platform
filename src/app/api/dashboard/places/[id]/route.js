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
import cloudinary from "@/utils/cloudinary";

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
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map((image) => normalizeImage(image)).filter(Boolean);
}

function validateGallery(gallery) {
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
   CLOUDINARY CLEANUP
================================================================ */

async function deleteCloudinaryImage(publicId) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.error(`Failed to delete Cloudinary image: ${publicId}`, error);
  }
}

async function deletePlaceImages(place) {
  const publicIds = [];

  if (place?.coverImage?.publicId) {
    publicIds.push(place.coverImage.publicId);
  }

  if (Array.isArray(place?.gallery)) {
    for (const image of place.gallery) {
      if (image?.publicId) {
        publicIds.push(image.publicId);
      }
    }
  }

  const uniquePublicIds = [...new Set(publicIds)];

  if (!uniquePublicIds.length) {
    return;
  }

  await Promise.all(
    uniquePublicIds.map((publicId) => deleteCloudinaryImage(publicId)),
  );
}

/* ================================================================
   GET PLACE BY ID
   GET /api/dashboard/places/:id
================================================================ */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid place ID.");
    }

    await connectDB();

    const place = await Place.findById(id)
      .populate("destination", "name slug")
      .lean();

    if (!place) {
      return errorResponse("Place not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        data: place,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET place error:", error);

    return errorResponse("Failed to fetch place.", 500);
  }
}

/* ================================================================
   UPDATE PLACE
   PUT /api/dashboard/places/:id
================================================================ */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid place ID.");
    }

    await connectDB();

    const existingPlace = await Place.findById(id);

    if (!existingPlace) {
      return errorResponse("Place not found.", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body.");
    }

    const updateData = {};

    /* ------------------------------------------------------------
       DESTINATION
    ------------------------------------------------------------ */

    if (body.destination !== undefined) {
      const destination = normalizeString(body.destination);

      if (!mongoose.isValidObjectId(destination)) {
        return errorResponse("Invalid destination ID.");
      }

      const destinationExists = await Destination.exists({
        _id: destination,
      });

      if (!destinationExists) {
        return errorResponse("Destination not found.", 404);
      }

      updateData.destination = destination;
    }

    /* ------------------------------------------------------------
       NAME
    ------------------------------------------------------------ */

    if (body.name !== undefined) {
      const name = normalizeString(body.name);

      if (!name) {
        return errorResponse("Place name is required.");
      }

      if (!nameRegex.test(name)) {
        return errorResponse(
          "Place name can contain alphabets and spaces only.",
        );
      }

      if (name.length < 2 || name.length > 150) {
        return errorResponse(
          "Place name must be between 2 and 150 characters.",
        );
      }

      updateData.name = name;
    }

    /* ------------------------------------------------------------
       SLUG
    ------------------------------------------------------------ */

    if (body.slug !== undefined) {
      const slug = normalizeString(body.slug).toLowerCase();

      if (!slug) {
        return errorResponse("Place slug is required.");
      }

      if (!slugRegex.test(slug)) {
        return errorResponse(
          "Slug can contain lowercase letters, numbers, and hyphens only.",
        );
      }

      if (slug.length > 150) {
        return errorResponse("Slug cannot exceed 150 characters.");
      }

      const duplicate = await Place.findOne({
        slug,
        _id: { $ne: id },
      }).lean();

      if (duplicate) {
        return errorResponse("Place slug already exists.", 409);
      }

      updateData.slug = slug;
    }

    /* ------------------------------------------------------------
       CATEGORY
    ------------------------------------------------------------ */

    if (body.category !== undefined) {
      const category = normalizeString(body.category);

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

      updateData.category = category;
    }

    /* ------------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------------ */

    if (body.description !== undefined) {
      const description = normalizeString(body.description);

      if (!description) {
        return errorResponse("Place description is required.");
      }

      if (description.length < 10 || description.length > 5000) {
        return errorResponse(
          "Description must be between 10 and 5000 characters.",
        );
      }

      updateData.description = description;
    }

    /* ------------------------------------------------------------
       STRING FIELDS
    ------------------------------------------------------------ */

    const stringFields = [
      "shortDescription",
      "openingTime",
      "closingTime",
      "closedOn",
      "bestTimeToVisit",
      "visitDuration",
      "address",
    ];

    const maxLengths = {
      shortDescription: 500,
      openingTime: 50,
      closingTime: 50,
      closedOn: 100,
      bestTimeToVisit: 200,
      visitDuration: 100,
      address: 500,
    };

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        const value = normalizeString(body[field]);

        if (value.length > maxLengths[field]) {
          return errorResponse(
            `${field} cannot exceed ${maxLengths[field]} characters.`,
          );
        }

        updateData[field] = value || undefined;
      }
    }

    /* ------------------------------------------------------------
       CURRENCY
    ------------------------------------------------------------ */

    if (body.currency !== undefined) {
      const currency = normalizeString(body.currency).toUpperCase();

      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return errorResponse("Currency must be INR or USD.");
      }

      updateData.currency = currency;
    }

    /* ------------------------------------------------------------
       ENTRY FEE
    ------------------------------------------------------------ */

    if (body.entryFee !== undefined) {
      const entryFee = normalizeEntryFee(body.entryFee);

      if (!entryFee) {
        return errorResponse(
          "Entry fee values must be valid non-negative numbers.",
        );
      }

      updateData.entryFee = entryFee;
    }

    /* ------------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------------ */

    if (body.coverImage !== undefined) {
      const imageError = validateImage(body.coverImage, "Cover image");

      if (imageError) {
        return errorResponse(imageError);
      }

      updateData.coverImage = normalizeImage(body.coverImage);
    }

    /* ------------------------------------------------------------
       GALLERY
    ------------------------------------------------------------ */

    if (body.gallery !== undefined) {
      const galleryError = validateGallery(body.gallery);

      if (galleryError) {
        return errorResponse(galleryError);
      }

      updateData.gallery = normalizeGallery(body.gallery);
    }

    /* ------------------------------------------------------------
       LATITUDE
    ------------------------------------------------------------ */

    if (body.latitude !== undefined) {
      const latitudeError = validateCoordinate(
        body.latitude,
        -90,
        90,
        "Latitude",
      );

      if (latitudeError) {
        return errorResponse(latitudeError);
      }

      const latitude = normalizeNumber(body.latitude);

      if (latitude === null) {
        return errorResponse("Latitude must be a valid number.");
      }

      updateData.latitude = latitude;
    }

    /* ------------------------------------------------------------
       LONGITUDE
    ------------------------------------------------------------ */

    if (body.longitude !== undefined) {
      const longitudeError = validateCoordinate(
        body.longitude,
        -180,
        180,
        "Longitude",
      );

      if (longitudeError) {
        return errorResponse(longitudeError);
      }

      const longitude = normalizeNumber(body.longitude);

      if (longitude === null) {
        return errorResponse("Longitude must be a valid number.");
      }

      updateData.longitude = longitude;
    }

    /* ------------------------------------------------------------
       BOOLEAN FIELDS
    ------------------------------------------------------------ */

    if (body.isFeatured !== undefined) {
      const error = validateBoolean(body.isFeatured, "isFeatured");

      if (error) {
        return errorResponse(error);
      }

      updateData.isFeatured = body.isFeatured;
    }

    if (body.isActive !== undefined) {
      const error = validateBoolean(body.isActive, "isActive");

      if (error) {
        return errorResponse(error);
      }

      updateData.isActive = body.isActive;
    }

    /* ------------------------------------------------------------
       UPDATE
    ------------------------------------------------------------ */

    const place = await Place.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("destination", "name slug");

    if (!place) {
      return errorResponse("Place not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Place updated successfully.",
        data: place,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT place error:", error);

    if (error?.code === 11000) {
      return errorResponse("Place slug already exists.", 409);
    }

    if (error?.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return errorResponse(message || "Validation failed.", 400);
    }

    return errorResponse("Failed to update place.", 500);
  }
}

/* ================================================================
   ACTIVATE / DEACTIVATE PLACE
   PATCH /api/dashboard/places/:id
================================================================ */

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid place ID.");
    }

    await connectDB();

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body.");
    }

    if (typeof body.isActive !== "boolean") {
      return errorResponse("isActive must be a boolean value.");
    }

    const place = await Place.findByIdAndUpdate(
      id,
      {
        isActive: body.isActive,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("destination", "name slug");

    if (!place) {
      return errorResponse("Place not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: body.isActive
          ? "Place activated successfully."
          : "Place deactivated successfully.",
        data: place,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH place status error:", error);

    if (error?.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return errorResponse(message || "Validation failed.", 400);
    }

    return errorResponse("Failed to update place status.", 500);
  }
}

/* ================================================================
   PERMANENT DELETE PLACE
   DELETE /api/dashboard/places/:id
================================================================ */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid place ID.");
    }

    await connectDB();

    const place = await Place.findById(id).lean();

    if (!place) {
      return errorResponse("Place not found.", 404);
    }

    /* ------------------------------------------------------------
       DELETE DATABASE RECORD
    ------------------------------------------------------------ */

    await Place.deleteOne({
      _id: id,
    });

    /* ------------------------------------------------------------
       DELETE CLOUDINARY IMAGES
    ------------------------------------------------------------ */

    await deletePlaceImages(place);

    return NextResponse.json(
      {
        success: true,
        message: "Place permanently deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE place error:", error);

    return errorResponse("Failed to permanently delete place.", 500);
  }
}

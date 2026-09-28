import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

import {
  Transportation,
  Destination,
  SUPPORTED_CURRENCIES,
  nameRegex,
  phoneRegex,
  urlRegex,
} from "@/utils/schema";

const TRANSPORTATION_TYPES = [
  "flight",
  "train",
  "bus",
  "taxi",
  "car-rental",
  "bike-rental",
];

const MAX_TEXT_LENGTH = {
  providerName: 150,
  from: 150,
  to: 150,
  description: 5000,
  estimatedDuration: 100,
  schedule: 500,
  bookingUrl: 500,
  contactPhone: 20,
};

const MAX_GALLERY_IMAGES = 30;
const MAX_PUBLIC_ID_LENGTH = 500;

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

function cleanString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
}

function validateText(value, field, maxLength, options = {}) {
  const { required = false, useNameRegex = false, minLength = 1 } = options;

  const cleaned = cleanString(value);

  if (!cleaned) {
    if (required) {
      return {
        value: null,
        error: `${field} is required`,
      };
    }

    return {
      value: undefined,
      error: null,
    };
  }

  if (cleaned.length < minLength) {
    return {
      value: null,
      error: `${field} must contain at least ${minLength} characters`,
    };
  }

  if (cleaned.length > maxLength) {
    return {
      value: null,
      error: `${field} cannot exceed ${maxLength} characters`,
    };
  }

  if (useNameRegex && !nameRegex.test(cleaned)) {
    return {
      value: null,
      error: `${field} can contain alphabets and spaces only`,
    };
  }

  return {
    value: cleaned,
    error: null,
  };
}

function normalizeImage(image, fieldName = "Image") {
  if (!image || typeof image !== "object") {
    return {
      value: null,
      error: `${fieldName} is required`,
    };
  }

  const url = cleanString(image.url);
  const publicId = cleanString(image.publicId);

  if (!url) {
    return {
      value: null,
      error: `${fieldName} URL is required`,
    };
  }

  if (!urlRegex.test(url)) {
    return {
      value: null,
      error: `${fieldName} URL must be a valid HTTP or HTTPS URL`,
    };
  }

  if (!publicId) {
    return {
      value: null,
      error: `${fieldName} public ID is required`,
    };
  }

  if (publicId.length > MAX_PUBLIC_ID_LENGTH) {
    return {
      value: null,
      error: `${fieldName} public ID is too long`,
    };
  }

  return {
    value: {
      url,
      publicId,
    },
    error: null,
  };
}

function normalizeGallery(gallery) {
  if (gallery === undefined || gallery === null) {
    return {
      value: [],
      error: null,
    };
  }

  if (!Array.isArray(gallery)) {
    return {
      value: null,
      error: "Gallery must be an array",
    };
  }

  if (gallery.length > MAX_GALLERY_IMAGES) {
    return {
      value: null,
      error: `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images`,
    };
  }

  const normalized = [];

  for (let index = 0; index < gallery.length; index += 1) {
    const result = normalizeImage(gallery[index], `Gallery image ${index + 1}`);

    if (result.error) {
      return {
        value: null,
        error: result.error,
      };
    }

    normalized.push(result.value);
  }

  return {
    value: normalized,
    error: null,
  };
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return NaN;
  }

  return number;
}

function validateCost(min, max) {
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return "Estimated cost must contain valid numbers";
  }

  if (min !== undefined && min < 0) {
    return "Minimum estimated cost cannot be negative";
  }

  if (max !== undefined && max < 0) {
    return "Maximum estimated cost cannot be negative";
  }

  if (min !== undefined && max !== undefined && min > max) {
    return "Minimum cost cannot be greater than maximum cost";
  }

  return null;
}

function parseBoolean(value, fieldName, defaultValue) {
  if (value === undefined || value === null) {
    return {
      value: defaultValue,
      error: null,
    };
  }

  if (typeof value === "boolean") {
    return {
      value,
      error: null,
    };
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return {
        value: true,
        error: null,
      };
    }

    if (normalized === "false") {
      return {
        value: false,
        error: null,
      };
    }
  }

  return {
    value: null,
    error: `${fieldName} must be a boolean`,
  };
}

function normalizePhone(value) {
  if (value === undefined || value === null || value === "") {
    return {
      value: undefined,
      error: null,
    };
  }

  const raw = String(value).trim();

  if (!raw) {
    return {
      value: undefined,
      error: null,
    };
  }

  if (raw.length > MAX_TEXT_LENGTH.contactPhone) {
    return {
      value: null,
      error: "Contact phone cannot exceed 20 characters",
    };
  }

  if (!/^\+?[0-9\s().-]+$/.test(raw)) {
    return {
      value: null,
      error: "Contact phone contains invalid characters",
    };
  }

  const digits = raw.replace(/\D/g, "");

  if (!phoneRegex.test(digits)) {
    return {
      value: null,
      error: "Contact phone must contain 7 to 15 digits",
    };
  }

  return {
    value: digits,
    error: null,
  };
}

function normalizeOptionalUrl(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return {
      value: undefined,
      error: null,
    };
  }

  const url = String(value).trim();

  if (!url) {
    return {
      value: undefined,
      error: null,
    };
  }

  if (url.length > MAX_TEXT_LENGTH.bookingUrl) {
    return {
      value: null,
      error: `${fieldName} cannot exceed ${MAX_TEXT_LENGTH.bookingUrl} characters`,
    };
  }

  if (!urlRegex.test(url)) {
    return {
      value: null,
      error: `${fieldName} must be a valid HTTP or HTTPS URL`,
    };
  }

  return {
    value: url,
    error: null,
  };
}

function getPublicIds(item) {
  const ids = [];

  if (item?.coverImage?.publicId) {
    ids.push(item.coverImage.publicId);
  }

  if (Array.isArray(item?.gallery)) {
    item.gallery.forEach((image) => {
      if (image?.publicId) {
        ids.push(image.publicId);
      }
    });
  }

  return [...new Set(ids)];
}

async function deleteCloudinaryImages(publicIds) {
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

function getDatabaseError(error) {
  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    if (duplicateField === "slug") {
      return {
        message: "A transportation record with this slug already exists",
        status: 409,
      };
    }

    return {
      message: "A record with the same value already exists",
      status: 409,
    };
  }

  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map(
      (item) => item.message,
    );

    return {
      message: messages[0] || "Validation failed",
      status: 400,
    };
  }

  if (error?.name === "CastError") {
    return {
      message: `Invalid value for ${error.path || "field"}`,
      status: 400,
    };
  }

  return {
    message: "Internal server error",
    status: 500,
  };
}

/* ================================================================
   GET ONE
================================================================ */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid transportation ID");
    }

    await connectDB();

    const transportation = await Transportation.findById(id)
      .populate("destination", "name slug")
      .lean();

    if (!transportation) {
      return errorResponse("Transportation not found", 404);
    }

    return NextResponse.json({
      success: true,
      data: transportation,
    });
  } catch (error) {
    console.error("Transportation GET by ID error:", error);

    return errorResponse("Failed to fetch transportation", 500);
  }
}

/* ================================================================
   UPDATE
================================================================ */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid transportation ID");
    }

    await connectDB();

    const existing = await Transportation.findById(id);

    if (!existing) {
      return errorResponse("Transportation not found", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body");
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Request body must be an object");
    }

    const update = {};

    /* Destination */

    if (body.destination !== undefined) {
      const destination = cleanString(body.destination);

      if (!destination) {
        return errorResponse("Destination is required");
      }

      if (!mongoose.isValidObjectId(destination)) {
        return errorResponse("Invalid destination");
      }

      const destinationExists = await Destination.exists({
        _id: destination,
      });

      if (!destinationExists) {
        return errorResponse("Selected destination was not found", 404);
      }

      update.destination = destination;
    }

    /* Type */

    if (body.type !== undefined) {
      const type = cleanString(body.type);

      if (!TRANSPORTATION_TYPES.includes(type)) {
        return errorResponse("Invalid transportation type");
      }

      update.type = type;
    }

    /* Provider */

    if (body.providerName !== undefined) {
      const result = validateText(
        body.providerName,
        "Provider name",
        MAX_TEXT_LENGTH.providerName,
        {
          required: true,
          useNameRegex: true,
          minLength: 2,
        },
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      update.providerName = result.value;
    }

    /* From */

    if (body.from !== undefined) {
      const result = validateText(body.from, "From", MAX_TEXT_LENGTH.from, {
        required: true,
        useNameRegex: true,
        minLength: 2,
      });

      if (result.error) {
        return errorResponse(result.error);
      }

      update.from = result.value;
    }

    /* To */

    if (body.to !== undefined) {
      const result = validateText(body.to, "To", MAX_TEXT_LENGTH.to, {
        required: true,
        useNameRegex: true,
        minLength: 2,
      });

      if (result.error) {
        return errorResponse(result.error);
      }

      update.to = result.value;
    }

    /* Description */

    if (body.description !== undefined) {
      const result = validateText(
        body.description,
        "Description",
        MAX_TEXT_LENGTH.description,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      update.description = result.value || "";
    }

    /* Estimated Duration */

    if (body.estimatedDuration !== undefined) {
      const result = validateText(
        body.estimatedDuration,
        "Estimated duration",
        MAX_TEXT_LENGTH.estimatedDuration,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      update.estimatedDuration = result.value || "";
    }

    /* Schedule */

    if (body.schedule !== undefined) {
      const result = validateText(
        body.schedule,
        "Schedule",
        MAX_TEXT_LENGTH.schedule,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      update.schedule = result.value || "";
    }

    /* Booking URL */

    if (body.bookingUrl !== undefined) {
      const result = normalizeOptionalUrl(body.bookingUrl, "Booking URL");

      if (result.error) {
        return errorResponse(result.error);
      }

      update.bookingUrl = result.value || "";
    }

    /* Contact Phone */

    if (body.contactPhone !== undefined) {
      const result = normalizePhone(body.contactPhone);

      if (result.error) {
        return errorResponse(result.error);
      }

      update.contactPhone = result.value || "";
    }

    /* Currency */

    if (body.currency !== undefined) {
      const currency = cleanString(body.currency)?.toUpperCase();

      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return errorResponse("Currency must be INR or USD");
      }

      update.currency = currency;
    }

    /* Estimated Cost */

    if (body.estimatedCost !== undefined) {
      if (
        body.estimatedCost === null ||
        typeof body.estimatedCost !== "object" ||
        Array.isArray(body.estimatedCost)
      ) {
        return errorResponse("Estimated cost must be an object");
      }

      const min = parseOptionalNumber(body.estimatedCost.min);

      const max = parseOptionalNumber(body.estimatedCost.max);

      const costError = validateCost(min, max);

      if (costError) {
        return errorResponse(costError);
      }

      update.estimatedCost = {
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
      };
    }

    /* Cover Image */

    if (body.coverImage !== undefined) {
      const result = normalizeImage(body.coverImage, "Cover image");

      if (result.error) {
        return errorResponse(result.error);
      }

      update.coverImage = result.value;
    }

    /* Gallery */

    if (body.gallery !== undefined) {
      const result = normalizeGallery(body.gallery);

      if (result.error) {
        return errorResponse(result.error);
      }

      update.gallery = result.value;
    }

    /* Active */

    if (body.isActive !== undefined) {
      const result = parseBoolean(body.isActive, "isActive", true);

      if (result.error) {
        return errorResponse(result.error);
      }

      update.isActive = result.value;
    }

    if (Object.keys(update).length === 0) {
      return errorResponse("No valid fields were provided for update");
    }

    const oldPublicIds = getPublicIds(existing);

    const updated = await Transportation.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate("destination", "name slug")
      .lean();

    if (!updated) {
      return errorResponse("Transportation not found", 404);
    }

    /* Cloudinary cleanup */

    if (body.coverImage !== undefined || body.gallery !== undefined) {
      const newPublicIds = getPublicIds(updated);

      const removedPublicIds = oldPublicIds.filter(
        (publicId) => !newPublicIds.includes(publicId),
      );

      if (removedPublicIds.length > 0) {
        await deleteCloudinaryImages(removedPublicIds);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transportation updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Transportation PUT error:", error);

    const databaseError = getDatabaseError(error);

    return errorResponse(databaseError.message, databaseError.status);
  }
}

/* ================================================================
   ACTIVATE / DEACTIVATE
================================================================ */

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid transportation ID");
    }

    await connectDB();

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body");
    }

    if (typeof body?.isActive !== "boolean") {
      return errorResponse("isActive must be a boolean");
    }

    const transportation = await Transportation.findByIdAndUpdate(
      id,
      {
        isActive: body.isActive,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("destination", "name slug")
      .lean();

    if (!transportation) {
      return errorResponse("Transportation not found", 404);
    }

    return NextResponse.json({
      success: true,
      message: body.isActive
        ? "Transportation activated successfully"
        : "Transportation deactivated successfully",
      data: transportation,
    });
  } catch (error) {
    console.error("Transportation PATCH error:", error);

    const databaseError = getDatabaseError(error);

    return errorResponse(databaseError.message, databaseError.status);
  }
}

/* ================================================================
   PERMANENT DELETE
================================================================ */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid transportation ID");
    }

    await connectDB();

    const transportation = await Transportation.findById(id);

    if (!transportation) {
      return errorResponse("Transportation not found", 404);
    }

    const publicIds = getPublicIds(transportation);

    await Transportation.findByIdAndDelete(id);

    if (publicIds.length > 0) {
      await deleteCloudinaryImages(publicIds);
    }

    return NextResponse.json({
      success: true,
      message: "Transportation permanently deleted",
    });
  } catch (error) {
    console.error("Transportation DELETE error:", error);

    return errorResponse("Failed to delete transportation", 500);
  }
}

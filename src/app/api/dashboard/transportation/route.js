import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import { requireAdmin } from "@/utils/adminAuth";
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
   GET ALL TRANSPORTATION
================================================================ */

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const transportation = await Transportation.find({})
      .populate("destination", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: transportation.length,
      data: transportation,
    });
  } catch (error) {
    console.error("Transportation GET error:", error);

    return errorResponse("Failed to fetch transportation", 500);
  }
}

/* ================================================================
   CREATE TRANSPORTATION
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
      return errorResponse("Invalid JSON request body");
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Request body must be an object");
    }

    /* Destination */

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

    /* Type */

    const type = cleanString(body.type);

    if (!type) {
      return errorResponse("Transportation type is required");
    }

    if (!TRANSPORTATION_TYPES.includes(type)) {
      return errorResponse("Invalid transportation type");
    }

    /* Provider */

    const providerResult = validateText(
      body.providerName,
      "Provider name",
      MAX_TEXT_LENGTH.providerName,
      {
        required: true,
        useNameRegex: true,
        minLength: 2,
      },
    );

    if (providerResult.error) {
      return errorResponse(providerResult.error);
    }

    /* From */

    const fromResult = validateText(body.from, "From", MAX_TEXT_LENGTH.from, {
      required: true,
      useNameRegex: true,
      minLength: 2,
    });

    if (fromResult.error) {
      return errorResponse(fromResult.error);
    }

    /* To */

    const toResult = validateText(body.to, "To", MAX_TEXT_LENGTH.to, {
      required: true,
      useNameRegex: true,
      minLength: 2,
    });

    if (toResult.error) {
      return errorResponse(toResult.error);
    }

    /* Description */

    const descriptionResult = validateText(
      body.description,
      "Description",
      MAX_TEXT_LENGTH.description,
    );

    if (descriptionResult.error) {
      return errorResponse(descriptionResult.error);
    }

    /* Estimated duration */

    const durationResult = validateText(
      body.estimatedDuration,
      "Estimated duration",
      MAX_TEXT_LENGTH.estimatedDuration,
    );

    if (durationResult.error) {
      return errorResponse(durationResult.error);
    }

    /* Schedule */

    const scheduleResult = validateText(
      body.schedule,
      "Schedule",
      MAX_TEXT_LENGTH.schedule,
    );

    if (scheduleResult.error) {
      return errorResponse(scheduleResult.error);
    }

    /* Booking URL */

    const bookingUrlResult = normalizeOptionalUrl(
      body.bookingUrl,
      "Booking URL",
    );

    if (bookingUrlResult.error) {
      return errorResponse(bookingUrlResult.error);
    }

    /* Contact phone */

    const phoneResult = normalizePhone(body.contactPhone);

    if (phoneResult.error) {
      return errorResponse(phoneResult.error);
    }

    /* Currency */

    const currency = cleanString(body.currency)?.toUpperCase() || "INR";

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return errorResponse("Currency must be INR or USD");
    }

    /* Estimated cost */

    let estimatedMin;
    let estimatedMax;

    if (body.estimatedCost !== undefined && body.estimatedCost !== null) {
      if (
        typeof body.estimatedCost !== "object" ||
        Array.isArray(body.estimatedCost)
      ) {
        return errorResponse("Estimated cost must be an object");
      }

      estimatedMin = parseOptionalNumber(body.estimatedCost.min);

      estimatedMax = parseOptionalNumber(body.estimatedCost.max);
    }

    const costError = validateCost(estimatedMin, estimatedMax);

    if (costError) {
      return errorResponse(costError);
    }

    /* Cover image */

    const coverResult = normalizeImage(body.coverImage, "Cover image");

    if (coverResult.error) {
      return errorResponse(coverResult.error);
    }

    /* Gallery */

    const galleryResult = normalizeGallery(body.gallery);

    if (galleryResult.error) {
      return errorResponse(galleryResult.error);
    }

    /* Active status */

    const activeResult = parseBoolean(body.isActive, "isActive", true);

    if (activeResult.error) {
      return errorResponse(activeResult.error);
    }

    /* Create */

    const transportation = await Transportation.create({
      destination,
      type,
      providerName: providerResult.value,
      from: fromResult.value,
      to: toResult.value,
      description: descriptionResult.value || "",
      estimatedDuration: durationResult.value || "",
      schedule: scheduleResult.value || "",
      bookingUrl: bookingUrlResult.value || "",
      contactPhone: phoneResult.value || "",
      currency,
      estimatedCost: {
        ...(estimatedMin !== undefined ? { min: estimatedMin } : {}),
        ...(estimatedMax !== undefined ? { max: estimatedMax } : {}),
      },
      coverImage: coverResult.value,
      gallery: galleryResult.value,
      isActive: activeResult.value,
    });

    const populated = await Transportation.findById(transportation._id)
      .populate("destination", "name slug")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Transportation created successfully",
        data: populated,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Transportation POST error:", error);

    const databaseError = getDatabaseError(error);

    return errorResponse(databaseError.message, databaseError.status);
  }
}

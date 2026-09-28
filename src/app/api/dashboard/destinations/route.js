import { NextResponse } from "next/server";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  nameRegex,
  slugRegex,
  urlRegex,
} from "@/utils/schema";

import { requireAdmin } from "@/utils/adminAuth";

/* =========================================================
   HELPERS
========================================================= */

function errorResponse(
  message,
  status = 400,
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    },
  );
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidBoolean(value) {
  return typeof value === "boolean";
}

function validateCoordinate(
  value,
  min,
  max,
  fieldName,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${fieldName} must be a valid number.`;
  }

  if (
    number < min ||
    number > max
  ) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }

  return null;
}

function validateImage(
  image,
  fieldName = "Image",
) {
  if (
    !image ||
    typeof image !== "object"
  ) {
    return `${fieldName} is required.`;
  }

  const url = normalizeString(
    image.url,
  );

  const publicId =
    normalizeString(
      image.publicId,
    );

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
  if (
    !image ||
    typeof image !== "object"
  ) {
    return null;
  }

  return {
    url: normalizeString(
      image.url,
    ),
    publicId: normalizeString(
      image.publicId,
    ),
  };
}

function validateGallery(
  gallery,
) {
  if (gallery === undefined) {
    return [];
  }

  if (!Array.isArray(gallery)) {
    return "Gallery must be an array.";
  }

  if (gallery.length > 30) {
    return "Gallery cannot contain more than 30 images.";
  }

  for (
    let index = 0;
    index < gallery.length;
    index += 1
  ) {
    const error =
      validateImage(
        gallery[index],
        `Gallery image ${index + 1}`,
      );

    if (error) {
      return error;
    }
  }

  return null;
}

/* =========================================================
   GET
   GET /api/dashboard/destinations
========================================================= */

export async function GET(request) {
  try {
    const admin =
      await requireAdmin(request);

    if (!admin) {
      return errorResponse(
        "Unauthorized. Admin access required.",
        401,
      );
    }

    await connectDB();

    const destinations =
      await Destination.find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
     * IMPORTANT:
     *
     * The frontend receives:
     *
     * response.data === destinations
     *
     * Example:
     *
     * {
     *   success: true,
     *   count: 3,
     *   data: [
     *     {...},
     *     {...},
     *     {...}
     *   ]
     * }
     */

    return NextResponse.json(
      {
        success: true,
        count: destinations.length,
        data: destinations,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Get Destinations Error:",
      error,
    );

    return errorResponse(
      "Failed to fetch destinations.",
      500,
    );
  }
}

/* =========================================================
   POST
   POST /api/dashboard/destinations
========================================================= */

export async function POST(request) {
  try {
    const admin =
      await requireAdmin(request);

    if (!admin) {
      return errorResponse(
        "Unauthorized. Admin access required.",
        401,
      );
    }

    await connectDB();

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body.",
      );
    }

    /* =======================================================
       NORMALIZE
    ======================================================= */

    const name =
      normalizeString(body.name);

    const slug =
      normalizeString(body.slug)
        .toLowerCase();

    const type =
      normalizeString(body.type)
        .toLowerCase();

    const country =
      normalizeString(body.country);

    const state =
      normalizeString(body.state);

    const description =
      normalizeString(
        body.description,
      );

    const shortDescription =
      normalizeString(
        body.shortDescription,
      );

    const bestTimeToVisit =
      normalizeString(
        body.bestTimeToVisit,
      );

    const language =
      normalizeString(
        body.language,
      );

    const currency =
      normalizeString(
        body.currency,
      ).toUpperCase();

    const address =
      normalizeString(
        body.address,
      );

    /* =======================================================
       REQUIRED
    ======================================================= */

    if (!name) {
      return errorResponse(
        "Destination name is required.",
      );
    }

    if (!slug) {
      return errorResponse(
        "Destination slug is required.",
      );
    }

    if (!type) {
      return errorResponse(
        "Destination type is required.",
      );
    }

    if (!country) {
      return errorResponse(
        "Country is required.",
      );
    }

    if (!description) {
      return errorResponse(
        "Description is required.",
      );
    }

    if (!body.coverImage) {
      return errorResponse(
        "Cover image is required.",
      );
    }

    /* =======================================================
       NAME
    ======================================================= */

    if (!nameRegex.test(name)) {
      return errorResponse(
        "Destination name can contain alphabets and spaces only.",
      );
    }

    if (
      country &&
      !nameRegex.test(country)
    ) {
      return errorResponse(
        "Country can contain alphabets and spaces only.",
      );
    }

    if (
      state &&
      !nameRegex.test(state)
    ) {
      return errorResponse(
        "State can contain alphabets and spaces only.",
      );
    }

    /* =======================================================
       LENGTH
    ======================================================= */

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return errorResponse(
        "Destination name must be between 2 and 100 characters.",
      );
    }

    if (
      country.length < 2 ||
      country.length > 100
    ) {
      return errorResponse(
        "Country must be between 2 and 100 characters.",
      );
    }

    if (state.length > 100) {
      return errorResponse(
        "State cannot exceed 100 characters.",
      );
    }

    if (
      description.length < 10 ||
      description.length > 5000
    ) {
      return errorResponse(
        "Description must be between 10 and 5000 characters.",
      );
    }

    if (
      shortDescription.length > 500
    ) {
      return errorResponse(
        "Short description cannot exceed 500 characters.",
      );
    }

    if (
      bestTimeToVisit.length > 200
    ) {
      return errorResponse(
        "Best time to visit cannot exceed 200 characters.",
      );
    }

    if (address.length > 500) {
      return errorResponse(
        "Address cannot exceed 500 characters.",
      );
    }

    /* =======================================================
       SLUG
    ======================================================= */

    if (!slugRegex.test(slug)) {
      return errorResponse(
        "Slug can contain lowercase letters, numbers, and hyphens only.",
      );
    }

    /* =======================================================
       TYPE
    ======================================================= */

    const allowedTypes = [
      "country",
      "state",
      "city",
      "region",
    ];

    if (
      !allowedTypes.includes(type)
    ) {
      return errorResponse(
        "Invalid destination type.",
      );
    }

    /* =======================================================
       LANGUAGE
    ======================================================= */

    if (
      language &&
      !SUPPORTED_LANGUAGES.includes(
        language,
      )
    ) {
      return errorResponse(
        "Language must be Tamil, English, Hindi, or Malayalam.",
      );
    }

    /* =======================================================
       CURRENCY
    ======================================================= */

    if (
      !SUPPORTED_CURRENCIES.includes(
        currency,
      )
    ) {
      return errorResponse(
        "Currency must be INR or USD.",
      );
    }

    /* =======================================================
       COVER IMAGE
    ======================================================= */

    const coverImageError =
      validateImage(
        body.coverImage,
        "Cover image",
      );

    if (coverImageError) {
      return errorResponse(
        coverImageError,
      );
    }

    /* =======================================================
       GALLERY
    ======================================================= */

    const galleryError =
      validateGallery(
        body.gallery,
      );

    if (galleryError) {
      return errorResponse(
        galleryError,
      );
    }

    /* =======================================================
       COORDINATES
    ======================================================= */

    const latitudeError =
      validateCoordinate(
        body.latitude,
        -90,
        90,
        "Latitude",
      );

    if (latitudeError) {
      return errorResponse(
        latitudeError,
      );
    }

    const longitudeError =
      validateCoordinate(
        body.longitude,
        -180,
        180,
        "Longitude",
      );

    if (longitudeError) {
      return errorResponse(
        longitudeError,
      );
    }

    /* =======================================================
       BOOLEAN
    ======================================================= */

    const isFeatured =
      body.isFeatured === undefined
        ? false
        : body.isFeatured;

    const isActive =
      body.isActive === undefined
        ? true
        : body.isActive;

    if (
      !isValidBoolean(isFeatured)
    ) {
      return errorResponse(
        "isFeatured must be true or false.",
      );
    }

    if (
      !isValidBoolean(isActive)
    ) {
      return errorResponse(
        "isActive must be true or false.",
      );
    }

    /* =======================================================
       DUPLICATE
    ======================================================= */

    const existingDestination =
      await Destination.findOne({
        slug,
      }).lean();

    if (existingDestination) {
      return errorResponse(
        "A destination with this slug already exists.",
        409,
      );
    }

    /* =======================================================
       CREATE
    ======================================================= */

    const destination =
      await Destination.create({
        name,
        slug,
        type,
        country,

        state:
          state || undefined,

        description,

        shortDescription:
          shortDescription ||
          undefined,

        bestTimeToVisit:
          bestTimeToVisit ||
          undefined,

        language:
          language || undefined,

        currency,

        address:
          address || undefined,

        latitude:
          body.latitude ===
            undefined ||
          body.latitude === null ||
          body.latitude === ""
            ? undefined
            : Number(
                body.latitude,
              ),

        longitude:
          body.longitude ===
            undefined ||
          body.longitude === null ||
          body.longitude === ""
            ? undefined
            : Number(
                body.longitude,
              ),

        coverImage:
          normalizeImage(
            body.coverImage,
          ),

        gallery:
          Array.isArray(
            body.gallery,
          )
            ? body.gallery
                .map(
                  normalizeImage,
                )
                .filter(Boolean)
            : [],

        isFeatured,
        isActive,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Destination created successfully.",
        data: destination,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create Destination Error:",
      error,
    );

    if (
      error?.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors,
        )
          .map(
            (item) =>
              item.message,
          )
          .join(", ");

      return errorResponse(
        messages ||
          "Validation failed.",
        400,
      );
    }

    if (
      error?.code === 11000
    ) {
      return errorResponse(
        "A destination with this slug already exists.",
        409,
      );
    }

    return errorResponse(
      "Failed to create destination.",
      500,
    );
  }
}
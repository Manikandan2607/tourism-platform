import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import {
  Destination,
  Package,
  Place,
  SUPPORTED_CURRENCIES,
  nameRegex,
  slugRegex,
  urlRegex,
} from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";

const ALLOWED_PRICE_TYPES = ["per-person", "per-couple", "per-group"];

const MAX_GALLERY_IMAGES = 30;
const MAX_ARRAY_ITEMS = 50;
const MAX_ITINERARY_DAYS = 60;

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
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeImage(image) {
  if (!image || typeof image !== "object" || Array.isArray(image)) {
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
      valid: false,
      message: `${fieldName} must contain both URL and public ID`,
    };
  }

  if (!urlRegex.test(normalizedImage.url)) {
    return {
      valid: false,
      message: `${fieldName} URL must be a valid HTTP or HTTPS URL`,
    };
  }

  return {
    valid: true,
    image: normalizedImage,
  };
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map(normalizeImage);
}

function validateGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return {
      valid: false,
      message: "Gallery must be an array",
    };
  }

  if (gallery.length > MAX_GALLERY_IMAGES) {
    return {
      valid: false,
      message: `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images`,
    };
  }

  const normalizedGallery = [];

  for (let index = 0; index < gallery.length; index += 1) {
    const result = validateImage(gallery[index], `Gallery image ${index + 1}`);

    if (!result.valid) {
      return result;
    }

    normalizedGallery.push(result.image);
  }

  return {
    valid: true,
    gallery: normalizedGallery,
  };
}

function parseStrictBoolean(value) {
  if (typeof value === "boolean") {
    return {
      valid: true,
      value,
    };
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return {
        valid: true,
        value: true,
      };
    }

    if (normalized === "false") {
      return {
        valid: true,
        value: false,
      };
    }
  }

  return {
    valid: false,
    message: "Value must be a boolean",
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => normalizeString(item)).filter(Boolean);
}

function validateStringArray(
  value,
  fieldName,
  maxItems = MAX_ARRAY_ITEMS,
  maxItemLength = 200,
) {
  if (!Array.isArray(value)) {
    return {
      valid: false,
      message: `${fieldName} must be an array`,
    };
  }

  if (value.length > maxItems) {
    return {
      valid: false,
      message: `${fieldName} cannot contain more than ${maxItems} items`,
    };
  }

  const normalized = [];

  for (let index = 0; index < value.length; index += 1) {
    const item = normalizeString(value[index]);

    if (!item) {
      return {
        valid: false,
        message: `${fieldName} item ${index + 1} cannot be empty`,
      };
    }

    if (item.length > maxItemLength) {
      return {
        valid: false,
        message: `${fieldName} item ${index + 1} cannot exceed ${maxItemLength} characters`,
      };
    }

    normalized.push(item);
  }

  return {
    valid: true,
    value: normalized,
  };
}

function validateCurrency(currency) {
  const normalized = normalizeString(currency).toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(normalized)) {
    return {
      valid: false,
      message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
    };
  }

  return {
    valid: true,
    value: normalized,
  };
}

function validateName(value) {
  const name = normalizeString(value);

  if (!name) {
    return {
      valid: false,
      message: "Package name is required",
    };
  }

  if (name.length < 2 || name.length > 150) {
    return {
      valid: false,
      message: "Package name must be between 2 and 150 characters",
    };
  }

  if (!nameRegex.test(name)) {
    return {
      valid: false,
      message: "Package name may contain alphabets and spaces only",
    };
  }

  return {
    valid: true,
    value: name,
  };
}

function validateSlug(value) {
  const slug = normalizeSlug(value);

  if (!slug) {
    return {
      valid: false,
      message: "Package slug is required",
    };
  }

  if (slug.length > 150) {
    return {
      valid: false,
      message: "Package slug cannot exceed 150 characters",
    };
  }

  if (!slugRegex.test(slug)) {
    return {
      valid: false,
      message:
        "Package slug may contain lowercase letters, numbers and hyphens only",
    };
  }

  return {
    valid: true,
    value: slug,
  };
}

function validateDescription(value) {
  const description = normalizeString(value);

  if (!description) {
    return {
      valid: false,
      message: "Package description is required",
    };
  }

  if (description.length < 10 || description.length > 5000) {
    return {
      valid: false,
      message: "Package description must be between 10 and 5000 characters",
    };
  }

  return {
    valid: true,
    value: description,
  };
}

function validateShortDescription(value) {
  const shortDescription = normalizeString(value);

  if (shortDescription.length > 500) {
    return {
      valid: false,
      message: "Short description cannot exceed 500 characters",
    };
  }

  return {
    valid: true,
    value: shortDescription,
  };
}

function validatePrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return {
      valid: false,
      message: "Price must be a valid non-negative number",
    };
  }

  return {
    valid: true,
    value: price,
  };
}

function validateDuration(duration) {
  if (!duration || typeof duration !== "object" || Array.isArray(duration)) {
    return {
      valid: false,
      message: "Duration must contain days and nights",
    };
  }

  const days = Number(duration.days);
  const nights = Number(duration.nights);

  if (
    !Number.isInteger(days) ||
    days < 1 ||
    !Number.isInteger(nights) ||
    nights < 0
  ) {
    return {
      valid: false,
      message:
        "Duration days must be a whole number of at least 1 and nights must be a whole number of 0 or more",
    };
  }

  if (days > 365 || nights > 365) {
    return {
      valid: false,
      message: "Duration cannot exceed 365 days or nights",
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

function validatePriceType(value) {
  const priceType = normalizeString(value);

  if (!ALLOWED_PRICE_TYPES.includes(priceType)) {
    return {
      valid: false,
      message: `Price type must be one of: ${ALLOWED_PRICE_TYPES.join(", ")}`,
    };
  }

  return {
    valid: true,
    value: priceType,
  };
}

async function validateItinerary(itinerary, destinationId) {
  if (itinerary === undefined || itinerary === null) {
    return {
      valid: true,
      itinerary: [],
    };
  }

  if (!Array.isArray(itinerary)) {
    return {
      valid: false,
      message: "Itinerary must be an array",
    };
  }

  if (itinerary.length > MAX_ITINERARY_DAYS) {
    return {
      valid: false,
      message: `Itinerary cannot contain more than ${MAX_ITINERARY_DAYS} days`,
    };
  }

  const normalized = [];
  const usedDays = new Set();
  const allPlaceIds = new Set();

  for (let index = 0; index < itinerary.length; index += 1) {
    const item = itinerary[index];

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return {
        valid: false,
        message: `Invalid itinerary item at position ${index + 1}`,
      };
    }

    const day = Number(item.day);

    if (!Number.isInteger(day) || day < 1) {
      return {
        valid: false,
        message: `Invalid itinerary day at position ${index + 1}`,
      };
    }

    if (usedDays.has(day)) {
      return {
        valid: false,
        message: `Duplicate itinerary day: Day ${day}`,
      };
    }

    usedDays.add(day);

    const title = normalizeString(item.title);

    if (!title) {
      return {
        valid: false,
        message: `Itinerary title is required for Day ${day}`,
      };
    }

    if (title.length > 200) {
      return {
        valid: false,
        message: `Itinerary title for Day ${day} cannot exceed 200 characters`,
      };
    }

    const description = normalizeString(item.description);

    if (description.length > 2000) {
      return {
        valid: false,
        message: `Itinerary description for Day ${day} cannot exceed 2000 characters`,
      };
    }

    if (item.places !== undefined && !Array.isArray(item.places)) {
      return {
        valid: false,
        message: `Places for Day ${day} must be an array`,
      };
    }

    const rawPlaces = Array.isArray(item.places) ? item.places : [];

    const places = [];

    for (const placeId of rawPlaces) {
      if (!mongoose.isValidObjectId(placeId)) {
        return {
          valid: false,
          message: `Invalid place ID: ${placeId}`,
        };
      }

      const normalizedPlaceId = String(placeId);

      if (!allPlaceIds.has(normalizedPlaceId)) {
        allPlaceIds.add(normalizedPlaceId);
        places.push(normalizedPlaceId);
      }
    }

    normalized.push({
      day,
      title,
      description,
      places,
    });
  }

  if (allPlaceIds.size > 0) {
    const placeIds = Array.from(allPlaceIds);

    const places = await Place.find({
      _id: {
        $in: placeIds,
      },
    })
      .select("_id destination")
      .lean();

    if (places.length !== placeIds.length) {
      const existingIds = new Set(places.map((place) => String(place._id)));

      const missingPlaceId = placeIds.find(
        (placeId) => !existingIds.has(placeId),
      );

      return {
        valid: false,
        message: `Place not found: ${missingPlaceId}`,
      };
    }

    const invalidDestinationPlace = places.find(
      (place) => String(place.destination) !== String(destinationId),
    );

    if (invalidDestinationPlace) {
      return {
        valid: false,
        message: "All itinerary places must belong to the selected destination",
      };
    }
  }

  normalized.sort((a, b) => a.day - b.day);

  return {
    valid: true,
    itinerary: normalized,
  };
}

async function populatePackage(packageId) {
  return Package.findById(packageId)
    .populate("destination", "name slug")
    .populate("itinerary.places", "name slug category")
    .lean();
}

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    await connectDB();

    const packages = await Package.find({})
      .populate("destination", "name slug")
      .populate("itinerary.places", "name slug category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("GET packages error:", error);

    return errorResponse("Failed to fetch packages", 500);
  }
}

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
      return errorResponse("Request body must contain valid JSON", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body", 400);
    }

    const {
      destination,
      name,
      slug,
      shortDescription,
      description,
      duration,
      price,
      priceType,
      currency,
      inclusions,
      exclusions,
      itinerary,
      coverImage,
      gallery,
      isFeatured,
      isActive,
    } = body;

    /*
     * Destination
     */
    if (!destination) {
      return errorResponse("Destination is required", 400);
    }

    if (!mongoose.isValidObjectId(destination)) {
      return errorResponse("Invalid destination ID", 400);
    }

    const destinationExists = await Destination.exists({
      _id: destination,
    });

    if (!destinationExists) {
      return errorResponse("Destination not found", 404);
    }

    /*
     * Name
     */
    const nameValidation = validateName(name);

    if (!nameValidation.valid) {
      return errorResponse(nameValidation.message, 400);
    }

    /*
     * Slug
     */
    const slugValidation = validateSlug(slug);

    if (!slugValidation.valid) {
      return errorResponse(slugValidation.message, 400);
    }

    /*
     * Description
     */
    const descriptionValidation = validateDescription(description);

    if (!descriptionValidation.valid) {
      return errorResponse(descriptionValidation.message, 400);
    }

    /*
     * Short description
     */
    const shortDescriptionValidation =
      validateShortDescription(shortDescription);

    if (!shortDescriptionValidation.valid) {
      return errorResponse(shortDescriptionValidation.message, 400);
    }

    /*
     * Duration
     */
    const durationValidation = validateDuration(duration);

    if (!durationValidation.valid) {
      return errorResponse(durationValidation.message, 400);
    }

    /*
     * Price
     */
    const priceValidation = validatePrice(price);

    if (!priceValidation.valid) {
      return errorResponse(priceValidation.message, 400);
    }

    /*
     * Price type
     */
    const priceTypeValidation = validatePriceType(priceType || "per-person");

    if (!priceTypeValidation.valid) {
      return errorResponse(priceTypeValidation.message, 400);
    }

    /*
     * Currency
     */
    const currencyValidation = validateCurrency(currency || "INR");

    if (!currencyValidation.valid) {
      return errorResponse(currencyValidation.message, 400);
    }

    /*
     * Cover image
     */
    const coverImageValidation = validateImage(coverImage, "Cover image");

    if (!coverImageValidation.valid) {
      return errorResponse(coverImageValidation.message, 400);
    }

    /*
     * Gallery
     */
    const galleryValidation = validateGallery(gallery || []);

    if (!galleryValidation.valid) {
      return errorResponse(galleryValidation.message, 400);
    }

    /*
     * Inclusions
     */
    const inclusionsValidation = validateStringArray(
      inclusions || [],
      "Inclusions",
      MAX_ARRAY_ITEMS,
      200,
    );

    if (!inclusionsValidation.valid) {
      return errorResponse(inclusionsValidation.message, 400);
    }

    /*
     * Exclusions
     */
    const exclusionsValidation = validateStringArray(
      exclusions || [],
      "Exclusions",
      MAX_ARRAY_ITEMS,
      200,
    );

    if (!exclusionsValidation.valid) {
      return errorResponse(exclusionsValidation.message, 400);
    }

    /*
     * Boolean fields
     */
    const featuredValidation =
      isFeatured === undefined
        ? {
            valid: true,
            value: false,
          }
        : parseStrictBoolean(isFeatured);

    if (!featuredValidation.valid) {
      return errorResponse("isFeatured must be a boolean", 400);
    }

    const activeValidation =
      isActive === undefined
        ? {
            valid: true,
            value: true,
          }
        : parseStrictBoolean(isActive);

    if (!activeValidation.valid) {
      return errorResponse("isActive must be a boolean", 400);
    }

    /*
     * Slug uniqueness
     */
    const existingPackage = await Package.exists({
      slug: slugValidation.value,
    });

    if (existingPackage) {
      return errorResponse("Package slug already exists", 409);
    }

    /*
     * Itinerary
     */
    const itineraryValidation = await validateItinerary(
      itinerary || [],
      destination,
    );

    if (!itineraryValidation.valid) {
      return errorResponse(itineraryValidation.message, 400);
    }

    /*
     * Create package
     */
    const createdPackage = await Package.create({
      destination,

      name: nameValidation.value,

      slug: slugValidation.value,

      shortDescription: shortDescriptionValidation.value,

      description: descriptionValidation.value,

      duration: durationValidation.value,

      price: priceValidation.value,

      priceType: priceTypeValidation.value,

      currency: currencyValidation.value,

      inclusions: inclusionsValidation.value,

      exclusions: exclusionsValidation.value,

      itinerary: itineraryValidation.itinerary,

      coverImage: coverImageValidation.image,

      gallery: galleryValidation.gallery,

      isFeatured: featuredValidation.value,

      isActive: activeValidation.value,
    });

    const packageData = await populatePackage(createdPackage._id);

    return NextResponse.json(
      {
        success: true,
        message: "Package created successfully",
        data: packageData,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST package error:", error);

    if (error?.code === 11000) {
      return errorResponse("Package slug already exists", 409);
    }

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {})
        .map((item) => item.message)
        .filter(Boolean);

      return errorResponse(
        messages.length > 0 ? messages.join(", ") : "Package validation failed",
        400,
      );
    }

    return errorResponse("Failed to create package", 500);
  }
}
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
import cloudinary from "@/utils/cloudinary";

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

function validateCurrency(value) {
  const currency = normalizeString(value).toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return {
      valid: false,
      message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
    };
  }

  return {
    valid: true,
    value: currency,
  };
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

function getPackageImagePublicIds(packageData) {
  const publicIds = [];

  if (packageData?.coverImage?.publicId) {
    publicIds.push(String(packageData.coverImage.publicId));
  }

  if (Array.isArray(packageData?.gallery)) {
    for (const image of packageData.gallery) {
      if (image?.publicId) {
        publicIds.push(String(image.publicId));
      }
    }
  }

  return [...new Set(publicIds.filter(Boolean))];
}

async function deleteCloudinaryImages(publicIds) {
  if (!Array.isArray(publicIds)) {
    return;
  }

  for (const publicId of publicIds) {
    if (!publicId) {
      continue;
    }

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

async function populatePackage(id) {
  return Package.findById(id)
    .populate("destination", "name slug")
    .populate("itinerary.places", "name slug category")
    .lean();
}

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid package ID", 400);
    }

    await connectDB();

    const packageData = await populatePackage(id);

    if (!packageData) {
      return errorResponse("Package not found", 404);
    }

    return NextResponse.json({
      success: true,
      data: packageData,
    });
  } catch (error) {
    console.error("GET package error:", error);

    return errorResponse("Failed to fetch package", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid package ID", 400);
    }

    await connectDB();

    const existingPackage = await Package.findById(id);

    if (!existingPackage) {
      return errorResponse("Package not found", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must contain valid JSON", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body", 400);
    }

    const allowedFields = [
      "destination",
      "name",
      "slug",
      "shortDescription",
      "description",
      "duration",
      "price",
      "priceType",
      "currency",
      "inclusions",
      "exclusions",
      "itinerary",
      "coverImage",
      "gallery",
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
      return errorResponse("No valid fields provided for update", 400);
    }

    /*
     * Destination
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "destination")) {
      if (!mongoose.isValidObjectId(updateData.destination)) {
        return errorResponse("Invalid destination ID", 400);
      }

      const destinationExists = await Destination.exists({
        _id: updateData.destination,
      });

      if (!destinationExists) {
        return errorResponse("Destination not found", 404);
      }
    }

    const destinationId = updateData.destination || existingPackage.destination;

    /*
     * Name
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "name")) {
      const validation = validateName(updateData.name);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.name = validation.value;
    }

    /*
     * Slug
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "slug")) {
      const validation = validateSlug(updateData.slug);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      const duplicate = await Package.findOne({
        slug: validation.value,
        _id: {
          $ne: id,
        },
      });

      if (duplicate) {
        return errorResponse("Package slug already exists", 409);
      }

      updateData.slug = validation.value;
    }

    /*
     * Short description
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "shortDescription")) {
      const validation = validateShortDescription(updateData.shortDescription);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.shortDescription = validation.value;
    }

    /*
     * Description
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "description")) {
      const validation = validateDescription(updateData.description);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.description = validation.value;
    }

    /*
     * Duration
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "duration")) {
      const validation = validateDuration(updateData.duration);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.duration = validation.value;
    }

    /*
     * Price
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "price")) {
      const validation = validatePrice(updateData.price);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.price = validation.value;
    }

    /*
     * Price type
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "priceType")) {
      const validation = validatePriceType(updateData.priceType);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.priceType = validation.value;
    }

    /*
     * Currency
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "currency")) {
      const validation = validateCurrency(updateData.currency);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.currency = validation.value;
    }

    /*
     * Inclusions
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "inclusions")) {
      const validation = validateStringArray(
        updateData.inclusions,
        "Inclusions",
        MAX_ARRAY_ITEMS,
        200,
      );

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.inclusions = validation.value;
    }

    /*
     * Exclusions
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "exclusions")) {
      const validation = validateStringArray(
        updateData.exclusions,
        "Exclusions",
        MAX_ARRAY_ITEMS,
        200,
      );

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.exclusions = validation.value;
    }

    /*
     * Itinerary
     *
     * If destination changes but itinerary was
     * not explicitly supplied, validate the
     * existing itinerary against the new destination.
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "itinerary")) {
      const validation = await validateItinerary(
        updateData.itinerary,
        destinationId,
      );

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.itinerary = validation.itinerary;
    } else if (
      Object.prototype.hasOwnProperty.call(updateData, "destination") &&
      Array.isArray(existingPackage.itinerary) &&
      existingPackage.itinerary.length > 0
    ) {
      const validation = await validateItinerary(
        existingPackage.itinerary,
        destinationId,
      );

      if (!validation.valid) {
        return errorResponse(
          "The selected destination does not contain all existing itinerary places. Update the itinerary before changing destination.",
          400,
        );
      }
    }

    /*
     * Cover image
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "coverImage")) {
      const validation = validateImage(updateData.coverImage, "Cover image");

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.coverImage = validation.image;
    }

    /*
     * Gallery
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "gallery")) {
      const validation = validateGallery(updateData.gallery);

      if (!validation.valid) {
        return errorResponse(validation.message, 400);
      }

      updateData.gallery = validation.gallery;
    }

    /*
     * Featured
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "isFeatured")) {
      const validation = parseStrictBoolean(updateData.isFeatured);

      if (!validation.valid) {
        return errorResponse("isFeatured must be a boolean", 400);
      }

      updateData.isFeatured = validation.value;
    }

    /*
     * Active
     */
    if (Object.prototype.hasOwnProperty.call(updateData, "isActive")) {
      const validation = parseStrictBoolean(updateData.isActive);

      if (!validation.valid) {
        return errorResponse("isActive must be a boolean", 400);
      }

      updateData.isActive = validation.value;
    }

    /*
     * Save old Cloudinary references.
     */
    const oldPublicIds = getPackageImagePublicIds(existingPackage);

    /*
     * Update MongoDB.
     */
    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPackage) {
      return errorResponse("Package not found", 404);
    }

    /*
     * Determine which images are still
     * referenced after the update.
     */
    const newPublicIds = getPackageImagePublicIds(updatedPackage);

    const removedPublicIds = oldPublicIds.filter(
      (publicId) => !newPublicIds.includes(publicId),
    );

    /*
     * Best-effort Cloudinary cleanup.
     */
    if (removedPublicIds.length > 0) {
      await deleteCloudinaryImages(removedPublicIds);
    }

    const packageData = await populatePackage(id);

    return NextResponse.json({
      success: true,
      message: "Package updated successfully",
      data: packageData,
    });
  } catch (error) {
    console.error("PUT package error:", error);

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

    return errorResponse("Failed to update package", 500);
  }
}

/*
 * Separate active/inactive status update.
 */
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid package ID", 400);
    }

    await connectDB();

    const packageData = await Package.findById(id);

    if (!packageData) {
      return errorResponse("Package not found", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must contain valid JSON", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body", 400);
    }

    if (typeof body.isActive !== "boolean") {
      return errorResponse("isActive must be a boolean", 400);
    }

    packageData.isActive = body.isActive;

    await packageData.save();

    return NextResponse.json({
      success: true,
      message: body.isActive
        ? "Package activated successfully"
        : "Package deactivated successfully",
      data: {
        _id: packageData._id,
        isActive: packageData.isActive,
      },
    });
  } catch (error) {
    console.error("PATCH package status error:", error);

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {})
        .map((item) => item.message)
        .filter(Boolean);

      return errorResponse(
        messages.length > 0 ? messages.join(", ") : "Package validation failed",
        400,
      );
    }

    return errorResponse("Failed to update package status", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid package ID", 400);
    }

    await connectDB();

    /*
     * Load the package before deletion
     * so Cloudinary IDs are available.
     */
    const packageData = await Package.findById(id);

    if (!packageData) {
      return errorResponse("Package not found", 404);
    }

    const publicIds = getPackageImagePublicIds(packageData);

    /*
     * Permanently delete MongoDB record.
     */
    await Package.findByIdAndDelete(id);

    /*
     * Permanently remove Cloudinary images.
     */
    if (publicIds.length > 0) {
      await deleteCloudinaryImages(publicIds);
    }

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("DELETE package error:", error);

    return errorResponse("Failed to delete package", 500);
  }
}

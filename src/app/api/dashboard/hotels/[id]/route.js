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
import cloudinary from "@/utils/cloudinary";

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

function normalizeBoolean(value) {
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

function getImagePublicIds(hotel) {
  const ids = [];

  if (hotel?.coverImage?.publicId) {
    ids.push(hotel.coverImage.publicId);
  }

  if (Array.isArray(hotel?.gallery)) {
    for (const image of hotel.gallery) {
      if (image?.publicId) {
        ids.push(image.publicId);
      }
    }
  }

  return [...new Set(ids)];
}

async function deleteCloudinaryImages(publicIds) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return;
  }

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

/* -------------------------------------------------------------------------- */
/* GET SINGLE HOTEL                                                           */
/* -------------------------------------------------------------------------- */

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid hotel ID");
    }

    await connectDB();

    const hotel = await Hotel.findById(id)
      .populate("destination", "name slug")
      .lean();

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    return NextResponse.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("GET hotel error:", error);

    return errorResponse("Failed to fetch hotel", 500);
  }
}

/* -------------------------------------------------------------------------- */
/* PUT / UPDATE HOTEL                                                         */
/* -------------------------------------------------------------------------- */

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid hotel ID");
    }

    await connectDB();

    const existingHotel = await Hotel.findById(id).lean();

    if (!existingHotel) {
      return errorResponse("Hotel not found", 404);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body");
    }

    const allowedFields = [
      "destination",
      "name",
      "slug",
      "description",
      "category",
      "pricePerNight",
      "currency",
      "amenities",
      "address",
      "latitude",
      "longitude",
      "contactPhone",
      "website",
      "coverImage",
      "gallery",
      "rating",
      "isFeatured",
      "isActive",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (body?.[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    /* ---------------------------------------------------------------------- */
    /* DESTINATION                                                             */
    /* ---------------------------------------------------------------------- */

    if (updateData.destination !== undefined) {
      if (!mongoose.isValidObjectId(updateData.destination)) {
        return errorResponse("Invalid destination ID");
      }

      const destinationExists = await Destination.exists({
        _id: updateData.destination,
      });

      if (!destinationExists) {
        return errorResponse("Destination not found", 404);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* NAME                                                                    */
    /* ---------------------------------------------------------------------- */

    if (updateData.name !== undefined) {
      updateData.name = normalizeString(updateData.name);

      if (!updateData.name) {
        return errorResponse("Hotel name is required");
      }

      if (updateData.name.length < 2) {
        return errorResponse("Hotel name must be at least 2 characters");
      }

      if (updateData.name.length > 150) {
        return errorResponse("Hotel name cannot exceed 150 characters");
      }

      if (!nameRegex.test(updateData.name)) {
        return errorResponse(
          "Hotel name can contain alphabets and spaces only",
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* SLUG                                                                    */
    /* ---------------------------------------------------------------------- */

    if (updateData.slug !== undefined) {
      updateData.slug = normalizeString(updateData.slug).toLowerCase();

      if (!updateData.slug) {
        return errorResponse("Hotel slug is required");
      }

      if (updateData.slug.length > 150) {
        return errorResponse("Slug cannot exceed 150 characters");
      }

      if (!slugRegex.test(updateData.slug)) {
        return errorResponse(
          "Slug can contain lowercase letters, numbers, and hyphens only",
        );
      }

      const duplicate = await Hotel.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      }).lean();

      if (duplicate) {
        return errorResponse("Hotel slug already exists", 409);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* DESCRIPTION                                                             */
    /* ---------------------------------------------------------------------- */

    if (updateData.description !== undefined) {
      updateData.description = normalizeString(updateData.description);

      if (!updateData.description) {
        return errorResponse("Hotel description is required");
      }

      if (updateData.description.length < 10) {
        return errorResponse(
          "Hotel description must be at least 10 characters",
        );
      }

      if (updateData.description.length > 5000) {
        return errorResponse("Hotel description cannot exceed 5000 characters");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* CATEGORY                                                                */
    /* ---------------------------------------------------------------------- */

    if (updateData.category !== undefined) {
      const allowedCategories = [
        "budget",
        "standard",
        "premium",
        "luxury",
        "resort",
        "homestay",
        "hostel",
      ];

      if (!allowedCategories.includes(updateData.category)) {
        return errorResponse("Invalid hotel category");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* PRICE                                                                   */
    /* ---------------------------------------------------------------------- */

    if (updateData.pricePerNight !== undefined) {
      const priceResult = validatePriceRange(updateData.pricePerNight);

      if (priceResult.error) {
        return errorResponse(priceResult.error);
      }

      updateData.pricePerNight = {
        min: priceResult.min,
        max: priceResult.max,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* CURRENCY                                                                */
    /* ---------------------------------------------------------------------- */

    if (updateData.currency !== undefined) {
      updateData.currency = normalizeString(updateData.currency).toUpperCase();

      if (!SUPPORTED_CURRENCIES.includes(updateData.currency)) {
        return errorResponse("Currency must be INR or USD");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* AMENITIES                                                               */
    /* ---------------------------------------------------------------------- */

    if (updateData.amenities !== undefined) {
      if (!Array.isArray(updateData.amenities)) {
        return errorResponse("Amenities must be an array");
      }

      updateData.amenities = normalizeAmenities(updateData.amenities);

      if (updateData.amenities.length > 50) {
        return errorResponse("Hotel cannot have more than 50 amenities");
      }

      for (const amenity of updateData.amenities) {
        if (amenity.length > 100) {
          return errorResponse("Each amenity cannot exceed 100 characters");
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* ADDRESS                                                                 */
    /* ---------------------------------------------------------------------- */

    if (updateData.address !== undefined) {
      updateData.address = normalizeString(updateData.address);

      if (updateData.address.length > 500) {
        return errorResponse("Address cannot exceed 500 characters");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* PHONE                                                                   */
    /* ---------------------------------------------------------------------- */

    if (updateData.contactPhone !== undefined) {
      updateData.contactPhone = normalizeString(updateData.contactPhone);

      if (updateData.contactPhone) {
        const digitsOnly = updateData.contactPhone.replace(/\D/g, "");

        if (!phoneRegex.test(digitsOnly)) {
          return errorResponse(
            "Contact phone must contain between 7 and 15 digits",
          );
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* WEBSITE                                                                 */
    /* ---------------------------------------------------------------------- */

    if (updateData.website !== undefined) {
      updateData.website = normalizeString(updateData.website);

      if (updateData.website.length > 500) {
        return errorResponse("Website cannot exceed 500 characters");
      }

      if (updateData.website && !urlRegex.test(updateData.website)) {
        return errorResponse("Website must be a valid HTTP or HTTPS URL");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* LATITUDE                                                                */
    /* ---------------------------------------------------------------------- */

    if (updateData.latitude !== undefined) {
      const latitude = normalizeOptionalNumber(updateData.latitude);

      if (latitude === null) {
        return errorResponse("Latitude must be a valid number");
      }

      if (latitude !== undefined) {
        const latitudeError = validateCoordinate(latitude, "Latitude", -90, 90);

        if (latitudeError) {
          return errorResponse(latitudeError);
        }

        updateData.latitude = latitude;
      } else {
        updateData.latitude = undefined;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* LONGITUDE                                                               */
    /* ---------------------------------------------------------------------- */

    if (updateData.longitude !== undefined) {
      const longitude = normalizeOptionalNumber(updateData.longitude);

      if (longitude === null) {
        return errorResponse("Longitude must be a valid number");
      }

      if (longitude !== undefined) {
        const longitudeError = validateCoordinate(
          longitude,
          "Longitude",
          -180,
          180,
        );

        if (longitudeError) {
          return errorResponse(longitudeError);
        }

        updateData.longitude = longitude;
      } else {
        updateData.longitude = undefined;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* COVER IMAGE                                                             */
    /* ---------------------------------------------------------------------- */

    if (updateData.coverImage !== undefined) {
      const normalizedCoverImage = normalizeImage(updateData.coverImage);

      const coverImageError = validateImage(
        normalizedCoverImage,
        "Cover image",
      );

      if (coverImageError) {
        return errorResponse(coverImageError);
      }

      updateData.coverImage = normalizedCoverImage;
    }

    /* ---------------------------------------------------------------------- */
    /* GALLERY                                                                 */
    /* ---------------------------------------------------------------------- */

    if (updateData.gallery !== undefined) {
      if (!Array.isArray(updateData.gallery)) {
        return errorResponse("Gallery must be an array");
      }

      updateData.gallery = normalizeGallery(updateData.gallery);

      const galleryError = validateGallery(updateData.gallery);

      if (galleryError) {
        return errorResponse(galleryError);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* RATING                                                                  */
    /* ---------------------------------------------------------------------- */

    if (updateData.rating !== undefined) {
      if (updateData.rating === null || updateData.rating === "") {
        updateData.rating = 0;
      } else {
        const rating = Number(updateData.rating);

        if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
          return errorResponse("Rating must be between 0 and 5");
        }

        updateData.rating = rating;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* BOOLEAN VALUES                                                          */
    /* ---------------------------------------------------------------------- */

    if (updateData.isFeatured !== undefined) {
      const isFeatured = normalizeBoolean(updateData.isFeatured);

      if (isFeatured === null) {
        return errorResponse("isFeatured must be a boolean");
      }

      updateData.isFeatured = isFeatured;
    }

    if (updateData.isActive !== undefined) {
      const isActive = normalizeBoolean(updateData.isActive);

      if (isActive === null) {
        return errorResponse("isActive must be a boolean");
      }

      updateData.isActive = isActive;
    }

    /* ---------------------------------------------------------------------- */
    /* UPDATE                                                                  */
    /* ---------------------------------------------------------------------- */

    const hotel = await Hotel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    /* ---------------------------------------------------------------------- */
    /* CLOUDINARY CLEANUP                                                      */
    /* ---------------------------------------------------------------------- */

    const oldImageIds = getImagePublicIds(existingHotel);

    const newImageIds = getImagePublicIds(hotel);

    const removedImageIds = oldImageIds.filter(
      (publicId) => !newImageIds.includes(publicId),
    );

    if (removedImageIds.length > 0) {
      await deleteCloudinaryImages(removedImageIds);
    }

    return NextResponse.json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    console.error("PUT hotel error:", error);

    if (error?.code === 11000) {
      return errorResponse("Hotel slug already exists", 409);
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0];

      return errorResponse(firstError?.message || "Hotel validation failed");
    }

    return errorResponse("Failed to update hotel", 500);
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE / PERMANENT DELETE                                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid hotel ID");
    }

    await connectDB();

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    const imagePublicIds = getImagePublicIds(hotel);

    await Hotel.findByIdAndDelete(id);

    await deleteCloudinaryImages(imagePublicIds);

    return NextResponse.json({
      success: true,
      message: "Hotel deleted permanently",
    });
  } catch (error) {
    console.error("DELETE hotel error:", error);

    return errorResponse("Failed to delete hotel", 500);
  }
}
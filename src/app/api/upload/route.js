import { NextResponse } from "next/server";

import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

export const runtime = "nodejs";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/* ============================================================
   HELPERS
============================================================ */

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

function sanitizeFolder(value) {
  if (typeof value !== "string") {
    return "tourism/general";
  }

  const folder = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");

  if (!folder) {
    return "tourism/general";
  }

  if (folder.includes("..")) {
    return "tourism/general";
  }

  if (!/^[a-zA-Z0-9_./-]+$/.test(folder)) {
    return "tourism/general";
  }

  return folder;
}

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

/* ============================================================
   POST
   POST /api/upload
============================================================ */

export async function POST(request) {
  try {
    /* ========================================================
       ADMIN AUTHENTICATION
    ======================================================== */

    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse(
        "Unauthorized. Admin access required.",
        401,
      );
    }

    /* ========================================================
       CONTENT TYPE
    ======================================================== */

    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("multipart/form-data")
    ) {
      return errorResponse(
        "Invalid upload request. The image must be sent as multipart/form-data.",
        415,
      );
    }

    /* ========================================================
       FORM DATA
    ======================================================== */

    let formData;

    try {
      formData = await request.formData();
    } catch (error) {
      console.error(
        "Failed to parse multipart form data:",
        error,
      );

      return errorResponse(
        "Unable to read the uploaded image. Please send the image using FormData.",
        400,
      );
    }

    const file = formData.get("file");

    const folderValue =
      formData.get("folder") || "tourism/general";

    /* ========================================================
       FILE VALIDATION
    ======================================================== */

    if (!file) {
      return errorResponse(
        "Image file is required.",
        400,
      );
    }

    if (
      typeof file !== "object" ||
      typeof file.arrayBuffer !== "function"
    ) {
      return errorResponse(
        "Invalid image file.",
        400,
      );
    }

    const fileType =
      typeof file.type === "string"
        ? file.type.toLowerCase().trim()
        : "";

    if (!ALLOWED_IMAGE_TYPES.has(fileType)) {
      return errorResponse(
        "Invalid image type. Only JPG, PNG, WEBP and GIF are allowed.",
        400,
      );
    }

    const fileSize =
      typeof file.size === "number"
        ? file.size
        : 0;

    if (fileSize <= 0) {
      return errorResponse(
        "Uploaded image is empty.",
        400,
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return errorResponse(
        "Image size cannot exceed 10 MB.",
        400,
      );
    }

    /* ========================================================
       CLOUDINARY FOLDER
    ======================================================== */

    const folder = sanitizeFolder(folderValue);

    /* ========================================================
       FILE -> BUFFER
    ======================================================== */

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      return errorResponse(
        "Unable to read the uploaded image.",
        400,
      );
    }

    /* ========================================================
       CLOUDINARY UPLOAD
    ======================================================== */

    const result =
      await uploadBufferToCloudinary(
        buffer,
        folder,
      );

    if (
      !result ||
      !result.secure_url ||
      !result.public_id
    ) {
      console.error(
        "Invalid Cloudinary response:",
        result,
      );

      return errorResponse(
        "Cloudinary did not return valid image information.",
        500,
      );
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully.",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width || null,
          height: result.height || null,
          format: result.format || null,
          bytes: result.bytes || fileSize,
        },
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width || null,
          height: result.height || null,
          format: result.format || null,
          bytes: result.bytes || fileSize,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Cloudinary upload error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Image upload failed.",
      },
      {
        status: 500,
      },
    );
  }
}
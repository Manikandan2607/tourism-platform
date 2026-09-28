import { NextResponse } from "next/server";

import { requireAdmin } from "@/utils/adminAuth";
import cloudinary from "@/utils/cloudinary";

export const runtime = "nodejs";

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

async function deleteImage(request) {
  try {
    /* ========================================================
       ADMIN AUTHENTICATION
    ======================================================== */

    const admin = await requireAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    /* ========================================================
       CONTENT TYPE
    ======================================================== */

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return errorResponse("Invalid request. Expected application/json.", 415);
    }

    /* ========================================================
       READ JSON
    ======================================================== */

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Invalid delete JSON:", error);

      return errorResponse("Invalid JSON request body.", 400);
    }

    /* ========================================================
       PUBLIC ID
    ======================================================== */

    const publicId =
      typeof body?.publicId === "string" ? body.publicId.trim() : "";

    if (!publicId) {
      return errorResponse("Cloudinary publicId is required.", 400);
    }

    /*
     * Prevent obvious invalid/path-like input.
     *
     * Cloudinary public IDs can contain folders and hyphens,
     * so "/" is allowed.
     */
    if (publicId.includes("..") || !/^[a-zA-Z0-9_./-]+$/.test(publicId)) {
      return errorResponse("Invalid Cloudinary publicId.", 400);
    }

    /* ========================================================
       CLOUDINARY DELETE
    ======================================================== */

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    console.log("Cloudinary delete result:", {
      publicId,
      result: result?.result,
    });

    /* ========================================================
       CLOUDINARY RESULT
    ======================================================== */

    /*
     * "ok"
     *     Image was deleted.
     *
     * "not found"
     *     Image was already gone. This is still treated
     *     as a successful final state.
     */
    if (result?.result !== "ok" && result?.result !== "not found") {
      return NextResponse.json(
        {
          success: false,
          message: "Cloudinary failed to delete the image.",
          result: result?.result || null,
        },
        { status: 500 },
      );
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          result.result === "not found"
            ? "Image was already removed."
            : "Image deleted successfully.",
        result: result.result,
        publicId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cloudinary image delete error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete image.",
      },
      { status: 500 },
    );
  }
}

/* ============================================================
   DELETE
============================================================ */

export async function DELETE(request) {
  return deleteImage(request);
}

/* ============================================================
   POST
   BACKWARD COMPATIBILITY
============================================================ */

export async function POST(request) {
  return deleteImage(request);
}

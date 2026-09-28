import { NextResponse } from "next/server";

import connectDB from "@/utils/mongodb";
import { Inquiry } from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";

/* =========================================================
   ESCAPE REGEX
========================================================= */

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* =========================================================
   GET - FETCH ALL INQUIRIES
========================================================= */

export async function GET(request) {
  try {
    /* -------------------------------------------------------
       ADMIN AUTH
    ------------------------------------------------------- */

    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin access required.",
        },
        { status: 401 },
      );
    }

    /* -------------------------------------------------------
       DATABASE
    ------------------------------------------------------- */

    await connectDB();

    /* -------------------------------------------------------
       QUERY PARAMETERS
    ------------------------------------------------------- */

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";

    /* -------------------------------------------------------
       FILTER
    ------------------------------------------------------- */

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          message: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    /* -------------------------------------------------------
       FETCH
    ------------------------------------------------------- */

    const inquiries = await Inquiry.find(filter)
      .populate("packageId", "name title slug")
      .populate("destinationId", "name slug")
      .sort({
        isRead: 1,
        createdAt: -1,
      })
      .lean();

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        count: inquiries.length,
        data: inquiries,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get Inquiries Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inquiries.",
      },
      { status: 500 },
    );
  }
}
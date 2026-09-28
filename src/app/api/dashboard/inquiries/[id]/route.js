import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/mongodb";
import { Inquiry } from "@/utils/schema";
import { requireAdmin } from "@/utils/adminAuth";

/* =========================================================
   GET - FETCH SINGLE INQUIRY
========================================================= */

export async function GET(request, { params }) {
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
       PARAMS
    ------------------------------------------------------- */

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inquiry ID.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       FIND INQUIRY
    ------------------------------------------------------- */

    const inquiry = await Inquiry.findById(id)
      .populate("packageId", "name title slug")
      .populate("destinationId", "name slug")
      .lean();

    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Inquiry not found.",
        },
        { status: 404 },
      );
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        data: inquiry,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get Inquiry Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inquiry.",
      },
      { status: 500 },
    );
  }
}

/* =========================================================
   PATCH - UPDATE INQUIRY
========================================================= */

export async function PATCH(request, { params }) {
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
       PARAMS
    ------------------------------------------------------- */

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inquiry ID.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       BODY
    ------------------------------------------------------- */

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       ALLOWED FIELDS
    ------------------------------------------------------- */

    const allowedFields = [
      "status",
      "isRead",
      "adminNote",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = body[field];
      }
    }

    /* -------------------------------------------------------
       STATUS VALIDATION
    ------------------------------------------------------- */

    const allowedStatuses = [
      "new",
      "contacted",
      "resolved",
      "archived",
    ];

    if (
      Object.prototype.hasOwnProperty.call(updateData, "status") &&
      !allowedStatuses.includes(updateData.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inquiry status.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       READ VALIDATION
    ------------------------------------------------------- */

    if (
      Object.prototype.hasOwnProperty.call(updateData, "isRead") &&
      typeof updateData.isRead !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "isRead must be a boolean value.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       ADMIN NOTE VALIDATION
    ------------------------------------------------------- */

    if (
      Object.prototype.hasOwnProperty.call(updateData, "adminNote")
    ) {
      if (typeof updateData.adminNote !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin note must be a string.",
          },
          { status: 400 },
        );
      }

      updateData.adminNote = updateData.adminNote.trim();
    }

    /* -------------------------------------------------------
       EMPTY UPDATE
    ------------------------------------------------------- */

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields provided for update.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       UPDATE
    ------------------------------------------------------- */

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("packageId", "name title slug")
      .populate("destinationId", "name slug")
      .lean();

    /* -------------------------------------------------------
       NOT FOUND
    ------------------------------------------------------- */

    if (!updatedInquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Inquiry not found.",
        },
        { status: 404 },
      );
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Inquiry updated successfully.",
        data: updatedInquiry,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Inquiry Error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: Object.values(error.errors)
            .map((item) => item.message)
            .join(", "),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update inquiry.",
      },
      { status: 500 },
    );
  }
}

/* =========================================================
   DELETE - PERMANENTLY DELETE INQUIRY
========================================================= */

export async function DELETE(request, { params }) {
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
       PARAMS
    ------------------------------------------------------- */

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inquiry ID.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       DELETE
    ------------------------------------------------------- */

    const deletedInquiry = await Inquiry.findByIdAndDelete(id);

    /* -------------------------------------------------------
       NOT FOUND
    ------------------------------------------------------- */

    if (!deletedInquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Inquiry not found.",
        },
        { status: 404 },
      );
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Inquiry deleted successfully.",
        data: {
          _id: id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete Inquiry Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete inquiry.",
      },
      { status: 500 },
    );
  }
}
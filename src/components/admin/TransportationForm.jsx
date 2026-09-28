"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Bike,
  BusFront,
  Car,
  Image as ImageIcon,
  LoaderCircle,
  Plane,
  Plus,
  Route,
  Save,
  Trash2,
  TrainFront,
  X,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";

/* =========================================================
   CONSTANTS
========================================================= */

const TYPE_OPTIONS = [
  {
    value: "flight",
    label: "Flight",
    icon: Plane,
  },
  {
    value: "train",
    label: "Train",
    icon: TrainFront,
  },
  {
    value: "bus",
    label: "Bus",
    icon: BusFront,
  },
  {
    value: "taxi",
    label: "Taxi",
    icon: Car,
  },
  {
    value: "car-rental",
    label: "Car Rental",
    icon: Car,
  },
  {
    value: "bike-rental",
    label: "Bike Rental",
    icon: Bike,
  },
];

const CURRENCY_OPTIONS = [
  {
    value: "INR",
    label: "Indian Rupee (INR)",
  },
  {
    value: "USD",
    label: "US Dollar (USD)",
  },
];

const MAX_GALLERY_IMAGES = 30;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/* =========================================================
   INITIAL FORM
========================================================= */

function createInitialForm(initialDestinationId = "") {
  return {
    destination: initialDestinationId || "",
    type: "",
    providerName: "",
    from: "",
    to: "",
    description: "",
    estimatedCost: {
      min: "",
      max: "",
    },
    currency: "INR",
    estimatedDuration: "",
    schedule: "",
    bookingUrl: "",
    contactPhone: "",
    coverImage: null,
    gallery: [],
    isActive: true,
  };
}

/* =========================================================
   IMAGE NORMALIZER
========================================================= */

function normalizeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  const url = typeof image.url === "string" ? image.url.trim() : "";

  const publicId =
    typeof image.publicId === "string" ? image.publicId.trim() : "";

  if (!url || !publicId) {
    return null;
  }

  return {
    url,
    publicId,
  };
}

/* =========================================================
   ADMIN TOKEN
========================================================= */

function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  /*
   * Your admin login stores the JWT here.
   * sessionStorage is the primary source.
   */
  const sessionToken = sessionStorage.getItem("authToken");

  if (typeof sessionToken === "string" && sessionToken.trim()) {
    return sessionToken.trim();
  }

  /*
   * Fallbacks for compatibility with
   * other admin pages.
   */
  const sessionFallbackKeys = ["token", "accessToken", "jwt", "adminToken"];

  for (const key of sessionFallbackKeys) {
    const value = sessionStorage.getItem(key);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const localStorageKeys = [
    "authToken",
    "token",
    "accessToken",
    "jwt",
    "adminToken",
  ];

  for (const key of localStorageKeys) {
    const value = localStorage.getItem(key);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TransportationForm({
  destinations = [],
  mode = "create",
  readOnly = false,
  initialValues = null,
  transportationId = "",
  initialDestinationId = "",
  onSuccess,
  onCancel,
  onCreateDestination,
}) {
  const [form, setForm] = useState(createInitialForm(initialDestinationId));

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  /* =======================================================
     NORMALIZED DESTINATIONS
  ======================================================= */

  const destinationList = useMemo(() => {
    if (!Array.isArray(destinations)) {
      return [];
    }

    return destinations.filter((destination) =>
      Boolean(destination?._id || destination?.id),
    );
  }, [destinations]);

  /* =======================================================
     LOAD INITIAL VALUES
  ======================================================= */

  useEffect(() => {
    if (mode !== "edit" || !initialValues) {
      return;
    }

    const destination =
      typeof initialValues.destination === "object"
        ? initialValues.destination?._id || initialValues.destination?.id || ""
        : initialValues.destination || "";

    setForm({
      destination,
      type: initialValues.type || "",
      providerName: initialValues.providerName || "",
      from: initialValues.from || "",
      to: initialValues.to || "",
      description: initialValues.description || "",
      estimatedCost: {
        min: initialValues.estimatedCost?.min ?? "",
        max: initialValues.estimatedCost?.max ?? "",
      },
      currency: initialValues.currency || "INR",
      estimatedDuration: initialValues.estimatedDuration || "",
      schedule: initialValues.schedule || "",
      bookingUrl: initialValues.bookingUrl || "",
      contactPhone: initialValues.contactPhone || "",
      coverImage: normalizeImage(initialValues.coverImage),
      gallery: Array.isArray(initialValues.gallery)
        ? initialValues.gallery.map(normalizeImage).filter(Boolean)
        : [],
      isActive: initialValues.isActive !== false,
    });
  }, [mode, initialValues]);

  /* =======================================================
     INITIAL DESTINATION
  ======================================================= */

  useEffect(() => {
    if (mode !== "create" || !initialDestinationId) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      destination: initialDestinationId,
    }));
  }, [mode, initialDestinationId]);

  /* =======================================================
     FIELD CHANGE
  ======================================================= */

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
      form: "",
    }));
  }

  function updateCost(field, value) {
    setForm((previous) => ({
      ...previous,
      estimatedCost: {
        ...previous.estimatedCost,
        [field]: value,
      },
    }));

    setErrors((previous) => ({
      ...previous,
      estimatedCost: "",
      form: "",
    }));
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm() {
    const nextErrors = {};

    if (!form.destination) {
      nextErrors.destination = "Destination is required.";
    }

    if (!form.type) {
      nextErrors.type = "Transportation type is required.";
    }

    const providerName = form.providerName.trim();

    if (!providerName) {
      nextErrors.providerName = "Provider name is required.";
    } else if (providerName.length < 2) {
      nextErrors.providerName = "Provider name must be at least 2 characters.";
    } else if (providerName.length > 150) {
      nextErrors.providerName = "Provider name cannot exceed 150 characters.";
    } else if (!/^[\p{L}]+(?:[\s]+[\p{L}]+)*$/u.test(providerName)) {
      nextErrors.providerName =
        "Provider name can contain alphabets and spaces only.";
    }

    const from = form.from.trim();

    if (!from) {
      nextErrors.from = "Starting location is required.";
    } else if (from.length > 150) {
      nextErrors.from = "Starting location cannot exceed 150 characters.";
    }

    const to = form.to.trim();

    if (!to) {
      nextErrors.to = "Destination location is required.";
    } else if (to.length > 150) {
      nextErrors.to = "Destination location cannot exceed 150 characters.";
    }

    if (form.description.length > 3000) {
      nextErrors.description = "Description cannot exceed 3000 characters.";
    }

    const min =
      form.estimatedCost.min === "" ? null : Number(form.estimatedCost.min);

    const max =
      form.estimatedCost.max === "" ? null : Number(form.estimatedCost.max);

    if (min !== null && !Number.isFinite(min)) {
      nextErrors.estimatedCost = "Minimum cost must be a valid number.";
    }

    if (max !== null && !Number.isFinite(max)) {
      nextErrors.estimatedCost = "Maximum cost must be a valid number.";
    }

    if (min !== null && min < 0) {
      nextErrors.estimatedCost = "Minimum cost cannot be negative.";
    }

    if (max !== null && max < 0) {
      nextErrors.estimatedCost = "Maximum cost cannot be negative.";
    }

    if (min !== null && max !== null && min > max) {
      nextErrors.estimatedCost =
        "Minimum cost cannot be greater than maximum cost.";
    }

    if (form.estimatedDuration.length > 100) {
      nextErrors.estimatedDuration =
        "Estimated duration cannot exceed 100 characters.";
    }

    if (form.schedule.length > 500) {
      nextErrors.schedule = "Schedule cannot exceed 500 characters.";
    }

    const bookingUrl = form.bookingUrl.trim();

    if (bookingUrl && !/^https?:\/\/[^\s]+$/i.test(bookingUrl)) {
      nextErrors.bookingUrl = "Booking URL must be a valid HTTP or HTTPS URL.";
    }

    const contactPhone = form.contactPhone.trim();

    if (contactPhone && !/^[0-9]{7,15}$/.test(contactPhone)) {
      nextErrors.contactPhone =
        "Contact phone must contain 7 to 15 digits only.";
    }

    if (mode === "create" && !form.coverImage) {
      nextErrors.coverImage = "Cover image is required.";
    }

    if (form.gallery.length > 30) {
      nextErrors.gallery = "Gallery cannot contain more than 30 images.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /* =======================================================
     IMAGE VALIDATION
  ======================================================= */

  function validateImageFile(file) {
    if (!file) {
      throw new Error("Please select an image.");
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error(
        "Invalid image type. Only JPG, PNG, WEBP and GIF are allowed.",
      );
    }

    if (file.size <= 0) {
      throw new Error("Selected image is empty.");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Image size cannot exceed 10 MB.");
    }
  }

  /* =======================================================
     UPLOAD IMAGE
  ======================================================= */

  async function uploadImage(file, folder = "tourism/transportation") {
    validateImageFile(file);

    /*
     * IMPORTANT:
     * The admin login stores the token in:
     *
     * sessionStorage.authToken
     *
     * This token MUST be sent to the
     * protected /api/upload route.
     */
    const token = getAdminToken();

    if (!token) {
      throw new Error(
        "Admin authentication token is missing. Please log in again.",
      );
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },

      body: formData,

      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      throw new Error(
        "Your admin session is invalid or expired. Please log in again.",
      );
    }

    if (!response.ok) {
      throw new Error(data?.message || "Image upload failed.");
    }

    if (data?.success === false) {
      throw new Error(data?.message || "Image upload failed.");
    }

    const image = data?.data || data?.image || data;

    if (!image?.url || !image?.publicId) {
      throw new Error(
        "Image upload completed but valid image information was not returned.",
      );
    }

    return {
      url: image.url,
      publicId: image.publicId,
    };
  }

  /* =======================================================
     COVER IMAGE
  ======================================================= */

  async function handleCoverImageChange(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setUploadingCover(true);

      setErrors((previous) => ({
        ...previous,
        coverImage: "",
        form: "",
      }));

      const image = await uploadImage(file, "tourism/transportation/cover");

      setForm((previous) => ({
        ...previous,
        coverImage: image,
      }));
    } catch (error) {
      console.error("Cover image upload failed:", error);

      setErrors((previous) => ({
        ...previous,
        coverImage: error?.message || "Failed to upload cover image.",
      }));
    } finally {
      setUploadingCover(false);
    }
  }

  /* =======================================================
     GALLERY
  ======================================================= */

  async function handleGalleryChange(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (!files.length) {
      return;
    }

    const remaining = MAX_GALLERY_IMAGES - form.gallery.length;

    if (remaining <= 0) {
      setErrors((previous) => ({
        ...previous,
        gallery: "Gallery cannot contain more than 30 images.",
      }));

      return;
    }

    const filesToUpload = files.slice(0, remaining);

    try {
      setUploadingGallery(true);

      setErrors((previous) => ({
        ...previous,
        gallery: "",
        form: "",
      }));

      const uploadedImages = [];

      for (const file of filesToUpload) {
        const image = await uploadImage(file, "tourism/transportation/gallery");

        if (image) {
          uploadedImages.push(image);
        }
      }

      setForm((previous) => ({
        ...previous,
        gallery: [...previous.gallery, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Gallery upload failed:", error);

      setErrors((previous) => ({
        ...previous,
        gallery: error?.message || "Failed to upload gallery image.",
      }));
    } finally {
      setUploadingGallery(false);
    }
  }

  /* =======================================================
     REMOVE COVER
  ======================================================= */

  function removeCoverImage() {
    setForm((previous) => ({
      ...previous,
      coverImage: null,
    }));

    setErrors((previous) => ({
      ...previous,
      coverImage: "",
    }));
  }

  /* =======================================================
     REMOVE GALLERY IMAGE
  ======================================================= */

  function removeGalleryImage(index) {
    setForm((previous) => ({
      ...previous,
      gallery: previous.gallery.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (readOnly || saving) {
      return;
    }

    const valid = validateForm();

    if (!valid) {
      return;
    }

    try {
      setSaving(true);

      setErrors((previous) => ({
        ...previous,
        form: "",
      }));

      const payload = {
        destination: form.destination,

        type: form.type,

        providerName: form.providerName.trim(),

        from: form.from.trim(),

        to: form.to.trim(),

        description: form.description.trim(),

        estimatedCost: {
          min:
            form.estimatedCost.min === ""
              ? undefined
              : Number(form.estimatedCost.min),

          max:
            form.estimatedCost.max === ""
              ? undefined
              : Number(form.estimatedCost.max),
        },

        currency: form.currency,

        estimatedDuration: form.estimatedDuration.trim(),

        schedule: form.schedule.trim(),

        bookingUrl: form.bookingUrl.trim(),

        contactPhone: form.contactPhone.trim(),

        coverImage: form.coverImage,

        gallery: form.gallery,

        isActive: form.isActive === true,
      };

      let response;

      if (mode === "edit" && transportationId) {
        response = await adminApi.put(
          `/api/dashboard/transportation/${transportationId}`,
          payload,
        );
      } else {
        response = await adminApi.post(
          "/api/dashboard/transportation",
          payload,
        );
      }

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to save transportation.");
      }

      const savedTransportation =
        response?.data?.data ||
        response?.data?.transportation ||
        response?.transportation ||
        response?.data ||
        null;

      if (typeof onSuccess === "function") {
        await onSuccess(savedTransportation);
      }
    } catch (error) {
      console.error("Failed to save transportation:", error);

      setErrors({
        form:
          error?.data?.message ||
          error?.message ||
          "Failed to save transportation.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
    >
      {/* HEADER */}

      <div className="border-b border-emerald-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Route size={21} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Transportation
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Manage flights, trains, buses, taxis and rental services.
              </p>
            </div>
          </div>

          {!readOnly ? (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  {mode === "edit" ? "Save Changes" : "Add Transportation"}
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* ERROR */}

      {errors.form ? (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:mx-6">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

          <p className="text-xs leading-5 text-red-700">{errors.form}</p>
        </div>
      ) : null}

      {/* CONTENT */}

      <div className="space-y-6 p-5 sm:p-6">
        {/* BASIC INFORMATION */}

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Basic Information
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Select the destination and transportation service type.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Destination" required error={errors.destination}>
              <select
                value={form.destination}
                onChange={(event) =>
                  updateField("destination", event.target.value)
                }
                disabled={readOnly}
                className={inputClass(errors.destination)}
              >
                <option value="">Select destination</option>

                {destinationList.map((destination) => {
                  const id = destination?._id || destination?.id;

                  const name =
                    destination?.name ||
                    destination?.title ||
                    destination?.destinationName ||
                    "Unnamed destination";

                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>

              {destinationList.length === 0 ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-[11px] text-amber-700">
                    No destinations found.
                  </p>

                  {typeof onCreateDestination === "function" ? (
                    <button
                      type="button"
                      onClick={onCreateDestination}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Add Destination
                    </button>
                  ) : null}
                </div>
              ) : null}
            </FormField>

            <FormField label="Transportation Type" required error={errors.type}>
              <select
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
                disabled={readOnly}
                className={inputClass(errors.type)}
              >
                <option value="">Select transportation type</option>

                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Provider Name"
              required
              error={errors.providerName}
            >
              <input
                type="text"
                value={form.providerName}
                onChange={(event) =>
                  updateField("providerName", event.target.value)
                }
                disabled={readOnly}
                placeholder="e.g. Tamil Nadu Transport"
                maxLength={150}
                className={inputClass(errors.providerName)}
              />
            </FormField>

            <FormField label="Contact Phone" error={errors.contactPhone}>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) =>
                  updateField("contactPhone", event.target.value)
                }
                disabled={readOnly}
                placeholder="9876543210"
                maxLength={15}
                className={inputClass(errors.contactPhone)}
              />
            </FormField>
          </div>
        </section>

        {/* ROUTE */}

        <section className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Route</h3>

            <p className="mt-1 text-xs text-slate-400">
              Enter the starting and destination locations.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="From" required error={errors.from}>
              <input
                type="text"
                value={form.from}
                onChange={(event) => updateField("from", event.target.value)}
                disabled={readOnly}
                placeholder="Starting location"
                maxLength={150}
                className={inputClass(errors.from)}
              />
            </FormField>

            <FormField label="To" required error={errors.to}>
              <input
                type="text"
                value={form.to}
                onChange={(event) => updateField("to", event.target.value)}
                disabled={readOnly}
                placeholder="Destination location"
                maxLength={150}
                className={inputClass(errors.to)}
              />
            </FormField>
          </div>
        </section>

        {/* COST */}

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Cost & Schedule
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Add estimated pricing and service timing.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FormField label="Minimum Cost" error={errors.estimatedCost}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedCost.min}
                onChange={(event) => updateCost("min", event.target.value)}
                disabled={readOnly}
                placeholder="0"
                className={inputClass(errors.estimatedCost)}
              />
            </FormField>

            <FormField label="Maximum Cost">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedCost.max}
                onChange={(event) => updateCost("max", event.target.value)}
                disabled={readOnly}
                placeholder="0"
                className={inputClass(errors.estimatedCost)}
              />
            </FormField>

            <FormField label="Currency">
              <select
                value={form.currency}
                onChange={(event) =>
                  updateField("currency", event.target.value)
                }
                disabled={readOnly}
                className={inputClass()}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Estimated Duration"
              error={errors.estimatedDuration}
            >
              <input
                type="text"
                value={form.estimatedDuration}
                onChange={(event) =>
                  updateField("estimatedDuration", event.target.value)
                }
                disabled={readOnly}
                placeholder="e.g. 2 hours 30 minutes"
                maxLength={100}
                className={inputClass(errors.estimatedDuration)}
              />
            </FormField>
          </div>

          <div className="mt-5">
            <FormField label="Schedule" error={errors.schedule}>
              <input
                type="text"
                value={form.schedule}
                onChange={(event) =>
                  updateField("schedule", event.target.value)
                }
                disabled={readOnly}
                placeholder="e.g. Daily, 6:00 AM - 10:00 PM"
                maxLength={500}
                className={inputClass(errors.schedule)}
              />
            </FormField>
          </div>
        </section>

        {/* BOOKING */}

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Booking</h3>

            <p className="mt-1 text-xs text-slate-400">
              Add an optional booking link.
            </p>
          </div>

          <FormField label="Booking URL" error={errors.bookingUrl}>
            <input
              type="url"
              value={form.bookingUrl}
              onChange={(event) =>
                updateField("bookingUrl", event.target.value)
              }
              disabled={readOnly}
              placeholder="https://example.com/book"
              className={inputClass(errors.bookingUrl)}
            />
          </FormField>
        </section>

        {/* DESCRIPTION */}

        <section>
          <FormField label="Description" error={errors.description}>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              disabled={readOnly}
              rows={5}
              maxLength={3000}
              placeholder="Describe this transportation service..."
              className={`${inputClass(errors.description)} resize-none`}
            />

            <p className="mt-1 text-right text-[10px] text-slate-400">
              {form.description.length}
              /3000
            </p>
          </FormField>
        </section>

        {/* COVER */}

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Cover Image</h3>

            <p className="mt-1 text-xs text-slate-400">
              Upload the main image for this transportation service.
            </p>
          </div>

          {form.coverImage?.url ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              <img
                src={form.coverImage.url}
                alt="Transportation cover"
                className="h-56 w-full object-cover"
              />

              {!readOnly ? (
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-red-500 shadow-sm hover:bg-red-50"
                >
                  <X size={17} />
                </button>
              ) : null}
            </div>
          ) : (
            <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition hover:border-emerald-300 hover:bg-emerald-50/30">
              {uploadingCover ? (
                <>
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-emerald-600"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ImageIcon size={20} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Upload Cover Image
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Click to choose an image
                  </p>
                </>
              )}

              {!readOnly ? (
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleCoverImageChange}
                  disabled={uploadingCover}
                  className="hidden"
                />
              ) : null}
            </label>
          )}

          {errors.coverImage ? (
            <p className="mt-2 text-xs text-red-600">{errors.coverImage}</p>
          ) : null}
        </section>

        {/* GALLERY */}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gallery</h3>

              <p className="mt-1 text-xs text-slate-400">
                Add additional images for this service.
              </p>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              {form.gallery.length}/30
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {form.gallery.map((image, index) => (
              <div
                key={image.publicId || index}
                className="group relative overflow-hidden rounded-xl border border-slate-200"
              >
                <img
                  src={image.url}
                  alt={`Gallery ${index + 1}`}
                  className="h-32 w-full object-cover"
                />

                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-red-500 shadow-sm hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            ))}

            {!readOnly && form.gallery.length < MAX_GALLERY_IMAGES ? (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition hover:border-emerald-300 hover:bg-emerald-50/30">
                {uploadingGallery ? (
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-emerald-600"
                  />
                ) : (
                  <Plus size={22} className="text-emerald-600" />
                )}

                <span className="mt-2 text-[11px] font-semibold text-slate-500">
                  Add Images
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleGalleryChange}
                  disabled={uploadingGallery}
                  className="hidden"
                />
              </label>
            ) : null}
          </div>

          {errors.gallery ? (
            <p className="mt-2 text-xs text-red-600">{errors.gallery}</p>
          ) : null}
        </section>

        {/* STATUS */}

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Service Status
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Control whether this transportation service is available.
              </p>
            </div>

            <button
              type="button"
              disabled={readOnly}
              onClick={() =>
                setForm((previous) => ({
                  ...previous,
                  isActive: !previous.isActive,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition ${
                form.isActive ? "bg-emerald-600" : "bg-slate-300"
              } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
              aria-label={
                form.isActive
                  ? "Deactivate transportation"
                  : "Activate transportation"
              }
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  form.isActive ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                form.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />

              {form.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </section>
      </div>

      {/* FOOTER */}

      {!readOnly ? (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={15} />
                {mode === "edit" ? "Save Changes" : "Create Transportation"}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      )}
    </form>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({ label, required = false, error = "", children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}

        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      {children}

      {error ? (
        <p className="mt-1.5 text-[11px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

/* =========================================================
   INPUT CLASS
========================================================= */

function inputClass(error = "") {
  return `w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    error
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
  }`;
}

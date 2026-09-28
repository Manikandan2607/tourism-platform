"use client";

import { useEffect, useState } from "react";
import { Loader2, ImagePlus, X, Wand2 } from "lucide-react";

import ImageUpload from "@/components/admin/ImageUpload";
import AdminButton from "@/components/admin/AdminButton";
import { adminApi } from "@/utils/adminApi";

const categories = [
  "historical",
  "beach",
  "temple",
  "museum",
  "waterfall",
  "hill-station",
  "wildlife",
  "adventure",
  "park",
  "lake",
  "viewpoint",
  "other",
];

const currencies = ["INR", "USD"];

// Unicode letters + spaces only.
const NAME_REGEX = /^[\p{L}]+(?:[\s]+[\p{L}]+)*$/u;

// Lowercase letters, numbers and hyphens.
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// HTTP / HTTPS image URL.
const IMAGE_URL_REGEX = /^https?:\/\/[^\s]+$/i;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function normalizeImage(image) {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return {
      url: image,
      publicId: "",
    };
  }

  if (typeof image === "object" && image.url) {
    return {
      url: image.url,
      publicId: image.publicId || "",
    };
  }

  return null;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map((image) => normalizeImage(image)).filter(Boolean);
}

function getInitialValues(initialValues) {
  if (!initialValues) {
    return {
      destination: "",
      name: "",
      slug: "",
      category: "",
      description: "",
      shortDescription: "",

      entryFee: {
        adult: "",
        child: "",
        foreigner: "",
      },

      currency: "INR",

      openingTime: "",
      closingTime: "",
      closedOn: "",
      bestTimeToVisit: "",
      visitDuration: "",
      address: "",
      latitude: "",
      longitude: "",

      coverImage: null,
      gallery: [],

      isFeatured: false,
      isActive: true,
    };
  }

  return {
    destination:
      typeof initialValues.destination === "object"
        ? initialValues.destination?._id || ""
        : initialValues.destination || "",

    name: initialValues.name || "",
    slug: initialValues.slug || "",
    category: initialValues.category || "",
    description: initialValues.description || "",
    shortDescription: initialValues.shortDescription || "",

    entryFee: {
      adult: initialValues.entryFee?.adult ?? "",
      child: initialValues.entryFee?.child ?? "",
      foreigner: initialValues.entryFee?.foreigner ?? "",
    },

    currency: currencies.includes(initialValues.currency)
      ? initialValues.currency
      : "INR",

    openingTime: initialValues.openingTime || "",
    closingTime: initialValues.closingTime || "",
    closedOn: initialValues.closedOn || "",
    bestTimeToVisit: initialValues.bestTimeToVisit || "",
    visitDuration: initialValues.visitDuration || "",
    address: initialValues.address || "",

    latitude: initialValues.latitude ?? "",
    longitude: initialValues.longitude ?? "",

    coverImage: normalizeImage(initialValues.coverImage),

    gallery: normalizeGallery(initialValues.gallery),

    isFeatured: initialValues.isFeatured ?? false,
    isActive: initialValues.isActive ?? true,
  };
}

function sanitizeName(value) {
  return value
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "");
}

function sanitizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "");
}

function generateSlugFromName(name) {
  return sanitizeSlug(name.trim());
}

function normalizeNumberInput(value) {
  if (value === "") {
    return "";
  }

  return value;
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function PlaceForm({
  initialValues = null,
  onSuccess = null,
  onCancel = null,
}) {
  const isEditMode = Boolean(initialValues?._id);

  const [formData, setFormData] = useState(() =>
    getInitialValues(initialValues),
  );

  const [destinations, setDestinations] = useState([]);

  const [loadingDestinations, setLoadingDestinations] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [galleryUploading, setGalleryUploading] = useState(false);

  const [galleryRemovingIndex, setGalleryRemovingIndex] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    setFormData(getInitialValues(initialValues));
    setError("");
  }, [initialValues]);

  useEffect(() => {
    loadDestinations();
  }, []);

  async function loadDestinations() {
    try {
      setLoadingDestinations(true);

      const response = await adminApi.get("/api/dashboard/destinations");

      setDestinations(response?.data || []);
    } catch (error) {
      console.error("Failed to load destinations:", error);

      setError(error?.message || "Failed to load destinations.");
    } finally {
      setLoadingDestinations(false);
    }
  }

  function updateField(field, value) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateEntryFee(field, value) {
    setFormData((previous) => ({
      ...previous,
      entryFee: {
        ...previous.entryFee,
        [field]: value,
      },
    }));
  }

  function handleNameChange(value) {
    const sanitized = sanitizeName(value);

    updateField("name", sanitized);
  }

  function handleSlugChange(value) {
    const sanitized = sanitizeSlug(value);

    updateField("slug", sanitized);
  }

  function generateSlug() {
    const slug = generateSlugFromName(formData.name);

    updateField("slug", slug);
  }

  function validateSelectedFile(file) {
    if (!file) {
      return "Please select an image.";
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, PNG, WEBP, and GIF images are allowed.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Each image must be 10 MB or smaller.";
    }

    return null;
  }

  async function handleGallerySelect(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setError("");

    for (const file of files) {
      const fileError = validateSelectedFile(file);

      if (fileError) {
        setError(fileError);
        event.target.value = "";
        return;
      }
    }

    setGalleryUploading(true);

    const uploadedImages = [];

    try {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      for (const file of files) {
        const formDataUpload = new FormData();

        formDataUpload.append("file", file);
        formDataUpload.append("folder", "tourism/places/gallery");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Please log in again.",
          );
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Gallery image upload failed.");
        }

        if (!data?.image?.url || !data?.image?.publicId) {
          throw new Error(
            "Uploaded gallery image is missing Cloudinary information.",
          );
        }

        if (!IMAGE_URL_REGEX.test(data.image.url)) {
          throw new Error("Uploaded gallery image URL is invalid.");
        }

        uploadedImages.push({
          url: data.image.url,
          publicId: data.image.publicId,
        });
      }

      setFormData((previous) => ({
        ...previous,
        gallery: [...previous.gallery, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Gallery upload error:", error);

      if (uploadedImages.length) {
        await Promise.allSettled(
          uploadedImages
            .filter((image) => image?.publicId)
            .map((image) => deleteCloudinaryImage(image.publicId)),
        );
      }

      setError(error?.message || "Gallery image upload failed.");
    } finally {
      setGalleryUploading(false);

      event.target.value = "";
    }
  }

  async function deleteCloudinaryImage(publicId) {
    if (!publicId) {
      return;
    }

    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

    if (!token) {
      throw new Error("Admin session not found. Please log in again.");
    }

    const response = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        publicId,
      }),
    });

    const data = await readJsonResponse(response);

    if (response.status === 401) {
      throw new Error("Your admin session has expired. Please log in again.");
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Failed to delete image.");
    }
  }

  async function removeGalleryImage(index) {
    const image = formData.gallery[index];

    try {
      setError("");
      setGalleryRemovingIndex(index);

      if (image?.publicId) {
        await deleteCloudinaryImage(image.publicId);
      }

      setFormData((previous) => ({
        ...previous,
        gallery: previous.gallery.filter(
          (_, imageIndex) => imageIndex !== index,
        ),
      }));
    } catch (error) {
      console.error("Gallery delete error:", error);

      setError(error?.message || "Failed to delete gallery image.");
    } finally {
      setGalleryRemovingIndex(null);
    }
  }

  function validateForm() {
    const name = formData.name.trim();
    const slug = formData.slug.trim();

    if (!formData.destination) {
      return "Please select a destination.";
    }

    if (!name) {
      return "Place name is required.";
    }

    if (name.length < 2) {
      return "Place name must be at least 2 characters.";
    }

    if (name.length > 150) {
      return "Place name cannot exceed 150 characters.";
    }

    if (!NAME_REGEX.test(name)) {
      return "Place name can contain alphabets and spaces only.";
    }

    if (!slug) {
      return "Slug is required.";
    }

    if (slug.length > 150) {
      return "Slug cannot exceed 150 characters.";
    }

    if (!SLUG_REGEX.test(slug)) {
      return "Slug can contain lowercase letters, numbers, and hyphens only.";
    }

    if (!formData.category) {
      return "Category is required.";
    }

    if (!categories.includes(formData.category)) {
      return "Please select a valid category.";
    }

    if (!formData.description.trim()) {
      return "Description is required.";
    }

    if (formData.description.trim().length < 10) {
      return "Description must be at least 10 characters.";
    }

    if (formData.description.trim().length > 5000) {
      return "Description cannot exceed 5000 characters.";
    }

    if (formData.shortDescription.trim().length > 500) {
      return "Short description cannot exceed 500 characters.";
    }

    if (!currencies.includes(formData.currency)) {
      return "Currency must be INR or USD.";
    }

    const numericFields = [
      ["Adult fee", formData.entryFee.adult],
      ["Child fee", formData.entryFee.child],
      ["Foreigner fee", formData.entryFee.foreigner],
    ];

    for (const [label, value] of numericFields) {
      if (value !== "") {
        const number = Number(value);

        if (!Number.isFinite(number) || number < 0) {
          return `${label} must be a valid non-negative number.`;
        }
      }
    }

    if (formData.openingTime.length > 50) {
      return "Opening time cannot exceed 50 characters.";
    }

    if (formData.closingTime.length > 50) {
      return "Closing time cannot exceed 50 characters.";
    }

    if (formData.closedOn.trim().length > 100) {
      return "Closed on cannot exceed 100 characters.";
    }

    if (formData.bestTimeToVisit.trim().length > 200) {
      return "Best time to visit cannot exceed 200 characters.";
    }

    if (formData.visitDuration.trim().length > 100) {
      return "Visit duration cannot exceed 100 characters.";
    }

    if (formData.address.trim().length > 500) {
      return "Address cannot exceed 500 characters.";
    }

    if (formData.latitude !== "") {
      const latitude = Number(formData.latitude);

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return "Latitude must be between -90 and 90.";
      }
    }

    if (formData.longitude !== "") {
      const longitude = Number(formData.longitude);

      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return "Longitude must be between -180 and 180.";
      }
    }

    if (!formData.coverImage?.url) {
      return "Cover image is required.";
    }

    if (!formData.coverImage?.publicId) {
      return "Cover image must contain valid Cloudinary information. Please upload the cover image again.";
    }

    if (!IMAGE_URL_REGEX.test(formData.coverImage.url)) {
      return "Cover image URL is invalid.";
    }

    if (!Array.isArray(formData.gallery)) {
      return "Gallery images are invalid.";
    }

    for (const image of formData.gallery) {
      if (!image?.url || !image?.publicId) {
        return "Every gallery image must contain valid Cloudinary information.";
      }

      if (!IMAGE_URL_REGEX.test(image.url)) {
        return "One of the gallery image URLs is invalid.";
      }
    }

    if (typeof formData.isFeatured !== "boolean") {
      return "Featured status is invalid.";
    }

    if (typeof formData.isActive !== "boolean") {
      return "Active status is invalid.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        destination: formData.destination,

        name: formData.name.trim(),

        slug: formData.slug.trim().toLowerCase(),

        category: formData.category,

        description: formData.description.trim(),

        shortDescription: formData.shortDescription.trim(),

        entryFee: {
          adult:
            formData.entryFee.adult !== ""
              ? Number(formData.entryFee.adult)
              : undefined,

          child:
            formData.entryFee.child !== ""
              ? Number(formData.entryFee.child)
              : undefined,

          foreigner:
            formData.entryFee.foreigner !== ""
              ? Number(formData.entryFee.foreigner)
              : undefined,
        },

        currency: formData.currency,

        openingTime: formData.openingTime.trim(),

        closingTime: formData.closingTime.trim(),

        closedOn: formData.closedOn.trim(),

        bestTimeToVisit: formData.bestTimeToVisit.trim(),

        visitDuration: formData.visitDuration.trim(),

        address: formData.address.trim(),

        latitude:
          formData.latitude !== "" ? Number(formData.latitude) : undefined,

        longitude:
          formData.longitude !== "" ? Number(formData.longitude) : undefined,

        coverImage: {
          url: formData.coverImage.url,
          publicId: formData.coverImage.publicId,
        },

        gallery: formData.gallery
          .filter((image) => image?.url && image?.publicId)
          .map((image) => ({
            url: image.url,
            publicId: image.publicId,
          })),

        isFeatured: Boolean(formData.isFeatured),

        isActive: Boolean(formData.isActive),
      };

      let response;

      if (isEditMode) {
        response = await adminApi.put(
          `/api/dashboard/places/${initialValues._id}`,
          payload,
        );
      } else {
        response = await adminApi.post("/api/dashboard/places", payload);
      }

      if (!response?.success) {
        throw new Error(response?.message || "Failed to save place.");
      }

      if (typeof onSuccess === "function") {
        await onSuccess(response);
        return;
      }
    } catch (error) {
      console.error("Save place error:", error);

      setError(error?.message || "Failed to save place.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (typeof onCancel === "function") {
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ============================================================
          BASIC INFORMATION
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Basic Information"
          description="Add the main information about this tourist place."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {/* Destination */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Destination
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              value={formData.destination}
              onChange={(event) =>
                updateField("destination", event.target.value)
              }
              disabled={loadingDestinations}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50"
            >
              <option value="">
                {loadingDestinations
                  ? "Loading destinations..."
                  : "Select destination"}
              </option>

              {destinations
                .filter((destination) => destination.isActive !== false)
                .map((destination) => (
                  <option key={destination._id} value={destination._id}>
                    {destination.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Name */}
          <InputField
            label="Place Name"
            required
            value={formData.name}
            onChange={handleNameChange}
            placeholder="Example: Marina Beach"
          />

          {/* Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Slug
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="marina-beach"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              />

              <button
                type="button"
                onClick={generateSlug}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                title="Generate slug"
              >
                <Wand2 size={16} />

                <span className="hidden sm:inline">Generate</span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              value={formData.category}
              onChange={(event) => updateField("category", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Short Description */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Short Description
          </label>

          <textarea
            value={formData.shortDescription}
            onChange={(event) =>
              updateField("shortDescription", event.target.value)
            }
            rows={3}
            maxLength={500}
            placeholder="Short description of the place..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        {/* Description */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
            <span className="ml-1 text-red-500">*</span>
          </label>

          <textarea
            value={formData.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={7}
            maxLength={5000}
            placeholder="Detailed description of the place..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
          />
        </div>
      </div>

      {/* ============================================================
          IMAGES
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Images"
          description="Upload a cover image and additional gallery images."
        />

        <ImageUpload
          label="Cover Image"
          required
          value={formData.coverImage}
          onChange={(image) => updateField("coverImage", image)}
          folder="tourism/places/covers"
        />

        {/* Gallery */}
        <div className="mt-8">
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Gallery Images
          </label>

          <label
            className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 transition hover:border-emerald-400 hover:bg-emerald-50 ${
              galleryUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {galleryUploading ? (
              <>
                <Loader2
                  size={28}
                  className="mb-2 animate-spin text-emerald-600"
                />

                <span className="text-sm text-slate-600">
                  Uploading images...
                </span>
              </>
            ) : (
              <>
                <ImagePlus size={30} className="mb-2 text-emerald-600" />

                <span className="text-sm font-medium text-emerald-700">
                  Add Gallery Images
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  Select multiple images
                </span>
              </>
            )}

            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleGallerySelect}
              className="hidden"
              disabled={galleryUploading}
            />
          </label>

          {formData.gallery.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {formData.gallery.map((image, index) => (
                <div
                  key={image.publicId || `${image.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={image.url}
                    alt={`Gallery ${index + 1}`}
                    className="h-40 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    disabled={galleryRemovingIndex === index}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition hover:bg-red-700 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-70"
                    title="Remove image"
                  >
                    {galleryRemovingIndex === index ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          ENTRY FEE
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Entry Fee"
          description="Set the admission fees for different visitor types."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <NumberField
            label="Adult Fee"
            value={formData.entryFee.adult}
            onChange={(value) =>
              updateEntryFee("adult", normalizeNumberInput(value))
            }
            placeholder="0"
            min="0"
            step="0.01"
          />

          <NumberField
            label="Child Fee"
            value={formData.entryFee.child}
            onChange={(value) =>
              updateEntryFee("child", normalizeNumberInput(value))
            }
            placeholder="0"
            min="0"
            step="0.01"
          />

          <NumberField
            label="Foreigner Fee"
            value={formData.entryFee.foreigner}
            onChange={(value) =>
              updateEntryFee("foreigner", normalizeNumberInput(value))
            }
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        {/* Currency */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Currency
          </label>

          <select
            value={formData.currency}
            onChange={(event) => updateField("currency", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 md:max-w-xs"
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================
          VISITING INFORMATION
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Visiting Information"
          description="Provide opening hours and recommended visiting information."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Opening Time"
            type="time"
            value={formData.openingTime}
            onChange={(value) => updateField("openingTime", value)}
          />

          <InputField
            label="Closing Time"
            type="time"
            value={formData.closingTime}
            onChange={(value) => updateField("closingTime", value)}
          />

          <InputField
            label="Closed On"
            value={formData.closedOn}
            onChange={(value) => updateField("closedOn", value)}
            placeholder="Example: Monday"
          />

          <InputField
            label="Best Time to Visit"
            value={formData.bestTimeToVisit}
            onChange={(value) => updateField("bestTimeToVisit", value)}
            placeholder="Example: October to March"
          />

          <InputField
            label="Visit Duration"
            value={formData.visitDuration}
            onChange={(value) => updateField("visitDuration", value)}
            placeholder="Example: 2-3 hours"
          />
        </div>
      </div>

      {/* ============================================================
          LOCATION
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Location"
          description="Add the address and geographic coordinates."
        />

        <div className="space-y-5">
          <InputField
            label="Address"
            value={formData.address}
            onChange={(value) => updateField("address", value)}
            placeholder="Full address"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label="Latitude"
              value={formData.latitude}
              onChange={(value) => updateField("latitude", value)}
              placeholder="13.0827"
              step="any"
              min="-90"
              max="90"
            />

            <NumberField
              label="Longitude"
              value={formData.longitude}
              onChange={(value) => updateField("longitude", value)}
              placeholder="80.2707"
              step="any"
              min="-180"
              max="180"
            />
          </div>
        </div>
      </div>

      {/* ============================================================
          SETTINGS
      ============================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <SectionTitle
          title="Settings"
          description="Control visibility and featured status."
        />

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(event) =>
                updateField("isFeatured", event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />

            <span className="text-sm font-medium text-slate-700">
              Featured place
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />

            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>
      </div>

      {/* ============================================================
          ACTIONS
      ============================================================ */}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        {onCancel && (
          <AdminButton
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </AdminButton>
        )}

        <AdminButton
          type="submit"
          disabled={
            submitting || galleryUploading || galleryRemovingIndex !== null
          }
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}

          {submitting
            ? "Saving..."
            : isEditMode
              ? "Update Place"
              : "Create Place"}
        </AdminButton>
      </div>
    </form>
  );
}

/* ================================================================
   SECTION TITLE
================================================================ */

function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

/* ================================================================
   INPUT
================================================================ */

function InputField({
  label,
  required = false,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
      />
    </div>
  );
}

/* ================================================================
   NUMBER INPUT
================================================================ */

function NumberField({
  label,
  value,
  onChange,
  placeholder = "",
  step = "1",
  min,
  max,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
      />
    </div>
  );
}

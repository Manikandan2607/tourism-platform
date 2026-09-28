"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  X,
  MapPin,
  Image as ImageIcon,
  Settings,
  FileText,
  Info,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import { getToken } from "@/utils/api";
import ImageUpload from "@/components/admin/ImageUpload";

/* ================================================================
   CONSTANTS
================================================================ */

const LANGUAGES = ["Tamil", "English", "Hindi", "Malayalam"];

const CURRENCIES = ["INR", "USD"];

const DESTINATION_TYPES = [
  {
    value: "country",
    label: "Country",
  },
  {
    value: "state",
    label: "State",
  },
  {
    value: "city",
    label: "City",
  },
  {
    value: "region",
    label: "Region",
  },
];

/*
 * Destination names, countries and states:
 * - Unicode alphabets
 * - spaces
 *
 * Examples:
 * Chennai
 * Tamil Nadu
 * Kerala
 * München
 * കേരളം
 */
const NAME_REGEX = /^[\p{L}]+(?:[\s]+[\p{L}]+)*$/u;

/*
 * Slugs must match the backend schema:
 * lowercase letters, numbers and single hyphens between words.
 */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
 * Image URLs must be HTTP/HTTPS.
 */
const URL_REGEX = /^https?:\/\/[^\s]+$/i;

/*
 * Allowed image MIME types.
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const MAX_GALLERY_IMAGES = 30;

/* ================================================================
   COMPONENT
================================================================ */

export default function DestinationForm({
  initialData = null,
  initialValues = null,
  destinationId = null,
  mode = "create",
  onSuccess = null,
  onCancel = null,
}) {
  const router = useRouter();

  /* =========================================================
     DESTINATION DATA
  ========================================================= */

  const destination = initialData || initialValues || null;

  const id = destinationId || destination?._id || destination?.id || null;

  const galleryInputRef = useRef(null);

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] = useState(false);

  const [galleryUploading, setGalleryUploading] = useState(false);

  const [error, setError] = useState("");

  const [galleryError, setGalleryError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "city",
    country: "",
    state: "",
    description: "",
    shortDescription: "",
    bestTimeToVisit: "",
    language: "",
    currency: "INR",
    coverImage: null,
    gallery: [],
    latitude: "",
    longitude: "",
    address: "",
    isFeatured: false,
    isActive: true,
  });

  /* =========================================================
     IMAGE NORMALIZATION
  ========================================================= */

  function normalizeImage(image) {
    if (
      image &&
      typeof image === "object" &&
      typeof image.url === "string" &&
      image.url.trim()
    ) {
      return {
        url: image.url.trim(),
        publicId:
          typeof image.publicId === "string" ? image.publicId.trim() : "",
      };
    }

    if (typeof image === "string" && image.trim()) {
      return {
        url: image.trim(),
        publicId: "",
      };
    }

    return null;
  }

  function normalizeGallery(gallery) {
    if (!Array.isArray(gallery)) {
      return [];
    }

    return gallery
      .map((image) => normalizeImage(image))
      .filter(Boolean)
      .slice(0, MAX_GALLERY_IMAGES);
  }

  /* =========================================================
     LOAD INITIAL DATA
  ========================================================= */

  useEffect(() => {
    if (!destination) {
      return;
    }

    setFormData({
      name: destination.name || "",
      slug: destination.slug || "",
      type: destination.type || "city",
      country: destination.country || "",
      state: destination.state || "",
      description: destination.description || "",
      shortDescription: destination.shortDescription || "",
      bestTimeToVisit: destination.bestTimeToVisit || "",
      language: destination.language || "",
      currency: CURRENCIES.includes(destination.currency)
        ? destination.currency
        : "INR",
      coverImage: normalizeImage(destination.coverImage),
      gallery: normalizeGallery(destination.gallery),
      latitude: destination.latitude ?? "",
      longitude: destination.longitude ?? "",
      address: destination.address || "",
      isFeatured: destination.isFeatured === true,
      isActive: destination.isActive !== false,
    });
  }, [destination]);

  /* =========================================================
     ALPHABET-ONLY INPUT CLEANER
  ========================================================= */

  function sanitizeName(value) {
    return value
      .replace(/[^\p{L}\s]/gu, "")
      .replace(/\s+/g, " ")
      .replace(/^\s+/g, "");
  }

  /* =========================================================
     SLUG GENERATOR
  ========================================================= */

  function createSlug(value) {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    /*
     * Checkbox
     */
    if (type === "checkbox") {
      setFormData((previous) => ({
        ...previous,
        [name]: checked,
      }));

      return;
    }

    /*
     * Name fields
     */
    if (name === "name" || name === "country" || name === "state") {
      setFormData((previous) => ({
        ...previous,
        [name]: sanitizeName(value),
      }));

      return;
    }

    /*
     * Language
     */
    if (name === "language") {
      setFormData((previous) => ({
        ...previous,
        language: value,
      }));

      return;
    }

    /*
     * Currency
     */
    if (name === "currency") {
      setFormData((previous) => ({
        ...previous,
        currency: value,
      }));

      return;
    }

    /*
     * Type
     */
    if (name === "type") {
      setFormData((previous) => ({
        ...previous,
        type: value,
      }));

      return;
    }

    /*
     * Normal fields
     */
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =========================================================
     GENERATE SLUG
  ========================================================= */

  function generateSlug() {
    const slug = createSlug(formData.name);

    setFormData((previous) => ({
      ...previous,
      slug,
    }));
  }

  /* =========================================================
     GALLERY UPLOAD
  ========================================================= */

  async function handleGalleryUpload(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setGalleryError("");

    /*
     * Check gallery count before uploading.
     */
    const remainingSlots = MAX_GALLERY_IMAGES - formData.gallery.length;

    if (remainingSlots <= 0) {
      setGalleryError(
        `You can upload a maximum of ${MAX_GALLERY_IMAGES} gallery images.`,
      );

      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }

      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setGalleryError(
        `Only ${remainingSlots} more gallery image${
          remainingSlots === 1 ? "" : "s"
        } can be uploaded.`,
      );
    }

    setGalleryUploading(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      const uploadedImages = [];

      for (const file of filesToUpload) {
        /*
         * Validate image type.
         */
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          throw new Error(
            `${file.name}: Invalid image type. Only JPG, PNG, WEBP and GIF are allowed.`,
          );
        }

        /*
         * Validate image size.
         */
        if (file.size > MAX_IMAGE_SIZE) {
          throw new Error(`${file.name}: Image size cannot exceed 10 MB.`);
        }

        const uploadFormData = new FormData();

        uploadFormData.append("file", file);

        uploadFormData.append("folder", "tourism/destinations/gallery");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const responseText = await response.text();

        let data = {};

        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error("Upload server returned an invalid response.");
        }

        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Please log in again.",
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(data?.message || `Failed to upload ${file.name}.`);
        }

        if (!data.image?.url || !URL_REGEX.test(data.image.url)) {
          throw new Error(
            `Upload completed but no valid image URL was returned for ${file.name}.`,
          );
        }

        if (!data.image?.publicId || typeof data.image.publicId !== "string") {
          throw new Error(
            `Upload completed but no Cloudinary public ID was returned for ${file.name}.`,
          );
        }

        uploadedImages.push({
          url: data.image.url.trim(),
          publicId: data.image.publicId.trim(),
        });
      }

      /*
       * Add uploaded images.
       */
      setFormData((previous) => ({
        ...previous,
        gallery: [...previous.gallery, ...uploadedImages].slice(
          0,
          MAX_GALLERY_IMAGES,
        ),
      }));
    } catch (uploadError) {
      console.error("Destination gallery upload error:", uploadError);

      setGalleryError(
        uploadError?.message || "Failed to upload gallery image.",
      );
    } finally {
      setGalleryUploading(false);

      /*
       * Allow selecting the same file again.
       */
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  }

  /* =========================================================
     REMOVE GALLERY IMAGE
  ========================================================= */

  async function handleRemoveGalleryImage(index) {
    const image = formData.gallery[index];

    if (!image) {
      return;
    }

    setGalleryError("");

    /*
     * If this image has a Cloudinary public ID,
     * remove it from Cloudinary first.
     */
    if (image.publicId) {
      try {
        const token = getToken();

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
            publicId: image.publicId,
          }),
        });

        const responseText = await response.text();

        let data = {};

        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error("Image delete server returned an invalid response.");
        }

        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Please log in again.",
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(data?.message || "Failed to delete image.");
        }
      } catch (deleteError) {
        console.error("Gallery image delete error:", deleteError);

        setGalleryError(
          deleteError?.message || "Failed to delete gallery image.",
        );

        return;
      }
    }

    /*
     * Remove from local form state.
     */
    setFormData((previous) => ({
      ...previous,
      gallery: previous.gallery.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  /* =========================================================
     IMAGE VALIDATION
  ========================================================= */

  function validateImage(image, label, required = false) {
    if (!image) {
      if (required) {
        throw new Error(`${label} is required. Please upload an image.`);
      }

      return;
    }

    if (
      typeof image !== "object" ||
      typeof image.url !== "string" ||
      !image.url.trim()
    ) {
      throw new Error(`${label} must contain a valid image URL.`);
    }

    if (!URL_REGEX.test(image.url.trim())) {
      throw new Error(`${label} must use a valid HTTP or HTTPS URL.`);
    }

    if (typeof image.publicId !== "string" || !image.publicId.trim()) {
      throw new Error(`${label} is missing its Cloudinary public ID.`);
    }
  }

  /* =========================================================
     BUILD PAYLOAD
  ========================================================= */

  function buildPayload() {
    const name = formData.name.trim();

    const slug = formData.slug.trim().toLowerCase();

    const country = formData.country.trim();

    const state = formData.state.trim();

    const description = formData.description.trim();

    const shortDescription = formData.shortDescription.trim();

    const bestTimeToVisit = formData.bestTimeToVisit.trim();

    const address = formData.address.trim();

    /*
     * Validate cover image.
     */
    validateImage(formData.coverImage, "Cover image", true);

    /*
     * Validate gallery.
     */
    if (
      !Array.isArray(formData.gallery) ||
      formData.gallery.length > MAX_GALLERY_IMAGES
    ) {
      throw new Error(
        `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images.`,
      );
    }

    formData.gallery.forEach((image, index) => {
      validateImage(image, `Gallery image ${index + 1}`, true);
    });

    const payload = {
      name,
      slug,
      type: formData.type,
      country,
      description,

      coverImage: {
        url: formData.coverImage.url.trim(),
        publicId: formData.coverImage.publicId.trim(),
      },

      gallery: formData.gallery.map((image) => ({
        url: image.url.trim(),
        publicId: image.publicId.trim(),
      })),

      currency: formData.currency,

      isFeatured: formData.isFeatured === true,

      isActive: formData.isActive === true,
    };

    /*
     * Optional state.
     */
    if (state) {
      payload.state = state;
    }

    /*
     * Optional short description.
     */
    if (shortDescription) {
      payload.shortDescription = shortDescription;
    }

    /*
     * Optional best time.
     */
    if (bestTimeToVisit) {
      payload.bestTimeToVisit = bestTimeToVisit;
    }

    /*
     * Optional language.
     */
    if (formData.language) {
      payload.language = formData.language;
    }

    /*
     * Optional address.
     */
    if (address) {
      payload.address = address;
    }

    /*
     * Latitude.
     */
    if (
      formData.latitude !== "" &&
      formData.latitude !== null &&
      formData.latitude !== undefined
    ) {
      const latitude = Number(formData.latitude);

      if (!Number.isFinite(latitude)) {
        throw new Error("Latitude must be a valid number.");
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error("Latitude must be between -90 and 90.");
      }

      payload.latitude = latitude;
    }

    /*
     * Longitude.
     */
    if (
      formData.longitude !== "" &&
      formData.longitude !== null &&
      formData.longitude !== undefined
    ) {
      const longitude = Number(formData.longitude);

      if (!Number.isFinite(longitude)) {
        throw new Error("Longitude must be a valid number.");
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error("Longitude must be between -180 and 180.");
      }

      payload.longitude = longitude;
    }

    return payload;
  }

  /* =========================================================
     EXTRACT SAVED DESTINATION
  ========================================================= */

  function extractSavedDestination(response) {
    /*
     * Supports common API response shapes:
     *
     * {
     *   success: true,
     *   data: {
     *     data: destination
     *   }
     * }
     *
     * {
     *   success: true,
     *   data: destination
     * }
     *
     * {
     *   success: true,
     *   destination: destination
     * }
     *
     * {
     *   success: true,
     *   data: {
     *     destination: destination
     *   }
     * }
     */

    const candidates = [
      response?.data?.data,
      response?.data?.destination,
      response?.destination,
      response?.data,
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        (candidate._id || candidate.id)
      ) {
        return candidate;
      }
    }

    /*
     * Some APIs may return the destination
     * directly in the response object.
     */
    if (
      response &&
      typeof response === "object" &&
      (response._id || response.id)
    ) {
      return response;
    }

    return null;
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    /*
     * -----------------------------------------
     * BASIC VALUES
     * -----------------------------------------
     */

    const name = formData.name.trim();

    const country = formData.country.trim();

    const state = formData.state.trim();

    const slug = formData.slug.trim().toLowerCase();

    const description = formData.description.trim();

    const shortDescription = formData.shortDescription.trim();

    const bestTimeToVisit = formData.bestTimeToVisit.trim();

    const address = formData.address.trim();

    /*
     * -----------------------------------------
     * NAME
     * -----------------------------------------
     */

    if (!name) {
      setError("Destination name is required.");
      return;
    }

    if (name.length < 2 || name.length > 150) {
      setError("Destination name must be between 2 and 150 characters.");
      return;
    }

    if (!NAME_REGEX.test(name)) {
      setError("Destination name can contain alphabets and spaces only.");
      return;
    }

    /*
     * -----------------------------------------
     * SLUG
     * -----------------------------------------
     */

    if (!slug) {
      setError("Destination slug is required.");
      return;
    }

    if (slug.length < 2 || slug.length > 150) {
      setError("Slug must be between 2 and 150 characters.");
      return;
    }

    if (!SLUG_REGEX.test(slug)) {
      setError("Slug can contain lowercase letters, numbers and hyphens only.");
      return;
    }

    /*
     * -----------------------------------------
     * TYPE
     * -----------------------------------------
     */

    if (!DESTINATION_TYPES.some((item) => item.value === formData.type)) {
      setError("Please select a valid destination type.");
      return;
    }

    /*
     * -----------------------------------------
     * COUNTRY
     * -----------------------------------------
     */

    if (!country) {
      setError("Country is required.");
      return;
    }

    if (country.length < 2 || country.length > 150) {
      setError("Country must be between 2 and 150 characters.");
      return;
    }

    if (!NAME_REGEX.test(country)) {
      setError("Country can contain alphabets and spaces only.");
      return;
    }

    /*
     * -----------------------------------------
     * STATE
     * -----------------------------------------
     */

    if (state) {
      if (state.length > 150) {
        setError("State cannot exceed 150 characters.");
        return;
      }

      if (!NAME_REGEX.test(state)) {
        setError("State can contain alphabets and spaces only.");
        return;
      }
    }

    /*
     * -----------------------------------------
     * LANGUAGE
     * -----------------------------------------
     */

    if (formData.language && !LANGUAGES.includes(formData.language)) {
      setError("Please select a valid language.");
      return;
    }

    /*
     * -----------------------------------------
     * CURRENCY
     * -----------------------------------------
     */

    if (!CURRENCIES.includes(formData.currency)) {
      setError("Please select INR or USD as currency.");
      return;
    }

    /*
     * -----------------------------------------
     * SHORT DESCRIPTION
     * -----------------------------------------
     */

    if (shortDescription.length > 500) {
      setError("Short description cannot exceed 500 characters.");
      return;
    }

    /*
     * -----------------------------------------
     * DESCRIPTION
     * -----------------------------------------
     */

    if (!description) {
      setError("Description is required.");
      return;
    }

    if (description.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    if (description.length > 5000) {
      setError("Description cannot exceed 5000 characters.");
      return;
    }

    /*
     * -----------------------------------------
     * BEST TIME
     * -----------------------------------------
     */

    if (bestTimeToVisit.length > 200) {
      setError("Best time to visit cannot exceed 200 characters.");
      return;
    }

    /*
     * -----------------------------------------
     * ADDRESS
     * -----------------------------------------
     */

    if (address.length > 500) {
      setError("Address cannot exceed 500 characters.");
      return;
    }

    /*
     * -----------------------------------------
     * COVER IMAGE
     * -----------------------------------------
     */

    try {
      validateImage(formData.coverImage, "Cover image", true);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    /*
     * -----------------------------------------
     * GALLERY
     * -----------------------------------------
     */

    if (formData.gallery.length > MAX_GALLERY_IMAGES) {
      setError(
        `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images.`,
      );
      return;
    }

    try {
      formData.gallery.forEach((image, index) => {
        validateImage(image, `Gallery image ${index + 1}`, true);
      });
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    /*
     * -----------------------------------------
     * LATITUDE
     * -----------------------------------------
     */

    if (
      formData.latitude !== "" &&
      formData.latitude !== null &&
      formData.latitude !== undefined
    ) {
      const latitude = Number(formData.latitude);

      if (!Number.isFinite(latitude)) {
        setError("Latitude must be a valid number.");
        return;
      }

      if (latitude < -90 || latitude > 90) {
        setError("Latitude must be between -90 and 90.");
        return;
      }
    }

    /*
     * -----------------------------------------
     * LONGITUDE
     * -----------------------------------------
     */

    if (
      formData.longitude !== "" &&
      formData.longitude !== null &&
      formData.longitude !== undefined
    ) {
      const longitude = Number(formData.longitude);

      if (!Number.isFinite(longitude)) {
        setError("Longitude must be a valid number.");
        return;
      }

      if (longitude < -180 || longitude > 180) {
        setError("Longitude must be between -180 and 180.");
        return;
      }
    }

    /*
     * -----------------------------------------
     * EDIT MODE ID
     * -----------------------------------------
     */

    if (mode === "edit" && !id) {
      setError("Destination ID is missing. Cannot update destination.");
      return;
    }

    /*
     * -----------------------------------------
     * SUBMIT
     * -----------------------------------------
     */

    setLoading(true);

    try {
      const payload = buildPayload();

      console.log("Destination payload:", payload);

      let response;

      /*
       * CREATE
       */
      if (mode === "create") {
        response = await adminApi.post("/api/dashboard/destinations", payload);
      }

      /*
       * UPDATE
       */
      if (mode === "edit") {
        response = await adminApi.put(
          `/api/dashboard/destinations/${id}`,
          payload,
        );
      }

      /*
       * Validate response.
       */
      if (!response?.success) {
        throw new Error(response?.message || "Failed to save destination.");
      }

      /*
       * =====================================================
       * IMPORTANT:
       * Extract the actual saved destination object.
       *
       * Previously:
       *
       * await onSuccess(response);
       *
       * That caused the Transportation page to receive
       * the API response instead of the destination itself.
       *
       * Now onSuccess receives:
       *
       * {
       *   _id: "...",
       *   name: "...",
       *   slug: "...",
       *   ...
       * }
       * =====================================================
       */

      if (typeof onSuccess === "function") {
        const savedDestination = extractSavedDestination(response);

        console.log("Saved destination object:", savedDestination);

        /*
         * The destination ID is required by the
         * Transportation create flow.
         */
        if (!savedDestination?._id && !savedDestination?.id) {
          throw new Error(
            "Destination was created, but its ID was not returned by the server.",
          );
        }

        await onSuccess(savedDestination);

        return;
      }

      /*
       * Standalone page mode.
       */
      router.push("/admin/dashboard/destinations");

      router.refresh();
    } catch (saveError) {
      console.error("Destination save error:", saveError);

      setError(
        saveError?.data?.message ||
          saveError?.message ||
          "Failed to save destination.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CANCEL
  ========================================================= */

  function handleCancel() {
    if (loading) {
      return;
    }

    if (typeof onCancel === "function") {
      onCancel();
      return;
    }

    router.push("/admin/dashboard/destinations");
  }

  /* =========================================================
     INPUT CLASS
  ========================================================= */

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50";

  /* =========================================================
     SECTION CLASS
  ========================================================= */

  const sectionClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-red-600" />

          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* =====================================================
          BASIC INFORMATION
      ===================================================== */}

      <section className={sectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileText size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add the main information about this destination.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* NAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Destination Name *
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Example: Chennai"
              disabled={loading}
              maxLength={150}
              autoComplete="off"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Alphabets and spaces only.
            </p>
          </div>

          {/* SLUG */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Slug *
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="chennai"
                disabled={loading}
                maxLength={150}
                autoComplete="off"
                className={`${inputClass} min-w-0 flex-1`}
              />

              <button
                type="button"
                onClick={generateSlug}
                disabled={loading || !formData.name.trim()}
                className="shrink-0 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Lowercase letters, numbers and hyphens.
            </p>
          </div>

          {/* TYPE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Type *
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            >
              {DESTINATION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* COUNTRY */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Country *
            </label>

            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="India"
              disabled={loading}
              maxLength={150}
              autoComplete="country-name"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Alphabets and spaces only.
            </p>
          </div>

          {/* STATE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              State
            </label>

            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Tamil Nadu"
              disabled={loading}
              maxLength={150}
              autoComplete="address-level1"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Alphabets and spaces only.
            </p>
          </div>

          {/* LANGUAGE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Language
            </label>

            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            >
              <option value="">Select language</option>

              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          {/* CURRENCY */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Currency *
            </label>

            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* BEST TIME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Best Time To Visit
            </label>

            <input
              type="text"
              name="bestTimeToVisit"
              value={formData.bestTimeToVisit}
              onChange={handleChange}
              placeholder="October to March"
              disabled={loading}
              maxLength={200}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      <section className={sectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileText size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Description</h2>

            <p className="mt-1 text-sm text-slate-500">
              Provide useful information visitors should know about this
              destination.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* SHORT DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Short Description
            </label>

            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="A short description of the destination"
              disabled={loading}
              maxLength={500}
              className={inputClass}
            />
          </div>

          {/* FULL DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Description *
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={7}
              placeholder="Write a detailed description..."
              disabled={loading}
              maxLength={5000}
              className={`${inputClass} resize-y`}
            />

            <div className="mt-1 flex justify-end">
              <span className="text-xs text-slate-400">
                {formData.description.length}
                /5000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATION
      ===================================================== */}

      <section className={sectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Location</h2>

            <p className="mt-1 text-sm text-slate-500">
              Add address and map coordinates.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* ADDRESS */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Address
            </label>

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Destination address"
              disabled={loading}
              maxLength={500}
              autoComplete="street-address"
              className={inputClass}
            />
          </div>

          {/* LATITUDE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Latitude
            </label>

            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              min="-90"
              max="90"
              step="any"
              inputMode="decimal"
              placeholder="13.0827"
              disabled={loading}
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Allowed range: -90 to 90.
            </p>
          </div>

          {/* LONGITUDE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Longitude
            </label>

            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              min="-180"
              max="180"
              step="any"
              inputMode="decimal"
              placeholder="80.2707"
              disabled={loading}
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Allowed range: -180 to 180.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          IMAGES
      ===================================================== */}

      <section className={sectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ImageIcon size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Images</h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a cover image and gallery images for the destination.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* COVER IMAGE */}

          <div>
            <ImageUpload
              label="Cover Image"
              required
              value={formData.coverImage}
              onChange={(image) =>
                setFormData((previous) => ({
                  ...previous,
                  coverImage: image,
                }))
              }
              folder="tourism/destinations/covers"
            />
          </div>

          {/* GALLERY */}

          <div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-slate-700">
                Gallery Images
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Upload one or more images for this destination. Maximum{" "}
                {MAX_GALLERY_IMAGES} images.
              </p>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={
                loading ||
                galleryUploading ||
                formData.gallery.length >= MAX_GALLERY_IMAGES
              }
              className="flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {galleryUploading ? (
                <>
                  <Loader2
                    size={34}
                    className="mb-3 animate-spin text-emerald-600"
                  />

                  <span className="text-sm font-semibold text-slate-700">
                    Uploading images...
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    Please wait
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus size={36} className="mb-3 text-emerald-500" />

                  <span className="text-sm font-semibold text-slate-700">
                    {formData.gallery.length >= MAX_GALLERY_IMAGES
                      ? "Gallery limit reached"
                      : "Upload Gallery Images"}
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WEBP or GIF • Max 10MB each
                  </span>
                </>
              )}
            </button>

            {/* GALLERY ERROR */}

            {galleryError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{galleryError}</p>
              </div>
            )}

            {/* GALLERY PREVIEW */}

            {formData.gallery.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Uploaded Images
                  </p>

                  <p className="text-xs font-medium text-slate-500">
                    {formData.gallery.length} image
                    {formData.gallery.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {formData.gallery.map((image, index) => (
                    <div
                      key={image.publicId || image.url || index}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={image.url}
                        alt={`Destination gallery ${index + 1}`}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        disabled={loading || galleryUploading}
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete image"
                      >
                        <X size={18} />
                      </button>

                      <div className="absolute bottom-2 left-2 rounded-lg bg-slate-950/70 px-2 py-1 text-xs font-medium text-white">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      <section className={sectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Settings size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Settings</h2>

            <p className="mt-1 text-sm text-slate-500">
              Control visibility and featured status.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* FEATURED */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Featured destination
              </p>

              <p className="text-xs text-slate-500">
                Highlight this destination in featured sections.
              </p>
            </div>
          </label>

          {/* ACTIVE */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Active destination
              </p>

              <p className="text-xs text-slate-500">
                Allow this destination to remain active on the platform.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || galleryUploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}

          {loading
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
              ? "Update Destination"
              : "Create Destination"}
        </button>
      </div>
    </form>
  );
}

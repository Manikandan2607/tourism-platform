"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  ImagePlus,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import { getToken } from "@/utils/api";

const SUPPORTED_CURRENCIES = ["INR", "USD"];

const NAME_REGEX = /^[\p{L}]+(?:[\s]+[\p{L}]+)*$/u;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/i;

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_DAY_TITLE_LENGTH = 150;
const MAX_ACTIVITY_TITLE_LENGTH = 150;
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 2000;
const MAX_ACTIVITY_TIME_LENGTH = 50;
const MAX_GALLERY_IMAGES = 30;

const EMPTY_ACTIVITY = {
  time: "",
  title: "",
  description: "",
  place: "",
};

const EMPTY_DAY = {
  dayNumber: 1,
  title: "",
  activities: [{ ...EMPTY_ACTIVITY }],
};

function createEmptyDay(dayNumber) {
  return {
    dayNumber,
    title: "",
    activities: [{ ...EMPTY_ACTIVITY }],
  };
}

function normalizeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  const url = String(image.url || "").trim();
  const publicId = String(image.publicId || "").trim();

  if (!url || !publicId) {
    return null;
  }

  return {
    url,
    publicId,
  };
}

function normalizeId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value._id?.toString?.() || value.id?.toString?.() || "";
  }

  return String(value);
}

function extractList(response, keys = []) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  return [];
}

function normalizeDays(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return [createEmptyDay(1)];
  }

  return days.map((day, index) => ({
    dayNumber:
      Number.isInteger(Number(day?.dayNumber)) && Number(day.dayNumber) > 0
        ? Number(day.dayNumber)
        : index + 1,

    title: String(day?.title || ""),

    activities:
      Array.isArray(day?.activities) && day.activities.length > 0
        ? day.activities.map((activity) => ({
            time: String(activity?.time || ""),
            title: String(activity?.title || ""),
            description: String(activity?.description || ""),
            place: normalizeId(activity?.place),
          }))
        : [{ ...EMPTY_ACTIVITY }],
  }));
}

function normalizeInitialData(data) {
  if (!data) {
    return {
      destination: "",
      title: "",
      slug: "",
      duration: {
        days: 1,
        nights: 0,
      },
      description: "",
      currency: "INR",
      estimatedBudget: {
        min: "",
        max: "",
      },
      days: [createEmptyDay(1)],
      coverImage: null,
      gallery: [],
      isFeatured: false,
      isActive: true,
    };
  }

  return {
    destination: normalizeId(data.destination),

    title: String(data.title || ""),

    slug: String(data.slug || ""),

    duration: {
      days:
        Number.isInteger(Number(data.duration?.days)) &&
        Number(data.duration?.days) >= 1
          ? Number(data.duration.days)
          : 1,

      nights:
        Number.isInteger(Number(data.duration?.nights)) &&
        Number(data.duration?.nights) >= 0
          ? Number(data.duration.nights)
          : 0,
    },

    description: String(data.description || ""),

    currency: SUPPORTED_CURRENCIES.includes(
      String(data.currency || "").toUpperCase(),
    )
      ? String(data.currency).toUpperCase()
      : "INR",

    estimatedBudget: {
      min:
        data.estimatedBudget?.min !== undefined &&
        data.estimatedBudget?.min !== null
          ? String(data.estimatedBudget.min)
          : "",

      max:
        data.estimatedBudget?.max !== undefined &&
        data.estimatedBudget?.max !== null
          ? String(data.estimatedBudget.max)
          : "",
    },

    days: normalizeDays(data.days),

    coverImage: normalizeImage(data.coverImage),

    gallery: Array.isArray(data.gallery)
      ? data.gallery.map(normalizeImage).filter(Boolean)
      : [],

    isFeatured: data.isFeatured === true,

    isActive: data.isActive !== false,
  };
}

export default function ItineraryForm({
  initialData = null,
  initialValues = null,
  itineraryId = null,
  mode = "create",
  readOnly = false,
  onSuccess = null,
  onCancel = null,
}) {
  const sourceData = initialData || initialValues || null;

  const [destinations, setDestinations] = useState([]);
  const [places, setPlaces] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(() => normalizeInitialData(sourceData));

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  /* ============================================================
     LOAD DESTINATIONS + PLACES
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          adminApi.get("/api/dashboard/destinations"),
          adminApi.get("/api/dashboard/places"),
        ]);

        if (cancelled) {
          return;
        }

        const destinationsResult = results[0];
        const placesResult = results[1];

        if (destinationsResult.status === "fulfilled") {
          const destinationList = extractList(destinationsResult.value, [
            "destinations",
          ]);

          setDestinations(destinationList.filter((item) => item?._id));
        } else {
          console.error(
            "Failed to load destinations:",
            destinationsResult.reason,
          );

          setDestinations([]);
        }

        if (placesResult.status === "fulfilled") {
          const placeList = extractList(placesResult.value, ["places"]);

          setPlaces(placeList.filter((item) => item?._id));
        } else {
          console.error("Failed to load places:", placesResult.reason);

          setPlaces([]);
        }

        const destinationFailed = destinationsResult.status === "rejected";

        const placesFailed = placesResult.status === "rejected";

        if (destinationFailed && placesFailed) {
          setError(
            "Failed to load destinations and places. Please refresh and try again.",
          );
        } else if (destinationFailed) {
          setError(
            "Failed to load destinations. Please refresh and try again.",
          );
        } else if (placesFailed) {
          setError("Failed to load places. Please refresh and try again.");
        }
      } catch (loadError) {
        console.error("Failed to load itinerary form data:", loadError);

        if (!cancelled) {
          setError(
            loadError?.data?.message ||
              loadError?.message ||
              "Failed to load itinerary form data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     SYNC EDIT DATA
  ============================================================ */

  useEffect(() => {
    if (!sourceData) {
      return;
    }

    setForm(normalizeInitialData(sourceData));
  }, [sourceData]);

  /* ============================================================
     FILTER PLACES BY DESTINATION
  ============================================================ */

  const destinationPlaces = useMemo(() => {
    if (!form.destination) {
      return [];
    }

    return places.filter(
      (place) => normalizeId(place.destination) === form.destination,
    );
  }, [places, form.destination]);

  /* ============================================================
     FORM HELPERS
  ============================================================ */

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateDuration(field, value) {
    setForm((previous) => ({
      ...previous,
      duration: {
        ...previous.duration,
        [field]: value,
      },
    }));
  }

  function updateBudget(field, value) {
    setForm((previous) => ({
      ...previous,
      estimatedBudget: {
        ...previous.estimatedBudget,
        [field]: value,
      },
    }));
  }

  function updateDay(dayIndex, field, value) {
    setForm((previous) => {
      const days = [...previous.days];

      days[dayIndex] = {
        ...days[dayIndex],
        [field]: value,
      };

      return {
        ...previous,
        days,
      };
    });
  }

  function updateActivity(dayIndex, activityIndex, field, value) {
    setForm((previous) => {
      const days = [...previous.days];

      const activities = [...days[dayIndex].activities];

      activities[activityIndex] = {
        ...activities[activityIndex],
        [field]: value,
      };

      days[dayIndex] = {
        ...days[dayIndex],
        activities,
      };

      return {
        ...previous,
        days,
      };
    });
  }

  function handleDestinationChange(value) {
    setForm((previous) => ({
      ...previous,
      destination: value,
      days: previous.days.map((day) => ({
        ...day,
        activities: day.activities.map((activity) => ({
          ...activity,
          place: "",
        })),
      })),
    }));
  }

  function addDay() {
    setForm((previous) => {
      const nextDayNumber = previous.days.length + 1;

      return {
        ...previous,
        days: [...previous.days, createEmptyDay(nextDayNumber)],
        duration: {
          ...previous.duration,
          days: nextDayNumber,
        },
      };
    });
  }

  function removeDay(dayIndex) {
    if (form.days.length <= 1) {
      return;
    }

    setForm((previous) => {
      const days = previous.days
        .filter((_, index) => index !== dayIndex)
        .map((day, index) => ({
          ...day,
          dayNumber: index + 1,
        }));

      return {
        ...previous,
        days,
        duration: {
          ...previous.duration,
          days: days.length,
        },
      };
    });
  }

  function addActivity(dayIndex) {
    setForm((previous) => {
      const days = [...previous.days];

      days[dayIndex] = {
        ...days[dayIndex],
        activities: [...days[dayIndex].activities, { ...EMPTY_ACTIVITY }],
      };

      return {
        ...previous,
        days,
      };
    });
  }

  function removeActivity(dayIndex, activityIndex) {
    setForm((previous) => {
      const days = [...previous.days];

      const currentActivities = days[dayIndex].activities;

      if (currentActivities.length <= 1) {
        return previous;
      }

      days[dayIndex] = {
        ...days[dayIndex],
        activities: currentActivities.filter(
          (_, index) => index !== activityIndex,
        ),
      };

      return {
        ...previous,
        days,
      };
    });
  }

  /* ============================================================
     CLOUDINARY UPLOAD
  ============================================================ */

  async function uploadImage(file, folder) {
    if (!file) {
      return null;
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    const token = getToken();

    if (!token) {
      throw new Error("Your admin session has expired. Please login again.");
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Image upload failed.");
    }

    const image = normalizeImage(data?.image || data?.data || data);

    if (!image) {
      throw new Error(
        "Image upload succeeded but no valid image data was returned.",
      );
    }

    if (!URL_REGEX.test(image.url)) {
      throw new Error("Uploaded image returned an invalid URL.");
    }

    return image;
  }

  async function handleCoverUpload(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || readOnly) {
      return;
    }

    setUploadingCover(true);
    setError("");
    setSuccess("");

    try {
      const image = await uploadImage(file, "tourism/itineraries/cover");

      setForm((previous) => ({
        ...previous,
        coverImage: image,
      }));
    } catch (uploadError) {
      console.error("Cover upload failed:", uploadError);

      setError(uploadError?.message || "Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (files.length === 0 || readOnly) {
      return;
    }

    const remainingSlots = MAX_GALLERY_IMAGES - form.gallery.length;

    if (remainingSlots <= 0) {
      setError(
        `Gallery can contain a maximum of ${MAX_GALLERY_IMAGES} images.`,
      );
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    setUploadingGallery(true);
    setError("");
    setSuccess("");

    try {
      const uploaded = [];

      for (const file of filesToUpload) {
        const image = await uploadImage(file, "tourism/itineraries/gallery");

        if (image) {
          uploaded.push(image);
        }
      }

      if (uploaded.length > 0) {
        setForm((previous) => ({
          ...previous,
          gallery: [...previous.gallery, ...uploaded],
        }));
      }
    } catch (uploadError) {
      console.error("Gallery upload failed:", uploadError);

      setError(uploadError?.message || "Failed to upload gallery images.");
    } finally {
      setUploadingGallery(false);
    }
  }

  function removeCoverImage() {
    if (readOnly) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      coverImage: null,
    }));
  }

  function removeGalleryImage(index) {
    if (readOnly) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      gallery: previous.gallery.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  /* ============================================================
     VALIDATION
  ============================================================ */

  function validateForm() {
    const title = form.title.trim();
    const slug = form.slug.trim().toLowerCase();
    const description = form.description.trim();

    if (!form.destination) {
      return "Please select a destination.";
    }

    if (!title) {
      return "Please enter an itinerary title.";
    }

    if (title.length < 2) {
      return "Itinerary title must contain at least 2 characters.";
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return `Itinerary title cannot exceed ${MAX_TITLE_LENGTH} characters.`;
    }

    if (!NAME_REGEX.test(title)) {
      return "Itinerary title can contain only letters and spaces.";
    }

    if (!slug) {
      return "Please enter an itinerary slug.";
    }

    if (slug.length > MAX_TITLE_LENGTH) {
      return `Slug cannot exceed ${MAX_TITLE_LENGTH} characters.`;
    }

    if (!SLUG_REGEX.test(slug)) {
      return "Slug can contain only lowercase letters, numbers and hyphens.";
    }

    if (!SUPPORTED_CURRENCIES.includes(form.currency)) {
      return "Please select a valid currency.";
    }

    if (!description) {
      return "Please enter an itinerary description.";
    }

    if (description.length < 10) {
      return "Itinerary description must contain at least 10 characters.";
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
    }

    const days = Number(form.duration.days);
    const nights = Number(form.duration.nights);

    if (!Number.isInteger(days) || days < 1) {
      return "Duration days must be at least 1.";
    }

    if (!Number.isInteger(nights) || nights < 0) {
      return "Duration nights must be 0 or greater.";
    }

    if (!form.coverImage?.url) {
      return "Please upload a cover image.";
    }

    if (!form.coverImage?.publicId) {
      return "Cover image information is incomplete. Please upload the image again.";
    }

    if (!URL_REGEX.test(form.coverImage.url)) {
      return "Cover image URL is invalid.";
    }

    if (
      !Array.isArray(form.gallery) ||
      form.gallery.length > MAX_GALLERY_IMAGES
    ) {
      return `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images.`;
    }

    for (const image of form.gallery) {
      if (!image?.url || !image?.publicId) {
        return "One or more gallery images are invalid.";
      }

      if (!URL_REGEX.test(image.url)) {
        return "One or more gallery image URLs are invalid.";
      }
    }

    if (!Array.isArray(form.days) || form.days.length === 0) {
      return "Please add at least one itinerary day.";
    }

    for (let dayIndex = 0; dayIndex < form.days.length; dayIndex++) {
      const day = form.days[dayIndex];

      const dayTitle = day.title.trim();

      if (!dayTitle) {
        return `Please enter a title for Day ${dayIndex + 1}.`;
      }

      if (dayTitle.length > MAX_DAY_TITLE_LENGTH) {
        return `Day ${dayIndex + 1} title cannot exceed ${MAX_DAY_TITLE_LENGTH} characters.`;
      }

      if (!Array.isArray(day.activities) || day.activities.length === 0) {
        return `Please add at least one activity for Day ${dayIndex + 1}.`;
      }

      for (
        let activityIndex = 0;
        activityIndex < day.activities.length;
        activityIndex++
      ) {
        const activity = day.activities[activityIndex];

        const activityTitle = activity.title.trim();

        const activityTime = activity.time?.trim() || "";

        const activityDescription = activity.description?.trim() || "";

        if (!activityTitle) {
          return `Please enter an activity title for Day ${dayIndex + 1}.`;
        }

        if (activityTitle.length > MAX_ACTIVITY_TITLE_LENGTH) {
          return `Activity title in Day ${dayIndex + 1} cannot exceed ${MAX_ACTIVITY_TITLE_LENGTH} characters.`;
        }

        if (activityTime.length > MAX_ACTIVITY_TIME_LENGTH) {
          return `Activity time in Day ${dayIndex + 1} cannot exceed ${MAX_ACTIVITY_TIME_LENGTH} characters.`;
        }

        if (activityDescription.length > MAX_ACTIVITY_DESCRIPTION_LENGTH) {
          return `Activity description in Day ${dayIndex + 1} cannot exceed ${MAX_ACTIVITY_DESCRIPTION_LENGTH} characters.`;
        }

        if (activity.place) {
          const placeExists = destinationPlaces.some(
            (place) => normalizeId(place._id) === normalizeId(activity.place),
          );

          if (!placeExists) {
            return `Selected place in Day ${dayIndex + 1} does not belong to the selected destination.`;
          }
        }
      }
    }

    const budgetMin =
      form.estimatedBudget.min === "" ? null : Number(form.estimatedBudget.min);

    const budgetMax =
      form.estimatedBudget.max === "" ? null : Number(form.estimatedBudget.max);

    if (budgetMin !== null && (!Number.isFinite(budgetMin) || budgetMin < 0)) {
      return "Minimum budget must be a valid non-negative amount.";
    }

    if (budgetMax !== null && (!Number.isFinite(budgetMax) || budgetMax < 0)) {
      return "Maximum budget must be a valid non-negative amount.";
    }

    if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) {
      return "Maximum budget cannot be lower than minimum budget.";
    }

    if (mode === "edit" && !itineraryId) {
      return "Itinerary ID is missing.";
    }

    return "";
  }

  /* ============================================================
     BUILD PAYLOAD
  ============================================================ */

  function buildPayload() {
    const minBudget =
      form.estimatedBudget.min === "" ? null : Number(form.estimatedBudget.min);

    const maxBudget =
      form.estimatedBudget.max === "" ? null : Number(form.estimatedBudget.max);

    const payload = {
      destination: form.destination,

      title: form.title.trim(),

      slug: form.slug.trim().toLowerCase(),

      duration: {
        days: Number(form.duration.days),
        nights: Number(form.duration.nights),
      },

      description: form.description.trim(),

      currency: form.currency,

      days: form.days.map((day, dayIndex) => ({
        dayNumber: dayIndex + 1,

        title: day.title.trim(),

        activities: day.activities.map((activity) => {
          const item = {
            title: activity.title.trim(),
          };

          if (activity.time?.trim()) {
            item.time = activity.time.trim();
          }

          if (activity.description?.trim()) {
            item.description = activity.description.trim();
          }

          if (activity.place) {
            item.place = activity.place;
          }

          return item;
        }),
      })),

      coverImage: {
        url: form.coverImage.url.trim(),
        publicId: form.coverImage.publicId.trim(),
      },

      gallery: Array.isArray(form.gallery)
        ? form.gallery.map((image) => ({
            url: image.url.trim(),
            publicId: image.publicId.trim(),
          }))
        : [],

      isFeatured: form.isFeatured === true,

      isActive: form.isActive === true,
    };

    if (minBudget !== null || maxBudget !== null) {
      payload.estimatedBudget = {};

      if (minBudget !== null) {
        payload.estimatedBudget.min = minBudget;
      }

      if (maxBudget !== null) {
        payload.estimatedBudget.max = maxBudget;
      }
    }

    return payload;
  }

  /* ============================================================
     SUBMIT
  ============================================================ */

  async function handleSubmit(event) {
    event.preventDefault();

    if (readOnly || saving) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      let response;

      if (mode === "edit" && itineraryId) {
        response = await adminApi.put(
          `/api/dashboard/itineraries/${itineraryId}`,
          payload,
        );
      } else {
        response = await adminApi.post("/api/dashboard/itineraries", payload);
      }

      setSuccess(
        mode === "edit"
          ? "Itinerary updated successfully."
          : "Itinerary created successfully.",
      );

      if (typeof onSuccess === "function") {
        onSuccess(response);
      }
    } catch (submitError) {
      console.error("Failed to save itinerary:", submitError);

      setError(
        submitError?.data?.message ||
          submitError?.message ||
          "Failed to save itinerary.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading itinerary form...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing destinations and places
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     STYLES
  ============================================================ */

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Success */}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* ========================================================
          BASIC INFORMATION
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Basic Information
            </h2>

            <p className="text-xs text-slate-400">
              Add the main details for this itinerary.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Destination */}
          <div>
            <label className={labelClass}>
              Destination <span className="text-red-500">*</span>
            </label>

            <select
              value={form.destination}
              onChange={(event) => handleDestinationChange(event.target.value)}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="">Select destination</option>

              {destinations.map((destination) => (
                <option key={destination._id} value={destination._id}>
                  {destination.name}
                </option>
              ))}
            </select>

            {destinations.length === 0 ? (
              <p className="mt-1.5 text-xs text-amber-600">
                No destinations available.
              </p>
            ) : null}
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>
              Itinerary Title <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="e.g. Chennai Weekend Explorer"
              disabled={readOnly}
              className={inputClass}
            />

            <p className="mt-1 text-[11px] text-slate-400">
              Letters and spaces only.
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className={labelClass}>
              Slug <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.slug}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(event) =>
                updateForm(
                  "slug",
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-"),
                )
              }
              placeholder="chennai-weekend-explorer"
              disabled={readOnly}
              className={inputClass}
            />
          </div>

          {/* Days */}
          <div>
            <label className={labelClass}>
              Days <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={form.duration.days}
              onChange={(event) => {
                const value = event.target.value;

                updateDuration("days", value === "" ? "" : Number(value));
              }}
              disabled={readOnly}
              className={inputClass}
            />
          </div>

          {/* Nights */}
          <div>
            <label className={labelClass}>
              Nights <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.duration.nights}
              onChange={(event) => {
                const value = event.target.value;

                updateDuration("nights", value === "" ? "" : Number(value));
              }}
              disabled={readOnly}
              className={inputClass}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <label className={labelClass}>
            Description <span className="text-red-500">*</span>
          </label>

          <textarea
            rows={5}
            value={form.description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Describe the itinerary..."
            disabled={readOnly}
            className={inputClass}
          />

          <p className="mt-1 text-right text-[11px] text-slate-400">
            {form.description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
        </div>
      </section>

      {/* ========================================================
          BUDGET
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee size={19} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Estimated Budget
            </h2>

            <p className="text-xs text-slate-400">
              Optional minimum and maximum trip budget.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {/* Currency */}
          <div>
            <label className={labelClass}>
              Currency <span className="text-red-500">*</span>
            </label>

            <select
              value={form.currency}
              onChange={(event) => updateForm("currency", event.target.value)}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="INR">INR — Indian Rupee</option>

              <option value="USD">USD — US Dollar</option>
            </select>
          </div>

          {/* Minimum */}
          <div>
            <label className={labelClass}>Minimum Budget</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedBudget.min}
              onChange={(event) => updateBudget("min", event.target.value)}
              placeholder={form.currency === "USD" ? "e.g. 100" : "e.g. 5000"}
              disabled={readOnly}
              className={inputClass}
            />
          </div>

          {/* Maximum */}
          <div>
            <label className={labelClass}>Maximum Budget</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedBudget.max}
              onChange={(event) => updateBudget("max", event.target.value)}
              placeholder={form.currency === "USD" ? "e.g. 300" : "e.g. 12000"}
              disabled={readOnly}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          COVER IMAGE
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ImagePlus size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Cover Image</h2>

            <p className="text-xs text-slate-400">
              Upload the main image for this itinerary.
            </p>
          </div>
        </div>

        {form.coverImage?.url ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img
              src={form.coverImage.url}
              alt="Itinerary cover"
              className="h-64 w-full object-cover"
            />

            {!readOnly ? (
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-md transition hover:bg-red-50"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>
        ) : (
          <label
            className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center transition ${
              readOnly
                ? "cursor-not-allowed opacity-60"
                : "hover:border-emerald-400 hover:bg-emerald-50"
            }`}
          >
            {uploadingCover ? (
              <>
                <Loader2 size={28} className="animate-spin text-emerald-600" />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Uploading cover image...
                </p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-emerald-600" />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Upload cover image
                </p>

                <p className="mt-1 text-xs text-slate-400">PNG, JPG or WEBP</p>
              </>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleCoverUpload}
              disabled={readOnly || uploadingCover}
              className="hidden"
            />
          </label>
        )}
      </section>

      {/* ========================================================
          GALLERY
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ImagePlus size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Gallery</h2>

              <p className="text-xs text-slate-400">
                Add additional itinerary images.
              </p>
            </div>
          </div>

          {!readOnly ? (
            <label
              className={`inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition ${
                form.gallery.length >= MAX_GALLERY_IMAGES
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-emerald-100"
              }`}
            >
              {uploadingGallery ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Add Images
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleGalleryUpload}
                disabled={
                  uploadingGallery || form.gallery.length >= MAX_GALLERY_IMAGES
                }
                className="hidden"
              />
            </label>
          ) : null}
        </div>

        <p className="mb-4 text-xs text-slate-400">
          {form.gallery.length}/{MAX_GALLERY_IMAGES} images
        </p>

        {form.gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {form.gallery.map((image, index) => (
              <div
                key={`${image.publicId}-${index}`}
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
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-md transition hover:bg-red-50"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <ImagePlus size={25} className="mx-auto text-slate-300" />

            <p className="mt-2 text-sm font-medium text-slate-500">
              No gallery images added
            </p>
          </div>
        )}
      </section>

      {/* ========================================================
          DAILY ITINERARY
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daily Itinerary
              </h2>

              <p className="text-xs text-slate-400">
                Build activities for each day.
              </p>
            </div>
          </div>

          {!readOnly ? (
            <button
              type="button"
              onClick={addDay}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus size={16} />
              Add Day
            </button>
          ) : null}
        </div>

        <div className="space-y-5">
          {form.days.map((day, dayIndex) => (
            <div
              key={`day-${dayIndex}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
            >
              {/* Day heading */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                    {dayIndex + 1}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Day {dayIndex + 1}
                    </p>

                    <p className="text-xs text-slate-400">
                      {day.activities.length}{" "}
                      {day.activities.length === 1 ? "activity" : "activities"}
                    </p>
                  </div>
                </div>

                {!readOnly && form.days.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                    title="Remove day"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              {/* Day title */}
              <div className="mb-5">
                <label className={labelClass}>
                  Day Title <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={day.title}
                  maxLength={MAX_DAY_TITLE_LENGTH}
                  onChange={(event) =>
                    updateDay(dayIndex, "title", event.target.value)
                  }
                  placeholder="e.g. Explore Chennai Heritage"
                  disabled={readOnly}
                  className={inputClass}
                />
              </div>

              {/* Activities */}
              <div className="space-y-4">
                {day.activities.map((activity, activityIndex) => (
                  <div
                    key={`activity-${dayIndex}-${activityIndex}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">
                        Activity {activityIndex + 1}
                      </p>

                      {!readOnly && day.activities.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            removeActivity(dayIndex, activityIndex)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                          title="Remove activity"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Time */}
                      <div>
                        <label className={labelClass}>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            Time
                          </span>
                        </label>

                        <input
                          type="text"
                          value={activity.time}
                          maxLength={MAX_ACTIVITY_TIME_LENGTH}
                          onChange={(event) =>
                            updateActivity(
                              dayIndex,
                              activityIndex,
                              "time",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. 09:00 AM"
                          disabled={readOnly}
                          className={inputClass}
                        />
                      </div>

                      {/* Place */}
                      <div>
                        <label className={labelClass}>Place</label>

                        <select
                          value={activity.place || ""}
                          onChange={(event) =>
                            updateActivity(
                              dayIndex,
                              activityIndex,
                              "place",
                              event.target.value,
                            )
                          }
                          disabled={readOnly || !form.destination}
                          className={inputClass}
                        >
                          <option value="">Select place</option>

                          {destinationPlaces.map((place) => (
                            <option key={place._id} value={place._id}>
                              {place.name}
                            </option>
                          ))}
                        </select>

                        {form.destination && destinationPlaces.length === 0 ? (
                          <p className="mt-1.5 text-xs text-amber-600">
                            No places found for this destination.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Activity title */}
                    <div className="mt-4">
                      <label className={labelClass}>
                        Activity Title <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={activity.title}
                        maxLength={MAX_ACTIVITY_TITLE_LENGTH}
                        onChange={(event) =>
                          updateActivity(
                            dayIndex,
                            activityIndex,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Visit Kapaleeshwarar Temple"
                        disabled={readOnly}
                        className={inputClass}
                      />
                    </div>

                    {/* Activity description */}
                    <div className="mt-4">
                      <label className={labelClass}>Activity Description</label>

                      <textarea
                        rows={3}
                        value={activity.description}
                        maxLength={MAX_ACTIVITY_DESCRIPTION_LENGTH}
                        onChange={(event) =>
                          updateActivity(
                            dayIndex,
                            activityIndex,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="Describe what visitors will do..."
                        disabled={readOnly}
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => addActivity(dayIndex)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Plus size={15} />
                  Add Activity
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          VISIBILITY
      ======================================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">Visibility</h2>

          <p className="mt-1 text-xs text-slate-400">
            Control how this itinerary appears in your tourism platform.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Featured */}
          <button
            type="button"
            disabled={readOnly}
            onClick={() => updateForm("isFeatured", !form.isFeatured)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
              form.isFeatured
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white"
            } ${readOnly ? "cursor-default" : "hover:border-emerald-200"}`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Featured Itinerary
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Highlight this itinerary.
              </p>
            </div>

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                form.isFeatured
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-transparent"
              }`}
            >
              <Check size={15} />
            </div>
          </button>

          {/* Active */}
          <button
            type="button"
            disabled={readOnly}
            onClick={() => updateForm("isActive", !form.isActive)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
              form.isActive
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white"
            } ${readOnly ? "cursor-default" : "hover:border-emerald-200"}`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Active</p>

              <p className="mt-1 text-xs text-slate-400">
                Make this itinerary visible.
              </p>
            </div>

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                form.isActive
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-transparent"
              }`}
            >
              <Check size={15} />
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================
          FOOTER ACTIONS
      ======================================================== */}

      {!readOnly ? (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          {typeof onCancel === "function" ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>
          ) : null}

          <button
            type="submit"
            disabled={saving || uploadingCover || uploadingGallery}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : mode === "edit"
                ? "Update Itinerary"
                : "Create Itinerary"}
          </button>
        </div>
      ) : typeof onCancel === "function" ? (
        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <X size={16} />
            Close
          </button>
        </div>
      ) : null}
    </form>
  );
}

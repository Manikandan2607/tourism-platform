"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import { getToken } from "@/utils/api";

const emptyForm = {
  destination: "",
  name: "",
  slug: "",
  description: "",

  cuisines: "",
  foodType: "both",
  priceRange: "",

  popularDishes: "",

  openingTime: "",
  closingTime: "",

  address: "",
  latitude: "",
  longitude: "",

  contactPhone: "",
  website: "",

  coverImage: null,
  gallery: [],

  rating: 0,
  isFeatured: false,
  isActive: true,
};

function normalizeImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    const url = image.trim();

    if (!url) return null;

    return {
      url,
      publicId: "",
    };
  }

  if (typeof image === "object") {
    return {
      url: image.url || "",
      publicId: image.publicId || "",
    };
  }

  return null;
}

function normalizeFormData(data) {
  return {
    destination:
      typeof data.destination === "object"
        ? data.destination?._id || ""
        : data.destination || "",

    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",

    cuisines: Array.isArray(data.cuisines) ? data.cuisines.join(", ") : "",

    foodType: data.foodType || "both",
    priceRange: data.priceRange || "",

    popularDishes: Array.isArray(data.popularDishes)
      ? data.popularDishes.join(", ")
      : "",

    openingTime: data.openingTime || "",
    closingTime: data.closingTime || "",

    address: data.address || "",
    latitude: data.latitude ?? "",
    longitude: data.longitude ?? "",

    contactPhone: data.contactPhone || "",
    website: data.website || "",

    coverImage: normalizeImage(data.coverImage),

    gallery: Array.isArray(data.gallery)
      ? data.gallery.map(normalizeImage).filter(Boolean)
      : [],

    rating: data.rating ?? 0,
    isFeatured: Boolean(data.isFeatured),
    isActive: data.isActive !== false,
  };
}

function Field({ label, children, required = false, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

export default function RestaurantForm({
  initialValues = null,
  destinations = [],
  mode = "create",
  readOnly = false,
  onCancel,
  onSuccess,
}) {
  const router = useRouter();

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setForm(normalizeFormData(initialValues));
    } else {
      setForm(emptyForm);
    }
  }, [initialValues]);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function generateSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(value) {
    setForm((previous) => ({
      ...previous,
      name: value,
      ...(mode === "create" ? { slug: generateSlug(value) } : {}),
    }));
  }

  async function uploadCoverImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", "tourism/restaurants/cover");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Cover image upload failed");
      }

      if (data?.image) {
        setForm((previous) => ({
          ...previous,
          coverImage: data.image,
        }));
      }
    } catch (uploadError) {
      console.error(uploadError);

      setError(uploadError?.message || "Cover image upload failed");
    } finally {
      event.target.value = "";
    }
  }

  async function uploadGalleryImages(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setUploadingGallery(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const uploadedImages = [];

      for (const file of files) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("folder", "tourism/restaurants/gallery");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Gallery image upload failed");
        }

        if (data?.image) {
          uploadedImages.push(data.image);
        }
      }

      setForm((previous) => ({
        ...previous,
        gallery: [...previous.gallery, ...uploadedImages],
      }));
    } catch (uploadError) {
      console.error(uploadError);

      setError(uploadError?.message || "Gallery image upload failed");
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  }

  function removeGalleryImage(index) {
    if (readOnly) return;

    setForm((previous) => ({
      ...previous,
      gallery: previous.gallery.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  function removeCoverImage() {
    if (readOnly) return;

    setForm((previous) => ({
      ...previous,
      coverImage: null,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (readOnly) return;

    setError("");

    if (!form.destination) {
      setError("Please select a destination.");
      return;
    }

    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Restaurant slug is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Restaurant description is required.");
      return;
    }

    if (!form.priceRange) {
      setError("Please select a price range.");
      return;
    }

    if (!form.coverImage?.url) {
      setError("Please upload a cover image.");
      return;
    }

    const rating = Number(form.rating);

    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    if (form.latitude !== "" && Number.isNaN(Number(form.latitude))) {
      setError("Latitude must be a valid number.");
      return;
    }

    if (form.longitude !== "" && Number.isNaN(Number(form.longitude))) {
      setError("Longitude must be a valid number.");
      return;
    }

    const payload = {
      destination: form.destination,

      name: form.name.trim(),
      slug: generateSlug(form.slug),

      description: form.description.trim(),

      cuisines: form.cuisines
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      foodType: form.foodType,
      priceRange: form.priceRange,

      popularDishes: form.popularDishes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      openingTime: form.openingTime.trim(),
      closingTime: form.closingTime.trim(),

      address: form.address.trim(),

      latitude: form.latitude === "" ? undefined : Number(form.latitude),

      longitude: form.longitude === "" ? undefined : Number(form.longitude),

      contactPhone: form.contactPhone.trim(),
      website: form.website.trim(),

      coverImage: form.coverImage,
      gallery: form.gallery,

      rating,

      isFeatured: Boolean(form.isFeatured),
      isActive: Boolean(form.isActive),
    };

    try {
      setLoading(true);

      let response;

      if (mode === "edit" && initialValues?._id) {
        response = await adminApi.put(
          `/api/dashboard/restaurants/${initialValues._id}`,
          payload,
        );
      } else {
        response = await adminApi.post("/api/dashboard/restaurants", payload);
      }

      if (onSuccess) {
        await onSuccess(response?.data);
        return;
      }

      router.push("/admin/dashboard/restaurants");
    } catch (submitError) {
      console.error(submitError);

      setError(submitError?.message || "Failed to save restaurant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* BASIC INFORMATION */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Basic Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the restaurant's main information.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Destination" required>
            <select
              value={form.destination}
              onChange={(event) =>
                updateField("destination", event.target.value)
              }
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
          </Field>

          <Field label="Restaurant Name" required>
            <input
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              disabled={readOnly}
              placeholder="Example: Spice Garden"
              className={inputClass}
            />
          </Field>

          <Field label="Slug" required>
            <input
              value={form.slug}
              onChange={(event) =>
                updateField("slug", generateSlug(event.target.value))
              }
              disabled={readOnly}
              placeholder="spice-garden"
              className={inputClass}
            />
          </Field>

          <Field label="Food Type">
            <select
              value={form.foodType}
              onChange={(event) => updateField("foodType", event.target.value)}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="both">Both Veg & Non-Veg</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>
          </Field>

          <Field label="Price Range" required>
            <select
              value={form.priceRange}
              onChange={(event) =>
                updateField("priceRange", event.target.value)
              }
              disabled={readOnly}
              className={inputClass}
            >
              <option value="">Select price range</option>
              <option value="budget">Budget</option>
              <option value="moderate">Moderate</option>
              <option value="expensive">Expensive</option>
              <option value="luxury">Luxury</option>
            </select>
          </Field>

          <Field label="Rating">
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(event) => updateField("rating", event.target.value)}
              disabled={readOnly}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Description" required>
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              disabled={readOnly}
              placeholder="Describe the restaurant..."
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* FOOD */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Food Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Cuisines">
            <input
              value={form.cuisines}
              onChange={(event) => updateField("cuisines", event.target.value)}
              disabled={readOnly}
              placeholder="Indian, Chinese, Italian"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Separate multiple cuisines with commas.
            </p>
          </Field>

          <Field label="Popular Dishes">
            <input
              value={form.popularDishes}
              onChange={(event) =>
                updateField("popularDishes", event.target.value)
              }
              disabled={readOnly}
              placeholder="Biryani, Dosa, Pasta"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-400">
              Separate multiple dishes with commas.
            </p>
          </Field>
        </div>
      </section>

      {/* TIMING & CONTACT */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Timing & Contact
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Opening Time">
            <input
              type="time"
              value={form.openingTime}
              onChange={(event) =>
                updateField("openingTime", event.target.value)
              }
              disabled={readOnly}
              className={inputClass}
            />
          </Field>

          <Field label="Closing Time">
            <input
              type="time"
              value={form.closingTime}
              onChange={(event) =>
                updateField("closingTime", event.target.value)
              }
              disabled={readOnly}
              className={inputClass}
            />
          </Field>

          <Field label="Contact Phone">
            <input
              value={form.contactPhone}
              onChange={(event) =>
                updateField("contactPhone", event.target.value)
              }
              disabled={readOnly}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </Field>

          <Field label="Website">
            <input
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              disabled={readOnly}
              placeholder="https://example.com"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Address">
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              disabled={readOnly}
              placeholder="Restaurant address"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* LOCATION */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Location</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Latitude">
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(event) => updateField("latitude", event.target.value)}
              disabled={readOnly}
              placeholder="13.0827"
              className={inputClass}
            />
          </Field>

          <Field label="Longitude">
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(event) => updateField("longitude", event.target.value)}
              disabled={readOnly}
              placeholder="80.2707"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* IMAGES */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Restaurant Images
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload images directly to Cloudinary.
          </p>
        </div>

        {/* COVER */}
        <Field label="Cover Image" required>
          {!form.coverImage ? (
            !readOnly && (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-10 transition hover:border-emerald-400 hover:bg-emerald-50">
                <Upload className="mb-3 h-9 w-9 text-emerald-500" />

                <span className="text-sm font-semibold text-slate-700">
                  Upload cover image
                </span>

                <span className="mt-1 text-xs text-slate-400">
                  JPG, PNG, WEBP or GIF • Max 10MB
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={uploadCoverImage}
                  className="hidden"
                />
              </label>
            )
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100">
              <img
                src={form.coverImage.url}
                alt="Restaurant cover"
                className="h-64 w-full object-cover"
              />

              {!readOnly && (
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </Field>

        {/* GALLERY */}
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                Gallery Images
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Upload multiple restaurant images.
              </p>
            </div>

            {!readOnly && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                {uploadingGallery ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}

                {uploadingGallery ? "Uploading..." : "Add Images"}

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={uploadGalleryImages}
                  disabled={uploadingGallery}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {form.gallery.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />

              <p className="text-sm text-slate-500">
                No gallery images uploaded.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {form.gallery.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border border-slate-200"
                >
                  <img
                    src={image.url}
                    alt={`Gallery ${index + 1}`}
                    className="h-36 w-full object-cover transition group-hover:scale-105"
                  />

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SETTINGS */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Settings</h2>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                updateField("isFeatured", event.target.checked)
              }
              disabled={readOnly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <span className="text-sm font-medium text-slate-700">
              Featured restaurant
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
              disabled={readOnly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <span className="text-sm font-medium text-slate-700">
              Active restaurant
            </span>
          </label>
        </div>
      </section>

      {/* ACTIONS */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-3 border-t border-emerald-100 pt-5">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                router.push("/admin/dashboard/restaurants");
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}

            {mode === "edit" ? "Save Changes" : "Create Restaurant"}
          </button>
        </div>
      )}
    </form>
  );
}

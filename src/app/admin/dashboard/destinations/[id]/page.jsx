"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import DestinationForm from "@/components/admin/DestinationForm";
import { adminApi } from "@/utils/adminApi";

export default function DestinationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id;

  const isViewMode = searchParams.get("view") === "true";

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    loadDestination();
  }, [id]);

  async function loadDestination() {
    try {
      setLoading(true);
      setError("");

      console.log("Loading destination:", id);

      const response = await adminApi.get(
        `/api/dashboard/destinations/${id}`,
      );

      console.log(
        "Destination API response:",
        response,
      );

      const destinationData =
        response?.destination ||
        response?.data?.destination ||
        response?.data;

      if (!destinationData) {
        throw new Error("Destination not found.");
      }

      setDestination(destinationData);
    } catch (error) {
      console.error(
        "Failed to load destination:",
        error,
      );

      setError(
        error?.data?.message ||
          error?.message ||
          "Failed to load destination.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading destination...
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <div className="p-6">

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">

          <h1 className="text-lg font-semibold text-red-700">
            Unable to load destination
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <Link
            href="/admin/dashboard/destinations"
            className="mt-5 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to destinations
          </Link>

        </div>

      </div>
    );
  }

  /* =========================================================
     NOT FOUND
     ========================================================= */

  if (!destination) {
    return (
      <div className="p-6">

        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">

          <h1 className="text-lg font-semibold text-slate-900">
            Destination not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The destination may have been deleted
            or does not exist.
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     VIEW MODE
     ========================================================= */

  if (isViewMode) {
    const coverImage =
      typeof destination.coverImage === "string"
        ? destination.coverImage
        : destination.coverImage?.url || "";

    const gallery = Array.isArray(destination.gallery)
      ? destination.gallery
      : [];

    return (
      <div className="p-6">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <div className="mb-2">
              <Link
                href="/admin/dashboard/destinations"
                className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600"
              >
                <ArrowLeft
                  size={16}
                  className="mr-2"
                />
                Back to destinations
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {destination.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View destination details.
            </p>
          </div>

          <Link
            href={`/admin/dashboard/destinations/${destination._id}`}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Pencil
              size={17}
              className="mr-2"
            />
            Edit
          </Link>

        </div>

        {/* MAIN CARD */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* COVER IMAGE */}

          {coverImage ? (
            <div className="h-[400px] w-full overflow-hidden bg-slate-100">

              <img
                src={coverImage}
                alt={destination.name || "Destination"}
                className="h-full w-full object-cover"
              />

            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center bg-slate-100 text-sm text-slate-400">
              No cover image
            </div>
          )}

          {/* DETAILS */}

          <div className="p-6">

            <div className="grid gap-6 md:grid-cols-2">

              {/* NAME */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {destination.name || "-"}
                </p>
              </div>

              {/* SLUG */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Slug
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.slug || "-"}
                </p>
              </div>

              {/* TYPE */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Type
                </p>

                <p className="mt-1 capitalize text-sm text-slate-700">
                  {destination.type || "-"}
                </p>
              </div>

              {/* COUNTRY */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Country
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.country || "-"}
                </p>
              </div>

              {/* STATE */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  State
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.state || "-"}
                </p>
              </div>

              {/* BEST TIME */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Best Time to Visit
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.bestTimeToVisit || "-"}
                </p>
              </div>

              {/* LANGUAGE */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Language
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.language || "-"}
                </p>
              </div>

              {/* CURRENCY */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Currency
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.currency || "-"}
                </p>
              </div>

            </div>

            {/* SHORT DESCRIPTION */}

            <div className="mt-8 border-t border-slate-100 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Short Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {destination.shortDescription || "-"}
              </p>

            </div>

            {/* DESCRIPTION */}

            <div className="mt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {destination.description || "-"}
              </p>

            </div>

            {/* ADDRESS */}

            <div className="mt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Address
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {destination.address || "-"}
              </p>

            </div>

            {/* LOCATION */}

            <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Latitude
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.latitude ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Longitude
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {destination.longitude ?? "-"}
                </p>
              </div>

            </div>

            {/* STATUS */}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">

              {destination.isActive !== false ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  Inactive
                </span>
              )}

              {destination.isFeatured && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Featured
                </span>
              )}

            </div>

          </div>

        </div>

        {/* GALLERY */}

        {gallery.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Gallery
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Destination gallery images.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

              {gallery.map((image, index) => {

                const imageUrl =
                  typeof image === "string"
                    ? image
                    : image?.url || "";

                if (!imageUrl) {
                  return null;
                }

                return (
                  <div
                    key={
                      image?.publicId ||
                      `${imageUrl}-${index}`
                    }
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={imageUrl}
                      alt={`${destination.name} gallery ${index + 1}`}
                      className="h-48 w-full object-cover transition hover:scale-105"
                    />
                  </div>
                );
              })}

            </div>

          </div>
        )}

      </div>
    );
  }

  /* =========================================================
     EDIT MODE
     ========================================================= */

  return (
    <div className="p-6">

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-slate-900">
          Edit Destination
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update destination information.
        </p>

      </div>

      <DestinationForm
        initialValues={destination}
        destinationId={id}
        mode="edit"
      />

    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Eye,
  MapPin,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";

import AdminModal from "@/components/admin/AdminModal";
import PlaceForm from "@/components/admin/PlaceForm";
import StatCard from "@/components/admin/StatCard";

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [modalType, setModalType] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const getPlaceId = (place) => {
    return place?._id || place?.id || "";
  };

  const getImageUrl = (image) => {
    if (!image) return "";

    if (typeof image === "string") {
      return image;
    }

    return image?.url || "";
  };

  const formatCategory = (category) => {
    if (!category) return "—";

    return category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  /*
   * =====================================================
   * LOAD PLACES
   * =====================================================
   */

  const loadPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.get("/api/dashboard/places");

      const data = response?.data?.data || response?.data || [];

      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load places:", error);

      setError(error?.message || "Failed to load places.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  /*
   * =====================================================
   * MODAL
   * =====================================================
   */

  const openModal = (type, place) => {
    setSelectedPlace(place);
    setModalType(type);
    setError("");
  };

  const closeModal = () => {
    if (actionLoading) return;

    setModalType(null);
    setSelectedPlace(null);
  };

  /*
   * =====================================================
   * DELETE
   * =====================================================
   */

  const handleDelete = async () => {
    if (!selectedPlace) return;

    const id = getPlaceId(selectedPlace);

    if (!id) {
      setError("Place ID is missing.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await adminApi.delete(`/api/dashboard/places/${id}`);

      setModalType(null);
      setSelectedPlace(null);

      await loadPlaces();
    } catch (error) {
      console.error("Delete place error:", error);

      setError(error?.message || "Failed to delete place.");
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * =====================================================
   * ACTIVATE / DEACTIVATE
   * =====================================================
   */

  const handleToggleActive = async () => {
    if (!selectedPlace) return;

    const id = getPlaceId(selectedPlace);

    if (!id) {
      setError("Place ID is missing.");
      return;
    }

    const nextStatus = !selectedPlace.isActive;

    try {
      setActionLoading(true);
      setError("");

      /*
       * PATCH is preferred for a status-only operation.
       *
       * If your backend currently only supports PUT,
       * change this to adminApi.put().
       */
      await adminApi.patch(`/api/dashboard/places/${id}`, {
        isActive: nextStatus,
      });

      setModalType(null);
      setSelectedPlace(null);

      await loadPlaces();
    } catch (error) {
      console.error("Toggle place status error:", error);

      setError(error?.message || "Failed to update place status.");
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * =====================================================
   * EDIT SUCCESS
   * =====================================================
   */

  const handleEditSuccess = async () => {
    setModalType(null);
    setSelectedPlace(null);

    await loadPlaces();
  };

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="min-h-full bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-10">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading places...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * MAIN
   * =====================================================
   */

  return (
    <div className="min-h-full bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Places
              </h1>

              <p className="text-sm text-slate-500">
                Manage tourist attractions and places.
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard/places/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Place
          </Link>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => {
                setError("");
                loadPlaces();
              }}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* =================================================
            STAT CARDS
        ================================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Total Places"
            value={places.length}
            description="All tourist places"
            icon={<MapPin className="h-4 w-4" />}
          />

          <StatCard
            title="Active"
            value={places.filter((place) => place.isActive).length}
            description="Currently active"
            icon={<Power className="h-4 w-4" />}
          />

          <StatCard
            title="Featured"
            value={places.filter((place) => place.isFeatured).length}
            description="Featured attractions"
            icon={<Star className="h-4 w-4" />}
          />
        </div>

        {/* =================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {/* TABLE HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">All Places</h2>

              <p className="mt-0.5 text-xs text-slate-500">
                View, edit, activate, deactivate or permanently delete places.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPlaces}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* EMPTY */}

          {places.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MapPin className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">No places yet</h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first tourist place.
              </p>

              <Link
                href="/admin/dashboard/places/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Place
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Image
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Place
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Destination
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {places.map((place) => {
                    const id = getPlaceId(place);
                    const imageUrl = getImageUrl(place.coverImage);

                    return (
                      <tr
                        key={id}
                        className="border-b border-slate-100 last:border-0 hover:bg-emerald-50/30"
                      >
                        {/* IMAGE */}

                        <td className="px-5 py-4">
                          <div className="h-14 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={place.name || "Place"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <MapPin className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* PLACE */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {place.name || "Unnamed place"}
                            </p>

                            {place.shortDescription ? (
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                {place.shortDescription}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* DESTINATION */}

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-600">
                            {place.destination?.name || "—"}
                          </span>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {formatCategory(place.category)}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              place.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                place.isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />

                            {place.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() => openModal("view", place)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                              title="View place"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() => openModal("edit", place)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit place"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              type="button"
                              onClick={() =>
                                openModal(
                                  place.isActive ? "deactivate" : "activate",
                                  place,
                                )
                              }
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition ${
                                place.isActive
                                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={
                                place.isActive
                                  ? "Deactivate place"
                                  : "Activate place"
                              }
                            >
                              {place.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() => openModal("delete", place)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              title="Permanently delete place"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      <AdminModal
        open={modalType === "view" && !!selectedPlace}
        onClose={closeModal}
        title={selectedPlace?.name || "Place details"}
        description="Tourist place information"
        icon={Eye}
        maxWidth="max-w-5xl"
      >
        {selectedPlace ? <PlaceView place={selectedPlace} /> : null}
      </AdminModal>

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      <AdminModal
        open={modalType === "edit" && !!selectedPlace}
        onClose={closeModal}
        title="Edit Place"
        description="Update tourist place information"
        icon={Pencil}
        maxWidth="max-w-6xl"
      >
        {selectedPlace ? (
          <div className="p-5 sm:p-6">
            <PlaceForm
              initialValues={selectedPlace}
              onSuccess={handleEditSuccess}
              onCancel={closeModal}
            />
          </div>
        ) : null}
      </AdminModal>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <AdminModal
        open={modalType === "delete" && !!selectedPlace}
        onClose={closeModal}
        title="Delete Place"
        description="Permanent deletion"
        icon={Trash2}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-bold text-red-900">Permanent deletion</h3>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  This will permanently delete{" "}
                  <strong>{selectedPlace?.name}</strong> and remove its
                  Cloudinary cover and gallery images.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {actionLoading ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* =====================================================
          ACTIVATE / DEACTIVATE MODAL
      ===================================================== */}

      <AdminModal
        open={
          (modalType === "deactivate" || modalType === "activate") &&
          !!selectedPlace
        }
        onClose={closeModal}
        title={
          modalType === "deactivate" ? "Deactivate Place" : "Activate Place"
        }
        description={
          modalType === "deactivate"
            ? "Temporarily disable this place"
            : "Make this place active again"
        }
        icon={modalType === "deactivate" ? PowerOff : Power}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-6">
          <div
            className={`rounded-2xl border p-4 ${
              modalType === "deactivate"
                ? "border-amber-100 bg-amber-50"
                : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <div className="flex gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  modalType === "deactivate"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {modalType === "deactivate" ? (
                  <PowerOff className="h-5 w-5" />
                ) : (
                  <Power className="h-5 w-5" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  {modalType === "deactivate"
                    ? "Temporarily deactivate?"
                    : "Activate this place?"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {modalType === "deactivate"
                    ? `“${selectedPlace?.name}” will become inactive. You can activate it again later.`
                    : `“${selectedPlace?.name}” will become active again.`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                modalType === "deactivate"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : modalType === "deactivate" ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}

              {actionLoading
                ? "Updating..."
                : modalType === "deactivate"
                  ? "Deactivate"
                  : "Activate"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

/*
 * =========================================================
 * PLACE VIEW
 * =========================================================
 */

function PlaceView({ place }) {
  const getImageUrl = (image) => {
    if (!image) return "";

    if (typeof image === "string") {
      return image;
    }

    return image?.url || "";
  };

  const formatCategory = (category) => {
    if (!category) return "—";

    return category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* COVER */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {getImageUrl(place.coverImage) ? (
          <img
            src={getImageUrl(place.coverImage)}
            alt={place.name || "Place"}
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <MapPin className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* BASIC INFO */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="Destination" value={place.destination?.name} />

        <DetailItem label="Category" value={formatCategory(place.category)} />

        <DetailItem
          label="Status"
          value={place.isActive ? "Active" : "Inactive"}
        />

        <DetailItem label="Featured" value={place.isFeatured ? "Yes" : "No"} />

        <DetailItem label="Opening Time" value={place.openingTime} />

        <DetailItem label="Closing Time" value={place.closingTime} />

        <DetailItem label="Closed On" value={place.closedOn} />

        <DetailItem label="Visit Duration" value={place.visitDuration} />
      </div>

      {/* SHORT DESCRIPTION */}

      {place.shortDescription ? (
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            Short Description
          </h3>

          <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {place.shortDescription}
          </p>
        </section>
      ) : null}

      {/* DESCRIPTION */}

      <section>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Description</h3>

        <p className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
          {place.description || "No description available."}
        </p>
      </section>

      {/* FEES */}

      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Entry Fee</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FeeItem label="Adult" value={place.entryFee?.adult} />

          <FeeItem label="Child" value={place.entryFee?.child} />

          <FeeItem label="Foreigner" value={place.entryFee?.foreigner} />
        </div>
      </section>

      {/* LOCATION */}

      <section>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Location</h3>

        <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <DetailItem label="Address" value={place.address} plain />

          <DetailItem label="Latitude" value={place.latitude} plain />

          <DetailItem label="Longitude" value={place.longitude} plain />
        </div>
      </section>

      {/* BEST TIME */}

      {place.bestTimeToVisit ? (
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            Best Time to Visit
          </h3>

          <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {place.bestTimeToVisit}
          </p>
        </section>
      ) : null}

      {/* GALLERY */}

      {Array.isArray(place.gallery) && place.gallery.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Gallery</h3>

            <span className="text-xs font-medium text-slate-500">
              {place.gallery.length} images
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {place.gallery.map((image, index) => {
              const url = getImageUrl(image);

              if (!url) return null;

              return (
                <div
                  key={image?.publicId || index}
                  className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <img
                    src={url}
                    alt={`${place.name} gallery ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/*
 * =========================================================
 * DETAIL ITEM
 * =========================================================
 */

function DetailItem({ label, value, plain = false }) {
  return (
    <div
      className={
        plain ? "" : "rounded-xl border border-slate-100 bg-slate-50 p-4"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-700">
        {value !== undefined && value !== null && String(value).trim()
          ? String(value)
          : "—"}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * FEE ITEM
 * =========================================================
 */

function FeeItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        ₹{Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

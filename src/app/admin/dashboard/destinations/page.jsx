"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Eye,
  MapPin,
  Pencil,
  Power,
  PowerOff,
  Plus,
  RefreshCw,
  Trash2,
  Star,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";

import AdminModal from "@/components/admin/AdminModal";
import DestinationForm from "@/components/admin/DestinationForm";
import StatCard from "@/components/admin/StatCard";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     HELPERS
  ====================================================== */

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (typeof image === "string") {
      return image;
    }

    return image?.url || "";
  };

  const getDestinationId = (destination) => {
    return destination?._id || destination?.id || "";
  };

  /* =====================================================
     LOAD DESTINATIONS
  ====================================================== */

  const loadDestinations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.get("/api/dashboard/destinations");

      const data = response?.data?.data || response?.data || [];

      setDestinations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load destinations:", error);

      setError(error?.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  /* =====================================================
     MODAL
  ====================================================== */

  const openModal = (type, destination) => {
    setSelectedDestination(destination);
    setModalType(type);
    setError("");
  };

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setModalType(null);
    setSelectedDestination(null);
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const handleDelete = async () => {
    if (!selectedDestination) {
      return;
    }

    const id = getDestinationId(selectedDestination);

    if (!id) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await adminApi.delete(`/api/dashboard/destinations/${id}`);

      setModalType(null);
      setSelectedDestination(null);

      await loadDestinations();
    } catch (error) {
      console.error("Delete destination error:", error);

      setError(error?.message || "Failed to delete destination");
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     ACTIVATE / DEACTIVATE
  ====================================================== */

  const handleToggleActive = async () => {
    if (!selectedDestination) {
      return;
    }

    const id = getDestinationId(selectedDestination);

    if (!id) {
      return;
    }

    const nextStatus = !selectedDestination.isActive;

    try {
      setActionLoading(true);
      setError("");

      await adminApi.put(`/api/dashboard/destinations/${id}`, {
        isActive: nextStatus,
      });

      setModalType(null);
      setSelectedDestination(null);

      await loadDestinations();
    } catch (error) {
      console.error("Toggle destination status error:", error);

      setError(error?.message || "Failed to update destination status");
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     EDIT SUCCESS
  ====================================================== */

  const handleEditSuccess = async () => {
    setModalType(null);
    setSelectedDestination(null);

    await loadDestinations();
  };

  /* =====================================================
     STATISTICS
  ====================================================== */

  const totalDestinations = destinations.length;

  const activeDestinations = destinations.filter(
    (item) => item.isActive,
  ).length;

  const featuredDestinations = destinations.filter(
    (item) => item.isFeatured,
  ).length;

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-10">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading destinations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ====================================================== */

  return (
    <div className="min-h-full bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
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
                Destinations
              </h1>

              <p className="text-sm text-slate-500">
                Manage tourism destinations and their content.
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard/destinations/create"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-emerald-700
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
              focus:ring-offset-2
            "
          >
            <Plus className="h-4 w-4" />
            Add Destination
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
                loadDestinations();
              }}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* =================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Destinations"
            value={totalDestinations}
            description="All tourism destinations"
            icon={<MapPin className="h-5 w-5" />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Active"
            value={activeDestinations}
            description="Currently active destinations"
            icon={<Power className="h-5 w-5" />}
            valueClassName="text-emerald-600"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Featured"
            value={featuredDestinations}
            description="Featured destinations"
            icon={<Star className="h-5 w-5" />}
            valueClassName="text-amber-500"
            iconClassName="bg-amber-50 text-amber-500"
          />
        </div>

        {/* =================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">All Destinations</h2>

              <p className="mt-0.5 text-xs text-slate-500">
                View, edit, deactivate or permanently delete destinations.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDestinations}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-slate-200
                text-slate-500
                transition
                hover:border-emerald-200
                hover:bg-emerald-50
                hover:text-emerald-600
              "
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {destinations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MapPin className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No destinations yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first tourism destination.
              </p>

              <Link
                href="/admin/dashboard/destinations/create"
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-emerald-700
                "
              >
                <Plus className="h-4 w-4" />
                Add Destination
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
                      Destination
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Country
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
                  {destinations.map((destination) => {
                    const id = getDestinationId(destination);

                    const imageUrl = getImageUrl(destination.coverImage);

                    return (
                      <tr
                        key={id}
                        className="
                            border-b
                            border-slate-100
                            last:border-0
                            hover:bg-emerald-50/30
                          "
                      >
                        {/* IMAGE */}

                        <td className="px-5 py-4">
                          <div className="h-14 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={destination.name || "Destination"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <MapPin className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* NAME */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {destination.name || "Unnamed destination"}
                            </p>

                            {destination.shortDescription ? (
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                {destination.shortDescription}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                            {destination.type || "—"}
                          </span>
                        </td>

                        {/* COUNTRY */}

                        <td className="px-5 py-4 text-sm font-medium text-slate-600">
                          {destination.country || "—"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  destination.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }
                              `}
                          >
                            <span
                              className={`
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  ${
                                    destination.isActive
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                  }
                                `}
                            />

                            {destination.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openModal("view", destination)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                              title="View destination"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openModal("edit", destination)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit destination"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openModal(
                                  destination.isActive
                                    ? "deactivate"
                                    : "activate",
                                  destination,
                                )
                              }
                              className={`
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  bg-white
                                  transition
                                  ${
                                    destination.isActive
                                      ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }
                                `}
                              title={
                                destination.isActive ? "Deactivate" : "Activate"
                              }
                            >
                              {destination.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openModal("delete", destination)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                              title="Permanently delete"
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
        open={modalType === "view" && !!selectedDestination}
        onClose={closeModal}
        title={selectedDestination?.name || "Destination details"}
        description="Destination information"
        icon={Eye}
        maxWidth="max-w-5xl"
      >
        {selectedDestination ? (
          <div className="space-y-6 p-5 sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {getImageUrl(selectedDestination.coverImage) ? (
                <img
                  src={getImageUrl(selectedDestination.coverImage)}
                  alt={selectedDestination.name}
                  className="h-64 w-full object-cover sm:h-80"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-slate-400">
                  <MapPin className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Type" value={selectedDestination.type} />

              <DetailItem label="Country" value={selectedDestination.country} />

              <DetailItem label="State" value={selectedDestination.state} />

              <DetailItem
                label="Status"
                value={selectedDestination.isActive ? "Active" : "Inactive"}
              />

              <DetailItem
                label="Language"
                value={selectedDestination.language}
              />

              <DetailItem
                label="Currency"
                value={selectedDestination.currency}
              />

              <DetailItem
                label="Best time to visit"
                value={selectedDestination.bestTimeToVisit}
              />

              <DetailItem
                label="Featured"
                value={selectedDestination.isFeatured ? "Yes" : "No"}
              />
            </div>

            {selectedDestination.shortDescription ? (
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">
                  Short Description
                </h3>

                <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedDestination.shortDescription}
                </p>
              </section>
            ) : null}

            <section>
              <h3 className="mb-2 text-sm font-bold text-slate-900">
                Description
              </h3>

              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {selectedDestination.description || "No description available."}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold text-slate-900">
                Location
              </h3>

              <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                <DetailItem
                  label="Address"
                  value={selectedDestination.address}
                  plain
                />

                <DetailItem
                  label="Latitude"
                  value={selectedDestination.latitude}
                  plain
                />

                <DetailItem
                  label="Longitude"
                  value={selectedDestination.longitude}
                  plain
                />
              </div>
            </section>

            {Array.isArray(selectedDestination.gallery) &&
            selectedDestination.gallery.length > 0 ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Gallery</h3>

                  <span className="text-xs font-medium text-slate-500">
                    {selectedDestination.gallery.length} images
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {selectedDestination.gallery.map((image, index) => {
                    const url = getImageUrl(image);

                    if (!url) {
                      return null;
                    }

                    return (
                      <div
                        key={image?.publicId || index}
                        className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={url}
                          alt={`${selectedDestination.name} gallery ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      <AdminModal
        open={modalType === "edit" && !!selectedDestination}
        onClose={closeModal}
        title="Edit Destination"
        description="Update destination information"
        icon={Pencil}
        maxWidth="max-w-6xl"
      >
        {selectedDestination ? (
          <div className="p-5 sm:p-6">
            <DestinationForm
              initialValues={selectedDestination}
              destinationId={getDestinationId(selectedDestination)}
              mode="edit"
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
        open={modalType === "delete" && !!selectedDestination}
        onClose={closeModal}
        title="Delete Destination"
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
                  <strong>{selectedDestination?.name}</strong> from the database
                  and remove its Cloudinary images.
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
          !!selectedDestination
        }
        onClose={closeModal}
        title={
          modalType === "deactivate"
            ? "Deactivate Destination"
            : "Activate Destination"
        }
        description={
          modalType === "deactivate"
            ? "Temporarily disable this destination"
            : "Make this destination active again"
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
                    : "Activate this destination?"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {modalType === "deactivate"
                    ? `“${selectedDestination?.name}” will become inactive. You can activate it again later.`
                    : `“${selectedDestination?.name}” will become active again.`}
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
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                modalType === "deactivate"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
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

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value, plain = false }) {
  return (
    <div
      className={
        plain ? "" : "rounded-xl border border-slate-100 bg-slate-50 p-4"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
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
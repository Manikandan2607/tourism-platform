"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bike,
  BusFront,
  Car,
  Eye,
  Pencil,
  Plane,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Route,
  TrainFront,
  Trash2,
  X,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import StatCard from "@/components/admin/StatCard";

/* =========================================================
   TYPE CONFIG
========================================================= */

const TYPE_LABELS = {
  flight: "Flight",
  train: "Train",
  bus: "Bus",
  taxi: "Taxi",
  "car-rental": "Car Rental",
  "bike-rental": "Bike Rental",
};

const TYPE_ICONS = {
  flight: Plane,
  train: TrainFront,
  bus: BusFront,
  taxi: Car,
  "car-rental": Car,
  "bike-rental": Bike,
};

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
};

/* =========================================================
   HELPERS
========================================================= */

function formatType(type) {
  return TYPE_LABELS[type] || type || "—";
}

function formatCurrency(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || "₹";
}

function formatCost(cost, currency = "INR") {
  if (!cost) {
    return "—";
  }

  const min = Number(cost.min);
  const max = Number(cost.max);

  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (!hasMin && !hasMax) {
    return "—";
  }

  const symbol = formatCurrency(currency);

  const formatNumber = (value) =>
    value.toLocaleString(currency === "INR" ? "en-IN" : "en-US");

  if (hasMin && hasMax) {
    if (min === max) {
      return `${symbol}${formatNumber(min)}`;
    }

    return `${symbol}${formatNumber(min)} – ${symbol}${formatNumber(max)}`;
  }

  if (hasMin) {
    return `From ${symbol}${formatNumber(min)}`;
  }

  return `Up to ${symbol}${formatNumber(max)}`;
}

function getDestinationName(item) {
  if (!item?.destination) {
    return "—";
  }

  if (typeof item.destination === "object") {
    return (
      item.destination.name ||
      item.destination.title ||
      item.destination.slug ||
      "—"
    );
  }

  return String(item.destination);
}

function getTransportationList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.transportation)) {
    return response.transportation;
  }

  if (Array.isArray(response?.transportations)) {
    return response.transportations;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.transportation)) {
    return response.data.transportation;
  }

  if (Array.isArray(response?.data?.transportations)) {
    return response.data.transportations;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
}

/* =========================================================
   PAGE
========================================================= */

export default function TransportationPage() {
  const [transportation, setTransportation] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  /* =======================================================
     LOAD TRANSPORTATION
  ======================================================= */

  const loadTransportation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.get("/api/dashboard/transportation");

      console.log("Transportation API response:", response);

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to load transportation.");
      }

      const list = getTransportationList(response);

      setTransportation(list);
    } catch (err) {
      console.error("Failed to load transportation:", err);

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to load transportation records. Please try again.",
      );

      setTransportation([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadTransportation();
  }, [loadTransportation]);

  /* =======================================================
     STATS
  ======================================================= */

  const activeCount = transportation.filter(
    (item) => item?.isActive !== false,
  ).length;

  const inactiveCount = transportation.filter(
    (item) => item?.isActive === false,
  ).length;

  const destinationCount = new Set(
    transportation
      .map(
        (item) =>
          item?.destination?._id || item?.destination?.id || item?.destination,
      )
      .filter(Boolean),
  ).size;

  /* =======================================================
     TOGGLE ACTIVE / INACTIVE
  ======================================================= */

  async function handleToggle(item) {
    if (!item?._id || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const nextStatus = item.isActive === false;

      /*
       * PATCH is intentionally used here.
       * Your transportation API uses PATCH for partial
       * status updates.
       */
      const response = await adminApi.patch(
        `/api/dashboard/transportation/${item._id}`,
        {
          isActive: nextStatus,
        },
      );

      console.log("Transportation status response:", response);

      if (response?.success === false) {
        throw new Error(
          response?.message || "Failed to update transportation status.",
        );
      }

      setConfirmAction(null);

      await loadTransportation();
    } catch (err) {
      console.error("Failed to update transportation status:", err);

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to update transportation status.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     PERMANENT DELETE
  ======================================================= */

  async function handleDelete(item) {
    if (!item?._id || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await adminApi.delete(
        `/api/dashboard/transportation/${item._id}`,
      );

      console.log("Transportation delete response:", response);

      if (response?.success === false) {
        throw new Error(
          response?.message || "Failed to permanently delete transportation.",
        );
      }

      setConfirmAction(null);

      await loadTransportation();
    } catch (err) {
      console.error("Failed to delete transportation:", err);

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to permanently delete transportation.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     OPEN CONFIRMATION
  ======================================================= */

  function openToggleConfirmation(item) {
    if (actionLoading) {
      return;
    }

    setConfirmAction({
      type: "toggle",
      item,
    });
  }

  function openDeleteConfirmation(item) {
    if (actionLoading) {
      return;
    }

    setConfirmAction({
      type: "delete",
      item,
    });
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-[calc(100vh-64px)] bg-emerald-50/30 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Route size={22} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Transportation
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage flights, trains, buses, taxis and rental services.
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard/transportation/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
          >
            <Plus size={18} />
            Add Transportation
          </Link>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Something went wrong</p>

              <p className="mt-0.5 text-xs leading-5">{error}</p>
            </div>

            <button
              type="button"
              onClick={loadTransportation}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Retry
            </button>
          </div>
        ) : null}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Transportation"
            value={transportation.length}
            description="All transportation services"
            icon={<Route size={18} />}
          />

          <StatCard
            title="Active Services"
            value={activeCount}
            description="Currently available services"
            icon={<Power size={18} />}
          />

          <StatCard
            title="Destinations Covered"
            value={destinationCount}
            description={`${inactiveCount} inactive service${
              inactiveCount === 1 ? "" : "s"
            }`}
            icon={<BusFront size={18} />}
          />
        </div>

        {/* =================================================
            TABLE CONTAINER
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Transportation Services
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {transportation.length} service
                {transportation.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadTransportation}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh transportation"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <RefreshCw
                    size={21}
                    className="animate-spin text-emerald-600"
                  />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading transportation...
                </p>
              </div>
            </div>
          ) : transportation.length === 0 ? (
            /* =================================================
                EMPTY
            ================================================= */

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Route size={25} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                No transportation found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Add your first transportation service to start managing travel
                options.
              </p>

              <Link
                href="/admin/dashboard/transportation/create"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus size={15} />
                Add Transportation
              </Link>
            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Service
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Destination
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Route
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Cost
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {transportation.map((item) => {
                      const TypeIcon = TYPE_ICONS[item?.type] || Route;

                      const isActive = item?.isActive !== false;

                      return (
                        <tr
                          key={item._id}
                          className="transition hover:bg-emerald-50/30"
                        >
                          {/* SERVICE */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-emerald-600">
                                {item?.coverImage?.url ? (
                                  <img
                                    src={item.coverImage.url}
                                    alt={item.providerName || "Transportation"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <TypeIcon size={18} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {item.providerName || "Unnamed Provider"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {item.estimatedDuration ||
                                    "Duration not specified"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                              <TypeIcon size={13} />
                              {formatType(item.type)}
                            </span>
                          </td>

                          {/* DESTINATION */}

                          <td className="px-4 py-4">
                            <p className="max-w-[150px] truncate text-sm font-medium text-slate-700">
                              {getDestinationName(item)}
                            </p>
                          </td>

                          {/* ROUTE */}

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="max-w-[100px] truncate">
                                {item.from || "—"}
                              </span>

                              <span className="text-emerald-500">→</span>

                              <span className="max-w-[100px] truncate">
                                {item.to || "—"}
                              </span>
                            </div>
                          </td>

                          {/* COST */}

                          <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                            {formatCost(item.estimatedCost, item.currency)}
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/dashboard/transportation/${item._id}?view=true`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                title="View"
                              >
                                <Eye size={15} />
                              </Link>

                              <Link
                                href={`/admin/dashboard/transportation/${item._id}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => openToggleConfirmation(item)}
                                disabled={actionLoading}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isActive
                                    ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={isActive ? "Deactivate" : "Activate"}
                              >
                                {isActive ? (
                                  <PowerOff size={15} />
                                ) : (
                                  <Power size={15} />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteConfirmation(item)}
                                disabled={actionLoading}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete permanently"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="divide-y divide-slate-100 md:hidden">
                {transportation.map((item) => {
                  const TypeIcon = TYPE_ICONS[item?.type] || Route;

                  const isActive = item?.isActive !== false;

                  return (
                    <div key={item._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-600">
                          {item?.coverImage?.url ? (
                            <img
                              src={item.coverImage.url}
                              alt={item.providerName || "Transportation"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <TypeIcon size={19} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {item.providerName || "Unnamed Provider"}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {getDestinationName(item)}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-50 p-2">
                              <p className="text-[10px] font-medium text-slate-400">
                                Type
                              </p>

                              <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-700">
                                <TypeIcon size={13} />
                                {formatType(item.type)}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-2">
                              <p className="text-[10px] font-medium text-slate-400">
                                Cost
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-700">
                                {formatCost(item.estimatedCost, item.currency)}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-2">
                              <p className="text-[10px] font-medium text-slate-400">
                                Duration
                              </p>

                              <p className="mt-0.5 truncate font-semibold text-slate-700">
                                {item.estimatedDuration || "—"}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-2">
                              <p className="text-[10px] font-medium text-slate-400">
                                Schedule
                              </p>

                              <p className="mt-0.5 truncate font-semibold text-slate-700">
                                {item.schedule || "—"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 rounded-lg bg-emerald-50/60 px-3 py-2 text-xs text-slate-600">
                            <span>{item.from || "—"}</span>

                            <span className="px-1 text-emerald-500">→</span>

                            <span>{item.to || "—"}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/dashboard/transportation/${item._id}?view=true`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                              title="View"
                            >
                              <Eye size={15} />
                            </Link>

                            <Link
                              href={`/admin/dashboard/transportation/${item._id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => openToggleConfirmation(item)}
                              disabled={actionLoading}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-50 ${
                                isActive
                                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={isActive ? "Deactivate" : "Activate"}
                            >
                              {isActive ? (
                                <PowerOff size={15} />
                              ) : (
                                <Power size={15} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteConfirmation(item)}
                              disabled={actionLoading}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete permanently"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      {confirmAction ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setConfirmAction(null);
            }
          }}
        >
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="p-5 sm:p-6">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  confirmAction.type === "delete"
                    ? "bg-red-50 text-red-600"
                    : confirmAction.item?.isActive !== false
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {confirmAction.type === "delete" ? (
                  <Trash2 size={21} />
                ) : confirmAction.item?.isActive !== false ? (
                  <PowerOff size={21} />
                ) : (
                  <Power size={21} />
                )}
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                {confirmAction.type === "delete"
                  ? "Delete transportation?"
                  : confirmAction.item?.isActive !== false
                    ? "Deactivate transportation?"
                    : "Activate transportation?"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {confirmAction.type === "delete"
                  ? `This will permanently delete "${
                      confirmAction.item?.providerName ||
                      "this transportation service"
                    }". This action cannot be undone.`
                  : confirmAction.item?.isActive !== false
                    ? `"${
                        confirmAction.item?.providerName ||
                        "This transportation service"
                      }" will be deactivated and hidden from active transportation listings.`
                    : `"${
                        confirmAction.item?.providerName ||
                        "This transportation service"
                      }" will become active again.`}
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  {confirmAction.item?.providerName || "Unnamed Provider"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatType(confirmAction.item?.type)}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {confirmAction.item?.from || "—"} →{" "}
                  {confirmAction.item?.to || "—"}
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmAction(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    if (confirmAction.type === "delete") {
                      handleDelete(confirmAction.item);
                    } else {
                      handleToggle(confirmAction.item);
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    confirmAction.type === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmAction.item?.isActive !== false
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Processing...
                    </>
                  ) : confirmAction.type === "delete" ? (
                    <>
                      <Trash2 size={15} />
                      Delete Permanently
                    </>
                  ) : confirmAction.item?.isActive !== false ? (
                    <>
                      <PowerOff size={15} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power size={15} />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setConfirmAction(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

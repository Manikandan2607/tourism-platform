"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Route,
  X,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import TransportationForm from "@/components/admin/TransportationForm";

/* =========================================================
   HELPERS
========================================================= */

function extractTransportation(response) {
  if (!response) {
    return null;
  }

  /*
   * Direct transportation object.
   */
  if (
    response?._id ||
    response?.providerName ||
    response?.type
  ) {
    return response;
  }

  /*
   * { transportation: {...} }
   */
  if (response?.transportation) {
    return response.transportation;
  }

  /*
   * { data: {...} }
   */
  if (
    response?.data &&
    !Array.isArray(response.data) &&
    typeof response.data === "object"
  ) {
    /*
     * { data: { transportation: {...} } }
     */
    if (response.data.transportation) {
      return response.data.transportation;
    }

    /*
     * { data: {...transportation fields} }
     */
    if (
      response.data._id ||
      response.data.providerName ||
      response.data.type
    ) {
      return response.data;
    }

    /*
     * { data: { data: {...} } }
     */
    if (response.data.data) {
      return extractTransportation(response.data.data);
    }
  }

  return null;
}

function extractDestinations(response) {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.destinations)) {
    return response.destinations;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.destinations)) {
    return response.data.destinations;
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

export default function TransportationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id;

  const isViewMode =
    searchParams.get("view") === "true";

  const [transportation, setTransportation] =
    useState(null);

  const [destinations, setDestinations] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        transportResponse,
        destinationResponse,
      ] = await Promise.all([
        adminApi.get(
          `/api/dashboard/transportation/${id}`,
        ),
        adminApi.get(
          "/api/dashboard/destinations",
        ),
      ]);

      console.log(
        "Transportation details response:",
        transportResponse,
      );

      console.log(
        "Destination response:",
        destinationResponse,
      );

      if (transportResponse?.success === false) {
        throw new Error(
          transportResponse?.message ||
            "Failed to load transportation.",
        );
      }

      if (destinationResponse?.success === false) {
        throw new Error(
          destinationResponse?.message ||
            "Failed to load destinations.",
        );
      }

      const transportationData =
        extractTransportation(
          transportResponse,
        );

      const destinationList =
        extractDestinations(
          destinationResponse,
        );

      if (!transportationData) {
        throw new Error(
          "Transportation record was not returned by the server.",
        );
      }

      setTransportation(
        transportationData,
      );

      setDestinations(
        destinationList,
      );
    } catch (err) {
      console.error(
        "Failed to load transportation:",
        err,
      );

      setTransportation(null);
      setDestinations([]);

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to load transportation details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     CLOSE
  ======================================================= */

  function closePopup() {
    router.push(
      "/admin/dashboard/transportation",
    );
  }

  /* =======================================================
     SWITCH TO EDIT
  ======================================================= */

  function switchToEdit() {
    if (!id) {
      return;
    }

    router.push(
      `/admin/dashboard/transportation/${id}`,
    );
  }

  /* =======================================================
     SAVE
  ======================================================= */

  function handleSaved() {
    closePopup();
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          closePopup();
        }
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Route size={19} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {isViewMode
                  ? "Transportation Details"
                  : transportation
                    ? `Edit ${
                        transportation.providerName ||
                        "Transportation"
                      }`
                    : "Edit Transportation"}
              </h1>

              <p className="hidden text-xs text-slate-400 sm:block">
                {isViewMode
                  ? "View transportation information"
                  : "Update transportation information"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isViewMode && transportation ? (
              <button
                type="button"
                onClick={switchToEdit}
                className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:inline-flex"
              >
                <Pencil size={14} />
                Edit
              </button>
            ) : null}

            <button
              type="button"
              onClick={closePopup}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              title="Close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50/20">
          {loading ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <LoaderCircle
                    size={25}
                    className="animate-spin text-emerald-600"
                  />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Loading transportation...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[500px] items-center justify-center px-5">
              <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                  <AlertCircle size={20} />
                </div>

                <h2 className="mt-4 text-sm font-bold text-red-800">
                  Unable to load transportation
                </h2>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  {error}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <RefreshCw size={14} />
                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={closePopup}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : !transportation ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Transportation not found.
                </p>

                <button
                  type="button"
                  onClick={closePopup}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <TransportationForm
              initialValues={transportation}
              transportationId={id}
              destinations={destinations}
              mode="edit"
              readOnly={isViewMode}
              onSuccess={handleSaved}
              onCancel={closePopup}
            />
          )}
        </div>
      </div>
    </div>
  );
}
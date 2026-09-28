"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
  Route,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import TransportationForm from "@/components/admin/TransportationForm";

/* =========================================================
   HELPERS
========================================================= */

function extractDestinations(response) {
  /*
   * Current API response:
   *
   * {
   *   success: true,
   *   count: 3,
   *   data: [...]
   * }
   */

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  /*
   * Also support:
   *
   * {
   *   success: true,
   *   data: {
   *     destinations: [...]
   *   }
   * }
   */

  if (Array.isArray(response?.data?.destinations)) {
    return response.data.destinations;
  }

  /*
   * Also support:
   *
   * {
   *   destinations: [...]
   * }
   */

  if (Array.isArray(response?.destinations)) {
    return response.destinations;
  }

  /*
   * Direct array.
   */

  if (Array.isArray(response)) {
    return response;
  }

  /*
   * Nested data response.
   */

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

/* =========================================================
   PAGE
========================================================= */

export default function CreateTransportationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDestinationId =
    searchParams.get("destinationId") || "";

  const [destinations, setDestinations] = useState([]);

  const [loadingDestinations, setLoadingDestinations] =
    useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD DESTINATIONS
  ======================================================= */

  const loadDestinations = useCallback(async () => {
    try {
      setLoadingDestinations(true);
      setError("");

      const response = await adminApi.get(
        "/api/dashboard/destinations",
      );

      console.log(
        "Destination API response:",
        response,
      );

      const destinationList =
        extractDestinations(response);

      console.log(
        "Destinations loaded for transportation:",
        destinationList,
      );

      setDestinations(destinationList);
    } catch (error) {
      console.error(
        "Failed to load destinations:",
        error,
      );

      setDestinations([]);

      setError(
        error?.data?.message ||
          error?.message ||
          "Unable to load destinations.",
      );
    } finally {
      setLoadingDestinations(false);
    }
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  /* =======================================================
     SAVE
  ======================================================= */

  function handleSaved() {
    router.push(
      "/admin/dashboard/transportation",
    );
  }

  /* =======================================================
     CANCEL
  ======================================================= */

  function handleCancel() {
    router.push(
      "/admin/dashboard/transportation",
    );
  }

  /* =======================================================
     CREATE DESTINATION
  ======================================================= */

  function handleCreateDestination() {
    router.push(
      "/admin/dashboard/destinations/create?returnTo=/admin/dashboard/transportation/create",
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-emerald-50/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-emerald-600"
          >
            ← Back to Transportation
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Route size={21} />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Create Transportation
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Add a transportation option for a destination.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadDestinations}
              disabled={loadingDestinations}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  loadingDestinations
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh Destinations
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load destinations
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* =================================================
            DESTINATION LOADING
        ================================================= */}

        {loadingDestinations ? (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <RefreshCw
                size={17}
                className="animate-spin text-emerald-600"
              />

              <p className="text-sm font-medium text-slate-600">
                Loading destinations...
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            FORM
        ================================================= */}

        <TransportationForm
          mode="create"
          destinations={destinations}
          initialDestinationId={initialDestinationId}
          onSuccess={handleSaved}
          onCancel={handleCancel}
          onCreateDestination={handleCreateDestination}
        />
      </div>
    </div>
  );
}
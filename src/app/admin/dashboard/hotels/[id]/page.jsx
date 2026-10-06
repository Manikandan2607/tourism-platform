"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import HotelForm from "@/components/admin/HotelForm";
import { adminApi } from "@/utils/adminApi";
import AdminButton from "@/components/admin/AdminButton";

export default function HotelDetailsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isViewMode = searchParams.get("view") === "true";

  const [hotel, setHotel] = useState(null);
  const [destinations, setDestinations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadingDestinations, setLoadingDestinations] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function loadHotel() {
      try {
        setLoading(true);
        setError("");

        const response = await adminApi.get(`/api/dashboard/hotels/${id}`);

        if (!mounted) return;

        if (!response?.success) {
          throw new Error(response?.message || "Failed to load hotel.");
        }

        const hotelData = response?.data?.data ?? response?.data ?? null;

        setHotel(hotelData);
      } catch (error) {
        console.error("Load hotel error:", error);

        if (mounted) {
          setError(
            error?.data?.message || error?.message || "Failed to load hotel.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (isViewMode || !id) return;

    let mounted = true;

    async function loadDestinations() {
      try {
        setLoadingDestinations(true);

        const response = await adminApi.get("/api/dashboard/destinations");

        if (!mounted) return;

        const data = response?.data?.data ?? response?.data ?? [];

        setDestinations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load destinations:", error);

        if (mounted) {
          setDestinations([]);
        }
      } finally {
        if (mounted) {
          setLoadingDestinations(false);
        }
      }
    }

    loadDestinations();

    return () => {
      mounted = false;
    };
  }, [id, isViewMode]);

  if (loading) {
    return (
      <div className="min-h-full bg-emerald-50/30">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600" />

              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading hotel...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-emerald-50/30">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <div className="mt-4">
              <AdminButton
                variant="secondary"
                onClick={() => router.push("/admin/dashboard/hotels")}
              >
                <ArrowLeft size={16} />
                Back to Hotels
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-full bg-emerald-50/30">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 size={22} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-800">
              Hotel not found
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              The hotel may have been deleted.
            </p>

            <div className="mt-5">
              <AdminButton
                variant="secondary"
                onClick={() => router.push("/admin/dashboard/hotels")}
              >
                <ArrowLeft size={16} />
                Back to Hotels
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-emerald-50/30">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {isViewMode ? "View Hotel" : "Edit Hotel"}
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">{hotel.name}</p>
            </div>
          </div>

          <AdminButton
            variant="secondary"
            onClick={() => router.push("/admin/dashboard/hotels")}
          >
            <ArrowLeft size={16} />
            Back to Hotels
          </AdminButton>
        </div>

        {/* FORM */}
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {isViewMode ? (
            <HotelForm
              initialData={hotel}
              initialValues={hotel}
              hotelId={id}
              mode="view"
              readOnly
            />
          ) : loadingDestinations ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading destinations...
                </p>
              </div>
            </div>
          ) : (
            <HotelForm
              initialData={hotel}
              initialValues={hotel}
              hotelId={id}
              destinations={destinations}
              mode="edit"
              onSuccess={() => {
                router.push("/admin/dashboard/hotels");
              }}
              onCancel={() => {
                router.push("/admin/dashboard/hotels");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
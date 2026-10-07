"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_IMAGE = "/images/tourism-placeholder.jpg";

/* =========================================================
   IMAGE HELPER
========================================================= */

function getImageUrl(image) {
  if (!image) {
    return FALLBACK_IMAGE;
  }

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    if (image.url) {
      return image.url;
    }

    if (image.secure_url) {
      return image.secure_url;
    }
  }

  return FALLBACK_IMAGE;
}

/* =========================================================
   DESTINATION DETAIL PAGE
========================================================= */

export default function DestinationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params?.slug;

  /*
    If the user came from:
      /destinations?...
    then the URL contains:
      ?from=destinations

    If the user came from Home, there is no "from"
    parameter, so Back will go to Home.
  */
  const cameFromDestinations = searchParams.get("from") === "destinations";

  const backHref = cameFromDestinations ? "/destinations" : "/";

  const backLabel = cameFromDestinations
    ? "Back to Destinations"
    : "Back to Home";

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD DESTINATION
  ======================================================= */

  useEffect(() => {
    if (!slug) {
      return;
    }

    async function loadDestination() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/destinations/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Destination not found.");
        }

        setDestination(result.data);
      } catch (error) {
        console.error("Destination detail error:", error);

        setError(error?.message || "Unable to load this destination.");
      } finally {
        setLoading(false);
      }
    }

    loadDestination();
  }, [slug]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f6]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <LoaderCircle size={30} className="animate-spin text-emerald-600" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading destination...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !destination) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f6] px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <MapPin size={28} className="text-red-500" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
            Destination Not Found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            {error || "This destination is currently unavailable."}
          </p>

          <Link
            href={backHref}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft size={17} />
            {backLabel}
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const location = destination.state || destination.country || "India";

  const heroImage = getImageUrl(
    destination.coverImage || destination.image || destination.imageUrl,
  );

  const gallery = Array.isArray(destination.gallery) ? destination.gallery : [];

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f8f6] text-slate-900">
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative h-[520px] overflow-hidden sm:h-[570px] lg:h-[610px]">
        {/* Hero Image */}

        <img
          src={heroImage}
          alt={destination.name || "Destination"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {/* Gradient Overlay */}

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />

        {/* =================================================
            TOP NAVIGATION
        ================================================= */}

        <div className="absolute left-0 right-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
            {/* ================= BACK BUTTON ================= */}

            <Link
              href={backHref}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />

              {backLabel}
            </Link>

            {/* ================= RIGHT BADGE ================= */}

            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-md sm:flex">
              <Sparkles size={14} className="text-emerald-300" />
              Explore with SST Travels
            </div>
          </div>
        </div>

        {/* =================================================
            HERO CONTENT
        ================================================= */}

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pb-12 lg:px-8 lg:pb-16">
            {/* Location */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
              <MapPin size={16} className="text-emerald-300" />

              {location}
            </div>

            {/* Title */}

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {destination.name}
            </h1>

            {/* Description Preview */}

            {destination.description && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                {destination.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* ================= MAIN CONTENT ================= */}

          <div>
            {/* ================= ABOUT CARD ================= */}

            <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              {/* Small Heading */}

              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <span className="h-px w-7 bg-emerald-500" />
                Discover
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                About {destination.name}
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600 sm:text-base">
                {destination.description ||
                  "Information about this destination will be available soon."}
              </p>

              {/* Destination Details */}

              {(destination.state || destination.country) && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {/* State */}

                  {destination.state && (
                    <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-emerald-100 hover:bg-emerald-50/40">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                          <MapPin size={19} className="text-emerald-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            State
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {destination.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Country */}

                  {destination.country && (
                    <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-emerald-100 hover:bg-emerald-50/40">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                          <Globe2 size={19} className="text-emerald-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Country
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {destination.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ================= GALLERY ================= */}

            {gallery.length > 0 && (
              <section className="mt-10">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <span className="h-px w-7 bg-emerald-500" />
                    Explore
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Destination Gallery
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Take a closer look at this beautiful destination.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((image, index) => (
                    <div
                      key={image.publicId || index}
                      className={`group relative overflow-hidden rounded-2xl bg-slate-200 ${
                        index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${destination.name} gallery ${index + 1}`}
                        className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                          index === 0 ? "h-72 sm:h-[360px]" : "h-64"
                        }`}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      {/* Image Overlay */}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ================= SIDEBAR ================= */}

          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <div className="overflow-hidden rounded-3xl bg-[#071510] p-7 text-white shadow-xl shadow-slate-900/10">
              {/* Icon */}

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
                <MapPin size={22} className="text-emerald-400" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Your Next Journey
              </p>

              <h2 className="mt-2 text-2xl font-bold leading-tight">
                Explore {destination.name}
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Interested in visiting this destination? Get in touch with our
                team and start planning your trip.
              </p>

              {/* Benefits */}

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-400"
                  />
                  Personalized travel assistance
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-400"
                  />
                  Comfortable travel options
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-400"
                  />
                  Easy trip planning
                </div>
              </div>

              {/* Inquiry Button */}

              <Link
                href={`/contact?destinationId=${encodeURIComponent(
                  destination._id,
                )}`}
                className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/30"
              >
                <Mail size={17} />
                Send Inquiry
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <p className="mt-4 text-center text-[11px] text-slate-500">
                Let&apos;s make your journey memorable.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

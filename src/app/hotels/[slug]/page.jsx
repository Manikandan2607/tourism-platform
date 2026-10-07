"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiGet } from "@/utils/api";

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_IMAGE = "/images/tourism-placeholder.jpg";

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return FALLBACK_IMAGE;

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.secureUrl ||
      image.path ||
      FALLBACK_IMAGE
    );
  }

  return FALLBACK_IMAGE;
}

function formatCategory(category) {
  if (!category) return "Hotel";

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatPrice(price) {
  if (!price) return "Price unavailable";

  const min = Number(price.min || 0);
  const max = Number(price.max || 0);

  if (min && max) {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString(
      "en-IN",
    )}`;
  }

  return `From ₹${(min || max).toLocaleString("en-IN")}`;
}

/* =========================================================
   HOTEL DETAILS PAGE
========================================================= */

export default function HotelDetailsPage() {
  const params = useParams();
  const slug = params?.slug;

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD HOTEL
  ======================================================= */

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function loadHotel() {
      try {
        setLoading(true);
        setError("");

        const response = await apiGet(`/api/public/hotels/${slug}`);

        if (!isMounted) return;

        setHotel(response?.data || null);
      } catch (err) {
        console.error("Load Hotel Details Error:", err);

        if (isMounted) {
          setError(err?.message || "Failed to load hotel details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f8f6]">
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <LoaderCircle
                size={29}
                className="animate-spin text-emerald-600"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading hotel details...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !hotel) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f8f6]">
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle size={30} className="text-red-500" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
              Hotel Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              {error || "The requested hotel is unavailable."}
            </p>

            <Link
              href="/hotels"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ArrowLeft size={17} />
              Back to Hotels
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =======================================================
     HOTEL DATA
  ======================================================= */

  const coverImage = getImageUrl(hotel.coverImage);

  const gallery = Array.isArray(hotel.gallery) ? hotel.gallery : [];

  const destinationName =
    hotel.destination?.name || "Travel Destination";

  const rating = Number(hotel.rating || 0).toFixed(1);

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f5f8f6] text-slate-900">
      <Navbar />

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative h-[500px] overflow-hidden sm:h-[570px] lg:h-[610px]">
        {/* Hero Image */}
        <Image
          src={coverImage}
          alt={hotel.name || "Hotel"}
          fill
          priority
          unoptimized
          className="object-cover"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {/* Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/85" />

        {/* Top Navigation */}
        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
            <Link
              href="/hotels"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Hotels
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-md sm:flex">
              <Sparkles size={14} className="text-emerald-300" />
              Stay with SST Travels
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pb-12 lg:px-8 lg:pb-16">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/20">
                {formatCategory(hotel.category)}
              </span>

              {hotel.isFeatured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900">
                  <Sparkles size={13} />
                  Featured Hotel
                </span>
              )}
            </div>

            {/* Hotel Name */}
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {hotel.name}
            </h1>

            {/* Meta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <MapPin size={17} className="text-emerald-300" />
                {destinationName}
              </span>

              <span className="flex items-center gap-2">
                <Star
                  size={17}
                  fill="currentColor"
                  className="text-amber-400"
                />
                {rating} / 5
              </span>

              {hotel.address && (
                <span className="hidden items-center gap-2 md:flex">
                  <MapPin size={16} className="text-emerald-300" />
                  {hotel.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="space-y-9">
            {/* ================= ABOUT ================= */}

            <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 lg:p-9">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <span className="h-px w-7 bg-emerald-500" />
                Discover
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                About This Hotel
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600 sm:text-base">
                {hotel.description ||
                  "Hotel information will be available soon."}
              </p>

              {hotel.address && (
                <div className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <MapPin size={17} className="text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {hotel.address}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ================= AMENITIES ================= */}

            {hotel.amenities?.length > 0 && (
              <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 lg:p-9">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <span className="h-px w-7 bg-emerald-500" />
                  Comfort
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Hotel Amenities
                </h2>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {hotel.amenities.map((amenity, index) => (
                    <div
                      key={`${amenity}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition hover:border-emerald-100 hover:bg-emerald-50/40"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-500"
                      />

                      <span className="text-sm font-medium text-slate-600">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================= GALLERY ================= */}

            {gallery.length > 0 && (
              <section>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <span className="h-px w-7 bg-emerald-500" />
                    Explore
                  </div>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Hotel Gallery
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Take a closer look at your potential stay.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {gallery.map((image, index) => (
                    <div
                      key={image._id || image.publicId || index}
                      className="group relative h-64 overflow-hidden rounded-2xl bg-slate-200 sm:h-72"
                    >
                      <Image
                        src={getImageUrl(image)}
                        alt={`${hotel.name} gallery image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover transition duration-700 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================= CONTACT ================= */}

            {(hotel.contactPhone || hotel.website) && (
              <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <span className="h-px w-7 bg-emerald-500" />
                  Contact
                </div>

                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  Contact Information
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {hotel.contactPhone && (
                    <a
                      href={`tel:${hotel.contactPhone}`}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <Phone size={18} className="text-emerald-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Phone</p>

                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 transition group-hover:text-emerald-600">
                          {hotel.contactPhone}
                        </p>
                      </div>
                    </a>
                  )}

                  {hotel.website && (
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <Globe2 size={18} className="text-emerald-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Website</p>

                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 transition group-hover:text-emerald-600">
                          {hotel.website}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* ================= BOTTOM BACK BUTTON ================= */}

            <div className="pt-1">
              <Link
                href="/hotels"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ArrowLeft
                  size={17}
                  className="transition-transform group-hover:-translate-x-1"
                />
                Back to Hotels
              </Link>
            </div>
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <aside className="h-fit lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl bg-[#071510] text-white shadow-xl shadow-slate-900/10">
              {/* Sidebar Header */}
              <div className="relative overflow-hidden p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <BedDouble size={22} className="text-emerald-400" />
                  </div>

                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Stay Details
                  </p>

                  <h2 className="mt-2 text-2xl font-bold leading-tight">
                    {hotel.name}
                  </h2>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-white/10 px-7 py-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Price per night
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {formatPrice(hotel.pricePerNight)}
                </p>
              </div>

              {/* Details */}
              <div className="border-t border-white/10 px-7 py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <BedDouble size={17} />
                      Category
                    </span>

                    <span className="text-sm font-semibold capitalize text-slate-200">
                      {formatCategory(hotel.category)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <Star size={17} />
                      Rating
                    </span>

                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-200">
                      <Star
                        size={14}
                        fill="currentColor"
                        className="text-amber-400"
                      />
                      {rating} / 5
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin size={17} />
                      Location
                    </span>

                    <span className="max-w-[150px] truncate text-right text-sm font-semibold text-slate-200">
                      {destinationName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inquiry */}
              <div className="border-t border-white/10 p-7">
                <Link
                  href={`/contact?destinationId=${
                    hotel.destination?._id || ""
                  }`}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/30"
                >
                  <Mail size={17} />
                  Send Inquiry
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">
                  Contact our team for more information about this stay.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
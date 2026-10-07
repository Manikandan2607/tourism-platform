"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BedDouble,
  MapPin,
  Search,
  Star,
  Wifi,
  Car,
  Utensils,
  LoaderCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  Building2,
  ShieldCheck,
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
    return image || FALLBACK_IMAGE;
  }

  return (
    image.url ||
    image.secure_url ||
    image.secureUrl ||
    image.path ||
    FALLBACK_IMAGE
  );
}

function formatCategory(category) {
  if (!category) return "Hotel";

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatPrice(pricePerNight) {
  if (!pricePerNight) return "Price unavailable";

  const min = Number(pricePerNight.min || 0);
  const max = Number(pricePerNight.max || 0);

  if (!min && !max) return "Price unavailable";

  if (min && max) {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString(
      "en-IN",
    )}`;
  }

  return `From ₹${(min || max).toLocaleString("en-IN")}`;
}

/* =========================================================
   AMENITY ICON
========================================================= */

function AmenityIcon({ amenity }) {
  const value = String(amenity || "").toLowerCase();

  if (value.includes("wifi") || value.includes("internet")) {
    return <Wifi size={13} />;
  }

  if (value.includes("parking") || value.includes("car")) {
    return <Car size={13} />;
  }

  if (
    value.includes("restaurant") ||
    value.includes("food") ||
    value.includes("dining")
  ) {
    return <Utensils size={13} />;
  }

  return <ShieldCheck size={13} />;
}

/* =========================================================
   HOTEL CARD
========================================================= */

function HotelCard({ hotel }) {
  const imageUrl = getImageUrl(hotel.coverImage);

  return (
    <Link
      href={`/hotels/${hotel.slug || hotel._id}`}
      className="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div className="relative h-64 overflow-hidden bg-slate-200">
        <Image
          src={imageUrl}
          alt={hotel.name || "Hotel"}
          fill
          unoptimized
          className="object-cover transition duration-700 group-hover:scale-110"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />

        {/* Category */}
        <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-lg backdrop-blur">
          {formatCategory(hotel.category)}
        </div>

        {/* Featured */}
        {hotel.isFeatured && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
            <Sparkles size={13} />
            Featured
          </div>
        )}

        {/* Bottom image content */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-white/80">
                <MapPin size={13} />

                <span className="truncate">
                  {hotel.destination?.name || "India"}
                </span>
              </div>

              <h2 className="line-clamp-1 text-xl font-bold text-white">
                {hotel.name || "Hotel"}
              </h2>
            </div>

            {/* Rating */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 shadow-lg">
              <Star
                size={14}
                fill="currentColor"
                className="text-amber-500"
              />

              {Number(hotel.rating || 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="p-5">
        <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">
          {hotel.description ||
            "Discover a comfortable and memorable stay at this hotel."}
        </p>

        {/* Amenities */}
        {hotel.amenities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={`${amenity}-${index}`}
                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
              >
                <AmenityIcon amenity={amenity} />

                <span>{amenity}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bottom */}
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Price per night
            </p>

            <p className="mt-1 text-base font-extrabold text-emerald-700">
              {formatPrice(hotel.pricePerNight)}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   HOTELS PAGE
========================================================= */

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [destination, setDestination] = useState("all");

  /* =======================================================
     LOAD HOTELS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadHotels() {
      try {
        setLoading(true);
        setError("");

        const response = await apiGet("/api/public/hotels");

        if (!isMounted) return;

        setHotels(response?.data || []);
      } catch (err) {
        console.error("Load Hotels Error:", err);

        if (isMounted) {
          setError(err.message || "Failed to load hotels.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHotels();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    return [
      "all",
      ...new Set(
        hotels.map((hotel) => hotel.category).filter(Boolean),
      ),
    ];
  }, [hotels]);

  /* =======================================================
     DESTINATIONS
  ======================================================= */

  const destinations = useMemo(() => {
    return [
      "all",
      ...new Set(
        hotels
          .map((hotel) => hotel.destination?.name)
          .filter(Boolean),
      ),
    ];
  }, [hotels]);

  /* =======================================================
     FILTER HOTELS
  ======================================================= */

  const filteredHotels = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const searchableText = [
        hotel.name,
        hotel.description,
        hotel.category,
        hotel.address,
        hotel.destination?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchText);

      const matchesCategory =
        category === "all" || hotel.category === category;

      const matchesDestination =
        destination === "all" ||
        hotel.destination?.name === destination;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDestination
      );
    });
  }, [hotels, search, category, destination]);

  return (
    <div className="min-h-screen bg-[#f5f8f6] text-slate-900">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#073b32]">
        {/* Decorative background */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="max-w-3xl">
            {/* Small label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur">
              <BedDouble size={16} />
              Comfortable stays with SST Travels
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your Perfect
              <span className="block text-emerald-300">
                Stay in India
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
              Discover comfortable hotels, resorts, hostels, and
              homestays in beautiful destinations across India.
            </p>

            {/* Hero mini stats */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur">
                <Building2
                  size={16}
                  className="text-emerald-300"
                />
                Comfortable stays
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur">
                <Star
                  size={16}
                  className="fill-current text-amber-300"
                />
                Guest rated
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur">
                <ShieldCheck
                  size={16}
                  className="text-emerald-300"
                />
                Trusted travel
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#f5f8f6] [clip-path:ellipse(60%_100%_at_50%_100%)]" />
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        {/* ================= BACK TO HOME ================= */}

        <div className="mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Home
          </Link>
        </div>

        {/* ===================================================
            FILTER BOX
        =================================================== */}

        <section className="-mt-2 mb-12 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_45px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Find your stay
              </h2>

              <p className="text-xs text-slate-500">
                Search and filter hotels for your journey
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* Search */}
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search hotels, locations..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all"
                    ? "All Categories"
                    : formatCategory(item)}
                </option>
              ))}
            </select>

            {/* Destination */}
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            >
              {destinations.map((item) => (
                <option key={item} value={item}>
                  {item === "all"
                    ? "All Destinations"
                    : item}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              SST Travels Stays
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Explore Comfortable Stays
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Discover handpicked places to stay for your next journey.
            </p>
          </div>

          {!loading && !error && (
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
              {filteredHotels.length} hotel
              {filteredHotels.length !== 1 ? "s" : ""} available
            </div>
          )}
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <LoaderCircle
                size={28}
                className="animate-spin text-emerald-600"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-600">
              Finding comfortable stays...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait a moment
            </p>
          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle
                size={28}
                className="text-red-500"
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load hotels
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>
          </div>
        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          !error &&
          filteredHotels.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <BedDouble
                  size={32}
                  className="text-emerald-600"
                />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No hotels found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn't find any stays matching your current
                search or filters. Try changing your search options.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setDestination("all");
                }}
                className="mt-6 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* ===================================================
            HOTEL GRID
        =================================================== */}

        {!loading &&
          !error &&
          filteredHotels.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel._id}
                  hotel={hotel}
                />
              ))}
            </div>
          )}

        {/* ===================================================
            BOTTOM INFO
        =================================================== */}

        {!loading &&
          !error &&
          filteredHotels.length > 0 && (
            <section className="mt-16 overflow-hidden rounded-[30px] bg-[#073b32]">
              <div className="relative px-6 py-10 sm:px-10 sm:py-12">
                <div className="absolute -right-20 -top-32 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <Sparkles size={16} />
                      Travel with confidence
                    </div>

                    <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
                      Your comfort matters on every journey.
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-emerald-50/70">
                      Choose a stay that fits your journey and enjoy a
                      comfortable travel experience with SST Travels.
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#073b32] transition hover:bg-emerald-50"
                  >
                    Plan Your Trip

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            </section>
          )}

        {/* ================= BOTTOM BACK TO HOME ================= */}

        <div className="mt-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
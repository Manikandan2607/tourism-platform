"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe2,
  MapPin,
  Hotel,
  Utensils,
  Car,
  BriefcaseBusiness,
  Map,
  Mail,
  ArrowRight,
  Loader2,
  RefreshCw,
  CalendarDays,
  Clock3,
  Activity,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";

/* =========================================================
   MANAGEMENT ITEMS
========================================================= */

const managementItems = [
  {
    key: "destinations",
    title: "Destinations",
    description: "Total destinations",
    href: "/admin/dashboard/destinations",
    icon: Globe2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-emerald-200",
    hoverBorder: "hover:border-emerald-300",
    arrow: "text-emerald-600",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "places",
    title: "Places",
    description: "Total attractions",
    href: "/admin/dashboard/places",
    icon: MapPin,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    border: "border-sky-200",
    hoverBorder: "hover:border-sky-300",
    arrow: "text-sky-600",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "hotels",
    title: "Hotels",
    description: "Hotels and stays",
    href: "/admin/dashboard/hotels",
    icon: Hotel,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-300",
    arrow: "text-violet-600",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "restaurants",
    title: "Restaurants",
    description: "Restaurant listings",
    href: "/admin/dashboard/restaurants",
    icon: Utensils,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    border: "border-orange-200",
    hoverBorder: "hover:border-orange-300",
    arrow: "text-orange-600",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "transportation",
    title: "Transportation",
    description: "Travel and transport",
    href: "/admin/dashboard/transportation",
    icon: Car,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    border: "border-cyan-200",
    hoverBorder: "hover:border-cyan-300",
    arrow: "text-cyan-600",
    image:
      "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "packages",
    title: "Packages",
    description: "Tourism packages",
    href: "/admin/dashboard/packages",
    icon: BriefcaseBusiness,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    border: "border-rose-200",
    hoverBorder: "hover:border-rose-300",
    arrow: "text-rose-600",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "itineraries",
    title: "Itineraries",
    description: "Travel itineraries",
    href: "/admin/dashboard/itineraries",
    icon: Map,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    border: "border-indigo-200",
    hoverBorder: "hover:border-indigo-300",
    arrow: "text-indigo-600",
    image:
      "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=300&q=80",
  },
  {
    key: "inquiries",
    title: "New Inquiries",
    description: "Visitor inquiries",
    href: "/admin/dashboard/inquiries",
    icon: Mail,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    border: "border-sky-200",
    hoverBorder: "hover:border-sky-300",
    arrow: "text-sky-600",
    image:
      "https://images.unsplash.com/photo-1521292270410-a8c4d716d518?auto=format&fit=crop&w=300&q=80",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;

  return [];
}

function getCount(response) {
  if (!response) return 0;

  if (Array.isArray(response)) return response.length;
  if (Array.isArray(response.items)) return response.items.length;
  if (Array.isArray(response.data)) return response.data.length;

  if (Array.isArray(response.data?.items)) {
    return response.data.items.length;
  }

  if (typeof response.count === "number") return response.count;
  if (typeof response.total === "number") return response.total;

  return 0;
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ item, value }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.border} ${item.hoverBorder}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/30 blur-2xl transition-transform duration-300 group-hover:scale-150" />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ArrowRight
          className={`h-4 w-4 shrink-0 ${item.arrow} transition-transform duration-300 group-hover:translate-x-1`}
        />
      </div>

      <div className="relative mt-4 min-w-0 pr-12">
        <p className="truncate text-xs font-medium text-slate-500">
          {item.title}
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          {item.description}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 overflow-hidden rounded-xl border border-white/70 shadow-sm">
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="h-12 w-14 object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
    </Link>
  );
}

/* =========================================================
   ACTIVITY ITEM
========================================================= */

function ActivityItem({ icon: Icon, title, text, time }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-slate-50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{text}</p>
      </div>

      <span className="shrink-0 text-[10px] text-slate-400">{time}</span>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({ href, title, description, icon: Icon }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-100">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-600" />
    </Link>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tag,
  iconClass,
  tagClass,
  loading,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className={`text-xs font-medium ${tagClass}`}>{tag}</span>
      </div>

      <p className="mt-4 text-xs text-slate-400">{label}</p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

/* =========================================================
   DASHBOARD PAGE
========================================================= */

export default function DashboardPage() {
  const [stats, setStats] = useState({
    destinations: 0,
    places: 0,
    hotels: 0,
    restaurants: 0,
    transportation: 0,
    packages: 0,
    itineraries: 0,
    inquiries: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  /* DATE AND TIME */

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setCurrentDate(
        now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      );

      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    updateDateTime();

    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  /* LOAD DASHBOARD DATA */

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      "destinations",
      "places",
      "hotels",
      "restaurants",
      "transportation",
      "packages",
      "itineraries",
      "inquiries",
    ];

    try {
      const results = await Promise.allSettled(
        endpoints.map((endpoint) =>
          adminApi.get(`/api/dashboard/${endpoint}`),
        ),
      );

      const responseByKey = Object.fromEntries(
        endpoints.map((key, index) => [
          key,
          results[index].status === "fulfilled"
            ? results[index].value
            : null,
        ]),
      );

      const newInquiryItems = getItems(responseByKey.inquiries);

      let newInquiryCount = newInquiryItems.filter(
        (item) => String(item?.status || "").toLowerCase() === "new",
      ).length;

      if (
        newInquiryCount === 0 &&
        newInquiryItems.length > 0 &&
        newInquiryItems.every((item) => !item?.status)
      ) {
        newInquiryCount = newInquiryItems.length;
      }

      setStats({
        destinations: getCount(responseByKey.destinations),
        places: getCount(responseByKey.places),
        hotels: getCount(responseByKey.hotels),
        restaurants: getCount(responseByKey.restaurants),
        transportation: getCount(responseByKey.transportation),
        packages: getCount(responseByKey.packages),
        itineraries: getCount(responseByKey.itineraries),
        inquiries: newInquiryCount,
      });

      const failedEndpoints = results.some(
        (result) => result.status === "rejected",
      );

      if (failedEndpoints) {
        setError(
          "Some dashboard information could not be loaded. Please try refreshing.",
        );
      }
    } catch (err) {
      console.error("Dashboard loading failed:", err);
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalContent =
    stats.destinations +
    stats.places +
    stats.hotels +
    stats.restaurants +
    stats.transportation +
    stats.packages +
    stats.itineraries;

  return (
    <main className="m-0 min-h-[calc(100vh-64px)] w-full overflow-x-hidden bg-[#f5f8f6] p-0">
      <div className="mx-auto w-full px-3 pb-8 pt-4 sm:px-5 sm:pt-5 xl:px-6">
        {/* PAGE HEADER */}

        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Globe2 className="h-5 w-5" />
            </div> */}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Dashboard
                </h1>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                  Live
                </span>
              </div>

              <p className="text-xs text-slate-500 sm:text-sm">
                Manage your tourism platform from one place.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {error}
          </div>
        )}

        {/* WELCOME BANNER — ORIGINAL DESIGN */}

        <section className="relative mb-5 w-full overflow-hidden rounded-2xl bg-emerald-950 shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=90"
            alt="Beautiful travel landscape"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/75 to-slate-900/30" />

          <div className="relative flex min-h-[175px] w-full items-center px-5 py-6 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-lg sm:h-14 sm:w-14">
                  <img
                    src="/images/sst-travels-logo.png"
                    alt="SST Travels"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                    Tourism Management
                  </p>
                  <p className="text-lg font-bold text-white">SST Travels</p>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Welcome Back
                </p>

                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-medium text-white/80">
                  Tourism Management
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Travel More Worry Less{" "}
                <span className="inline-block">👋</span>
              </h2>

              <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">
                Manage destinations, hotels, packages and travel experiences
                from one beautiful platform.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {currentDate || "—"}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90">
                  <Clock3 className="h-3.5 w-3.5" />
                  {currentTime || "—"}
                </div>
              </div>
            </div>

            <div className="ml-auto hidden shrink-0 text-right lg:block">
              <p className="font-serif text-3xl font-bold italic leading-[1.1] text-white/95 xl:text-4xl">
                Explore
                <br />
                More
                <br />
                Worry Less
              </p>

              <div className="ml-auto mt-3 h-px w-16 bg-white/50" />

              <p className="mt-2 text-[8px] font-medium uppercase tracking-[0.3em] text-white/50">
                Your journey starts here
              </p>
            </div>
          </div>
        </section>

        {/* 1. TOURISM MANAGEMENT CARDS */}

        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Tourism Management
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              View and manage your platform content.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {managementItems.map((item) => (
              <StatCard
                key={item.key}
                item={item}
                value={loading ? "—" : stats[item.key] ?? 0}
              />
            ))}
          </div>
        </section>

        {/* 2. RECENT ACTIVITY + VISITOR INSIGHTS */}

        <section className="mb-5 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          {/* RECENT ACTIVITY */}

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Activity
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Current platform overview
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <ActivityItem
                icon={Globe2}
                title="Destinations"
                text={`${stats.destinations} destinations available`}
                time="Current"
              />

              <ActivityItem
                icon={MapPin}
                title="Places"
                text={`${stats.places} attractions listed`}
                time="Current"
              />

              <ActivityItem
                icon={Hotel}
                title="Hotels"
                text={`${stats.hotels} hotels available`}
                time="Current"
              />

              <ActivityItem
                icon={Mail}
                title="Inquiries"
                text={`${stats.inquiries} new visitor inquiries`}
                time="Current"
              />
            </div>
          </div>

          {/* VISITOR INSIGHTS */}

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Visitor Insights
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Tourism content overview
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  label: "Destinations",
                  value: stats.destinations,
                  color: "bg-emerald-500",
                },
                {
                  label: "Places",
                  value: stats.places,
                  color: "bg-sky-500",
                },
                {
                  label: "Packages",
                  value: stats.packages,
                  color: "bg-violet-500",
                },
                {
                  label: "New Inquiries",
                  value: stats.inquiries,
                  color: "bg-orange-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {loading ? "—" : item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{
                        width: `${Math.min(item.value * 20, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-4 text-slate-400">
              Bars show a relative display of your current content counts,
              not measured website traffic.
            </p>
          </div>
        </section>

        {/* 3. QUICK ACTIONS — BELOW THE TWO SECTIONS */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Quick Actions
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Quickly manage tourism content
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <QuickAction
              href="/admin/dashboard/destinations"
              title="Manage Destinations"
              description="View and add destinations"
              icon={Globe2}
            />

            <QuickAction
              href="/admin/dashboard/places"
              title="Manage Places"
              description="Update visitor attractions"
              icon={MapPin}
            />

            <QuickAction
              href="/admin/dashboard/hotels"
              title="Manage Hotels"
              description="Manage hotel listings"
              icon={Hotel}
            />

            <QuickAction
              href="/admin/dashboard/packages"
              title="Manage Packages"
              description="View tourism packages"
              icon={BriefcaseBusiness}
            />

            <QuickAction
              href="/admin/dashboard/inquiries"
              title="View Inquiries"
              description="Check visitor messages"
              icon={Mail}
            />
          </div>
        </section>

        {/* 4. PLATFORM SUMMARY */}

        <section className="mt-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Platform Summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              A quick summary of your tourism content.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Users}
              label="Tourism Content"
              value={totalContent}
              tag="Content"
              iconClass="bg-emerald-50 text-emerald-600"
              tagClass="text-emerald-600"
              loading={loading}
            />

            <SummaryCard
              icon={Eye}
              label="Listed Places"
              value={stats.places + stats.destinations}
              tag="Listings"
              iconClass="bg-sky-50 text-sky-600"
              tagClass="text-sky-600"
              loading={loading}
            />

            <SummaryCard
              icon={Map}
              label="Travel Options"
              value={stats.transportation + stats.itineraries}
              tag="Travel"
              iconClass="bg-violet-50 text-violet-600"
              tagClass="text-violet-600"
              loading={loading}
            />

            <SummaryCard
              icon={Mail}
              label="New Inquiries"
              value={stats.inquiries}
              tag="Attention"
              iconClass="bg-orange-50 text-orange-600"
              tagClass="text-orange-600"
              loading={loading}
            />
          </div>
        </section>

        {/* BOTTOM BANNER — ORIGINAL DESIGN */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Tourism Management
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Build memorable travel experiences for every visitor.
              </p>
            </div>

            <Link
              href="/admin/dashboard/destinations"
              className="group inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg sm:self-auto"
            >
              Manage Destinations
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>

      {loading && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Updating dashboard...
        </div>
      )}
    </main>
  );
}
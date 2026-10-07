"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Compass,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Video,
} from "lucide-react";

/* =========================================================
   CONTACT DETAILS
   ========================================================= */

const CONTACT_EMAIL = "manikandan.m20060726@gmail.com";
const CONTACT_PHONE = "+91 7708985232";

/* =========================================================
   GMAIL URL
   ========================================================= */

const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  CONTACT_EMAIL,
)}`;

/* =========================================================
   PHONE URL
   ========================================================= */

const PHONE_URL = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

/* =========================================================
   QUICK LINKS
   ========================================================= */

const quickLinks = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Destinations",
    href: "/destinations",
  },
  {
    name: "Packages",
    href: "/packages",
  },
  {
    name: "Reviews",
    href: "/reviews",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

/* =========================================================
   EXPLORE ITEMS
   ========================================================= */

const exploreItems = [
  {
    icon: MapPin,
    title: "Beautiful Destinations",
    description: "Discover places worth visiting",
  },
  {
    icon: Camera,
    title: "Travel Galleries",
    description: "Capture unforgettable moments",
  },
  {
    icon: Video,
    title: "Memorable Experiences",
    description: "Make every journey special",
  },
];

/* =========================================================
   FOOTER
   ========================================================= */

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#071510] text-white">
      {/* ===================================================
          DECORATIVE BACKGROUND
          =================================================== */}

      <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      {/* ===================================================
          MAIN FOOTER
          =================================================== */}

      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-11">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1.1fr_1.1fr]">
          {/* =================================================
              BRAND
              ================================================= */}

          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              {/* Logo */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-900/25 transition duration-300 group-hover:scale-105">
                <Compass size={21} strokeWidth={2} className="text-white" />
              </div>

              {/* Brand */}
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  SST Travels
                </h2>

                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-400">
                  Travel • Explore • Experience
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-xs text-xs leading-6 text-slate-400">
              Discover beautiful destinations, comfortable journeys, and
              unforgettable travel experiences with SST Travels.
            </p>

            {/* Trust Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />

              <span className="text-[11px] font-medium text-slate-300">
                Travel with comfort & confidence
              </span>
            </div>
          </div>

          {/* =================================================
              QUICK LINKS
              ================================================= */}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Quick Links
            </h3>

            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center text-xs text-slate-400 transition duration-200 hover:text-emerald-400"
                  >
                    <span>{link.name}</span>

                    <ArrowUpRight
                      size={12}
                      className="ml-1 opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* =================================================
              EXPLORE
              ================================================= */}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Explore
            </h3>

            <div className="mt-4 space-y-3">
              {exploreItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group flex items-start gap-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 transition duration-300 group-hover:bg-emerald-500/20">
                      <Icon size={15} className="text-emerald-400" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-200">
                        {item.title}
                      </p>

                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =================================================
              CONTACT
              ================================================= */}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Contact Us
            </h3>

            <div className="mt-4 space-y-3">
              {/* =================================================
                  LOCATION
                  ================================================= */}

              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <MapPin size={15} className="text-emerald-400" />
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Location</p>

                  <p className="mt-0.5 text-xs text-slate-300">India</p>
                </div>
              </div>

              {/* =================================================
                  PHONE
                  ================================================= */}

              <a
                href={PHONE_URL}
                className="group flex items-start gap-2.5"
                aria-label={`Call SST Travels at ${CONTACT_PHONE}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 transition group-hover:bg-emerald-500/20">
                  <Phone size={15} className="text-emerald-400" />
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Phone</p>

                  <p className="mt-0.5 text-xs text-slate-300 transition group-hover:text-emerald-400">
                    {CONTACT_PHONE}
                  </p>
                </div>
              </a>

              {/* =================================================
                  EMAIL → GMAIL
                  ================================================= */}

              <a
                href={GMAIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5"
                aria-label={`Email SST Travels at ${CONTACT_EMAIL}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 transition group-hover:bg-emerald-500/20">
                  <Mail size={15} className="text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500">Email</p>

                  <p className="mt-0.5 truncate text-xs text-slate-300 transition group-hover:text-emerald-400">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          BOTTOM BAR
          =================================================== */}

      <div className="relative border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-slate-400">SST Travels</span>. All
            rights reserved.
          </p>

          <div className="flex items-center gap-1.5">
            <Globe2 size={13} className="text-emerald-500" />

            <span>Explore more. Travel better.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

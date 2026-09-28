"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Search,
  Plane,
  Map,
  Package,
  Hotel,
  Utensils,
  Info,
  Phone,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Destinations", href: "/destinations" },
  { name: "Packages", href: "/packages" },
  { name: "Hotels", href: "/hotels" },
  // { name: "Food & Travel", href: "/restaurants" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const icons = {
  Home: Plane,
  Destinations: Map,
  Packages: Package,
  Hotels: Hotel,
  // "Food & Travel": Utensils,
  About: Info,
  Contact: Phone,
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-50">
      {/* Transparent premium navbar */}
      <div className="border-b border-white/10 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[82px] max-w-[1380px] items-center justify-between px-6 lg:px-10">

          {/* =====================================================
              LOGO
          ====================================================== */}

          <Link
            href="/"
            onClick={closeMenu}
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#007A5E] text-white shadow-lg shadow-emerald-900/20">
              <div className="absolute inset-1 rounded-full border border-white/30" />

              <Plane
                size={24}
                strokeWidth={2.4}
                className="relative rotate-[-12deg]"
              />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="text-[21px] font-extrabold tracking-tight text-[#064E3B]">
                  SST
                </span>

                <span className="text-[21px] font-extrabold tracking-tight text-[#064E3B]">
                  Travels
                </span>
              </div>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#367568]">
                Explore • Discover • Experience
              </p>
            </div>
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative py-2 text-[14px] font-semibold transition ${
                  link.name === "Home"
                    ? "text-[#007A5E]"
                    : "text-[#164E42] hover:text-[#007A5E]"
                }`}
              >
                {link.name}

                {link.name === "Home" && (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-[#007A5E]" />
                )}

                {link.name !== "Home" && (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-0 -translate-x-1/2 rounded-full bg-[#007A5E] transition-all duration-300 group-hover:w-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* =====================================================
              RIGHT ACTIONS
          ====================================================== */}

          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#064E3B] transition hover:bg-emerald-50"
            >
              <Search size={21} />
            </button>

            <Link
              href="/contact"
              className="group flex items-center gap-2 rounded-full bg-[#006B52] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-[#005842]"
            >
              <Plane
                size={16}
                className="transition group-hover:translate-x-0.5"
              />

              Plan Your Trip
            </Link>
          </div>

          {/* =====================================================
              MOBILE BUTTON
          ====================================================== */}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-white/80 text-[#006B52] md:hidden"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      {menuOpen && (
        <div className="border-b border-emerald-100 bg-white px-5 py-5 shadow-2xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = icons[link.name] || Plane;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-[#007A5E]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#007A5E]">
                    <Icon size={17} />
                  </span>

                  {link.name}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/contact"
            onClick={closeMenu}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#007A5E] px-5 py-3.5 text-sm font-bold text-white"
          >
            <Plane size={17} />
            Plan Your Trip
          </Link>
        </div>
      )}
    </header>
  );
}
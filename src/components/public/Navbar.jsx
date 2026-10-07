"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plane, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/destinations" },
  { label: "Packages", href: "/packages" },
  { label: "Hotels", href: "/hotels" },
  { label: "About", href: "/#why-sst-travels" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function toggleMobileMenu() {
    setMobileOpen((value) => !value);
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .sst-navbar-shell {
              padding-left: clamp(1rem, 3.2vw, 2.75rem);
              padding-right: clamp(1rem, 3.2vw, 2.75rem);
              padding-top: clamp(.7rem, 1.5vw, 1.25rem);
            }

            .sst-navbar {
              min-height: clamp(3.8rem, 5.2vw, 4.9rem);
            }

            .sst-navbar-logo {
              width: clamp(7.2rem, 11vw, 9.8rem);
            }

            .sst-navbar-links {
              gap: clamp(1rem, 2vw, 2rem);
            }

            .sst-navbar-link {
              font-size: clamp(.68rem, .78vw, .82rem);
            }

            .sst-navbar-cta {
              padding: clamp(.65rem, .9vw, .8rem) clamp(1rem, 1.7vw, 1.4rem);
              font-size: clamp(.68rem, .78vw, .82rem);
            }

            @media (max-width: 1023px) {
              .sst-navbar-shell {
                padding-top: .8rem;
              }
            }

            @media (max-width: 639px) {
              .sst-navbar-shell {
                padding-left: .75rem;
                padding-right: .75rem;
              }

              .sst-navbar-logo {
                width: 7.4rem;
              }
            }
          `,
        }}
      />

      <header className="absolute left-0 right-0 top-0 z-[100] w-full">
        <div className="sst-navbar-shell mx-auto w-full max-w-[1450px]">
          <nav className="sst-navbar flex items-start justify-between gap-3">
            <Link
              href="/"
              onClick={closeMobileMenu}
              aria-label="SST Travels Home"
              className="relative z-[110] flex shrink-0 items-start"
            >
              <img
                src="/images/sst-travels-logo.png"
                alt="SST Travels"
                draggable="false"
                className="sst-navbar-logo block h-auto object-contain object-left-top"
              />
            </Link>

            <div className="hidden flex-1 items-center justify-center lg:flex">
              <div className="sst-navbar-links flex items-center">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="sst-navbar-link group relative whitespace-nowrap py-2 font-semibold text-[#124f45] transition-colors duration-300 hover:text-[#07805f]"
                  >
                    {link.label}
                    {link.label === "Home" ? (
                      <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-[#07805f]" />
                    ) : (
                      <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full bg-[#07805f] transition-all duration-300 group-hover:w-full" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden shrink-0 items-center lg:flex">
              <Link
                href="/contact"
                className="sst-navbar-cta inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#075847] font-bold text-white shadow-[0_10px_25px_rgba(0,60,45,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#064c3e]"
              >
                <Plane size={15} strokeWidth={2.2} />
                <span>Plan Your Trip</span>
              </Link>
            </div>

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={toggleMobileMenu}
              className="relative z-[120] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-[#075847] shadow-[0_5px_20px_rgba(0,60,45,0.12)] backdrop-blur-md transition-all duration-300 hover:bg-white sm:h-11 sm:w-11 lg:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>

          {mobileOpen && (
            <div className="relative z-[110] mt-2 w-full overflow-hidden rounded-[22px] border border-white/70 bg-white/95 p-2.5 shadow-[0_20px_50px_rgba(0,60,45,0.15)] backdrop-blur-xl lg:hidden">
              <div className="flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#075847] transition-colors duration-300 hover:bg-[#eaf8f3]"
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="mt-1.5 flex items-center justify-center gap-2 rounded-xl bg-[#075847] px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-[#064c3e]"
                >
                  <Plane size={17} strokeWidth={2.2} />
                  <span>Plan Your Trip</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

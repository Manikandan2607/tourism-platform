"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Utensils,
  Car,
  BriefcaseBusiness,
  Map,
  MessageSquare,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";

/* =========================================================
   MENU ITEMS
========================================================= */

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Destinations",
    href: "/admin/dashboard/destinations",
    icon: MapPin,
  },
  {
    label: "Places",
    href: "/admin/dashboard/places",
    icon: MapPin,
  },
  {
    label: "Hotels",
    href: "/admin/dashboard/hotels",
    icon: Building2,
  },
  {
    label: "Restaurants",
    href: "/admin/dashboard/restaurants",
    icon: Utensils,
  },
  {
    label: "Transportation",
    href: "/admin/dashboard/transportation",
    icon: Car,
  },
  {
    label: "Packages",
    href: "/admin/dashboard/packages",
    icon: BriefcaseBusiness,
  },
  {
    label: "Itineraries",
    href: "/admin/dashboard/itineraries",
    icon: Map,
  },
  {
    label: "Inquiries",
    href: "/admin/dashboard/inquiries",
    icon: MessageSquare,
  },
];

/* =========================================================
   SIDEBAR
========================================================= */

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const pathname = usePathname();
  const router = useRouter();

  /* =======================================================
     LOGOUT
  ======================================================= */

  function handleLogout() {
    try {
      /*
       * Remove all possible client-side admin token keys.
       * authToken is the main token used by this project.
       */
      const tokenKeys = [
        "authToken",
        "adminToken",
        "token",
        "accessToken",
        "jwt",
      ];

      tokenKeys.forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });

      /*
       * Remove common cookie-based token names too.
       * This only works for cookies that are not HttpOnly.
       */
      const cookieNames = [
        "token",
        "adminToken",
        "accessToken",
        "jwt",
        "authToken",
      ];

      cookieNames.forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
    } catch (error) {
      console.error("Logout cleanup failed:", error);
    }

    /*
     * Close mobile sidebar.
     */
    setSidebarOpen?.(false);

    /*
     * Send admin back to login.
     */
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className={`
        fixed
        inset-y-0
        left-0
        z-50
        flex
        ~
        flex-col
        overflow-hidden
        bg-[#063f32]
        text-white
        shadow-xl
        transition-transform
        duration-300
        ease-in-out
        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
    >
      {/* =================================================
          LOGO HEADER
      ================================================== */}

      <div
        className="
          flex
          h-[110px]
          shrink-0
          items-center
          justify-center
          border-b
          border-white/10
          px-4
        "
      >
        <Link
          href="/admin/dashboard"
          aria-label="SST Travels Dashboard"
          onClick={() => setSidebarOpen?.(false)}
          className="
            relative
            flex
            h-[92px]
            w-[150px]
            items-center
            justify-center
            overflow-hidden
            rounded-xl
          "
        >
          {/* Original logo */}
          <img
            src="/images/sst-travels-logo.png"
            alt="SST Travels"
            draggable="false"
            className="
              absolute
              left-1/2
              top-1/2
              block
              h-auto
              w-[142px]
              -translate-x-1/2
              -translate-y-1/2
              object-contain
            "
          />

          {/* =================================================
              WHITE SST TEXT OVERLAY

              The original logo contains green SST lettering.
              This second copy only covers the lettering area
              and changes that area to white.
          ================================================== */}

          <img
            src="/images/sst-travels-logo.png"
            alt=""
            aria-hidden="true"
            draggable="false"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              block
              h-auto
              w-[142px]
              -translate-x-1/2
              -translate-y-1/2
              object-contain
              brightness-0
              invert
            "
            style={{
              clipPath: "inset(64% 0 17% 0)",
            }}
          />
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setSidebarOpen?.(false)}
          className="
            absolute
            right-3
            top-3
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-white/60
            transition
            hover:bg-white/10
            hover:text-white
            lg:hidden
          "
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* =================================================
          NAVIGATION
      ================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-3
          py-5
          scrollbar-thin
          scrollbar-thumb-white/20
          scrollbar-track-transparent
        "
      >
        <p
          className="
            mb-3
            px-2
            text-[10px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-emerald-100/40
          "
        >
          Main Menu
        </p>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen?.(false)}
                className={`
                  group
                  flex
                  h-12
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {/* Icon */}

                <span
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    ${
                      isActive
                        ? "bg-white/10"
                        : "bg-white/5 group-hover:bg-white/10"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                {/* Label */}

                <span
                  className="
                    min-w-0
                    flex-1
                    truncate
                    text-sm
                    font-medium
                  "
                >
                  {item.label}
                </span>

                {/* Arrow */}

                <ChevronRight
                  size={16}
                  className={`
                    shrink-0
                    transition-transform
                    ${
                      isActive
                        ? "text-white"
                        : "text-white/30 group-hover:text-white/60"
                    }
                  `}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* =================================================
          LOGOUT
      ================================================== */}

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="
            group
            flex
            h-12
            w-full
            items-center
            gap-3
            rounded-xl
            border
            border-red-400/20
            bg-red-500/10
            px-3
            text-red-300
            transition-all
            duration-200
            hover:border-red-400/40
            hover:bg-red-500
            hover:text-white
            active:scale-[0.98]
          "
        >
          {/* Logout icon */}

          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-red-500/15
              transition
              group-hover:bg-white/10
            "
          >
            <LogOut
              size={17}
              strokeWidth={2}
            />
          </span>

          {/* Text */}

          <span className="flex-1 text-left text-sm font-semibold">
            Logout
          </span>

          {/* Arrow */}

          <ChevronRight
            size={16}
            className="
              shrink-0
              text-red-300/50
              transition
              group-hover:translate-x-0.5
              group-hover:text-white
            "
          />
        </button>
      </div>
    </aside>
  );
}
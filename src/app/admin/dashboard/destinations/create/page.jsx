"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DestinationForm from "@/components/admin/DestinationForm";

export default function CreateDestinationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo =
    searchParams.get("returnTo") ||
    "/admin/dashboard/destinations";

  const handleSaved = useCallback(
    (createdDestination) => {
      console.log(
        "Destination created successfully:",
        createdDestination,
      );

      const createdId =
        createdDestination?._id ||
        createdDestination?.id ||
        "";

      /*
       * If this destination was created from
       * Transportation Create, return there and
       * pass the new destination ID.
       */
      if (
        returnTo.includes(
          "/admin/dashboard/transportation/create",
        )
      ) {
        const separator = returnTo.includes("?")
          ? "&"
          : "?";

        router.replace(
          `${returnTo}${separator}destinationId=${encodeURIComponent(
            createdId,
          )}`,
        );

        return;
      }

      /*
       * Normal destination creation.
       */
      router.replace(returnTo);
    },
    [returnTo, router],
  );

  const handleCancel = useCallback(() => {
    router.replace(returnTo);
  }, [returnTo, router]);

  return (
    <div className="min-h-full bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Destination
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add a new tourism destination to your platform.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <DestinationForm
            mode="create"
            onSuccess={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
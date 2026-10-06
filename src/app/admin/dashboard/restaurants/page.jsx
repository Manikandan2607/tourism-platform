"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  LoaderCircle,
  Utensils,
  Power,
  PowerOff,
  Star,
  Store,
} from "lucide-react";

import { adminApi } from "@/utils/adminApi";
import StatCard from "@/components/admin/StatCard";
import AdminModal from "@/components/admin/AdminModal";
import RestaurantForm from "@/components/admin/RestaurantForm";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function RestaurantDetails({ restaurant }) {
  if (!restaurant) return null;

  return (
    <div className="space-y-6">
      {/* COVER */}
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {restaurant.coverImage?.url ? (
          <img
            src={restaurant.coverImage.url}
            alt={restaurant.name}
            className="h-64 w-full object-cover"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-emerald-50">
            <Utensils className="h-12 w-12 text-emerald-300" />
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {restaurant.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {restaurant.destination?.name || "No destination"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {restaurant.isFeatured && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Featured
                </span>
              )}

              {restaurant.isActive ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BASIC DETAILS */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Basic Information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            label="Destination"
            value={restaurant.destination?.name}
          />

          <DetailItem label="Food Type" value={restaurant.foodType} />

          <DetailItem label="Price Range" value={restaurant.priceRange} />

          <DetailItem label="Rating" value={`${restaurant.rating ?? 0} / 5`} />
        </div>
      </section>

      {/* DESCRIPTION */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Description</h3>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
            {restaurant.description || "-"}
          </p>
        </div>
      </section>

      {/* FOOD */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Food Information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Cuisines"
            value={
              Array.isArray(restaurant.cuisines)
                ? restaurant.cuisines.join(", ")
                : "-"
            }
          />

          <DetailItem
            label="Popular Dishes"
            value={
              Array.isArray(restaurant.popularDishes)
                ? restaurant.popularDishes.join(", ")
                : "-"
            }
          />
        </div>
      </section>

      {/* TIMING / CONTACT */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Timing & Contact
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Opening Time" value={restaurant.openingTime} />

          <DetailItem label="Closing Time" value={restaurant.closingTime} />

          <DetailItem label="Phone" value={restaurant.contactPhone} />

          <DetailItem label="Website" value={restaurant.website} />
        </div>

        <div className="mt-3">
          <DetailItem label="Address" value={restaurant.address} />
        </div>
      </section>

      {/* LOCATION */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Location</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Latitude" value={restaurant.latitude} />

          <DetailItem label="Longitude" value={restaurant.longitude} />
        </div>
      </section>

      {/* GALLERY */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Gallery</h3>

        {restaurant.gallery?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {restaurant.gallery.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <img
                  src={image.url}
                  alt={`${restaurant.name} gallery ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center sm:p-8">
            <p className="text-sm text-slate-400">
              No gallery images available.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [modal, setModal] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [restaurantResponse, destinationResponse] = await Promise.all([
        adminApi.get("/api/dashboard/restaurants"),
        adminApi.get("/api/dashboard/destinations"),
      ]);

      setRestaurants(restaurantResponse?.data || []);
      setDestinations(destinationResponse?.data || []);
    } catch (loadError) {
      console.error(loadError);

      setError(loadError?.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function closeModal() {
    setModal(null);
    setSelectedRestaurant(null);
  }

  function openView(restaurant) {
    setSelectedRestaurant(restaurant);
    setModal("view");
  }

  function openEdit(restaurant) {
    setSelectedRestaurant(restaurant);
    setModal("edit");
  }

  function openDelete(restaurant) {
    setSelectedRestaurant(restaurant);
    setModal("delete");
  }

  function openToggle(restaurant) {
    setSelectedRestaurant(restaurant);
    setModal(restaurant.isActive ? "deactivate" : "activate");
  }

  async function handleDelete() {
    if (!selectedRestaurant) return;

    try {
      await adminApi.delete(
        `/api/dashboard/restaurants/${selectedRestaurant._id}`,
      );

      closeModal();
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);

      setError(deleteError?.message || "Failed to delete restaurant");
    }
  }

  async function handleToggle() {
    if (!selectedRestaurant) return;

    const nextStatus = !selectedRestaurant.isActive;

    try {
      await adminApi.put(
        `/api/dashboard/restaurants/${selectedRestaurant._id}`,
        {
          isActive: nextStatus,
        },
      );

      closeModal();
      await loadData();
    } catch (toggleError) {
      console.error(toggleError);

      setError(
        toggleError?.message ||
          `Failed to ${nextStatus ? "activate" : "deactivate"} restaurant`,
      );
    }
  }

  const totalRestaurants = restaurants.length;

  const activeRestaurants = restaurants.filter(
    (restaurant) => restaurant.isActive,
  ).length;

  const featuredRestaurants = restaurants.filter(
    (restaurant) => restaurant.isFeatured,
  ).length;

  return (
    <div className="min-h-full bg-emerald-50/30 p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Utensils size={21} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Restaurants
              </h1>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Manage restaurants and dining information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin/dashboard/restaurants/create";
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={17} />
            Add Restaurant
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto font-semibold hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Total Restaurants"
            value={totalRestaurants}
            description="All restaurants"
            icon={<Store size={18} />}
            href="/admin/dashboard/restaurants"
          />

          <StatCard
            title="Active"
            value={activeRestaurants}
            description="Currently active"
            icon={<Power size={18} />}
          />

          <StatCard
            title="Featured"
            value={featuredRestaurants}
            description="Featured restaurants"
            icon={<Star size={18} />}
          />
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-emerald-600"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading restaurants...
                </p>
              </div>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <Utensils size={26} className="text-emerald-500" />
              </div>

              <h2 className="mt-4 text-base font-bold text-slate-900">
                No restaurants found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add your first restaurant to get started.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/admin/dashboard/restaurants/create";
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Add Restaurant
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-emerald-100 bg-emerald-50/50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Restaurant
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Destination
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Food
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Price
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Rating
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr
                      key={restaurant._id}
                      className="border-b border-slate-100 transition last:border-0 hover:bg-emerald-50/30"
                    >
                      {/* RESTAURANT */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-emerald-50">
                            {restaurant.coverImage?.url ? (
                              <img
                                src={restaurant.coverImage.url}
                                alt={restaurant.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Utensils
                                  size={18}
                                  className="text-emerald-400"
                                />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {restaurant.name}
                            </p>

                            {restaurant.isFeatured && (
                              <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DESTINATION */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {restaurant.destination?.name || "-"}
                      </td>

                      {/* FOOD */}
                      <td className="px-5 py-3.5">
                        <span className="capitalize text-slate-600">
                          {restaurant.foodType || "-"}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td className="px-5 py-3.5">
                        <span className="capitalize text-slate-600">
                          {restaurant.priceRange || "-"}
                        </span>
                      </td>

                      {/* RATING */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star
                            size={14}
                            className="fill-amber-400 text-amber-400"
                          />

                          <span className="font-medium text-slate-700">
                            {restaurant.rating ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-3.5">
                        {restaurant.isActive ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title="View restaurant"
                            onClick={() => openView(restaurant)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            title="Edit restaurant"
                            onClick={() => openEdit(restaurant)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title={
                              restaurant.isActive
                                ? "Deactivate restaurant"
                                : "Activate restaurant"
                            }
                            onClick={() => openToggle(restaurant)}
                            className={`rounded-lg border bg-white p-2 transition ${
                              restaurant.isActive
                                ? "border-slate-200 text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {restaurant.isActive ? (
                              <PowerOff size={15} />
                            ) : (
                              <Power size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Delete restaurant permanently"
                            onClick={() => openDelete(restaurant)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      <AdminModal
        open={modal === "view"}
        onClose={closeModal}
        title="Restaurant Details"
        description="View restaurant information"
        size="xl"
      >
        <RestaurantDetails restaurant={selectedRestaurant} />
      </AdminModal>

      {/* EDIT MODAL */}
      <AdminModal
        open={modal === "edit"}
        onClose={closeModal}
        title="Edit Restaurant"
        description="Update restaurant information"
        size="xl"
      >
        {selectedRestaurant && (
          <RestaurantForm
            initialValues={selectedRestaurant}
            destinations={destinations}
            mode="edit"
            onSuccess={async () => {
              closeModal();
              await loadData();
            }}
            onCancel={closeModal}
          />
        )}
      </AdminModal>

      {/* DEACTIVATE MODAL */}
      <AdminModal
        open={modal === "deactivate"}
        onClose={closeModal}
        title="Deactivate Restaurant"
        description="Temporarily hide this restaurant"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
            Are you sure you want to deactivate{" "}
            <strong className="text-slate-900">
              {selectedRestaurant?.name}
            </strong>
            ? You can activate it again later.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleToggle}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Deactivate
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ACTIVATE MODAL */}
      <AdminModal
        open={modal === "activate"}
        onClose={closeModal}
        title="Activate Restaurant"
        description="Make this restaurant visible again"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
            Activate{" "}
            <strong className="text-slate-900">
              {selectedRestaurant?.name}
            </strong>
            ?
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleToggle}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Activate
            </button>
          </div>
        </div>
      </AdminModal>

      {/* DELETE MODAL */}
      <AdminModal
        open={modal === "delete"}
        onClose={closeModal}
        title="Delete Restaurant"
        description="Permanent deletion"
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm leading-6 text-red-700">
              This will permanently delete{" "}
              <strong>{selectedRestaurant?.name}</strong> and remove its stored
              Cloudinary images. This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

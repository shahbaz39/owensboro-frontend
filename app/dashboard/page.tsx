"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseServices";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    categories: 0,
    listings: 0,
    subCategories: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [catSnap, productSnap, subSnap] = await Promise.all([
          getDocs(collection(db, "Catagories")),
          getDocs(collection(db, "Products")),
          getDocs(collection(db, "SubCatagories")),
        ]);

        setStats({
          categories: catSnap.size,
          listings: productSnap.size,
          subCategories: subSnap.size,
        });
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#ff6b4a] md:text-6xl">
        Dashboard
      </h2>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <StatCard
          value={loading ? "..." : stats.categories}
          label="Total Categories"
        />
        <StatCard
          value={loading ? "..." : stats.listings}
          label="Total Listings"
        />
        <StatCard
          value={loading ? "..." : stats.subCategories}
          label="Total Sub Categories"
        />
      </div>

      {/* SECTIONS */}
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* QUICK ACTIONS */}
        <section className="rounded-[28px] border border-[#ff6b4a] bg-black p-6">
          <h3 className="text-2xl font-bold text-[#ff6b4a] md:text-3xl">
            Quick Actions
          </h3>

          <p className="mt-2 text-xl font-semibold text-[#f4ead7]">
            Common administrative tasks
          </p>

          <div className="mt-4 space-y-3">
            <button
              onClick={() => (window.location.href = "/dashboard/category")}
              className="w-full rounded-2xl bg-[#e8dfc7] px-6 py-3 text-left text-lg font-medium text-black transition hover:opacity-95"
            >
              Add New Category
            </button>

            <button
              onClick={() => (window.location.href = "/dashboard/listings")}
              className="w-full rounded-2xl border border-[#e8dfc7] bg-transparent px-6 py-3 text-left text-lg font-medium text-[#f4ead7] transition hover:bg-[#111111]"
            >
              Add New Listing
            </button>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="rounded-[28px] border border-[#ff6b4a] bg-black p-6">
          <h3 className="text-2xl font-bold text-[#ff6b4a] md:text-3xl">
            Platform Stats
          </h3>

          <p className="mt-2 text-xl font-semibold text-[#f4ead7]">
            Live system data
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex items-center justify-between text-lg md:text-xl">
              <span className="text-[#f4ead7]">Listings published</span>
              <span className="text-[#ff6b4a] font-semibold">
                {loading ? "..." : stats.listings}
              </span>
            </div>

            <div className="flex items-center justify-between text-lg md:text-xl">
              <span className="text-[#f4ead7]">Categories created</span>
              <span className="text-[#ff6b4a] font-semibold">
                {loading ? "..." : stats.categories}
              </span>
            </div>

            <div className="flex items-center justify-between text-lg md:text-xl">
              <span className="text-[#f4ead7]">Sub Categories</span>
              <span className="text-[#ff6b4a] font-semibold">
                {loading ? "..." : stats.subCategories}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* STAT CARD */
function StatCard({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#ff6b4a] bg-black px-8 py-6 text-center">
      <h3 className="text-4xl font-bold text-[#ff6b4a] md:text-5xl">
        {value}
      </h3>
      <p className="mt-2 text-xl font-semibold text-[#f4ead7]">
        {label}
      </p>
    </div>
  );
}
export default function DashboardPage() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <h2 className="mb-8 text-4xl font-bold tracking-tight text-[#ff6b4a] md:text-6xl">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <StatCard value="16" label="Total Categories" />
        <StatCard value="267" label="Total Listings" />
        <StatCard value="27" label="Total Sub Categories" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="rounded-[28px] border border-[#ff6b4a] bg-black p-6">
          <h3 className="text-2xl font-bold text-[#ff6b4a] md:text-3xl">
            Quick Actions
          </h3>

          <p className="mt-2 text-xl font-semibold text-[#f4ead7]">
            Common administrative tasks
          </p>

          <p className="mt-3 text-lg font-medium text-[#ff6b4a]">
            Active categories
          </p>

          <div className="mt-4 space-y-3">
            <button className="w-full rounded-2xl bg-[#e8dfc7] px-6 py-3 text-left text-lg font-medium text-black transition hover:opacity-95">
              Add New Category
            </button>

            <button className="w-full rounded-2xl border border-[#e8dfc7] bg-transparent px-6 py-3 text-left text-lg font-medium text-[#f4ead7] transition hover:bg-[#111111]">
              Add New Listing
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#ff6b4a] bg-black p-6">
          <h3 className="text-2xl font-bold text-[#ff6b4a] md:text-3xl">
            Recent Activity
          </h3>

          <p className="mt-2 text-xl font-semibold text-[#f4ead7]">
            Latest updates to your platform
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex items-center justify-between gap-4 text-lg md:text-xl">
              <span className="font-medium text-[#f4ead7]">Listings published</span>
              <span className="font-semibold text-[#ff6b4a]">267</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-lg md:text-xl">
              <span className="font-medium text-[#f4ead7]">Categories created</span>
              <span className="font-semibold text-[#ff6b4a]">16</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#ff6b4a] bg-black px-8 py-6 text-center">
      <h3 className="text-4xl font-bold text-[#ff6b4a] md:text-5xl">{value}</h3>
      <p className="mt-2 text-xl font-semibold text-[#f4ead7]">{label}</p>
    </div>
  );
}
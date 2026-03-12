const banners = [
  {
    id: 1,
    title: "Restore D7 Campaign",
    placement: "Homepage Hero",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "TOA Visual Promotion",
    placement: "Homepage Secondary",
    status: "Scheduled",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Summer Event Spotlight",
    placement: "Top Featured Strip",
    status: "Draft",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80",
  },
];

export default function Page() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
            Banner
          </h1>
          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Manage promotional banners displayed across the platform.
          </p>
        </div>

        <button className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white">
          Add Banner
        </button>
      </div>

      <section className="mt-8 rounded-[28px] border border-[#ff7a59]/70 bg-[#0a0a0a] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#ff7a59] md:text-4xl">
            Banner Library
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[#f3ead7] md:text-base">
            Upload, update, and manage visual banners for featured campaigns,
            homepage placements, and promotional sections.
          </p>
        </div>

        <div className="space-y-4">
          {banners.map((banner) => (
            <BannerRow
              key={banner.id}
              title={banner.title}
              placement={banner.placement}
              status={banner.status}
              image={banner.image}
            />
          ))}
        </div>

        <Pagination />
      </section>
    </div>
  );
}

function BannerRow({
  title,
  placement,
  status,
  image,
}: {
  title: string;
  placement: string;
  status: string;
  image: string;
}) {
  const statusClasses =
    status === "Active"
      ? "bg-green-100 text-green-700"
      : status === "Scheduled"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-[#ff7a59]/40 bg-[#111111] p-4 transition hover:border-[#ff7a59] hover:shadow-lg md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="h-20 w-28 overflow-hidden rounded-xl bg-[#1b1b1b] md:h-24 md:w-36">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white md:text-lg">
            {title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="rounded-full bg-[#ece2cb] px-2.5 py-1 font-medium text-black">
              {placement}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-center">
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 md:text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.62 17.67 4 18.5l.83-4.62L16.862 3.487Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.5 5.85 18.15 9.5"
            />
          </svg>
          Update
        </button>

        <button className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500 hover:text-white md:text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

function Pagination() {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[#f3ead7]/70">
        Showing <span className="font-semibold text-[#f3ead7]">1–3</span> of{" "}
        <span className="font-semibold text-[#f3ead7]">12</span> banners
      </p>

      <div className="flex items-center gap-2">
        <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#f3ead7]/70 transition hover:border-[#ff7a59]/40 hover:text-[#f3ead7]">
          Previous
        </button>

        <button className="h-10 min-w-10 rounded-lg bg-[#ff7a59] px-3 text-sm font-semibold text-white">
          1
        </button>

        <button className="h-10 min-w-10 rounded-lg border border-white/10 px-3 text-sm text-[#f3ead7] transition hover:border-[#ff7a59]/40 hover:text-white">
          2
        </button>

        <button className="h-10 min-w-10 rounded-lg border border-white/10 px-3 text-sm text-[#f3ead7] transition hover:border-[#ff7a59]/40 hover:text-white">
          3
        </button>

        <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#f3ead7] transition hover:border-[#ff7a59]/40 hover:text-white">
          Next
        </button>
      </div>
    </div>
  );
}
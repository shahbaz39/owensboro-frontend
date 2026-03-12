const listings = [
  {
    id: 1,
    title: "VFW Live Music in Owensboro",
    category: "Event & Entertainment",
    subCategory: "Live Music",
    location: "Owensboro",
    status: "Published",
  },
  {
    id: 2,
    title: "Retro Shock at Senior Community Center of Owensboro",
    category: "Event & Entertainment",
    subCategory: "Performing Arts",
    location: "Owensboro",
    status: "Published",
  },
  {
    id: 3,
    title: "Chance Stanley at Brasher's Lil Nashville",
    category: "Event & Entertainment",
    subCategory: "Live Music",
    location: "Nashville",
    status: "Draft",
  },
  {
    id: 4,
    title: "March Craftness 2026",
    category: "Shopping",
    subCategory: "Pop-Up Events",
    location: "Downtown",
    status: "Published",
  },
  {
    id: 5,
    title: "Owensboro Food Truck Fiesta",
    category: "Food",
    subCategory: "Fast Food",
    location: "Riverfront",
    status: "Archived",
  },
  {
    id: 6,
    title: "Boutique Stay Weekend Offer",
    category: "Hotels",
    subCategory: "Boutique Hotels",
    location: "Owensboro",
    status: "Published",
  },
];

export default function Page() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
            Listings
          </h1>
          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Manage and organize all published platform listings.
          </p>
        </div>

        <button className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white">
          Add Listing
        </button>
      </div>

      <section className="mt-8 rounded-[28px] border border-[#ff7a59]/70 bg-[#0a0a0a] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#ff7a59] md:text-4xl">
            Listings Directory
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[#f3ead7] md:text-base">
            Review, update, and manage your platform listings. Each listing is
            organized by category and sub category for easier browsing and
            moderation.
          </p>
        </div>

        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              title={listing.title}
              category={listing.category}
              subCategory={listing.subCategory}
              location={listing.location}
              status={listing.status}
            />
          ))}
        </div>

        <Pagination />
      </section>
    </div>
  );
}

function ListingRow({
  title,
  category,
  subCategory,
  location,
  status,
}: {
  title: string;
  category: string;
  subCategory: string;
  location: string;
  status: string;
}) {
  const statusClasses =
    status === "Published"
      ? "bg-green-100 text-green-700"
      : status === "Draft"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-200 text-gray-700";

  return (
    <div className="group flex flex-col justify-between gap-4 rounded-xl bg-[#ece2cb] px-4 py-3 text-black transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold md:text-lg">{title}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <span className="rounded-full bg-black/8 px-2.5 py-1 font-medium text-black/70">
            {category}
          </span>

          <span className="rounded-full bg-black/8 px-2.5 py-1 font-medium text-black/70">
            {subCategory}
          </span>

          <span className="text-black/60">{location}</span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}`}
          >
            {status}
          </span>
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
        Showing <span className="font-semibold text-[#f3ead7]">1–6</span> of{" "}
        <span className="font-semibold text-[#f3ead7]">267</span> listings
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

        <span className="px-1 text-[#f3ead7]/50">...</span>

        <button className="h-10 min-w-10 rounded-lg border border-white/10 px-3 text-sm text-[#f3ead7] transition hover:border-[#ff7a59]/40 hover:text-white">
          45
        </button>

        <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#f3ead7] transition hover:border-[#ff7a59]/40 hover:text-white">
          Next
        </button>
      </div>
    </div>
  );
}
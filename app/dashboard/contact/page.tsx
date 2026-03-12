const requests = [
  {
    id: 1,
    name: "Tyler",
    email: "tyler@msquaredmarketing.com",
  },
  {
    id: 2,
    name: "Ashley",
    email: "moonfacestudio270@gmail.com",
  },
  {
    id: 3,
    name: "Brittany Weidemann",
    email: "bweidemann14@gmail.com",
  },
  {
    id: 4,
    name: "Denise Jarboe",
    email: "denise@email.com",
  },
];

export default function Page() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
          All Support Requests
        </h1>

        <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
          General questions or requests for information.
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <section className="mt-8 rounded-[28px] border border-[#ff7a59]/70 bg-[#0a0a0a] p-5 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#ff7a59] md:text-4xl">
            Requests (74)
          </h2>

          <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[#f3ead7] md:text-base">
            Manage incoming support messages and respond to users quickly.
          </p>
        </div>

        {/* REQUEST LIST */}
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestRow key={request.id} {...request} />
          ))}
        </div>

        <Pagination />
      </section>
    </div>
  );
}

function RequestRow({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#ece2cb] px-5 py-4 text-black transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <h3 className="text-base font-semibold md:text-lg">{name}</h3>

        <p className="mt-1 text-sm text-[#ff7a59]">
          email : {email}
        </p>
      </div>

      <button className="rounded-lg bg-[#ff7a59] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 md:text-sm">
        View
      </button>
    </div>
  );
}

function Pagination() {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[#f3ead7]/70">
        Showing <span className="font-semibold text-[#f3ead7]">1–4</span> of{" "}
        <span className="font-semibold text-[#f3ead7]">74</span> requests
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
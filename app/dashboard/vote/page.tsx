const votes = [
  {
    id: 1,
    title: "Vote Your Favorite",
    link: "https://example.com",
  },
];

export default function Page() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
          Vote For Your Favorite
        </h1>

        <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
          Submit a link that users can vote for.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* LEFT FORM */}
        <div className="rounded-2xl border border-[#ff7a59]/60 bg-[#0a0a0a] p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            What would you like to submit?
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#f3ead7]">
                Title
              </label>

              <input
                type="text"
                placeholder="Enter title"
                className="mt-2 w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-[#ff7a59]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f3ead7]">
                Add Link
              </label>

              <input
                type="text"
                placeholder="Enter link"
                className="mt-2 w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-[#ff7a59]"
              />
            </div>

            <button className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Submit
            </button>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="space-y-4">
          {votes.map((vote) => (
            <VoteCard key={vote.id} {...vote} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VoteCard({
  title,
  link,
}: {
  title: string;
  link: string;
}) {
  return (
    <div className="rounded-xl bg-[#ff7a59] p-5 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold md:text-base">{title}</span>

        <div className="flex items-center gap-3">
          {/* EDIT */}
          <button className="hover:opacity-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.62 17.67 4 18.5l.83-4.62L16.862 3.487Z"
              />
            </svg>
          </button>

          {/* DELETE */}
          <button className="hover:opacity-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
            </svg>
          </button>
        </div>
      </div>

      <a
        href={link}
        className="mt-2 block text-xs text-white/80 underline"
        target="_blank"
      >
        {link}
      </a>
    </div>
  );
}
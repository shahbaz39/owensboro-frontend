const challenges = [
  {
    id: 1,
    title: "TOA",
    video:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
];

export default function Page() {
  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
            Challenge
          </h1>

          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Admin can create, manage, and update weekly challenge videos easily.
          </p>
        </div>

        <button className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white">
          Add Challenge
        </button>
      </div>

      <section className="mt-10 space-y-6">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} {...challenge} />
        ))}
      </section>
    </div>
  );
}

function ChallengeCard({
  title,
  video,
}: {
  title: string;
  video: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ff7a59]/60 bg-[#0a0a0a] p-6">
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          controls
          className="w-full rounded-xl"
        >
          <source src={video} type="video/mp4" />
        </video>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-[#ff7a59] px-5 py-3 text-white">
        <span className="text-sm font-semibold md:text-base">{title}</span>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1 text-white hover:opacity-80">
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
            </svg>
          </button>

          <button className="inline-flex items-center gap-1 text-white hover:opacity-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
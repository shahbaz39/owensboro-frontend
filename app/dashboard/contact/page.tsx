"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseServices";

/* TYPES */
type Request = {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: any;
};

export default function Page() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 6;

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "ContactUs"));

      const data = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.name,
          email: x.email,
          message: x.message,
          timestamp: x.timestamp,
        };
      });

      setRequests(data);
    };

    fetchData();
  }, []);

  /* PAGINATION */
  const totalPages = Math.ceil(requests.length / perPage);

  const paginated = requests.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
          All Support Requests
        </h1>

        <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
          General questions or requests for information.
        </p>
      </div>

      {/* MAIN */}
      <section className="mt-8 rounded-[28px] border border-[#ff7a59]/70 bg-[#0a0a0a] p-5 md:p-6">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#ff7a59] md:text-4xl">
            Requests ({requests.length})
          </h2>

          <p className="mt-2 text-[#f3ead7]">
            Manage incoming support messages efficiently.
          </p>
        </div>

        {/* GRID */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginated.map((r) => (
            <RequestCard
              key={r.id}
              {...r}
              onView={() => setSelected(r)}
            />
          ))}
        </div>

        {/* PAGINATION */}
        <div className="mt-8 flex justify-between items-center text-[#f3ead7]">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="opacity-70 hover:opacity-100"
          >
            Prev
          </button>

          <span>{page} / {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="opacity-70 hover:opacity-100"
          >
            Next
          </button>
        </div>
      </section>

      {/* VIEW MODAL */}
      {selected && (
        <Modal title="Support Request" onClose={() => setSelected(null)}>
          <div className="space-y-3 text-black">

            <p><b>Name:</b> {selected.name}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Message:</b></p>

            <div className="p-3 bg-white rounded-lg border">
              {selected.message}
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}

/* CARD */
function RequestCard({
  name,
  email,
  message,
  onView,
}: any) {
  return (
    <div className="rounded-xl bg-[#ece2cb] p-5 text-black transition hover:-translate-y-1 hover:shadow-lg">

      <h3 className="font-semibold text-lg">{name}</h3>

      <p className="text-sm text-[#ff7a59] mt-1 truncate">
        {email}
      </p>

      <p className="text-sm mt-3 line-clamp-3 text-black/70">
        {message}
      </p>

      <button
        onClick={onView}
        className="mt-4 w-full rounded-lg bg-[#ff7a59] py-2 text-white font-semibold"
      >
        View
      </button>
    </div>
  );
}

/* MODAL */
function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-[#e8dcc7] p-6 rounded-3xl w-[90%] max-w-lg">

        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-[#ff7a59]">{title}</h2>
          <button onClick={onClose}>✖</button>
        </div>

        {children}
      </div>
    </div>
  );
}
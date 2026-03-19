"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseServices";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const perPage = 9;

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "Users"));
        const data = snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            name: x.full_name || x.display_name || "No Name",
            email: x.email || "No Email",
            phone: x.phone_number || "No Phone",
          };
        });
        setUsers(data);
      } catch (err) {
        console.error("Users fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(users.length / perPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return users.slice(start, start + perPage);
  }, [users, page]);

  return (
    <div className="px-6 pt-6 pb-10">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-5xl font-bold text-[#ff7a59]">All Users Info</h1>
        <p className="mt-2 text-lg text-[#e8dcc7]">
          All users information is listed here.
        </p>
      </header>

      {/* USERS CONTAINER */}
      <section className="rounded-3xl border border-[#ff7a59]/40 bg-[#0a0a0a] p-6">
        {/* TITLE */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#ff7a59]">
            Users ({users.length})
          </h2>
        </div>

        {/* LOADING */}
        {loading ? (
          <p className="text-[#f3ead7]">Loading users...</p>
        ) : (
          <>
            {/* GRID */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginated.map((user) => (
                <UserCard key={user.id} {...user} />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-8 flex items-center justify-between text-[#f3ead7]">
              <p>
                Showing {(page - 1) * perPage + 1}–
                {Math.min(page * perPage, users.length)} of {users.length}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <button className="rounded-xl bg-[#ff7a59] px-4 py-2 text-white">
                  {page}
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// USER CARD COMPONENT
function UserCard({ name, email, phone }: { name: string; email: string; phone: string }) {
  return (
    <div className="group relative rounded-2xl bg-[#e8dcc7] p-5 text-black transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* NAME */}
      <h3 className="text-lg font-semibold">{name}</h3>

      {/* DETAILS */}
      <div className="mt-3 space-y-1 text-sm">
        <p className="text-[#ff7a59] break-all">email: {email}</p>
        <p className="text-[#ff7a59]">phone: {phone}</p>
      </div>

      {/* COPY ACTIONS */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => navigator.clipboard.writeText(email)}
          className="rounded-lg bg-black/10 p-2 hover:bg-black/20"
        >
          📧
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(phone)}
          className="rounded-lg bg-black/10 p-2 hover:bg-black/20"
        >
          📞
        </button>
      </div>

      {/* ACCENT */}
      <div className="mt-4 h-[2px] w-10 bg-[#ff7a59]/40 rounded-full transition-all group-hover:w-16" />
    </div>
  );
}
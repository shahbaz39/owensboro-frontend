"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseServices";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login"); // 🔒 redirect if not logged in
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ⏳ Prevent flicker before auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Checking access...
      </div>
    );
  }

  // ✅ Your existing UI stays EXACTLY the same
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
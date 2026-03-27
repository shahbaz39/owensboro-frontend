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

 // ⏳ Stunning Loading Screen
if (loading) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black relative overflow-hidden">
      
      {/* Neon Spinner */}
      <div className="relative flex items-center justify-center w-28 h-28">
        <div className="absolute w-28 h-28 rounded-full border-4 border-[#f4ead7]/20 border-t-[#ff6b4a] animate-spin shadow-[0_0_20px_#ff6b4a]"></div>
        <div className="absolute w-20 h-20 rounded-full bg-black shadow-inner"></div>
      </div>

      {/* Loading Text */}
      <p className="mt-6 text-2xl font-bold text-[#f4ead7] tracking-wider animate-pulse drop-shadow-[0_0_10px_#ff6b4a]">
        Loading Dashboard...
      </p>

      {/* Neon Glow Bar */}
      <div className="mt-5 h-1 w-36 rounded-full bg-gradient-to-r from-[#ff6b4a]/60 via-[#f4ead7]/40 to-[#ff6b4a]/60 animate-pulse shadow-[0_0_10px_#ff6b4a]"></div>

      {/* Sparkle Animation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#ff6b4a] rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
  // ✅ Your existing UI stays EXACTLY the same
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
<main className="flex-1 pt-4 pb-4 px-8">{children}</main>      </div>
    </div>
  );
}
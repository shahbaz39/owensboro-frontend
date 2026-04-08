"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseServices";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-10 py-6">
      <h1 className="text-5xl font-bold text-[#f3ead7]">
        The Owensboro App
      </h1>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-3 rounded-2xl border border-[#ff6b4a] bg-black px-6 py-3 text-lg font-semibold text-[#ff6b4a] transition-all duration-200 hover:bg-[#ff6b4a] hover:text-black active:scale-95 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Logging out...
          </>
        ) : (
          <>
            <LogOut className="h-5 w-5" />
            Logout
          </>
        )}
      </button>
    </header>
  );
}
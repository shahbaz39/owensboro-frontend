"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseServices";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex items-center justify-between px-10 py-6">
      <h1 className="text-5xl font-bold text-[#f3ead7]">
        The Owensboro App
      </h1>

      <button
        onClick={handleLogout}
        className="text-2xl text-[#f3ead7] cursor-pointer"
      >
        Logout
      </button>
    </header>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseServices";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      await signInWithEmailAndPassword(auth, email, password);

      router.push("/dashboard");

    } catch (err: any) {
      setError("Invalid email or password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#ff7a59]/60 bg-[#0a0a0a] p-10 shadow-[0_0_40px_rgba(255,122,89,0.12)]">

        <h1 className="text-center text-3xl font-bold text-[#ff7a59]">
          The Owensboro App
        </h1>

        <h2 className="mt-6 text-center text-2xl font-semibold text-[#ff7a59]">
          Admin Login
        </h2>

        <p className="mt-2 text-center text-sm text-[#e8dcc7]">
          Sign in to manage your platform
        </p>

        <div className="mt-10 space-y-6">

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-[#e8dcc7]">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2 w-full rounded-xl border border-white/25 bg-black px-4 py-3 text-white outline-none focus:border-[#ff7a59]"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium text-[#e8dcc7]">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/25 bg-black px-4 py-3 pr-12 text-white outline-none focus:border-[#ff7a59]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-[#ff7a59]"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-[#e8dcc7] py-3 font-semibold text-black transition hover:bg-[#ff7a59] hover:text-white"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>
    </div>
  );
}
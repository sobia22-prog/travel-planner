"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setAuth } from "@/lib/auth";

interface LoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: {
      id: number;
      name: string;
      type: string;
    };
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>(
        "/api/auth/local",
        {
          method: "POST",
          body: JSON.stringify({ identifier, password }),
        },
        null
      );
      localStorage.setItem("travel_token", data.jwt);
      localStorage.setItem("jwt", data.jwt);

      // Fetch user with role from /api/users/me
      let userWithRole = data.user;
      try {
        const meData = await apiFetch<{
          id: number;
          username: string;
          email: string;
          role: { id: number; name: string; type: string } | null;
        }>(
          "/api/users/me",
          { method: "GET" },
          data.jwt
        );
        userWithRole = { ...data.user, role: meData.role || undefined };
      } catch (meErr) {
        console.warn("Could not fetch user role:", meErr);
        // Continue with user data from login response
      }

      // Store auth data
      setAuth(data.jwt, userWithRole);

      // Redirect to home (no admin panel in frontend)
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl font-bold mb-4">
              T
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue planning your trips</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-blue-600 font-medium hover:text-blue-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

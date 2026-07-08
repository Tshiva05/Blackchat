"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      router.push("/chat");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Check your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-[#0B0F14]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <MessageSquare className="text-brand" size={26} />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Chat App</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl2 border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#111823]"
        >
          <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Sign in with your email, mobile, username, or chat ID.
          </p>

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Email / mobile / username / ID
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
            placeholder="you@example.com"
          />

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
            placeholder="••••••••"
          />

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          New here?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

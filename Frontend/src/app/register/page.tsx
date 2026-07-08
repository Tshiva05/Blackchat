"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

type Step = "identifier" | "details";

export default function RegisterPage() {
  const { requestRegisterOtp, verifyRegisterOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestRegisterOtp(identifier.trim());
      setInfo(
        identifier.includes("@")
          ? "We sent a 6-digit code to your email."
          : "We sent a 6-digit code to your mobile number."
      );
      setStep("details");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Couldn't send OTP. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await verifyRegisterOtp({ identifier: identifier.trim(), otp, name, username, password });
      router.push("/chat");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed.");
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

        <div className="rounded-xl2 border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#111823]">
          {step === "identifier" ? (
            <form onSubmit={handleRequestOtp}>
              <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Create your account</h1>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                You'll get a permanent numeric chat ID once you're verified.
              </p>

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Email or mobile number
              </label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
                placeholder="you@example.com or +1 555 0100"
              />

              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !identifier.trim()}
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? "Sending code…" : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Verify & set up</h1>
              {info && (
                <div className="mb-4 flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 size={14} /> {info}
                </div>
              )}

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                6-digit code
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm tracking-widest outline-none focus:border-brand dark:border-gray-700"
                placeholder="123456"
              />

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
                placeholder="Your full name"
              />

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
                placeholder="unique_username"
              />

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
                placeholder="At least 8 characters"
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
                {busy ? "Creating account…" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => setStep("identifier")}
                className="mt-2 w-full text-center text-xs text-gray-500 hover:underline"
              >
                Use a different email or mobile
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
  

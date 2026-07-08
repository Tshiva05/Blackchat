"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { CustomVoiceCommand, VoiceAction } from "@/types";
import { DEFAULT_PHRASES } from "@/lib/voiceCommands";

const ACTION_LABELS: Record<VoiceAction, string> = {
  erase_chat: "Erase the chat",
  delete_message: "Delete a message",
  call_user: "Call a contact",
  open_settings: "Open settings",
  mute_notifications: "Mute notifications",
  search_user: "Search for a user",
  send_message: "Send a message",
  create_group: "Create a group",
  record_voice_note: "Record a voice note",
  dark_mode: "Toggle dark mode",
  logout: "Log out",
};

export default function SettingsPage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [privacy, setPrivacy] = useState(user?.privacy);
  const [theme, setTheme] = useState<"light" | "dark" | "amoled">("dark");
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [customCommands, setCustomCommands] = useState<CustomVoiceCommand[]>([]);
  const [newPhrase, setNewPhrase] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio || "");
    setStatus(user.status || "");
    setPrivacy(user.privacy);
    setTheme(user.settings?.theme || "dark");
    setVoiceCommandsEnabled(!!user.settings?.voiceCommandsEnabled);
  }, [user]);

  useEffect(() => {
    api.get("/users/voice-commands").then((res) => setCustomCommands(res.data.customVoiceCommands || []));
  }, []);

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2000);
  }

  async function saveProfile() {
    await api.patch("/users/me", { name, bio, status });
    await refreshUser();
    flash("Profile saved.");
  }

  async function savePrivacy() {
    await api.patch("/users/me/privacy", privacy);
    await refreshUser();
    flash("Privacy settings saved.");
  }

  async function saveTheme(next: "light" | "dark" | "amoled") {
    setTheme(next);
    await api.patch("/users/me/settings", { theme: next });
    document.documentElement.classList.toggle("dark", next !== "light");
    document.documentElement.classList.toggle("amoled", next === "amoled");
    localStorage.setItem("theme", next === "light" ? "light" : "dark");
    flash("Theme updated.");
  }

  async function toggleVoiceCommands() {
    const next = !voiceCommandsEnabled;
    setVoiceCommandsEnabled(next);
    await api.patch("/users/me/settings", { voiceCommandsEnabled: next });
  }

  function getPhrases(action: VoiceAction): string[] {
    return customCommands.find((c) => c.action === action)?.phrases || [];
  }

  function addPhrase(action: VoiceAction) {
    const phrase = (newPhrase[action] || "").trim().toLowerCase();
    if (!phrase) return;
    setCustomCommands((prev) => {
      const existing = prev.find((c) => c.action === action);
      if (existing) {
        if (existing.phrases.includes(phrase)) return prev;
        return prev.map((c) => (c.action === action ? { ...c, phrases: [...c.phrases, phrase] } : c));
      }
      return [...prev, { action, phrases: [phrase] }];
    });
    setNewPhrase((p) => ({ ...p, [action]: "" }));
  }

  function removePhrase(action: VoiceAction, phrase: string) {
    setCustomCommands((prev) =>
      prev.map((c) => (c.action === action ? { ...c, phrases: c.phrases.filter((p) => p !== phrase) } : c))
    );
  }

  async function saveVoiceCommands() {
    const res = await api.put("/users/voice-commands", { customVoiceCommands: customCommands });
    setCustomCommands(res.data.customVoiceCommands);
    flash("Voice commands saved.");
  }

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-[#0B0F14]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-gray-50/90 px-5 py-4 backdrop-blur dark:border-gray-800 dark:bg-[#0B0F14]/90">
        <button onClick={() => router.push("/chat")} className="rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        {/* Profile */}
        <section className="rounded-xl2 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111823]">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="mb-3 text-xs text-gray-400">
            Chat ID <span className="font-mono text-brand">{user.chatId}</span> (permanent, can&apos;t be changed)
          </div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
          />
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Status</label>
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
          />
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={2}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
          />
          <button onClick={saveProfile} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Save profile
          </button>
        </section>

        {/* Theme */}
        <section className="rounded-xl2 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111823]">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Theme</h2>
          <div className="flex gap-2">
            {(["light", "dark", "amoled"] as const).map((t) => (
              <button
                key={t}
                onClick={() => saveTheme(t)}
                className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                  theme === t ? "border-brand bg-brand/10 text-brand" : "border-gray-300 dark:border-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        {privacy && (
          <section className="rounded-xl2 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111823]">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Privacy</h2>
            {(
              [
                ["hideOnlineStatus", "Hide online status"],
                ["hideLastSeen", "Hide last seen"],
                ["hideProfilePicture", "Hide profile picture"],
                ["hideMobile", "Hide mobile number"],
                ["disableSearchByMobile", "Disable search by mobile number"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200">{label}</span>
                <input
                  type="checkbox"
                  checked={!!(privacy as any)[key]}
                  onChange={(e) => setPrivacy((p) => (p ? { ...p, [key]: e.target.checked } : p))}
                  className="h-4 w-4 accent-brand"
                />
              </label>
            ))}
            <button onClick={savePrivacy} className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Save privacy settings
            </button>
          </section>
        )}

        {/* Voice commands */}
        <section className="rounded-xl2 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111823]">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Voice commands</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              Enabled
              <input
                type="checkbox"
                checked={voiceCommandsEnabled}
                onChange={toggleVoiceCommands}
                className="h-4 w-4 accent-brand"
              />
            </label>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            Every action already responds to a default phrase. Add your own on top — e.g. teach{" "}
            <strong>&ldquo;Erase the chat&rdquo;</strong> to also fire on <strong>&ldquo;Destroy&rdquo;</strong> or{" "}
            <strong>&ldquo;Clear everything&rdquo;</strong>.
          </p>

          <div className="space-y-4">
            {(Object.keys(ACTION_LABELS) as VoiceAction[]).map((action) => (
              <div key={action} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                  {ACTION_LABELS[action]}
                </div>
                <div className="mb-2 text-xs text-gray-400">
                  Default: &ldquo;{DEFAULT_PHRASES[action][0]}&rdquo;
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {getPhrases(action).map((phrase) => (
                    <span
                      key={phrase}
                      className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand"
                    >
                      {phrase}
                      <button onClick={() => removePhrase(action, phrase)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newPhrase[action] || ""}
                    onChange={(e) => setNewPhrase((p) => ({ ...p, [action]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addPhrase(action)}
                    placeholder="Add a custom phrase…"
                    className="flex-1 rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs dark:border-gray-700"
                  />
                  <button
                    onClick={() => addPhrase(action)}
                    className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveVoiceCommands}
            className="mt-4 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Save size={14} /> Save voice commands
          </button>
        </section>

        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
        >
          Log out
        </button>

        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {saved}
          </div>
        )}
      </div>
    </div>
  );
    }

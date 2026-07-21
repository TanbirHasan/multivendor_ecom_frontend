"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { RequireAuth } from "@/components/guards/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { updateUser } from "@/lib/api/users";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { formatDate, initials } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const dirty = name !== user.name || email !== user.email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateUser(user!.id, { name, email });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      setError(extractErrorMessage(err, "Could not update profile"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
          {initials(user.name)}
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{user.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <RoleBadge role={user.role} />
            <span className="text-xs text-slate-400">Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <Input id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} />
        <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" isLoading={isSaving} disabled={!dirty}>
          Save changes
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { UserCog } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Role, User } from "@/lib/types";

const ROLES: Role[] = ["BUYER", "SELLER", "ADMIN"];

interface EditUserDialogProps {
  user: User | null;
  isSaving?: boolean;
  onSave: (id: string, payload: { name: string; email: string; role: Role }) => void;
  onCancel: () => void;
}

export function EditUserDialog({ user, isSaving, onSave, onCancel }: EditUserDialogProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "BUYER");

  useEffect(() => {
    if (!user) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onCancel]);

  if (!user || typeof document === "undefined") return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    onSave(user.id, { name: name.trim(), email: email.trim(), role });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-950/20 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <UserCog className="size-5" />
        </div>
        <h3 className="text-base font-bold text-stone-950 dark:text-stone-100">Edit user</h3>

        <Input id="edit-user-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
        <Input id="edit-user-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Select id="edit-user-role" label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}

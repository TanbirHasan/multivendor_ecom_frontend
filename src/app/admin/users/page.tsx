"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deleteUser, listUsers, updateUser } from "@/lib/api/users";
import type { Role, User } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { formatDate, initials } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [target, setTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setUsers(await listUsers());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(id: string, payload: { name: string; email: string; role: Role }) {
    setIsSaving(true);
    try {
      const updated = await updateUser(id, payload);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(`${updated.name} updated`);
      setEditing(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update user"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast.success("User deleted");
      setTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete user — they may still own products"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          View every account, edit details or role, or remove a user. New accounts can only be created via self-registration.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-stone-500 dark:border-stone-800 dark:bg-stone-950/40">
                <tr>
                  <th className="px-5 py-3 font-bold">User</th>
                  <th className="px-5 py-3 font-bold">Joined</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-2xl bg-teal-700 text-xs font-black text-white dark:bg-amber-400 dark:text-stone-950">
                          {initials(u.name)}
                        </span>
                        <div>
                          <p className="font-bold text-stone-800 dark:text-stone-100">{u.name}</p>
                          <p className="text-xs font-medium text-stone-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditing(u)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button variant="danger" size="sm" onClick={() => setTarget(u)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditUserDialog key={editing?.id ?? "none"} user={editing} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditing(null)} />

      <ConfirmDialog
        open={Boolean(target)}
        title={`Delete "${target?.name}"?`}
        description="This permanently removes their account and revokes their sessions."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

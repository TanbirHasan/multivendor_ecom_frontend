"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shield, Trash2, Users } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { deleteUser, listUsers, updateUser } from "@/lib/api/users";
import type { Role, User } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate, initials } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

const ROLES: Role[] = ["BUYER", "SELLER", "ADMIN"];

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <AdminUsersContent />
    </RequireAuth>
  );
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
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

  async function handleRoleChange(user: User, role: Role) {
    if (role === user.role) return;
    setSavingId(user.id);
    try {
      const updated = await updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(`${user.name} is now ${role}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update role"));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete user"));
    } finally {
      setIsDeleting(false);
      setTarget(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <Shield className="size-5" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Manage users</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">View accounts, change roles, or remove users.</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
            <table className="w-full min-w-[760px] text-left text-sm">
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
                      {u.id === currentUser?.id ? (
                        <RoleBadge role={u.role} />
                      ) : (
                        <select
                          value={u.role}
                          disabled={savingId === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                          className="rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-stone-800 shadow-sm shadow-stone-950/5 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.id !== currentUser?.id && (
                        <Button variant="danger" size="sm" onClick={() => setTarget(u)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Delete "${target?.name}"?`}
        description="This permanently removes their account."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

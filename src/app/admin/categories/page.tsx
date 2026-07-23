"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api/categories";
import type { Category } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [target, setTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setCategories(await listCategories());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const category = await createCategory(newName.trim());
      setCategories((prev) => [...prev, category]);
      setNewName("");
      toast.success("Category created");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not create category"));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditingName(c.name);
  }

  async function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateCategory(id, editingName.trim());
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      toast.success("Category updated");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update category"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteCategory(target.id);
      setCategories((prev) => prev.filter((c) => c.id !== target.id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete category"));
    } finally {
      setIsDeleting(false);
      setTarget(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <Layers className="size-5" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Manage categories</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Categories organize products across the marketplace.</p>

        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            id="new-category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1"
          />
          <Button type="submit" isLoading={isCreating}>
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : categories.length === 0 ? (
          <EmptyState icon={Layers} title="No categories yet" description="Create your first category above." />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                {editingId === c.id ? (
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      id={`edit-${c.id}`}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(c.id)} isLoading={isSaving}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-100">{c.name}</p>
                      <p className="text-xs font-medium text-stone-400">Added {formatDate(c.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(c)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setTarget(c)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Delete "${target?.name}"?`}
        description="Categories that still have products can't be deleted."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

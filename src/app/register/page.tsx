"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BadgeCheck, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/client";
import { dashboardPathForRole } from "@/lib/roles";
import { RequireGuest } from "@/components/guards/require-guest";

export default function RegisterPage() {
  return (
    <RequireGuest>
      <RegisterForm />
    </RequireGuest>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await register({ name, email, password, role });
      toast.success(`Welcome to Marketa, ${user.name}`);
      router.push(dashboardPathForRole(user.role));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not create account"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 shadow-sm shadow-stone-950/20 dark:bg-amber-400 dark:text-stone-950">
              <ShoppingBag className="size-5" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Create your account</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Join Marketa as a buyer or seller.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-xl shadow-stone-950/10 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              id="name"
              label="Full name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Seller"
            />
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            <Select
              id="role"
              label="I want to"
              value={role}
              onChange={(e) => setRole(e.target.value as "BUYER" | "SELLER")}
            >
              <option value="BUYER">Shop as a buyer</option>
              <option value="SELLER">Sell products</option>
            </Select>
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-teal-700 hover:text-teal-600 dark:text-amber-300">
              Log in
            </Link>
          </p>
        </div>
      </div>

      <section className="hidden overflow-hidden rounded-[2rem] bg-linear-to-br from-teal-700 via-teal-600 to-amber-400 p-10 text-white shadow-2xl shadow-stone-950/15 lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/25">
            <Store className="size-6" />
          </span>
          <h2 className="mt-8 max-w-sm text-4xl font-black tracking-tight">Start shopping or open your seller shelf.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
            One account flow supports buyers and sellers without adding extra friction.
          </p>
        </div>
        <div className="rounded-3xl border border-white/20 bg-white/16 p-5 backdrop-blur">
          <BadgeCheck className="size-5 text-white" />
          <p className="mt-4 text-sm font-bold">Role-aware navigation and protected dashboards are already wired.</p>
        </div>
      </section>
    </div>
  );
}

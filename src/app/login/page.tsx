"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LockKeyhole, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/client";
import { dashboardPathForRole } from "@/lib/roles";
import { RequireGuest } from "@/components/guards/require-guest";

export default function LoginPage() {
  return (
    <RequireGuest>
      <LoginForm />
    </RequireGuest>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await login({ email, password });
      toast.success(`Welcome back, ${user.name}`);
      router.push(dashboardPathForRole(user.role));
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid credentials"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <section className="hidden overflow-hidden rounded-[2rem] bg-stone-950 p-10 text-white shadow-2xl shadow-stone-950/15 lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
            <ShoppingBag className="size-6" />
          </span>
          <h2 className="mt-8 max-w-sm text-4xl font-black tracking-tight">Run your marketplace session with confidence.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-300">
            Buyers, sellers, and admins all land in one calm control center.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <Store className="size-5 text-amber-300" />
            <p className="mt-4 text-sm font-bold">Seller dashboard</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <LockKeyhole className="size-5 text-teal-300" />
            <p className="mt-4 text-sm font-bold">Secure auth flow</p>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 shadow-sm shadow-stone-950/20 dark:bg-amber-400 dark:text-stone-950">
              <ShoppingBag className="size-5" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Log in to your Marketa account.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-xl shadow-stone-950/10 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}
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
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-teal-700 hover:text-teal-600 dark:text-amber-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Ambient } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — FLEX Bridge" },
      { name: "description", content: "Sign in or create your FLEX Bridge alumni account." },
      { property: "og:title", content: "Sign in — FLEX Bridge" },
      {
        property: "og:description",
        content: "Sign in or create your FLEX Bridge alumni account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        navigate({ to: "/onboarding", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Ambient />
      <main className="mx-auto max-w-[26rem] px-4 py-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 grid place-items-center">
            <span className="font-display font-extrabold text-primary text-sm">F</span>
          </div>
          <p className="font-display font-bold tracking-tight text-[15px]">FLEX Bridge</p>
        </div>

        <section className="rise rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
            {mode === "signup" ? "(a) · CREATE ACCOUNT" : "(a) · SIGN IN"}
          </p>
          <h1 className="font-display font-extrabold tracking-tight text-[24px] leading-tight mt-2">
            {mode === "signup" ? "Join the alumni network" : "Welcome back"}
          </h1>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "signup" && (
              <Field label="Full name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2.5 text-sm outline-none focus:ring-primary"
                  placeholder="Amina Karimova"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2.5 text-sm outline-none focus:ring-primary"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2.5 text-sm outline-none focus:ring-primary"
                placeholder="••••••••"
              />
            </Field>

            <button
              disabled={busy}
              className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-3 w-full text-xs text-primary font-medium"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
        {label.toUpperCase()}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

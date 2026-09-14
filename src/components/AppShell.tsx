import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useMyProfile() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

const NAV = [
  { to: "/dashboard", label: "HOME" },
  { to: "/matches", label: "MATCH" },
  { to: "/opportunities", label: "BOARD" },
  { to: "/forum", label: "FORUM" },
  { to: "/workspace", label: "WORK" },
  { to: "/admin", label: "ADMIN" },
] as const;

export function Ambient() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute -top-24 -left-16 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute top-24 right-10 size-56 rounded-full bg-accent/12 blur-3xl" />
      <div className="absolute bottom-10 -right-10 size-64 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name || "FLEX")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Ambient />

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto flex h-14 max-w-[26rem] items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 grid place-items-center">
              <span className="font-display font-extrabold text-primary text-sm">F</span>
            </div>
            <div className="leading-none">
              <p className="font-display font-bold tracking-tight text-[15px]">FLEX Bridge</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5 uppercase">
                {profile?.participant_role ?? "member"} · mentorship
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="h-9 px-3 grid place-items-center rounded-full bg-card/60 ring-1 ring-black/5 text-muted-foreground text-xs"
            >
              Sign out
            </button>
            <Link
              to="/onboarding"
              className="size-9 rounded-full bg-primary/10 ring-1 ring-primary/20 grid place-items-center font-mono text-[10px] text-primary"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[26rem] px-4 pb-28 pt-5 space-y-5">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/70 border-t border-border">
        <div className="mx-auto max-w-[26rem] grid grid-cols-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground"
              activeProps={{ className: "flex flex-col items-center gap-1 py-2.5 text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`size-2 rounded-full ${isActive ? "bg-primary" : "bg-foreground/25"}`}
                  />
                  <span className="font-mono text-[8px] tracking-wider">{item.label}</span>
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">{children}</p>
      {right}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

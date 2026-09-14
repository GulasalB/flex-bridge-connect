import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Mentorship workspace — FLEX Bridge" },
      {
        name: "description",
        content: "Private space for matched pairs to log 1-on-1 sessions and track goals.",
      },
      { property: "og:title", content: "Mentorship workspace — FLEX Bridge" },
      {
        property: "og:description",
        content: "Private space for matched pairs to log 1-on-1 sessions and track goals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

type Pair = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  goal: string;
  status: string;
};

function Workspace() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [session, setSession] = useState({ title: "", notes: "", duration_minutes: 60 });
  const [goalTitle, setGoalTitle] = useState("");

  const { data: pairs } = useQuery({
    queryKey: ["workspace-pairs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorships")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Pair[];
    },
  });

  const { data: names } = useQuery({
    queryKey: ["pair-names", (pairs ?? []).length],
    enabled: !!pairs?.length,
    queryFn: async () => {
      const ids = Array.from(
        new Set((pairs ?? []).flatMap((p) => [p.mentor_id, p.mentee_id])),
      );
      const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
    },
  });

  useEffect(() => {
    if (!activeId && pairs?.length) setActiveId(pairs[0].id);
  }, [pairs, activeId]);

  const { data: sessions } = useQuery({
    queryKey: ["sessions", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_sessions")
        .select("*")
        .eq("mentorship_id", activeId!)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["goals", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_goals")
        .select("*")
        .eq("mentorship_id", activeId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const active = (pairs ?? []).find((p) => p.id === activeId);
  const partnerId = active
    ? active.mentor_id === user?.id
      ? active.mentee_id
      : active.mentor_id
    : null;
  const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0);
  const done = (goals ?? []).filter((g) => g.completed).length;
  const pct = goals?.length ? Math.round((done / goals.length) * 100) : 0;

  async function acceptPair(id: string) {
    const { error } = await supabase.from("mentorships").update({ status: "active" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mentorship activated");
    queryClient.invalidateQueries({ queryKey: ["workspace-pairs"] });
  }

  async function logSession(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activeId) return;
    const { error } = await supabase
      .from("mentorship_sessions")
      .insert({ ...session, mentorship_id: activeId, created_by: user.id });
    if (error) return toast.error(error.message);
    setSession({ title: "", notes: "", duration_minutes: 60 });
    toast.success("Session logged");
    queryClient.invalidateQueries({ queryKey: ["sessions", activeId] });
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !goalTitle.trim()) return;
    const { error } = await supabase
      .from("mentorship_goals")
      .insert({ mentorship_id: activeId, title: goalTitle });
    if (error) return toast.error(error.message);
    setGoalTitle("");
    queryClient.invalidateQueries({ queryKey: ["goals", activeId] });
  }

  async function toggleGoal(id: string, completed: boolean) {
    const { error } = await supabase
      .from("mentorship_goals")
      .update({ completed: !completed })
      .eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["goals", activeId] });
  }

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel>(a) · YOUR PAIRS</SectionLabel>
        {(pairs ?? []).length === 0 ? (
          <p className="rounded-2xl bg-card/75 ring-1 ring-black/5 p-4 text-xs text-muted-foreground">
            No mentorships yet. Request an intro from the matching screen to open a workspace.
          </p>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4">
            {(pairs ?? []).map((pair) => {
              const other = pair.mentor_id === user?.id ? pair.mentee_id : pair.mentor_id;
              return (
                <button
                  key={pair.id}
                  onClick={() => setActiveId(pair.id)}
                  className={`shrink-0 rounded-full text-xs px-3 py-1.5 ${
                    activeId === pair.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/60 ring-1 ring-black/5 text-muted-foreground"
                  }`}
                >
                  {names?.[other] ?? "FLEX alum"}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {active && (
        <>
          <section className="rise" style={{ animationDelay: "90ms" }}>
            <SectionLabel
              right={
                <span className="font-mono text-[10px] text-accent">{active.status}</span>
              }
            >
              (b) · WORKSPACE
            </SectionLabel>
            <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <div className="size-9 rounded-full bg-primary/10 ring-1 ring-primary/20 grid place-items-center font-mono text-[10px] text-primary">
                  {(names?.[partnerId ?? ""] ?? "FB").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm tracking-tight">
                    Sessions with {names?.[partnerId ?? ""] ?? "your pair"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Goal: {active.goal || "—"} · {Math.round((totalMinutes / 60) * 10) / 10}h logged
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-[10px] text-primary">{pct}%</span>
              </div>

              {active.status === "pending" && (
                <button
                  onClick={() => acceptPair(active.id)}
                  className="mt-3 w-full rounded-lg bg-accent text-accent-foreground text-xs font-medium py-2"
                >
                  Activate this mentorship
                </button>
              )}

              <div className="space-y-1.5 mt-3.5">
                {(sessions ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No sessions logged yet.</p>
                )}
                {(sessions ?? []).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="size-4 shrink-0 rounded-md bg-primary/15 grid place-items-center text-primary font-mono text-[9px]">
                      {(sessions ?? []).length - i}
                    </span>
                    <span className="truncate">
                      {item.title}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground">
                      {new Date(item.occurred_at).toLocaleDateString()} · {item.duration_minutes}m
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={logSession} className="mt-3 space-y-2">
                <input
                  required
                  placeholder="Session title"
                  value={session.title}
                  onChange={(e) => setSession({ ...session, title: e.target.value })}
                  className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Notes"
                    value={session.notes}
                    onChange={(e) => setSession({ ...session, notes: e.target.value })}
                    className="col-span-2 rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
                  />
                  <input
                    type="number"
                    min={5}
                    value={session.duration_minutes}
                    onChange={(e) =>
                      setSession({ ...session, duration_minutes: Number(e.target.value) })
                    }
                    className="rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
                  />
                </div>
                <button className="w-full rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2">
                  Log session
                </button>
              </form>
            </div>
          </section>

          <section className="rise" style={{ animationDelay: "180ms" }}>
            <SectionLabel>(c) · GOAL TRACKER</SectionLabel>
            <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-4 space-y-2">
              {(goals ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No shared goals yet.</p>
              )}
              {(goals ?? []).map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className="flex w-full items-center gap-2 text-left text-sm"
                >
                  <span
                    className={`size-4 rounded-md ring-1 ring-black/10 grid place-items-center font-mono text-[9px] ${
                      goal.completed ? "bg-primary text-primary-foreground" : "bg-card/60"
                    }`}
                  >
                    {goal.completed ? "✓" : ""}
                  </span>
                  <span className={goal.completed ? "line-through text-muted-foreground" : ""}>
                    {goal.title}
                  </span>
                </button>
              ))}
              <form onSubmit={addGoal} className="flex gap-2 pt-1">
                <input
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Add a goal"
                  className="flex-1 rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
                />
                <button className="rounded-lg bg-accent text-accent-foreground text-xs font-medium px-3">
                  Add
                </button>
              </form>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

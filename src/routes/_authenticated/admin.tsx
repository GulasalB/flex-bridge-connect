import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useIsAdmin } from "@/components/AppShell";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — FLEX Bridge" },
      {
        name: "description",
        content: "City representative dashboard: engagement, active pairs, and session hours.",
      },
      { property: "og:title", content: "Admin panel — FLEX Bridge" },
      {
        property: "og:description",
        content: "City representative dashboard: engagement, active pairs, and session hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: isAdmin, isPending } = useIsAdmin();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [profiles, pairs, sessions, events, threads] = await Promise.all([
        supabase.from("profiles").select("id, full_name, city, host_state, flex_year"),
        supabase.from("mentorships").select("*"),
        supabase.from("mentorship_sessions").select("duration_minutes, occurred_at"),
        supabase.from("opportunities").select("id, title, event_date, rsvps(id)"),
        supabase.from("threads").select("id"),
      ]);
      return {
        profiles: profiles.data ?? [],
        pairs: pairs.data ?? [],
        sessions: sessions.data ?? [],
        events: events.data ?? [],
        threads: threads.data ?? [],
      };
    },
  });

  if (isPending) {
    return (
      <AppShell>
        <p className="text-xs text-muted-foreground">Checking access…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <section className="rise">
          <SectionLabel>(a) · RESTRICTED</SectionLabel>
          <div className="rounded-2xl bg-card/75 ring-1 ring-black/5 p-4">
            <p className="font-display font-bold text-sm tracking-tight">
              City representatives only
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This dashboard tracks engagement across the alumni network. Ask a city representative
              to grant you access.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const hours = Math.round(
    ((stats?.sessions ?? []).reduce((s, x) => s + x.duration_minutes, 0) / 60) * 10,
  ) / 10;
  const activePairs = (stats?.pairs ?? []).filter((p) => p.status === "active");
  const rsvpTotal = (stats?.events ?? []).reduce((s, e) => s + (e.rsvps?.length ?? 0), 0);

  const metrics = [
    { label: "Alumni", value: stats?.profiles.length ?? 0 },
    { label: "Active pairs", value: activePairs.length },
    { label: "Session hours", value: hours },
    { label: "Event RSVPs", value: rsvpTotal },
    { label: "Threads", value: stats?.threads.length ?? 0 },
    { label: "Pending pairs", value: (stats?.pairs ?? []).filter((p) => p.status === "pending").length },
  ];

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel>(a) · ENGAGEMENT</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-3"
            >
              <p className="font-display font-extrabold text-[22px] tracking-tight text-primary leading-none">
                {metric.value}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground mt-1.5 uppercase">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: "90ms" }}>
        <SectionLabel>(b) · MENTORSHIP PAIRS</SectionLabel>
        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(stats?.pairs ?? []).length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No mentorships created yet.</p>
          )}
          {(stats?.pairs ?? []).map((pair) => {
            const name = (id: string) =>
              (stats?.profiles ?? []).find((p) => p.id === id)?.full_name ?? "FLEX alum";
            return (
              <div key={pair.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {name(pair.mentor_id)} → {name(pair.mentee_id)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{pair.goal || "—"}</p>
                </div>
                <span
                  className={`shrink-0 font-mono text-[9px] rounded-full px-2 py-0.5 ${
                    pair.status === "active"
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {pair.status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: "180ms" }}>
        <SectionLabel>(c) · EVENT TURNOUT</SectionLabel>
        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(stats?.events ?? []).length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No opportunities posted yet.</p>
          )}
          {(stats?.events ?? []).map((event) => (
            <div key={event.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  {formatDate(event.event_date)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-primary">
                {event.rsvps?.length ?? 0} RSVPs
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

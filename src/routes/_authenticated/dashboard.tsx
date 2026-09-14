import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser, useMyProfile } from "@/components/AppShell";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FLEX Bridge" },
      {
        name: "description",
        content: "Your matches, upcoming events, and mentorship progress at a glance.",
      },
      { property: "og:title", content: "Dashboard — FLEX Bridge" },
      {
        property: "og:description",
        content: "Your matches, upcoming events, and mentorship progress at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ count: mentors }, pairs, events] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("id", user!.id),
        supabase.from("mentorships").select("id, status"),
        supabase
          .from("opportunities")
          .select("id, title, event_date, host_label")
          .gte("event_date", new Date().toISOString())
          .order("event_date")
          .limit(2),
      ]);
      const pairIds = (pairs.data ?? []).map((p) => p.id);
      let minutes = 0;
      if (pairIds.length) {
        const { data: sessions } = await supabase
          .from("mentorship_sessions")
          .select("duration_minutes")
          .in("mentorship_id", pairIds);
        minutes = (sessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0);
      }
      return {
        alumni: mentors ?? 0,
        activePairs: (pairs.data ?? []).filter((p) => p.status === "active").length,
        hours: Math.round(minutes / 60),
        events: events.data ?? [],
      };
    },
  });

  return (
    <AppShell>
      <section className="rise rounded-2xl bg-card/70 backdrop-blur-xl ring-1 ring-black/5 p-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
            (a) · DASHBOARD
          </p>
          <span className="font-mono text-[10px] text-accent">● crossable</span>
        </div>
        <h1 className="font-display font-extrabold tracking-tight text-[26px] leading-[1.05] mt-2 text-balance">
          {profile?.full_name ? `${profile.full_name.split(" ")[0]}, your ` : "Your "}
          <span className="text-primary">next shore</span> is ready.
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 text-pretty">
          {profile?.onboarded
            ? `${profile.goals?.length ?? 0} goals set · ${profile.host_country || "host country"} ${profile.flex_year ? `· FLEX ${profile.flex_year}` : ""}`
            : "Finish your profile so we can rank your mentor matches."}
        </p>

        <div className="relative mt-4 h-16">
          <svg viewBox="0 0 330 64" className="absolute inset-0 w-full h-full" fill="none">
            <path
              d="M6 40 C 90 40, 110 12, 165 12 C 220 12, 240 40, 324 40"
              stroke="hsl(211 82% 49% / 0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
            />
            <path
              className="draw-cable"
              d="M6 40 C 90 40, 110 12, 165 12 C 220 12, 240 40, 324 40"
              stroke="hsl(211 82% 49%)"
              strokeWidth="2"
              strokeDasharray="480"
              strokeDashoffset="480"
            />
          </svg>
          <div className="absolute left-0 top-6 flex flex-col items-center">
            <div className="size-3 rounded-full bg-foreground/70" />
            <span className="font-mono text-[9px] text-muted-foreground mt-1.5">You</span>
          </div>
          <div className="absolute right-0 top-6 flex flex-col items-center">
            <div className="size-4 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="font-mono text-[9px] text-muted-foreground mt-1.5">Mentor</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          <Stat value={stats?.alumni ?? 0} label="ALUMNI" />
          <Stat value={stats?.activePairs ?? 0} label="PAIRS" accent />
          <Stat value={`${stats?.hours ?? 0}h`} label="LOGGED" />
        </div>

        {!profile?.onboarded && (
          <Link
            to="/onboarding"
            className="mt-3 block w-full rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2 text-center"
          >
            Complete your profile
          </Link>
        )}
      </section>

      <section className="rise" style={{ animationDelay: "90ms" }}>
        <SectionLabel
          right={
            <Link to="/opportunities" className="text-xs font-medium text-primary">
              See all
            </Link>
          }
        >
          (b) · NEXT UP
        </SectionLabel>
        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(stats?.events ?? []).length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No upcoming events posted yet.</p>
          )}
          {(stats?.events ?? []).map((event) => (
            <div key={event.id} className="p-3">
              <p className="font-mono text-[9px] text-accent">{formatDate(event.event_date)}</p>
              <p className="font-display font-bold text-sm tracking-tight mt-0.5">{event.title}</p>
              <p className="text-xs text-muted-foreground truncate">{event.host_label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: "180ms" }}>
        <SectionLabel>(c) · JUMP BACK IN</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile to="/matches" title="Find a mentor" body="Ranked by shared goals" />
          <Tile to="/workspace" title="Workspace" body="Log sessions & goals" />
          <Tile to="/forum" title="Discussion" body="Ask the community" />
          <Tile to="/opportunities" title="Opportunities" body="RSVP to events" />
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card/60 ring-1 ring-black/5 p-2.5">
      <p
        className={`font-display font-bold text-lg leading-none ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
      <p className="font-mono text-[9px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function Tile({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-3 block"
    >
      <p className="font-display font-bold text-sm tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
    </Link>
  );
}

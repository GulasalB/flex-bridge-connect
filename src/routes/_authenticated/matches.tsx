import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser, useMyProfile } from "@/components/AppShell";
import { GOALS, matchScore } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "Mentor matching — FLEX Bridge" },
      {
        name: "description",
        content: "Mentors ranked against your goals: college applications, career, transition.",
      },
      { property: "og:title", content: "Mentor matching — FLEX Bridge" },
      {
        property: "og:description",
        content: "Mentors ranked against your goals: college applications, career, transition.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Matches,
});

function Matches() {
  const { data: user } = useCurrentUser();
  const { data: me } = useMyProfile();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("All goals");

  const { data: people } = useQuery({
    queryKey: ["mentor-pool", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user!.id)
        .in("participant_role", ["mentor", "both"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: mentorships } = useQuery({
    queryKey: ["my-mentorships", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("mentorships").select("*");
      if (error) throw error;
      return data;
    },
  });

  async function requestIntro(mentorId: string, goal: string) {
    if (!user) return;
    const { error } = await supabase
      .from("mentorships")
      .insert({ mentor_id: mentorId, mentee_id: user.id, goal, status: "pending" });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already requested" : error.message);
      return;
    }
    toast.success("Intro requested");
    queryClient.invalidateQueries({ queryKey: ["my-mentorships"] });
  }

  const ranked = (people ?? [])
    .map((p) => ({ ...p, score: matchScore(me?.goals ?? [], p.goals ?? []) }))
    .filter((p) => filter === "All goals" || (p.goals ?? []).includes(filter))
    .sort((a, b) => b.score - a.score);

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel
          right={
            <span className="font-mono text-[10px] text-muted-foreground">
              {ranked.length} results
            </span>
          }
        >
          (a) · MENTOR MATCHES
        </SectionLabel>

        <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-4 px-4">
          {["All goals", ...GOALS].map((goal) => (
            <button
              key={goal}
              onClick={() => setFilter(goal)}
              className={`shrink-0 rounded-full text-xs px-3 py-1.5 ${
                filter === goal
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/60 ring-1 ring-black/5 text-muted-foreground"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {ranked.length === 0 && (
            <p className="rounded-2xl bg-card/75 ring-1 ring-black/5 p-4 text-xs text-muted-foreground">
              No mentors match this filter yet. Invite alumni to join, or switch filters.
            </p>
          )}
          {ranked.map((person) => {
            const existing = (mentorships ?? []).find(
              (m) => m.mentor_id === person.id && m.mentee_id === user?.id,
            );
            return (
              <div
                key={person.id}
                className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-3 flex gap-3"
              >
                <div className="size-12 shrink-0 rounded-xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center font-display font-bold text-primary text-sm">
                  {(person.full_name || "FB")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold text-sm tracking-tight truncate">
                      {person.full_name || "FLEX alum"}
                    </p>
                    <span
                      className={`font-mono text-[9px] rounded-full px-2 py-0.5 ${
                        person.score >= 80
                          ? "bg-accent/15 text-accent"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {person.score}% match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {(person.goals ?? [])[0] ?? "Open to mentoring"} · '{person.flex_year || "—"}{" "}
                    Alum, {person.host_state || person.host_country || "—"}
                  </p>
                  {person.bio && (
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                      {person.bio}
                    </p>
                  )}
                  <button
                    disabled={!!existing}
                    onClick={() =>
                      requestIntro(person.id, (person.goals ?? [])[0] ?? "General mentorship")
                    }
                    className={`mt-2 w-full rounded-lg text-xs font-medium py-2 ${
                      existing
                        ? "bg-card/70 ring-1 ring-black/10 text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {existing
                      ? existing.status === "active"
                        ? "Matched"
                        : "Intro requested"
                      : "Request intro"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

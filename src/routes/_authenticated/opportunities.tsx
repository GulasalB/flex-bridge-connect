import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser, useIsAdmin } from "@/components/AppShell";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities board — FLEX Bridge" },
      {
        name: "description",
        content: "Events, workshops, and alumni opportunities posted by city representatives.",
      },
      { property: "og:title", content: "Opportunities board — FLEX Bridge" },
      {
        property: "og:description",
        content: "Events, workshops, and alumni opportunities posted by city representatives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const { data: user } = useCurrentUser();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    host_label: "",
    capacity: 50,
  });

  const { data: events } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, rsvps(user_id)")
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  async function toggleRsvp(opportunityId: string, going: boolean) {
    if (!user) return;
    const query = going
      ? supabase.from("rsvps").delete().eq("opportunity_id", opportunityId).eq("user_id", user.id)
      : supabase.from("rsvps").insert({ opportunity_id: opportunityId, user_id: user.id });
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(going ? "RSVP removed" : "You're going");
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("opportunities").insert({
      ...form,
      event_date: new Date(form.event_date).toISOString(),
      created_by: user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opportunity posted");
    setOpen(false);
    setForm({
      title: "",
      description: "",
      event_date: "",
      location: "",
      host_label: "",
      capacity: 50,
    });
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  }

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel
          right={
            isAdmin ? (
              <button
                onClick={() => setOpen(!open)}
                className="text-xs font-medium text-primary"
              >
                {open ? "Cancel" : "Post event"}
              </button>
            ) : undefined
          }
        >
          (a) · OPPORTUNITIES
        </SectionLabel>

        {isAdmin && open && (
          <form
            onSubmit={createEvent}
            className="rounded-2xl bg-card/75 ring-1 ring-black/5 p-3 space-y-2 mb-3"
          >
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <textarea
              rows={2}
              placeholder="What alumni should expect"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <input
              required
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
              />
              <input
                placeholder="Host (City Rep)"
                value={form.host_label}
                onChange={(e) => setForm({ ...form, host_label: e.target.value })}
                className="rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
              />
            </div>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <button className="w-full rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2">
              Publish
            </button>
          </form>
        )}

        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(events ?? []).length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">
              No opportunities posted yet. City representatives can post events here.
            </p>
          )}
          {(events ?? []).map((event) => {
            const rsvps = event.rsvps ?? [];
            const going = rsvps.some((r) => r.user_id === user?.id);
            return (
              <div key={event.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] text-accent">
                      {formatDate(event.event_date)}
                    </p>
                    <p className="font-display font-bold text-sm tracking-tight mt-0.5">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.host_label || "FLEX Bridge"} · {rsvps.length}/{event.capacity} going
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground/80 mt-1">{event.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleRsvp(event.id, going)}
                    className={`shrink-0 rounded-lg text-xs font-medium px-3 py-2 ${
                      going
                        ? "bg-card/70 ring-1 ring-black/10 text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {going ? "Going" : "RSVP"}
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

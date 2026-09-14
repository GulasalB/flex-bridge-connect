import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser } from "@/components/AppShell";

const CATEGORIES = [
  "University applications",
  "Reverse culture shock",
  "Career planning",
  "General",
];

export const Route = createFileRoute("/_authenticated/forum")({
  head: () => ({
    meta: [
      { title: "Discussion board — FLEX Bridge" },
      {
        name: "description",
        content:
          "Ask alumni about university applications, reverse culture shock, and career planning.",
      },
      { property: "og:title", content: "Discussion board — FLEX Bridge" },
      {
        property: "og:description",
        content:
          "Ask alumni about university applications, reverse culture shock, and career planning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Forum,
});

function Forum() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "University applications" });

  const { data: threads } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threads")
        .select("*, replies(id), profiles:author_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("threads").insert({ ...form, author_id: user.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ title: "", body: "", category: "University applications" });
    setOpen(false);
    toast.success("Thread posted");
    queryClient.invalidateQueries({ queryKey: ["threads"] });
  }

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel
          right={
            <button onClick={() => setOpen(!open)} className="text-xs font-medium text-primary">
              {open ? "Cancel" : "New thread"}
            </button>
          }
        >
          (a) · DISCUSSION
        </SectionLabel>

        {open && (
          <form
            onSubmit={createThread}
            className="rounded-2xl bg-card/75 ring-1 ring-black/5 p-3 space-y-2 mb-3"
          >
            <input
              required
              placeholder="Your question"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <textarea
              rows={3}
              placeholder="Add context…"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
            />
            <div className="flex gap-1.5 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, category: c })}
                  className={`shrink-0 rounded-full text-xs px-3 py-1.5 ${
                    form.category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/60 ring-1 ring-black/5 text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button className="w-full rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2">
              Post thread
            </button>
          </form>
        )}

        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(threads ?? []).length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">
              No threads yet — start the first conversation.
            </p>
          )}
          {(threads ?? []).map((thread) => (
            <Link
              key={thread.id}
              to="/forum/$threadId"
              params={{ threadId: thread.id }}
              className="block p-3"
            >
              <p className="text-sm font-medium tracking-tight">{thread.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Asked by{" "}
                {(thread.profiles as { full_name?: string } | null)?.full_name ?? "FLEX alum"} ·{" "}
                {thread.category}
              </p>
              <div className="flex gap-3 mt-2 font-mono text-[10px] text-muted-foreground">
                <span>{(thread.replies ?? []).length} replies</span>
                <span>{new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

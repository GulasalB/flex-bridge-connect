import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/forum/$threadId")({
  head: () => ({
    meta: [
      { title: "Thread — FLEX Bridge" },
      { name: "description", content: "A FLEX Bridge community discussion thread." },
      { property: "og:title", content: "Thread — FLEX Bridge" },
      { property: "og:description", content: "A FLEX Bridge community discussion thread." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadView,
});

function ThreadView() {
  const { threadId } = Route.useParams();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: thread } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threads")
        .select("*, profiles:author_id(full_name)")
        .eq("id", threadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: replies } = useQuery({
    queryKey: ["replies", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("replies")
        .select("*, profiles:author_id(full_name)")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    const { error } = await supabase
      .from("replies")
      .insert({ thread_id: threadId, author_id: user.id, body });
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
  }

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel
          right={
            <Link to="/forum" className="text-xs font-medium text-primary">
              Back
            </Link>
          }
        >
          (a) · THREAD
        </SectionLabel>

        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-4">
          <p className="font-mono text-[9px] text-accent">{thread?.category ?? ""}</p>
          <h1 className="font-display font-extrabold tracking-tight text-[20px] leading-tight mt-1">
            {thread?.title ?? "Loading…"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {(thread?.profiles as { full_name?: string } | null)?.full_name ?? "FLEX alum"}
          </p>
          {thread?.body && <p className="text-sm mt-3 whitespace-pre-wrap">{thread.body}</p>}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: "90ms" }}>
        <SectionLabel>(b) · {(replies ?? []).length} REPLIES</SectionLabel>
        <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
          {(replies ?? []).length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No replies yet — be the first.</p>
          )}
          {(replies ?? []).map((item) => (
            <div key={item.id} className="p-3">
              <p className="text-sm whitespace-pre-wrap">{item.body}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1.5">
                {(item.profiles as { full_name?: string } | null)?.full_name ?? "FLEX alum"} ·{" "}
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={reply} className="mt-3 space-y-2">
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your advice…"
            className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-primary"
          />
          <button className="w-full rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2">
            Post reply
          </button>
        </form>
      </section>
    </AppShell>
  );
}

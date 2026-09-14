import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SectionLabel, useCurrentUser, useMyProfile } from "@/components/AppShell";
import { GOALS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Your FLEX profile — FLEX Bridge" },
      {
        name: "description",
        content: "Add your FLEX year, host country and state, goals, and contact links.",
      },
      { property: "og:title", content: "Your FLEX profile — FLEX Bridge" },
      {
        property: "og:description",
        content: "Add your FLEX year, host country and state, goals, and contact links.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile, isLoading } = useMyProfile();

  const [form, setForm] = useState({
    full_name: "",
    flex_year: "",
    host_country: "",
    host_state: "",
    city: "",
    contact_email: "",
    linkedin_url: "",
    instagram_url: "",
    bio: "",
    participant_role: "mentee",
    goals: [] as string[],
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      flex_year: profile.flex_year ?? "",
      host_country: profile.host_country ?? "",
      host_state: profile.host_state ?? "",
      city: profile.city ?? "",
      contact_email: profile.contact_email ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      instagram_url: profile.instagram_url ?? "",
      bio: profile.bio ?? "",
      participant_role: profile.participant_role ?? "mentee",
      goals: profile.goals ?? [],
    });
  }, [profile]);

  function toggleGoal(goal: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...form, onboarded: true });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Profile saved");
    navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <section className="rise">
        <SectionLabel>(a) · YOUR FLEX PROFILE</SectionLabel>
        <form
          onSubmit={save}
          className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 p-4 space-y-3"
        >
          <h1 className="font-display font-extrabold tracking-tight text-[22px] leading-tight">
            Tell us where you crossed from.
          </h1>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Loading your details…" : "This drives your mentor matches."}
          </p>

          <Field label="Full name">
            <Input
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="FLEX year">
              <Input
                value={form.flex_year}
                onChange={(v) => setForm({ ...form, flex_year: v })}
                placeholder="2019-20"
                required
              />
            </Field>
            <Field label="Host country">
              <Input
                value={form.host_country}
                onChange={(v) => setForm({ ...form, host_country: v })}
                placeholder="USA"
                required
              />
            </Field>
            <Field label="Host state">
              <Input
                value={form.host_state}
                onChange={(v) => setForm({ ...form, host_state: v })}
                placeholder="Texas"
                required
              />
            </Field>
            <Field label="Current city">
              <Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            </Field>
          </div>

          <Field label="I'm joining as">
            <div className="flex gap-1.5">
              {["mentee", "mentor", "both"].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setForm({ ...form, participant_role: role })}
                  className={`flex-1 rounded-full text-xs px-3 py-1.5 ring-1 ${
                    form.participant_role === role
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card/60 ring-black/5 text-muted-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Goals">
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`rounded-full text-xs px-3 py-1.5 ring-1 ${
                    form.goals.includes(goal)
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card/60 ring-black/5 text-muted-foreground"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Short bio">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2.5 text-sm outline-none focus:ring-primary"
              placeholder="What you can help with, or what you're looking for."
            />
          </Field>

          <p className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground pt-1">
            OPTIONAL CONTACT
          </p>
          <Field label="Contact email">
            <Input
              value={form.contact_email}
              onChange={(v) => setForm({ ...form, contact_email: v })}
              placeholder="you@example.com"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="LinkedIn">
              <Input
                value={form.linkedin_url}
                onChange={(v) => setForm({ ...form, linkedin_url: v })}
                placeholder="linkedin.com/in/…"
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={form.instagram_url}
                onChange={(v) => setForm({ ...form, instagram_url: v })}
                placeholder="@handle"
              />
            </Field>
          </div>

          <button
            disabled={busy}
            className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>
    </AppShell>
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

function Input({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-card/70 ring-1 ring-black/10 px-3 py-2.5 text-sm outline-none focus:ring-primary"
    />
  );
}

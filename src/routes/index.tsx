import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambient } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FLEX Bridge — Alumni Mentorship & Peer Matching" },
      {
        name: "description",
        content:
          "Join FLEX Bridge to be matched with alumni mentors, RSVP to city events, and share advice with the FLEX community.",
      },
      { property: "og:title", content: "FLEX Bridge — Alumni Mentorship & Peer Matching" },
      {
        property: "og:description",
        content:
          "Match with alumni mentors, RSVP to city events, and trade advice on applications, career, and coming home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Ambient />
      <main className="mx-auto max-w-[26rem] px-4 py-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 grid place-items-center">
            <span className="font-display font-extrabold text-primary text-sm">F</span>
          </div>
          <p className="font-display font-bold tracking-tight text-[15px]">FLEX Bridge</p>
        </div>

        <section className="rise rounded-2xl bg-card/70 backdrop-blur-xl ring-1 ring-black/5 p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
              (a) · ALUMNI NETWORK
            </p>
            <span className="font-mono text-[10px] text-accent">● open</span>
          </div>
          <h1 className="font-display font-extrabold tracking-tight text-[26px] leading-[1.05] mt-2 text-balance">
            The bridge to your <span className="text-primary">next shore</span> starts here.
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-pretty">
            Mentors, city events, and a forum for FLEX alumni — matched to the goals you pick at
            sign-up.
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

          <Link
            to="/auth"
            className="mt-2 block w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 text-center"
          >
            Create your account
          </Link>
        </section>

        <section className="rise" style={{ animationDelay: "90ms" }}>
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mb-2.5">
            (b) · WHAT YOU GET
          </p>
          <div className="rounded-2xl bg-card/75 backdrop-blur-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
            {[
              ["Mentor matching", "Ranked matches on college apps, career, and transition goals."],
              ["Opportunities board", "City and university reps post events; you RSVP in one tap."],
              ["Discussion board", "Ask the community about applications and coming home."],
              ["Mentorship workspace", "Log 1-on-1 sessions and track shared goals privately."],
            ].map(([title, body]) => (
              <div key={title} className="p-3">
                <p className="font-display font-bold text-sm tracking-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

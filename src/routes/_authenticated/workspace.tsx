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
  component: Workspace;
});

function Workspace() {
  return null;
}

import { createFileRoute } from "@tanstack/react-router";
import { TrainingHub } from "@/components/team/TrainingHub";

export const Route = createFileRoute("/_authenticated/training-records")({
  head: () => ({
    meta: [
      { title: "Training Records — Control Room Manager" },
      { name: "description", content: "Westgrove induction & training — Controller/Dual Service (Sections 1–12) and Cleaning (Sections 1–4)." },
      { property: "og:title", content: "Training Records — Control Room Manager" },
      { property: "og:description", content: "Westgrove induction & training — Controller/Dual Service (Sections 1–12) and Cleaning (Sections 1–4)." },
    ],
  }),
  component: TrainingHub,
});

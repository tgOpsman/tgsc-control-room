import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/weather-log")({
  head: () => ({
    meta: [
      { title: "Weather Log — Control Room Manager" },
      { name: "description", content: "BMS temperature readings and weather conditions." },
      { property: "og:title", content: "Weather Log — Control Room Manager" },
      { property: "og:description", content: "BMS temperature readings and weather conditions." },
    ],
  }),
  component: () => <ModulePage path="/weather-log" />,
});

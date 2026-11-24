import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { db } from "@/lib/db";

export function WeeklyVisitsChart() {
  const { data: visits } = useQuery({
    queryKey: ["weekly-visits"],
    refetchInterval: 60000,
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), 6)).toISOString();
      const { data } = await db("vehicle_visits").select("check_in_time").gte("check_in_time", since);
      return data ?? [];
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    const count = (visits ?? []).filter((v: any) => {
      if (!v.check_in_time) return false;
      const t = parseISO(v.check_in_time);
      return t >= start && t <= end;
    }).length;
    return { day: format(date, "EEE"), date: format(date, "dd MMM"), count, isToday: i === 6 };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-lg font-semibold text-foreground mb-1">Daily Visit Summary</h2>
      <p className="text-xs text-muted-foreground mb-5">Total vehicle visits per day — last 7 days</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={days} barSize={32}>
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            cursor={{ fill: "var(--muted)", radius: 6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              return (
                <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
                  <p className="font-semibold text-foreground">{d.date}</p>
                  <p className="text-muted-foreground">{d.count} visit{d.count !== 1 ? "s" : ""}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {days.map((d, i) => (
              <Cell key={i} fill={d.isToday ? "var(--accent)" : "var(--primary)"} opacity={d.isToday ? 1 : 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

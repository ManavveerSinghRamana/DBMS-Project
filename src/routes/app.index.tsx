import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/StatCard";
import { AlertTriangle, Home, Users, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatIndianCurrency, formatIndianNumber } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

interface Overview {
  disaster_id: string;
  disaster_name: string;
  disaster_type: string;
  status: string;
  affected_area_count: number;
  total_affected_population: number;
  shelter_count: number;
  total_capacity: number;
  total_occupied: number;
}

function Dashboard() {
  const { isStaff, hasRole } = useAuth();
  const [overview, setOverview] = useState<Overview[]>([]);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [donationSeries, setDonationSeries] = useState<{ day: string; total: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: ov, error: ovErr } = await supabase
        .from("v_disaster_overview")
        .select("*")
        .order("start_date", { ascending: false });
      if (ovErr) toast.error(ovErr.message);
      setOverview((ov ?? []) as Overview[]);

      // Donations: aggregate via sql view if user has access, else own
      const { data: ds } = await supabase
        .from("v_donation_summary")
        .select("*")
        .order("day", { ascending: true })
        .limit(30);
      if (ds) {
        setDonationSeries(ds.map((d: any) => ({ day: d.day, total: Number(d.total_amount) })));
      }

      const { data: dn } = await supabase
        .from("donations")
        .select("amount");
      const tot = (dn ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
      setDonationsTotal(tot);
      setDonationsCount((dn ?? []).length);
    })();

    // realtime: new disasters
    const ch = supabase
      .channel("dashboard-disasters")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "disasters" }, (p: any) => {
        toast.info(`New disaster reported: ${p.new.disaster_name}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalPop = overview.reduce((s, r) => s + Number(r.total_affected_population || 0), 0);
  const totalShelters = overview.reduce((s, r) => s + Number(r.shelter_count || 0), 0);
  const activeCount = overview.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active disasters" value={activeCount} icon={AlertTriangle} tone="primary" hint={`${overview.length} total`} />
        <StatCard label="Affected population" value={formatIndianNumber(totalPop)} icon={Users} tone="warning" />
        <StatCard label="Shelters" value={totalShelters} icon={Home} tone="secondary" />
        <StatCard
          label={hasRole("donor") || isStaff ? "Donations total" : "My donations"}
          value={formatIndianCurrency(donationsTotal)}
          icon={HeartHandshake}
          tone="success"
          hint={`${donationsCount} ${donationsCount === 1 ? "donation" : "donations"}`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Affected population by disaster</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.slice(0, 8).map((r) => ({
                name: r.disaster_name.length > 14 ? r.disaster_name.slice(0, 14) + "…" : r.disaster_name,
                population: Number(r.total_affected_population),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="population" fill="oklch(0.55 0.18 25)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Donations over time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationSeries}>
                <defs>
                  <linearGradient id="don" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.45 0.14 230)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.45 0.14 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="oklch(0.45 0.14 230)" fill="url(#don)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Disaster overview (live SQL view)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Disaster</th>
                <th className="pr-4">Type</th>
                <th className="pr-4">Status</th>
                <th className="pr-4">Areas</th>
                <th className="pr-4">Population</th>
                <th className="pr-4">Shelters</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((r) => (
                <tr key={r.disaster_id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.disaster_name}</td>
                  <td className="pr-4 capitalize">{r.disaster_type}</td>
                  <td className="pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="pr-4">{r.affected_area_count}</td>
                  <td className="pr-4">{formatIndianNumber(Number(r.total_affected_population))}</td>
                  <td className="pr-4">{r.shelter_count}</td>
                  <td>
                    {r.total_capacity > 0
                      ? `${r.total_occupied}/${r.total_capacity} (${Math.round((Number(r.total_occupied) / Number(r.total_capacity)) * 100)}%)`
                      : "—"}
                  </td>
                </tr>
              ))}
              {overview.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No disasters yet. {isStaff && "Add one from the Disasters page."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
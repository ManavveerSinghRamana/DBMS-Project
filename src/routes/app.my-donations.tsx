import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { formatIndianCurrency, formatIndianDate } from "@/lib/format";

export const Route = createFileRoute("/app/my-donations")({
  component: MyDonations,
});

function MyDonations() {
  const { user, isStaff } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("donations").select("*, disasters(disaster_name)").order("donation_date", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [user]);

  const total = items.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">{isStaff ? "All donations" : "Your contribution"}</div>
        <div className="text-3xl font-bold mt-1">{formatIndianCurrency(total)}</div>
        <div className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "donation" : "donations"}</div>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr>
            <th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Directed to</th><th className="px-4 py-3">Message</th>
          </tr></thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.donation_id} className="border-t">
                <td className="px-4 py-3">{formatIndianDate(d.donation_date)}</td>
                <td className="px-4 py-3 font-medium">{formatIndianCurrency(Number(d.amount))}</td>
                <td className="px-4 py-3">{d.disasters?.disaster_name ?? "General relief"}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.message ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No donations yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/distribution")({
  component: DistPage,
});

function DistPage() {
  const { user, isStaff } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area_id: "", material_name: "", quantity: 1, notes: "" });

  const load = async () => {
    const { data } = await supabase.from("distribution").select("*, affected_areas(area_name)").order("distribution_date", { ascending: false });
    setItems(data ?? []);
    const { data: a } = await supabase.from("affected_areas").select("area_id, area_name");
    setAreas(a ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area_id) return toast.error("Pick an area");
    const { error } = await supabase.from("distribution").insert({
      area_id: form.area_id,
      material_name: form.material_name.trim(),
      quantity: Number(form.quantity),
      notes: form.notes.trim() || null,
      admin_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Distribution recorded");
    setOpen(false);
    setForm({ area_id: "", material_name: "", quantity: 1, notes: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Record distribution</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New distribution log</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>Area</Label>
                  <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>{areas.map((a) => <SelectItem key={a.area_id} value={a.area_id}>{a.area_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Material</Label><Input required placeholder="e.g. Food packets, Blankets" value={form.material_name} onChange={(e) => setForm({ ...form, material_name: e.target.value })} /></div>
                <div><Label>Quantity</Label><Input type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <DialogFooter><Button type="submit">Record</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr>
            <th className="px-4 py-3">Date</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Material</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Notes</th>
          </tr></thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.distribution_id} className="border-t">
                <td className="px-4 py-3">{new Date(d.distribution_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{d.affected_areas?.area_name}</td>
                <td className="px-4 py-3 font-medium">{d.material_name}</td>
                <td className="px-4 py-3">{d.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.notes ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No distribution records.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
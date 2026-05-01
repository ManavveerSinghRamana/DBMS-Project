import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { formatIndianNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/areas")({
  component: AreasPage,
});

type Area = {
  area_id: string; disaster_id: string; area_name: string; severity: string;
  population: number; latitude: number | null; longitude: number | null;
};

function AreasPage() {
  const { isStaff } = useAuth();
  const [areas, setAreas] = useState<(Area & { disasters?: { disaster_name: string } })[]>([]);
  const [disasters, setDisasters] = useState<{ disaster_id: string; disaster_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    disaster_id: "", area_name: "", severity: "medium", population: 0,
    latitude: "" as string | number, longitude: "" as string | number,
  });

  const load = async () => {
    const { data } = await supabase.from("affected_areas").select("*, disasters(disaster_name)").order("created_at", { ascending: false });
    setAreas((data ?? []) as any);
    const { data: d } = await supabase.from("disasters").select("disaster_id, disaster_name").order("start_date", { ascending: false });
    setDisasters(d ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id) return toast.error("Pick a disaster");
    const { error } = await supabase.from("affected_areas").insert({
      disaster_id: form.disaster_id,
      area_name: form.area_name.trim(),
      severity: form.severity,
      population: Number(form.population),
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    });
    if (error) return toast.error(error.message);
    toast.success("Area added");
    setOpen(false);
    setForm({ disaster_id: "", area_name: "", severity: "medium", population: 0, latitude: "", longitude: "" });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this area?")) return;
    const { error } = await supabase.from("affected_areas").delete().eq("area_id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add area</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New affected area</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>Disaster</Label>
                  <Select value={form.disaster_id} onValueChange={(v) => setForm({ ...form, disaster_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select disaster" /></SelectTrigger>
                    <SelectContent>{disasters.map((d) => <SelectItem key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Area name</Label><Input required value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Population</Label><Input type="number" min={0} value={form.population} onChange={(e) => setForm({ ...form, population: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
                  <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr>
            <th className="px-4 py-3">Area</th><th className="px-4 py-3">Disaster</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Population</th><th className="px-4 py-3">Coords</th>{isStaff && <th></th>}
          </tr></thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.area_id} className="border-t">
                <td className="px-4 py-3 font-medium">{a.area_name}</td>
                <td className="px-4 py-3">{a.disasters?.disaster_name ?? "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${a.severity === "critical" ? "bg-destructive/15 text-destructive" : a.severity === "high" ? "bg-primary/10 text-primary" : a.severity === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{a.severity}</span></td>
                <td className="px-4 py-3">{formatIndianNumber(a.population)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : "—"}</td>
                {isStaff && <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon" onClick={() => remove(a.area_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>}
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={isStaff ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">No affected areas yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
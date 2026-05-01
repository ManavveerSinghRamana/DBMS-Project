import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, Phone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/app/shelters")({
  component: SheltersPage,
});

type Shelter = {
  shelter_id: string; area_id: string; shelter_name: string; location: string;
  capacity: number; occupied_count: number; contact_number: string | null;
  latitude: number | null; longitude: number | null;
  affected_areas?: { area_name: string };
};

function SheltersPage() {
  const { isStaff } = useAuth();
  const [items, setItems] = useState<Shelter[]>([]);
  const [areas, setAreas] = useState<{ area_id: string; area_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState<{ shelter: Shelter | null; type: "intake" | "release" }>({ shelter: null, type: "intake" });
  const [moveCount, setMoveCount] = useState(1);
  const [form, setForm] = useState({
    area_id: "", shelter_name: "", location: "", capacity: 50,
    contact_number: "", latitude: "" as string | number, longitude: "" as string | number,
  });

  const load = async () => {
    const { data } = await supabase.from("shelters").select("*, affected_areas(area_name)").order("created_at", { ascending: false });
    setItems((data ?? []) as any);
    const { data: a } = await supabase.from("affected_areas").select("area_id, area_name");
    setAreas(a ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area_id) return toast.error("Pick an area");
    const { error } = await supabase.from("shelters").insert({
      area_id: form.area_id,
      shelter_name: form.shelter_name.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      contact_number: form.contact_number.trim() || null,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    });
    if (error) return toast.error(error.message);
    toast.success("Shelter added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete shelter?")) return;
    const { error } = await supabase.from("shelters").delete().eq("shelter_id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const submitMove = async () => {
    if (!moveOpen.shelter || moveCount < 1) return;
    const { error } = await supabase.from("shelter_movements").insert({
      shelter_id: moveOpen.shelter.shelter_id,
      movement_type: moveOpen.type,
      count: moveCount,
    });
    if (error) return toast.error(error.message);
    toast.success(`${moveOpen.type === "intake" ? "Intake" : "Release"} recorded — occupancy auto-updated by trigger`);
    setMoveOpen({ shelter: null, type: "intake" });
    setMoveCount(1);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add shelter</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New shelter</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>Affected area</Label>
                  <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>{areas.map((a) => <SelectItem key={a.area_id} value={a.area_id}>{a.area_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Shelter name</Label><Input required value={form.shelter_name} onChange={(e) => setForm({ ...form, shelter_name: e.target.value })} /></div>
                <div><Label>Location address</Label><Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Capacity</Label><Input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
                  <div><Label>Contact</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s) => {
          const pct = Math.min(100, Math.round((s.occupied_count / s.capacity) * 100));
          return (
            <Card key={s.shelter_id} className="p-5 space-y-3">
              <div>
                <div className="font-semibold text-lg">{s.shelter_name}</div>
                <div className="text-sm text-muted-foreground">{s.location}</div>
                {s.affected_areas?.area_name && (
                  <div className="text-xs text-muted-foreground mt-1">Area: {s.affected_areas.area_name}</div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Occupancy</span>
                  <span className="font-medium">{s.occupied_count} / {s.capacity} ({pct}%)</span>
                </div>
                <Progress value={pct} />
              </div>
              {s.contact_number && (
                <div className="text-sm flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {s.contact_number}</div>
              )}
              {isStaff && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { setMoveCount(1); setMoveOpen({ shelter: s, type: "intake" }); }}>
                    <ArrowDownToLine className="h-4 w-4 mr-1" /> Intake
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setMoveCount(1); setMoveOpen({ shelter: s, type: "release" }); }}>
                    <ArrowUpFromLine className="h-4 w-4 mr-1" /> Release
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => remove(s.shelter_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
        {items.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No shelters yet.</div>}
      </div>

      <Dialog open={!!moveOpen.shelter} onOpenChange={(o) => !o && setMoveOpen({ shelter: null, type: "intake" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{moveOpen.type === "intake" ? "Intake people" : "Release people"} — {moveOpen.shelter?.shelter_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Count</Label>
            <Input type="number" min={1} value={moveCount} onChange={(e) => setMoveCount(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">A database trigger will automatically adjust the shelter's occupancy and reject over-capacity intakes.</p>
          </div>
          <DialogFooter><Button onClick={submitMove}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
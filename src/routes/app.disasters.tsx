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
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/app/disasters")({
  component: DisastersPage,
});

const schema = z.object({
  disaster_name: z.string().trim().min(2).max(120),
  disaster_type: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  start_date: z.string().min(1),
  status: z.enum(["active", "monitoring", "resolved"]),
});

type Disaster = {
  disaster_id: string;
  disaster_name: string;
  disaster_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
};

const TYPES = ["flood", "earthquake", "cyclone", "wildfire", "drought", "landslide", "epidemic", "other"];

function DisastersPage() {
  const { isStaff } = useAuth();
  const [items, setItems] = useState<Disaster[]>([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Disaster | null>(null);
  const [form, setForm] = useState({
    disaster_name: "",
    disaster_type: "flood",
    description: "",
    start_date: new Date().toISOString().slice(0, 10),
    status: "active" as "active" | "monitoring" | "resolved",
  });

  const load = async () => {
    const { data, error } = await supabase.from("disasters").select("*").order("start_date", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Disaster[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      disaster_name: "",
      disaster_type: "flood",
      description: "",
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    setOpen(true);
  };
  const openEdit = (d: Disaster) => {
    setEditing(d);
    setForm({
      disaster_name: d.disaster_name,
      disaster_type: d.disaster_type,
      description: d.description ?? "",
      start_date: d.start_date,
      status: (d.status as any) ?? "active",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (editing) {
      const { error } = await supabase.from("disasters").update(parsed.data).eq("disaster_id", editing.disaster_id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("disasters").insert(parsed.data);
      if (error) return toast.error(error.message);
      toast.success("Disaster added");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this disaster and all related areas/shelters?")) return;
    const { error } = await supabase.from("disasters").delete().eq("disaster_id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = items.filter((d) => {
    const matchQ = q === "" || d.disaster_name.toLowerCase().includes(q.toLowerCase()) || d.disaster_type.toLowerCase().includes(q.toLowerCase());
    const matchS = filterStatus === "all" || d.status === filterStatus;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search disasters…" className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add disaster</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit disaster" : "New disaster"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div><Label>Name</Label><Input required value={form.disaster_name} onChange={(e) => setForm({ ...form, disaster_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.disaster_type} onValueChange={(v) => setForm({ ...form, disaster_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Start date</Label><Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <DialogFooter><Button type="submit">{editing ? "Save" : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Description</th>
              {isStaff && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.disaster_id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{d.disaster_name}</td>
                <td className="px-4 py-3 capitalize">{d.disaster_type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "active" ? "bg-primary/10 text-primary" : d.status === "monitoring" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3">{d.start_date}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{d.description}</td>
                {isStaff && (
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(d.disaster_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isStaff ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">No disasters found.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
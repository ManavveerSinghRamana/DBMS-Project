import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/users")({
  component: AdminUsers,
});

const ROLES = ["admin", "government", "donor", "public_user"] as const;

function AdminUsers() {
  const { hasRole } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [add, setAdd] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: ps } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(ps ?? []);
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const m: Record<string, string[]> = {};
    (rs ?? []).forEach((r: any) => { (m[r.user_id] ??= []).push(r.role); });
    setRoles(m);
  };
  useEffect(() => { load(); }, []);

  if (!hasRole("admin")) return <div className="text-muted-foreground">Admin access required.</div>;

  const grant = async (uid: string) => {
    const role = add[uid];
    if (!role) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
    if (error) return toast.error(error.message);
    toast.success("Role granted");
    load();
  };
  const revoke = async (uid: string, role: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role as any);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left"><tr>
          <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Grant role</th>
        </tr></thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-t align-top">
              <td className="px-4 py-3 font-medium">{p.user_name}</td>
              <td className="px-4 py-3">{p.user_email}</td>
              <td className="px-4 py-3">{p.user_phoneno ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                    {(roles[p.id] ?? []).map((r) => (
                      <button key={r} onClick={() => revoke(p.id, r)} className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs hover:line-through" title="Click to revoke" data-testid={`assigned-role-${r}`}>{r}</button>
                    ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Select value={add[p.id] ?? ""} onValueChange={(v) => setAdd({ ...add, [p.id]: v })}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Pick role" /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} data-testid={`role-option-${r}`}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => grant(p.id)} data-testid="grant-role-button">Grant</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
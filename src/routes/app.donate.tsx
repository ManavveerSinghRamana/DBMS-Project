import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartHandshake, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatIndianCurrency } from "@/lib/format";

export const Route = createFileRoute("/app/donate")({
  component: DonatePage,
});

function DonatePage() {
  const navigate = useNavigate();
  const [disasters, setDisasters] = useState<{ disaster_id: string; disaster_name: string }[]>([]);
  const [amount, setAmount] = useState<number>(50);
  const [disasterId, setDisasterId] = useState<string>("none");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from("disasters").select("disaster_id, disaster_name").eq("status", "active")
      .then(({ data }) => setDisasters(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return toast.error("Amount must be positive");
    setBusy(true);
    const { error } = await supabase.rpc("process_donation", {
      p_amount: amount,
      p_disaster_id: (disasterId === "none" ? null : disasterId) as any,
      p_message: (message.trim() || null) as any,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSuccess(true);
    toast.success(`Thank you for your ${formatIndianCurrency(amount)} donation!`);
  };

  if (success) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
        <h2 className="text-2xl font-bold mt-4">Thank you!</h2>
        <p className="text-muted-foreground mt-2">Your donation of <strong>{formatIndianCurrency(amount)}</strong> has been recorded. It will help relief efforts on the ground.</p>
        <div className="flex gap-2 justify-center mt-6">
          <Button onClick={() => { setSuccess(false); setAmount(50); setMessage(""); }}>Donate again</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/app/my-donations" })}>View my donations</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-lg mx-auto" style={{ background: "var(--gradient-card)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-xl">Make a donation</h2>
          <p className="text-sm text-muted-foreground">100% goes to relief operations.</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Amount (INR)</Label>
          <div className="flex gap-2 mt-1 mb-2">
            {[10, 25, 50, 100, 250].map((v) => (
              <Button key={v} type="button" variant={amount === v ? "default" : "outline"} size="sm" onClick={() => setAmount(v)}>
                {formatIndianCurrency(v)}
              </Button>
            ))}
          </div>
          <Input type="number" min={1} required value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div>
          <Label>Direct to (optional)</Label>
          <Select value={disasterId} onValueChange={setDisasterId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General relief fund</SelectItem>
              {disasters.map((d) => <SelectItem key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Message (optional)</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        </div>
        <Button type="submit" className="w-full" disabled={busy} size="lg">
          {busy ? "Processing…" : `Donate ${formatIndianCurrency(amount)}`}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Processed via the <code>process_donation()</code> stored procedure.</p>
      </form>
    </Card>
  );
}
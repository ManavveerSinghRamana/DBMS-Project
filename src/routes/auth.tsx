import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { DEMO_ACCOUNTS, ensureDemoAccounts } from "@/lib/demo-accounts";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const signupSchema = z.object({
  user_name: z.string().trim().min(2).max(80),
  user_email: z.string().trim().email().max(255),
  user_phoneno: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(6).max(72),
  role: z.enum(["public_user", "donor", "government", "admin"]),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(true);
  const [seedError, setSeedError] = useState<string | null>(null);
  const provisionDemoAccounts = useServerFn(ensureDemoAccounts);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  useEffect(() => {
    let cancelled = false;
    provisionDemoAccounts()
      .then(() => {
        if (!cancelled) {
          setSeedError(null);
          setSeeding(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSeedError(error instanceof Error ? error.message : "Unable to provision demo accounts.");
          setSeeding(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [provisionDemoAccounts]);

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup state
  const [su, setSu] = useState({
    user_name: "",
    user_email: "",
    user_phoneno: "",
    password: "",
    role: "public_user" as "public_user" | "donor" | "government" | "admin",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/app" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(su);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: su.user_email,
      password: su.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          user_name: su.user_name,
          user_phoneno: su.user_phoneno || null,
          role: su.role,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're signed in.");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="w-full max-w-md p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary mx-auto flex items-center justify-center text-primary-foreground font-bold text-xl">R</div>
          <h1 className="text-2xl font-bold mt-3">Relief Hub</h1>
          <p className="text-sm text-muted-foreground">Sign in or create an account</p>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 mt-4">
              <div>
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy} data-testid="auth-login-submit">{busy ? "Signing in..." : "Sign in"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 mt-4">
              <div>
                <Label>Full name</Label>
                <Input required value={su.user_name} onChange={(e) => setSu({ ...su, user_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required value={su.user_email} onChange={(e) => setSu({ ...su, user_email: e.target.value })} />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={su.user_phoneno} onChange={(e) => setSu({ ...su, user_phoneno: e.target.value })} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" required value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={su.role} onValueChange={(v) => setSu({ ...su, role: v as typeof su.role })}>
                  <SelectTrigger data-testid="auth-role-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public_user" data-testid="user-role-public_user">Public User</SelectItem>
                    <SelectItem value="donor" data-testid="user-role-donor">Donor</SelectItem>
                    <SelectItem value="government" data-testid="user-role-government">Government Authority</SelectItem>
                    <SelectItem value="admin" data-testid="user-role-admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Demo: roles self-selected. In production, staff roles require approval.</p>
              </div>
              <Button type="submit" className="w-full" disabled={busy} data-testid="auth-signup-submit">{busy ? "Creating..." : "Create account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="mt-6 rounded-lg border bg-muted/30 p-4" data-testid="demo-accounts-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Demo accounts</h2>
              <p className="text-xs text-muted-foreground">
                Fixed login/password pairs for each role are provisioned automatically on first load.
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {seeding ? "Provisioning…" : seedError ? "Provisioning unavailable" : "Ready"}
            </div>
          </div>
          {seedError && <p className="mt-2 text-xs text-destructive">{seedError}</p>}
          <div className="mt-4 grid gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                className="w-full rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                data-testid={`demo-account-${account.role}`}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{account.label}</span>
                  <span className="text-xs text-muted-foreground capitalize">{account.role.replace("_", " ")}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Login: {account.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  Password: {account.password}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
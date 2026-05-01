import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertTriangle, HeartHandshake, Home, MapPin, ShieldCheck, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">R</div>
            <span className="font-bold text-lg">Relief Hub</span>
          </div>
          <div className="flex gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 py-24 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm mb-6">
            <Activity className="h-4 w-4" /> Live disaster response platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
            Coordinate relief.<br/>Save more lives.
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto opacity-90">
            A unified portal for governments, NGOs, donors and citizens to manage disasters,
            shelters and donations — in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-lg">Open dashboard</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="bg-white/10 text-primary-foreground border-white/30 hover:bg-white/20">
                Donate now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything in one place</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: AlertTriangle, title: "Disaster tracking", desc: "Track active incidents with severity, affected areas and timeline." },
            { icon: Home, title: "Shelter management", desc: "Live capacity & occupancy with automatic intake & release logging." },
            { icon: HeartHandshake, title: "Donations", desc: "Secure donor flow with receipts and transparent allocation." },
            { icon: MapPin, title: "Map view", desc: "See affected areas and shelters geographically on an interactive map." },
            { icon: ShieldCheck, title: "Role-based access", desc: "Admin, Government, Donor and Public roles, enforced at the database level." },
            { icon: Activity, title: "Live analytics", desc: "Aggregated views & charts powered by SQL views and triggers." },
          ].map((f) => (
            <Card key={f.title} className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Relief Hub — Built for disaster response.
      </footer>
    </div>
  );
}

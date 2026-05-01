import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const title =
    path === "/app" ? "Dashboard" :
    path.includes("/disasters") ? "Disasters" :
    path.includes("/areas") ? "Affected Areas" :
    path.includes("/shelters") ? "Shelters" :
    path.includes("/map") ? "Map View" :
    path.includes("/donate") ? "Donate" :
    path.includes("/my-donations") ? "My Donations" :
    path.includes("/distribution") ? "Relief Distribution" :
    path.includes("/admin/users") ? "Roles & Users" : "Relief Hub";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="font-semibold text-lg">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="capitalize" data-testid={`user-role-badge-${r}`}>{r.replace("_", " ")}</Badge>
              ))}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { formatIndianNumber } from "@/lib/format";



export const Route = createFileRoute("/app/map")({
  component: MapPage,
});

function MapPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);

  const [isClient, setIsClient] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any | null>(null);

  useEffect(() => {
    // Only run data fetching and Leaflet setup on client
    setIsClient(true);
    supabase.from("affected_areas").select("*, disasters(disaster_name)").not("latitude", "is", null)
      .then(({ data }) => setAreas(data ?? []));
    supabase.from("shelters").select("*").not("latitude", "is", null)
      .then(({ data }) => setShelters(data ?? []));

    // Configure Leaflet default icons and load react-leaflet components
    (async () => {
      try {
        const L = await import('leaflet');
        // Fix default marker icons
        try {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
        } catch {}
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      } catch (err) {
        // If Leaflet fails to load on server or in constrained env, log and continue
        // This prevents a hard crash during SSR/build.
        // eslint-disable-next-line no-console
        console.warn('Leaflet not available:', err);
      }

      try {
        const RL = await import('react-leaflet');
        setLeafletComponents(RL);
      } catch (err) {
        console.warn('react-leaflet not available:', err);
      }
    })();
  }, []);

  return (
    <Card className="overflow-hidden h-[calc(100vh-160px)]">
      {isClient && LeafletComponents ? (
        <LeafletComponents.MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
          <LeafletComponents.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {areas.map((a) => (
            <LeafletComponents.CircleMarker
              key={a.area_id}
              center={[Number(a.latitude), Number(a.longitude)]}
              radius={10}
              pathOptions={{
                color: a.severity === "critical" ? "#dc2626" : a.severity === "high" ? "#ea580c" : a.severity === "medium" ? "#ca8a04" : "#65a30d",
                fillOpacity: 0.6,
              }}
            >
              <LeafletComponents.Popup>
                <strong>{a.area_name}</strong><br />
                Disaster: {a.disasters?.disaster_name}<br />
                Severity: {a.severity}<br />
                Population: {formatIndianNumber(a.population)}
              </LeafletComponents.Popup>
            </LeafletComponents.CircleMarker>
          ))}
          {shelters.map((s) => (
            <LeafletComponents.Marker key={s.shelter_id} position={[Number(s.latitude), Number(s.longitude)]}>
              <LeafletComponents.Popup>
                <strong>{s.shelter_name}</strong><br />
                {s.location}<br />
                {s.occupied_count}/{s.capacity} occupied
              </LeafletComponents.Popup>
            </LeafletComponents.Marker>
          ))}
        </LeafletComponents.MapContainer>
      ) : (
        // Placeholder while SSR / before client mount
        <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">Map loading…</div>
      )}
    </Card>
  );
}
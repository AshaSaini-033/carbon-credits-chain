import { useEffect, useRef } from "react";

interface ProjectMapProps {
  projects: Array<{
    id: number;
    name: string;
    coordinates: { lat: number; lng: number };
    status: string;
    area: string;
    carbonEstimate: string;
    lastMRV: string;
  }>;
  center?: { lat: number; lng: number };
}

export const ProjectMap = ({ projects, center }: ProjectMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple map placeholder - in production would use leaflet
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          border-radius: 8px;
        ">
          🗺️ Interactive Map<br/>
          <small>${projects.length} Projects</small>
        </div>
      `;
    }
  }, [projects]);

  return <div ref={mapRef} className="w-full h-full" />;
};
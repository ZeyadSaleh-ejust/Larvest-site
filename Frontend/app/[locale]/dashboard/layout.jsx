"use client";
import { MapProvider } from "./_components/context/MapContext";

export default function DashboardLayout({ children }) {
  return (
    <MapProvider>
      {children}
    </MapProvider>
  );
} 
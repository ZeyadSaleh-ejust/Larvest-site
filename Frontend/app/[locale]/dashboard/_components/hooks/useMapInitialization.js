"use client";
import { useState, useEffect, useRef } from "react";

export const useMapInitialization = (mapRef) => {
  const [map, setMap] = useState(null);
  const mapInstanceRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const drawnItemsRef = useRef(null);
  const drawControlRef = useRef(null);
  const boundariesLayerRef = useRef(null);
  const L = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current || !mounted) return;

      try {
        // Clean up existing map instance if it exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          mapInitializedRef.current = false;
        }

        L.current = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        await import("leaflet-draw/dist/leaflet.draw.css");
        await import("leaflet-draw");

        if (!mounted) return;

        mapInstanceRef.current = L.current.map(mapRef.current, {
          center: [26.8206, 30.8025],
          zoom: 6.5,
          zoomControl: false,
          attributionControl: false,
        });

        // Initialize the FeatureGroup to store editable layers
        drawnItemsRef.current = new L.current.FeatureGroup();
        mapInstanceRef.current.addLayer(drawnItemsRef.current);

        // Add Esri Boundaries & Places as an overlay that will appear on all base layers
        boundariesLayerRef.current = L.current.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles &copy; Esri &mdash; Boundaries and Places",
            maxZoom: 19,
            pane: "overlayPane", // Use the overlay pane to ensure it's above base layers
            zIndex: 650, // Higher zIndex to ensure it's above most layers but below user-drawn items
          }
        ).addTo(mapInstanceRef.current);

        // Initialize draw control
        drawControlRef.current = new L.current.Control.Draw({
          position: "topright",
          draw: {
            polyline: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: "#e1e100",
                message: "<strong>Error:</strong> Shape edges cannot cross!",
              },
              shapeOptions: {
                color: "#4CAF50",
                fillOpacity: 0.2,
              },
            },
            circle: false,
            circlemarker: false,
            rectangle: false,
            marker: false,
          },
          edit: {
            featureGroup: drawnItemsRef.current,
            remove: true,
          },
        });

        mapInstanceRef.current.addControl(drawControlRef.current);

        if (mounted) {
          setMap(mapInstanceRef.current);
          mapInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Error initializing map:", error);
        mapInitializedRef.current = false;
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        // Remove all event listeners
        mapInstanceRef.current.off();
        // Remove all layers
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }
        if (boundariesLayerRef.current) {
          boundariesLayerRef.current.remove();
        }
        // Remove the map instance
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
        L.current = null;
      }
    };
  }, [mapRef]);

  return {
    map,
    L: L.current,
    mapInstance: mapInstanceRef.current,
    drawnItems: drawnItemsRef.current,
    drawControl: drawControlRef.current,
    boundariesLayer: boundariesLayerRef.current
  };
};
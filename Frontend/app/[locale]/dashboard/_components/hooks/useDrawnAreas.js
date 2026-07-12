"use client";
import { useState, useRef, useEffect } from "react";

export const useDrawnAreas = (mapInstance, drawnItems, L) => {
  const [drawnAreas, setDrawnAreas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempAreaDetails, setTempAreaDetails] = useState(null);
  const [isAreaSaved, setIsAreaSaved] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const areasMapRef = useRef(new Map());
  const layerMapRef = useRef(new Map());

  // Sync areasMap with drawnAreas
  useEffect(() => {
    areasMapRef.current.clear();
    drawnAreas.forEach((area) => {
      areasMapRef.current.set(area.id, area);
    });
  }, [drawnAreas]);

  // Redraw areas when map or drawnItems changes
  useEffect(() => {
    if (mapInstance && drawnItems && L) {
      // Clear existing layers and maps
      drawnItems.clearLayers();
      areasMapRef.current.clear();
      layerMapRef.current.clear();

      // Re-add all drawn areas to the map and feature group
      drawnAreas.forEach((area) => {
        if (area.coordinates) {
          // Create new layer with area's coordinates
          const layer = L.polygon(area.coordinates, {
            color: "#4CAF50",
            fillColor: "#4CAF50",
            fillOpacity: 0.2,
            weight: 2,
            opacity: 1,
          });

          // Create and bind popup
          const popupContent = `
            <div class="font-sans">
              <p class="font-medium">${area.name || "Unnamed Area"}</p>
              <p class="text-sm mt-1">Area: ${area.measurements?.acres || '0.00'} acres</p>
              ${area.primaryCrop
              ? `<p class="text-sm">Crop: ${area.primaryCrop}</p>`
              : ''
            }
              ${area.soilType
              ? `<p class="text-sm">Soil: ${area.soilType}</p>`
              : ''
            }
            </div>
          `;
          layer.bindPopup(popupContent);

          // Add layer to map and feature group
          layer.addTo(mapInstance);
          drawnItems.addLayer(layer);

          // Update both maps with the new layer
          areasMapRef.current.set(area.id, { ...area, layer });
          layerMapRef.current.set(area.id, layer);
        }
      });
    }
  }, [drawnAreas, mapInstance, drawnItems, L]);

  const handleDeleteArea = (areaId) => {
    // Find the area to delete
    const areaToDelete = drawnAreas.find((area) => area.id === areaId);

    if (areaToDelete && areaToDelete.layer) {
      // Remove layer from map and feature group
      if (mapInstance && mapInstance.hasLayer(areaToDelete.layer)) {
        mapInstance.removeLayer(areaToDelete.layer);
      }
      if (drawnItems && drawnItems.hasLayer(areaToDelete.layer)) {
        drawnItems.removeLayer(areaToDelete.layer);
      }

      // Remove from areasMap
      areasMapRef.current.delete(areaId);

      // Update state to remove the area
      setDrawnAreas((prevAreas) =>
        prevAreas.filter((area) => area.id !== areaId)
      );
    }
  };

  return {
    drawnAreas,
    setDrawnAreas,
    isModalOpen,
    setIsModalOpen,
    tempAreaDetails,
    setTempAreaDetails,
    isAreaSaved,
    setIsAreaSaved,
    editingAreaId,
    setEditingAreaId,
    areasMapRef,
    layerMapRef,
    handleDeleteArea
  };
};
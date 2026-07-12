"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import MapControls from "./MapControls";
import MapSearch from "./MapSearch";
import AreaDetailsModal from "./AreaDetailsModal";
import CoordinatesInput from "./CoordinatesInput";
import DrawnAreasDetails from "./DrawnAreasDetails";
import { useMap } from "./context/MapContext";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useRouter } from 'next/navigation';

import { calculateAreaMeasurements, calculateCenter } from "./utils/areaCalculations";
import { getLocationDetails } from "./utils/locationService";
import { useAddFarmAreaMutation, useDeleteFarmAreaMutation, useGetFarmAreasQuery, useUpdateFarmAreaMutation } from "@/app/[locale]/lib/api/farmAreasSlice";
import TileGenerationForm from "./TileGenerationForm";

const MapLayers = () => {
  const { t, i18n } = useTranslation("dashboard");
  const router = useRouter();
  const isRTL = i18n.language === 'ar';

  const {
    // Map instance and refs
    mapRef,
    map,
    mapInstance,
    L,
    drawnItems,
    drawControl,

    // Layer management
    layers,
    activeLayer,
    handleLayerChange,
    isLayerLoading,
    customFilters,
    availableBands,
    createCustomFilter,
    updateCustomFilter,
    deleteCustomFilter,
    isGeneratingTiles,
    handleGenerateTiles,

    // Drawn areas management
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

    // UI state
    showCoordinatesInput,
    setShowCoordinatesInput,
    showTileGenerationForm,

    // Event handlers
    handleLocationSelect,
    handleModalClose,
    handleEdit,
    handleDrawByCoordinates,
  } = useMap();

  // Add API hooks
  const { data: farmAreas, isLoading: isLoadingAreas } = useGetFarmAreasQuery();
  const [addFarmArea] = useAddFarmAreaMutation();
  const [updateFarmArea] = useUpdateFarmAreaMutation();
  const [deleteFarmArea] = useDeleteFarmAreaMutation();

  // Update drawnAreas when farmAreas data changes
  useEffect(() => {
    if (farmAreas) {
      setDrawnAreas(farmAreas);
    }
  }, [farmAreas, setDrawnAreas]);

  // Handle save area details with API integration
  const handleSaveAreaDetails = async (areaData) => {
    try {
      const completeData = {
        ...areaData,
        coordinates: tempAreaDetails.details.coordinates,
        center: tempAreaDetails.details.center,
        measurements: tempAreaDetails.details.measurements,
        location: tempAreaDetails.details.location,
      };

      if (editingAreaId) {
        // Update existing area
        await updateFarmArea({
          id: editingAreaId,
          ...completeData,
        }).unwrap();
      } else {
        // Add new area
        await addFarmArea(completeData).unwrap();
      }
      setIsModalOpen(false);
      setEditingAreaId(null);
    } catch (error) {
      console.error('Failed to save area:', error);
      // Handle error (you might want to show a notification here)
    }
  };

  // Handle delete area with API integration
  const handleDeleteArea = async (areaId) => {
    try {
      await deleteFarmArea(areaId).unwrap();
      // The list will automatically update due to the API cache invalidation
    } catch (error) {
      console.error('Failed to delete area:', error);
      // Handle error (you might want to show a notification here)
    }
  };

  // Add filter styles to document head
  useEffect(() => {
    // Create a style element for the filter styles
    const styleElement = document.createElement('style');

    // Collect all filter styles from layer configurations
    let filterStyles = '';
    Object.values(layers).forEach(layer => {
      if (layer.filter && layer.filterStyle) {
        filterStyles += layer.filterStyle;
      }
    });

    styleElement.textContent = filterStyles;
    document.head.appendChild(styleElement);

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Set up event handlers for map drawing events
  useEffect(() => {
    if (!mapInstance || !L || !drawnItems) return;

    // Handle created shapes
    const handleCreated = async (event) => {
      const layer = event.layer;

      const coordinates = layer.getLatLngs()[0];

      // Calculate area measurements
      const measurements = calculateAreaMeasurements(L, coordinates);

      // Calculate center point using utility function
      const center = calculateCenter(coordinates);

      // Get location details
      const locationInfo = await getLocationDetails(center.lat, center.lng);

      // Add layer to map with default style
      layer.setStyle({
        color: "#4CAF50",
        fillOpacity: 0.2,
        weight: 2,
      });
      layer.addTo(mapInstance);
      drawnItems.addLayer(layer);

      // Store temporary area details
      setTempAreaDetails({
        layer,
        details: {
          id: Date.now(),
          coordinates,
          center,
          measurements,
          location: locationInfo,
          timestamp: new Date().toLocaleString(),
        },
        isEditing: false,
      });

      // Open modal for additional details
      setIsModalOpen(true);
    };

    // Handle deleted shapes
    const handleDeleted = async (e) => {
      const layers = e.layers;
      const deletedLayers = Array.from(layers.getLayers());
      console.log('Deleted layers:', deletedLayers);

      try {
        // Delete each area from the API
        for (const layer of deletedLayers) {
          const layerCoords = layer.getLatLngs()[0].map(coord => [coord.lat, coord.lng]);
          const area = drawnAreas.find(area =>
            JSON.stringify(area.coordinates) === JSON.stringify(layerCoords)
          );
          console.log('Found area:', area);
          if (area?.id) {
            await deleteFarmArea(area.id).unwrap();
            toast.success(`Area "${area.name || 'Unnamed'}" deleted successfully`);
          }
        }
        // The list will automatically update due to the API cache invalidation
      } catch (error) {
        console.error('Failed to delete areas:', error);
        toast.error(error.data?.detail || 'Failed to delete area(s)');
      }
    };

    // Add event listeners
    mapInstance.on(L.Draw.Event.CREATED, handleCreated);
    mapInstance.on(L.Draw.Event.EDITED, handleEdit);
    mapInstance.on(L.Draw.Event.DELETED, handleDeleted);

    // Clean up event listeners
    return () => {
      mapInstance.off(L.Draw.Event.CREATED, handleCreated);
      mapInstance.off(L.Draw.Event.EDITED, handleEdit);
      mapInstance.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [mapInstance, L, drawnItems, drawnAreas, setDrawnAreas, setTempAreaDetails, setIsModalOpen]);

  return (
    <div className="space-y-8" >
      {/* Map Controls */}
      <MapControls
        layers={layers}
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        isLayerLoading={isLayerLoading}
        customFilters={customFilters}
        availableBands={availableBands}
        onCreateCustomFilter={createCustomFilter}
        onUpdateCustomFilter={updateCustomFilter}
        onDeleteCustomFilter={deleteCustomFilter}
        isGeneratingTiles={isGeneratingTiles}
      />

      {/* Area Details Modal */}
      <AreaDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAreaDetails}
        initialData={tempAreaDetails ? tempAreaDetails.details : {}}
      />

      {/* Map and Tile Generation Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container - Takes 2/3 of the space */}
        <div className={`${showTileGenerationForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Coordinates Input Panel */}
            {showCoordinatesInput && (
              <CoordinatesInput onDrawArea={handleDrawByCoordinates} />
            )}

            {/* Search Bar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-96 max-w-[calc(100%-2rem)] z-10">
              <MapSearch onLocationSelect={handleLocationSelect} />
            </div>

            {/* Map */}
            <div ref={mapRef} className="h-[450px] md:h-[700px] w-full z-0">
              {/* Map Loading Overlay */}
              {!map && (
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              )}

          
            </div>
    {/* Base Layer Icon Group */}
    <div className="absolute top-4 left-4 z-[100] flex flex-col gap-3 pointer-events-auto">
                {Object.entries(layers).filter(([layerId]) => ['trueColor', 'osm', 'topo'].includes(layerId)).map(([layerId, layer]) => (
                  <button
                    key={layerId}
                    onClick={() => handleLayerChange(layerId)}
                    className={`group p-2 rounded-full shadow-lg border-2 transition-all flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30
                      ${activeLayer === layerId ? 'border-green-500 ring-2 ring-green-400' : 'border-gray-200 dark:border-gray-600'}`}
                    title={layer.name}
                    style={{ outline: 'none' }}
                  >
                    {/* Creative SVG Icon for each layer */}
                    {layerId === 'trueColor' && (
                      <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="15" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                        <circle cx="16" cy="16" r="8" fill="#fbbf24" stroke="#f59e42" strokeWidth="1.5" />
                        <circle cx="13" cy="13" r="2" fill="#22d3ee" />
                        <circle cx="19" cy="19" r="2" fill="#22c55e" />
                      </svg>
                    )}
                    {layerId === 'osm' && (
                      <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="26" height="26" rx="6" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                        <path d="M8 24L24 8" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="8" cy="24" r="2" fill="#0ea5e9" />
                        <circle cx="24" cy="8" r="2" fill="#0ea5e9" />
                      </svg>
                    )}
                    {layerId === 'topo' && (
                      <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="26" height="26" rx="6" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
                        <path d="M8 20C12 14 20 18 24 12" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="8" cy="20" r="2" fill="#eab308" />
                        <circle cx="24" cy="12" r="2" fill="#eab308" />
                      </svg>
                    )}
                    <span className="sr-only">{layer.name}</span>
                  </button>
                ))}
              </div>
            {/* Map Controls Overlay */}
            <div className="absolute bottom-4 right-4 z-[10] flex flex-col gap-2">
              <button
                onClick={() => setShowCoordinatesInput(!showCoordinatesInput)}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={t('mapLayers.controls.drawByCoordinates')}
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showCoordinatesInput ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  )}
                </svg>
              </button>

              {map && (
                <>
                  <button
                    onClick={() => map.zoomIn()}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={t('mapLayers.controls.zoomIn')}
                  >
                    <svg
                      className="w-6 h-6 text-gray-600 dark:text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => map.zoomOut()}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={t('mapLayers.controls.zoomOut')}
                  >
                    <svg
                      className="w-6 h-6 text-gray-600 dark:text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tile Generation Form - Takes 1/3 of the space when visible */}
        {showTileGenerationForm && (
          <div className="lg:col-span-1">
            <TileGenerationForm />
          </div>
        )}
      </div>

      {/* Drawn Areas List */}
      {drawnAreas.length > 0 && (
        <DrawnAreasDetails
          areas={drawnAreas}
          onDelete={handleDeleteArea}
          onViewWeather={(areaId) => {
            router.push(`/${i18n.language}/dashboard/weather?areaId=${areaId}`);
          }}
          onEdit={(areaId) => {
            const area = drawnAreas.find((a) => a.id === areaId);
            if (area && area.layer) {
              setTempAreaDetails({
                layer: area.layer,
                details: area,
                isEditing: true,
              });
              setIsModalOpen(true);
              setEditingAreaId(areaId);

              if (mapInstance && area.center) {
                mapInstance.setView([area.center.lat, area.center.lng], 14, {
                  animate: true,
                  duration: 1,
                });
              }
            }
          }}
          onView={(areaId) => {
            const area = drawnAreas.find((a) => a.id === areaId);
            if (area) {
              // First try to get the layer from the layerMap
              let layer = layerMapRef.current.get(areaId);

              // If not found in layerMap, try to get it from the area object
              if (!layer && area.layer) {
                layer = area.layer;
              }

              // If we have a layer and map instance, center on it
              if (layer && mapInstance) {
                const bounds = layer.getBounds();
                mapInstance.fitBounds(bounds, {
                  padding: [50, 50],
                  animate: true,
                  duration: 1,
                });

                if (layer.getPopup()) {
                  layer.openPopup();
                }
              } else if (area.coordinates && mapInstance) {
                // If we don't have a layer but have coordinates, create a temporary one
                const tempLayer = L.polygon(area.coordinates, {
                  color: "#4CAF50",
                  fillColor: "#4CAF50",
                  fillOpacity: 0.2,
                  weight: 2,
                });

                const bounds = tempLayer.getBounds();
                mapInstance.fitBounds(bounds, {
                  padding: [50, 50],
                  animate: true,
                  duration: 1,
                });
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default MapLayers;
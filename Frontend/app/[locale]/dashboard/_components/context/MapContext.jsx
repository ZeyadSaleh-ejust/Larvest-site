"use client";
import { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { useMapInitialization } from "../hooks/useMapInitialization";
import { useDrawnAreas } from "../hooks/useDrawnAreas";
import { calculateAreaMeasurements, calculateCenter } from "../utils/areaCalculations";
import { getLocationDetails } from "../utils/locationService";
import { useGenerateTilesMutation } from "@/app/[locale]/lib/api/apiSlice";
import { SERVER_URL } from "@/utils/constants";
import toast from 'react-hot-toast';
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

// Create the context
const MapContext = createContext();


// Provider component
export function MapProvider({ children }) {
  const { t, i18n } = useTranslation('dashboard');
  const isRTL = i18n.language === 'ar';
  const mapRef = useRef(null);
  const [showCoordinatesInput, setShowCoordinatesInput] = useState(false);
  const [showSpatialAnalysis, setShowSpatialAnalysis] = useState(false);
  const [spatialAnalysisSettings, setSpatialAnalysisSettings] = useState({
    zoomLevel: 10,
    cloudCover: 30,
    aoiEnabled: false,
  });
  // Layer configurations
  const layers = useMemo(() => ({
    trueColor: {
      name: t('map.layers.trueColor.name'),
      description: t('map.layers.trueColor.description'),
      bands: t('map.layers.trueColor.bands'),
      application: t('map.layers.trueColor.application'),
      createLayer: (L) => {
        return L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 19,
          }
        );
      },
    },
    osm: {
      name: t('map.layers.osm.name'),
      description: t('map.layers.osm.description'),
      bands: t('map.layers.osm.bands'),
      application: t('map.layers.osm.application'),
      createLayer: (L) => {
        return L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
            maxZoom: 19,
          }
        );
      },
    },
    topo: {
      name: t('map.layers.topo.name'),
      description: t('map.layers.topo.description'),
      bands: t('map.layers.topo.bands'),
      application: t('map.layers.topo.application'),
      createLayer: (L) => {
        return L.tileLayer(
          "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          {
            attribution: "Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='http://viewfinderpanoramas.org'>SRTM</a> | Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a>",
            maxZoom: 17,
          }
        );
      },
    },
    // ndvi: {
    //   name: t('map.layers.ndvi.name'),
    //   description: t('map.layers.ndvi.description'),
    //   bands: t('map.layers.ndvi.bands'),
    //   application: t('map.layers.ndvi.application'),
    //   createLayer: (L) => {
    //     return L.tileLayer(
    //       "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //       {
    //         attribution: "NDVI visualization based on Sentinel-2 data",
    //         maxZoom: 19,
    //         // className: "ndvi-filter",
    //       }
    //     );
    //   },
    //   // filter: true,
    //   // filterStyle: `
    //   //   .ndvi-filter {
    //   //     filter: hue-rotate(90deg) saturate(150%) brightness(90%);
    //   //   }
    //   // `,
    // },
    // ndwi: {
    //   name: t('map.layers.ndwi.name'),
    //   description: t('map.layers.ndwi.description'),
    //   bands: t('map.layers.ndwi.bands'),
    //   application: t('map.layers.ndwi.application'),
    //   createLayer: (L) => {
    //     return L.tileLayer(
    //       "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //       {
    //         attribution: "NDWI visualization based on Sentinel-2 data",
    //         maxZoom: 19,
    //         // className: "ndwi-filter",
    //       }
    //     );
    //   },
    //   // filter: true,
    //   // filterStyle: `
    //   //   .ndwi-filter {
    //   //     filter: hue-rotate(180deg) saturate(200%) brightness(85%);
    //   //   }
    //   // `,
    // },
    // visualBands: {
    //   name: t('map.layers.visualBands.name'),
    //   description: t('map.layers.visualBands.description'),
    //   bands: t('map.layers.visualBands.bands'),
    //   application: t('map.layers.visualBands.application'),
    //   createLayer: (L) => {
    //     return L.tileLayer(
    //       "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //       {
    //         attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    //         maxZoom: 19,
    //         // className: "visual-bands-filter",
    //       }
    //     );
    //   },
    //   // filter: true,
    //   // filterStyle: `
    //   //   .visual-bands-filter {
    //   //     filter: contrast(110%) saturate(120%);
    //   //   }
    //   // `,
    // },
  }), [t]);

  // Tile generation constants
  const COLMAPS = useMemo(() => [
    { value: "RdYlGn", label: t('map.colormaps.RdYlGn') },
    { value: "viridis", label: t('map.colormaps.viridis') },
    { value: "plasma", label: t('map.colormaps.plasma') },
    { value: "inferno", label: t('map.colormaps.inferno') },
    { value: "magma", label: t('map.colormaps.magma') },
    { value: "cividis", label: t('map.colormaps.cividis') },
    { value: "YlGnBu", label: t('map.colormaps.YlGnBu') },
    { value: "jet", label: t('map.colormaps.jet') }
  ], [t]);

  const BANDS = useMemo(() => [
    { value: "blue", label: t('map.bands.blue') },
    { value: "green", label: t('map.bands.green') },
    { value: "red", label: t('map.bands.red') },
    { value: "nir", label: t('map.bands.nir') },
    { value: "nir_narrow", label: t('map.bands.nir_narrow') },
    { value: "red_edge1", label: t('map.bands.red_edge1') },
    { value: "red_edge2", label: t('map.bands.red_edge2') },
    { value: "red_edge3", label: t('map.bands.red_edge3') },
    { value: "swir1", label: t('map.bands.swir1') },
    { value: "swir2", label: t('map.bands.swir2') }
  ], [t]);

  const PRESET_FORMULAS = useMemo(() => [
    {
      name: t('map.presetFormulas.NDVI.name'),
      formula: "(band2-band1)/(band2+band1)",
      band1: "red",
      band2: "nir",
      description: t('map.presetFormulas.NDVI.description')
    },
    {
      name: t('map.presetFormulas.NDWI.name'),
      formula: "(band1-band2)/(band1+band2)",
      band1: "green",
      band2: "nir",
      description: t('map.presetFormulas.NDWI.description')
    },
    {
      name: t('map.presetFormulas.NDBI.name'),
      formula: "(band2-band1)/(band2+band1)",
      band1: "nir",
      band2: "swir1",
      description: t('map.presetFormulas.NDBI.description')
    },
    {
      name: t('map.presetFormulas.EVI.name'),
      formula: "2.5*((band2-band1)/(band2+6*band1-7.5*band1+1))",
      band1: "red",
      band2: "nir",
      description: t('map.presetFormulas.EVI.description')
    }
  ], [t]);

  // Layer management state
  const [activeLayer, setActiveLayer] = useState("trueColor");
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const [customFilters, setCustomFilters] = useState([]);
  const loadingTimeoutRef = useRef(null);
  const previousLayerRef = useRef(null);
  const [generateTiles] = useGenerateTilesMutation();
  const [generatedTiles, setGeneratedTiles] = useState([]);
  const [isGeneratingTiles, setIsGeneratingTiles] = useState(false);
  const layerInstancesRef = useRef(new Map());

  // Custom filter modal state
  const [isCustomFilterModalOpen, setIsCustomFilterModalOpen] = useState(false);
  const [customFilterForm, setCustomFilterForm] = useState({
    name: "",
    description: "",
    band1: "",
    band2: "",
    formula: ""
  });
  const [formulaInput, setFormulaInput] = useState("");

  // Available bands state
  const [availableBands] = useState([
    { id: "blue", name: t('map.bands.blue'), wavelength: "490nm" },
    { id: "green", name: t('map.bands.green'), wavelength: "560nm" },
    { id: "red", name: t('map.bands.red'), wavelength: "665nm" },
    { id: "red_edge1", name: t('map.bands.red_edge1'), wavelength: "705nm" },
    { id: "red_edge2", name: t('map.bands.red_edge2'), wavelength: "740nm" },
    { id: "red_edge3", name: t('map.bands.red_edge3'), wavelength: "783nm" },
    { id: "nir", name: t('map.bands.nir'), wavelength: "842nm" },
    { id: "nir_narrow", name: t('map.bands.nir_narrow'), wavelength: "865nm" },
    { id: "swir1", name: t('map.bands.swir1'), wavelength: "1610nm" },
    { id: "swir2", name: t('map.bands.swir2'), wavelength: "2190nm" },
  ]);

  // Tile generation form state
  const [tileFormData, setTileFormData] = useState({
    min_lon: 30.304434642130218,
    min_lat: 30.174682637534644,
    max_lon: 30.42143846734797,
    max_lat: 30.283438554006977,
    zoom_level: 12,
    start_date: format(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    cloud_cover: 30,
    band1: "red", // Red
    band2: "nir", // NIR
    formula: "(band2-band1)/(band2+band1)", // NDVI formula
    colormap_str: "RdYlGn"
  });

  const [useCurrentMapBounds, setUseCurrentMapBounds] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);

  // MapControls state
  const [showInfo, setShowInfo] = useState(false);
  const [infoLayer, setInfoLayer] = useState(null);
  const [showTileGenerationForm, setShowTileGenerationForm] = useState(false);

  // Separate base layers from filter layers
  const baseLayers = Object.entries(layers).filter(([_, layer]) => !layer.filter);
  const filterLayers = Object.entries(layers).filter(([_, layer]) => layer.filter);

  // Initialize map using custom hook
  const {
    map,
    L,
    mapInstance,
    drawnItems,
    drawControl
  } = useMapInitialization(mapRef);

  // Initialize drawn areas management using custom hook
  const {
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
  } = useDrawnAreas(mapInstance, drawnItems, L);

  // Consolidated settings state
  const [mapSettings, setMapSettings] = useState({
    zoomLevel: 10,
    cloudCover: 30,
    aoiEnabled: false,
  });

  // Function to safely set loading state with debounce
  const setLoading = (isLoading) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLayerLoading(true);
      }, 100);
    } else {
      setIsLayerLoading(false);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Layer change effect
  useEffect(() => {
    if (!mapInstance) return;

    if (previousLayerRef.current === activeLayer) return;
    previousLayerRef.current = activeLayer;

    setLoading(true);

    layerInstancesRef.current.forEach((layer) => {
      if (mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer);
      }
    });

    const applyLayer = () => {
      if (layers[activeLayer]) {
        const L = window.L;

        if (!layerInstancesRef.current.has(activeLayer)) {
          const layerInstance = layers[activeLayer].createLayer(L);

          if (layerInstance.on && typeof layerInstance.on === "function") {
            layerInstance.on("load", () => {
              setLoading(false);
            });

            layerInstance.on("loading", () => {
              setLoading(true);
            });
          }

          layerInstancesRef.current.set(activeLayer, layerInstance);
        }

        const layerToAdd = layerInstancesRef.current.get(activeLayer);
        layerToAdd.addTo(mapInstance);

        const boundariesLayer = mapInstance
          .getPane("overlayPane")
          .querySelector(".leaflet-layer:last-child");
        if (boundariesLayer) {
          boundariesLayer.style.zIndex = "400";
        }

        if (layers[activeLayer].filter) {
          layerToAdd.bringToFront();
        }

        setTimeout(() => {
          setLoading(false);
        }, 800);
      } else if (activeLayer.startsWith("custom_")) {
        const customFilter = customFilters.find(
          (filter) => `custom_${filter.id}` === activeLayer
        );
        if (customFilter) {
          const L = window.L;
          const customLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              opacity: 0.8,
              className: `custom-filter-${customFilter.id}`,
            }
          );

          const style = document.createElement("style");
          style.setAttribute("data-filter-id", customFilter.id);

          const band1Code = customFilter.band1.charCodeAt(1) || 2;
          const band2Code = customFilter.band2.charCodeAt(1) || 3;
          const hueRotate = (band1Code * band2Code) % 360;
          const saturation = 1 + (band1Code % 5) / 10;
          const brightness = 1 + (band2Code % 3) / 10;

          style.textContent = `.custom-filter-${customFilter.id} { 
            filter: hue-rotate(${hueRotate}deg) saturate(${saturation}) brightness(${brightness}); 
          }`;
          document.head.appendChild(style);

          if (customLayer.on && typeof customLayer.on === "function") {
            customLayer.on("load", () => {
              setLoading(false);
            });

            customLayer.on("loading", () => {
              setLoading(true);
            });
          }

          layerInstancesRef.current.set(activeLayer, customLayer);
          customLayer.addTo(mapInstance);
          customLayer.bringToFront();

          setTimeout(() => {
            setLoading(false);
          }, 800);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    requestAnimationFrame(applyLayer);
  }, [mapInstance, activeLayer, customFilters]);

  // Layer management functions
  const handleLayerChange = (layerId) => {
    if (layerId === activeLayer) return;

    if (layers[layerId] || layerId.startsWith("custom_")) {
      setActiveLayer(layerId);

      if (
        layerId === "ndvi" ||
        layerId === "ndwi" ||
        layerId === "visualBands" ||
        layerId.startsWith("custom_")
      ) {
        setIsGeneratingTiles(true);
        if (mapInstance) {
          const bounds = mapInstance.getBounds();
          const center = bounds.getCenter();
          const zoom = mapInstance.getZoom();

          setLoading(true);

          const loadingToast = toast.loading(
            `Generating ${layerId.startsWith('custom_') ? 'custom filter' : layerId.toUpperCase()} tiles...`,
            { duration: Infinity }
          );

          generateTiles({
            min_lon: bounds.getSouthWest().lng,
            min_lat: bounds.getSouthWest().lat,
            max_lon: bounds.getNorthEast().lng,
            max_lat: bounds.getNorthEast().lat,
            zoom_level: zoom,
            start_date: tileFormData.start_date,
            end_date: tileFormData.end_date,
            cloud_cover: tileFormData.cloud_cover,
            band1: tileFormData.band1,
            band2: tileFormData.band2,
            formula: tileFormData.formula,
            colormap_str: tileFormData.colormap_str,
            lat: center.lat,
            lng: center.lng,
            zoom: zoom,
            layer: layerId,
          })
            .unwrap()
            .then((response) => {
              if (response.tiles_generated > 0 && response.results && response.results.length > 0) {
                setGeneratedTiles(response.results);
                if (response.map_url) {
                  applyGeneratedTilesToMap(response.results);
                }
                toast.success(`Successfully generated ${response.tiles_generated} tiles`);
              } else {
                clearGeneratedTiles();
                toast.error("No tiles were generated for this area");
              }
              setLoading(false);
              toast.dismiss(loadingToast);
            })
            .catch((error) => {
              console.error("Error generating tiles:", error);
              setLoading(false);
              toast.dismiss(loadingToast);
              toast.error(`Error generating tiles: ${error.message || 'Unknown error'}`);
            })
            .finally(() => {
              setIsGeneratingTiles(false);
              setLoading(false);
            });
        }
      }
    }
  };

  const applyGeneratedTilesToMap = (tiles) => {
    if (!mapInstance || !tiles || tiles.length === 0) return;

    clearGeneratedTiles();

    const tileGroup = window.L.layerGroup();

    tiles.forEach(tile => {
      const bounds = tileToLatLngBounds(tile.x, tile.y, tile.z);
      const relativePath = tile?.file_path?.replace(/\\/g, "/");

      const imageOverlay = window.L.imageOverlay(
        `${SERVER_URL}/${relativePath}`,
        bounds,
        {
          opacity: 0.8,
          className: 'generated-tile',
          interactive: true
        }
      );

      imageOverlay.bindPopup(`
        <div>
          <strong>Tile:</strong> ${tile.tile}<br>
          <strong>Date:</strong> ${new Date(tile.date).toLocaleDateString()}<br>
          <strong>Cloud Cover:</strong> ${tile.cloud_cover.toFixed(2)}%
        </div>
      `);

      tileGroup.addLayer(imageOverlay);
    });

    tileGroup.addTo(mapInstance);
    layerInstancesRef.current.set('generatedTiles', tileGroup);

    if (tiles.length > 0) {
      const allBounds = tiles.map(tile => tileToLatLngBounds(tile.x, tile.y, tile.z));
      const combinedBounds = window.L.latLngBounds(allBounds[0].getSouthWest(), allBounds[0].getNorthEast());

      allBounds.forEach(bound => {
        combinedBounds.extend(bound);
      });

      mapInstance.fitBounds(combinedBounds);
    }
  };

  const clearGeneratedTiles = () => {
    if (!mapInstance) return;

    const tileGroup = layerInstancesRef.current.get('generatedTiles');
    if (tileGroup) {
      mapInstance.removeLayer(tileGroup);
      layerInstancesRef.current.delete('generatedTiles');
    }
  };

  const tileToLatLngBounds = (x, y, z) => {
    const tileSize = 256;
    const earthRadius = 6378137;
    const initialResolution = 2 * Math.PI * earthRadius / tileSize;
    const originShift = Math.PI * earthRadius;

    const pixelX = x * tileSize;
    const pixelY = y * tileSize;

    const resolution = initialResolution / Math.pow(2, z);
    const meterX1 = pixelX * resolution - originShift;
    const meterY1 = -(pixelY * resolution - originShift);
    const meterX2 = (pixelX + tileSize) * resolution - originShift;
    const meterY2 = -((pixelY + tileSize) * resolution - originShift);

    const lat1 = (2 * Math.atan(Math.exp(meterY1 / earthRadius)) - Math.PI / 2) * 180 / Math.PI;
    const lng1 = meterX1 * 180 / originShift;
    const lat2 = (2 * Math.atan(Math.exp(meterY2 / earthRadius)) - Math.PI / 2) * 180 / Math.PI;
    const lng2 = meterX2 * 180 / originShift;

    return window.L.latLngBounds(
      [lat1, lng1],
      [lat2, lng2]
    );
  };

  const createCustomFilter = (filterData) => {
    const newFilter = {
      id: Date.now(),
      name: filterData.name || `Custom Filter ${customFilters.length + 1}`,
      description:
        filterData.description ||
        `Custom analysis using ${filterData.band1} and ${filterData.band2}`,
      formula: filterData.formula,
      band1: filterData.band1,
      band2: filterData.band2,
      createdAt: new Date().toISOString(),
    };

    setCustomFilters((prev) => [...prev, newFilter]);
    return `custom_${newFilter.id}`;
  };

  const deleteCustomFilter = (filterId) => {
    setCustomFilters((prev) => prev.filter((filter) => filter.id !== filterId));

    if (activeLayer === `custom_${filterId}`) {
      setActiveLayer("trueColor");
    }

    const styleElement = document.querySelector(
      `style[data-filter-id="${filterId}"]`
    );
    if (styleElement) {
      document.head.removeChild(styleElement);
    }

    const customLayerId = `custom_${filterId}`;
    if (layerInstancesRef.current.has(customLayerId)) {
      const layer = layerInstancesRef.current.get(customLayerId);
      if (mapInstance && mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer);
      }
      layerInstancesRef.current.delete(customLayerId);
    }
  };

  const updateCustomFilter = (filterId, updatedData) => {
    setCustomFilters(prevFilters =>
      prevFilters.map(filter =>
        filter.id === filterId ? { ...filter, ...updatedData } : filter
      )
    );

    if (activeLayer === `custom_${filterId}`) {
      const oldLayer = layerInstancesRef.current.get(activeLayer);
      if (oldLayer && mapInstance.hasLayer(oldLayer)) {
        mapInstance.removeLayer(oldLayer);
      }

      const currentLayer = activeLayer;
      setActiveLayer('');
      setTimeout(() => setActiveLayer(currentLayer), 10);
    }

    return filterId;
  };

  // Update tile form data when map settings change
  useEffect(() => {
    setTileFormData(prev => ({
      ...prev,
      zoom_level: mapSettings.zoomLevel,
      cloud_cover: mapSettings.cloudCover
    }));
  }, [mapSettings]);

  // Update spatial analysis settings when map settings change
  useEffect(() => {
    setSpatialAnalysisSettings(prev => ({
      ...prev,
      zoomLevel: mapSettings.zoomLevel,
      cloudCover: mapSettings.cloudCover
    }));
  }, [mapSettings]);

  // Consolidated handler for settings changes
  const handleSettingsChange = (settings) => {
    setMapSettings(prev => ({
      ...prev,
      ...settings
    }));

    if (mapInstance && settings.zoomLevel) {
      const currentCenter = mapInstance.getCenter();
      mapInstance.setView(currentCenter, settings.zoomLevel);
    }

    if (settings.aoiEnabled !== mapSettings.aoiEnabled) {
      if (settings.aoiEnabled) {
        if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
          drawControl._toolbars.draw._modes.polygon.handler.enable();
        }
      } else {
        if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
          drawControl._toolbars.draw._modes.polygon.handler.disable();
        }
      }
    }
  };

  // Update tile form handlers to use consolidated settings
  const handleTileFormChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) : value;

    if (name === 'zoom_level' || name === 'cloud_cover') {
      handleSettingsChange({
        [name === 'zoom_level' ? 'zoomLevel' : 'cloudCover']: newValue
      });
    }

    setTileFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handlePresetSelect = (preset) => {
    setTileFormData(prev => ({
      ...prev,
      band1: preset.band1,
      band2: preset.band2,
      formula: preset.formula
    }));
  };

  const handleTileFormSubmit = async (e) => {
    e.preventDefault();

    if (useCurrentMapBounds && mapInstance) {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      setTileFormData(prev => ({
        ...prev,
        min_lon: sw.lng,
        min_lat: sw.lat,
        max_lon: ne.lng,
        max_lat: ne.lat
      }));
    }

    setIsGeneratingTiles(true);
    setLoading(true);

    const loadingToast = toast.loading(
      `Generating tiles...`,
      { duration: Infinity }
    );

    try {
      const response = await generateTiles({
        ...tileFormData,
        lat: (tileFormData.min_lat + tileFormData.max_lat) / 2,
        lng: (tileFormData.min_lon + tileFormData.max_lon) / 2,
        zoom: tileFormData.zoom_level,
      }).unwrap();

      if (response.tiles_generated > 0 && response.results && response.results.length > 0) {
        setGeneratedTiles(response.results);
        applyGeneratedTilesToMap(response.results);
        toast.success(`Successfully generated ${response.tiles_generated} tiles`);
      } else {
        clearGeneratedTiles();
        toast.error("No tiles were generated for this area");
      }
    } catch (error) {
      console.error("Error generating tiles:", error);
      toast.error(`Error generating tiles: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingTiles(false);
      setLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  // Update map bounds when map view changes
  useEffect(() => {
    if (useCurrentMapBounds && mapInstance) {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      setTileFormData(prev => ({
        ...prev,
        min_lon: sw.lng,
        min_lat: sw.lat,
        max_lon: ne.lng,
        max_lat: ne.lat
      }));
    }
  }, [mapInstance, useCurrentMapBounds]);

  // Event handlers
  const handleSpatialAnalysisChange = (settings) => {
    setSpatialAnalysisSettings(settings);

    if (mapInstance && settings.zoomLevel) {
      const currentCenter = mapInstance.getCenter();
      mapInstance.setView(currentCenter, settings.zoomLevel);
    }

    if (settings.aoiEnabled !== spatialAnalysisSettings.aoiEnabled) {
      if (settings.aoiEnabled) {
        if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
          drawControl._toolbars.draw._modes.polygon.handler.enable();
        }
      } else {
        if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
          drawControl._toolbars.draw._modes.polygon.handler.disable();
        }
      }
    }
  };

  const handleLocationSelect = (location) => {
    if (mapInstance && location) {
      mapInstance.setView([location.lat, location.lng], 13, {
        animate: true,
        duration: 1,
      });
    }
  };

  const handleSaveAreaDetails = async (formData) => {
    if (tempAreaDetails) {
      const { layer, details, isEditing } = tempAreaDetails;
      const coordinates = layer.getLatLngs()[0];
      const bounds = layer.getBounds();
      const center = bounds.getCenter();
      const measurements = calculateAreaMeasurements(L, coordinates);
      const locationInfo = await getLocationDetails(center.lat, center.lng);
      const areaId = isEditing ? details.id : Date.now().toString();

      const areaDetails = {
        id: areaId,
        name: formData.name || "Unnamed Area",
        primaryCrop: formData.primaryCrop,
        secondaryCrops: formData.secondaryCrops,
        soilType: formData.soilType,
        irrigationSystem: formData.irrigationSystem,
        fertilizers: formData.fertilizers,
        fertilizationFrequency: formData.fertilizationFrequency,
        fertilizationMethod: formData.fertilizationMethod,
        commonPests: formData.commonPests,
        pesticides: formData.pesticides,
        previousYield: formData.previousYield,
        soilTestResults: formData.soilTestResults,
        yieldLosses: formData.yieldLosses,
        additionalNotes: formData.additionalNotes,
        files: formData.files,
        coordinates,
        center: { lat: center.lat, lng: center.lng },
        measurements,
        location: locationInfo,
        lastEdited: new Date().toLocaleString(),
        timestamp: isEditing ? details.timestamp : new Date().toLocaleString(),
      };

      const popupContent = `
        <div class="font-sans">
          <p class="font-medium">${areaDetails.name}</p>
          <p class="text-sm mt-1">Area: ${areaDetails.measurements.acres} acres</p>
          ${areaDetails.primaryCrop ? `<p class="text-sm">Crop: ${areaDetails.primaryCrop}</p>` : ""}
          ${areaDetails.location ? `<p class="text-sm mt-1">${areaDetails.location.displayName}</p>` : ""}
        </div>
      `;

      const newLayer = L.polygon(coordinates, {
        color: "#4CAF50",
        fillColor: "#4CAF50",
        fillOpacity: 0.2,
        weight: 2,
        opacity: 1,
      });

      newLayer.bindPopup(popupContent);

      if (layer) {
        if (mapInstance && mapInstance.hasLayer(layer)) {
          mapInstance.removeLayer(layer);
        }
        if (drawnItems && drawnItems.hasLayer(layer)) {
          drawnItems.removeLayer(layer);
        }
      }

      newLayer.addTo(mapInstance);
      drawnItems.addLayer(newLayer);

      setDrawnAreas((prevAreas) => {
        if (isEditing) {
          return prevAreas.map((area) =>
            area.id === areaId ? { ...areaDetails, layer: newLayer } : area
          );
        } else {
          return [...prevAreas, { ...areaDetails, layer: newLayer }];
        }
      });

      layerMapRef.current.set(areaDetails.id, newLayer);
      setIsAreaSaved(true);
      setTempAreaDetails(null);
      setIsModalOpen(false);
      setEditingAreaId(null);
    }
  };

  const handleModalClose = () => {
    if (tempAreaDetails && !isAreaSaved) {
      const { layer } = tempAreaDetails;
      if (drawnItems && drawnItems.hasLayer(layer)) {
        drawnItems.removeLayer(layer);
      }
      if (mapInstance && mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer);
      }
    }
    setTempAreaDetails(null);
    setIsModalOpen(false);
  };

  const handleEdit = async (e) => {
    try {
      const editedLayers = e.layers;
      editedLayers.eachLayer(async (layer) => {
        const coordinates = layer.getLatLngs()[0];
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        const measurements = calculateAreaMeasurements(L, coordinates);
        const locationInfo = await getLocationDetails(center.lat, center.lng);

        let existingArea = null;
        if (layer._leaflet_id) {
          existingArea = Array.from(areasMapRef.current.values()).find(
            (area) => area.layer && area.layer._leaflet_id === layer._leaflet_id
          );
        }

        if (!existingArea) {
          existingArea = Array.from(areasMapRef.current.values()).find(
            (area) => {
              if (!area.coordinates || !area.coordinates[0]) return false;
              const areaFirstPoint = area.coordinates[0];
              const layerFirstPoint = coordinates[0];
              return (
                Math.abs(areaFirstPoint.lat - layerFirstPoint.lat) < 0.000001 &&
                Math.abs(areaFirstPoint.lng - layerFirstPoint.lng) < 0.000001
              );
            }
          );
        }

        if (existingArea) {
          const newLayer = L.polygon(coordinates, {
            color: "#4CAF50",
            fillColor: "#4CAF50",
            fillOpacity: 0.2,
            weight: 2,
            opacity: 1,
          });

          const updatedArea = {
            ...existingArea,
            coordinates,
            center: { lat: center.lat, lng: center.lng },
            measurements,
            location: locationInfo,
            lastEdited: new Date().toLocaleString(),
          };

          const popupContent = `
            <div class="font-sans">
              <p class="font-medium">${updatedArea.name || "Unnamed Area"}</p>
              <p class="text-sm mt-1">Area: ${measurements.acres} acres</p>
              ${updatedArea.cropType ? `<p class="text-sm">Crop: ${updatedArea.cropType}</p>` : ""}
              ${locationInfo ? `<p class="text-sm mt-1">${locationInfo.displayName}</p>` : ""}
            </div>
          `;

          newLayer.bindPopup(popupContent);

          if (mapInstance) {
            if (mapInstance.hasLayer(layer)) {
              mapInstance.removeLayer(layer);
            }
            newLayer.addTo(mapInstance);
          }

          if (drawnItems) {
            if (drawnItems.hasLayer(layer)) {
              drawnItems.removeLayer(layer);
            }
            drawnItems.addLayer(newLayer);
          }

          areasMapRef.current.set(existingArea.id, {
            ...updatedArea,
            layer: newLayer,
          });

          setTempAreaDetails({
            layer: newLayer,
            details: updatedArea,
            isEditing: true,
          });

          setDrawnAreas((prevAreas) => {
            return prevAreas.map((area) =>
              area.id === existingArea.id
                ? { ...updatedArea, layer: newLayer }
                : area
            );
          });

          setIsModalOpen(true);
          setEditingAreaId(existingArea.id);
        }
      });
    } catch (error) {
      console.error("Error handling edit:", error);
    }
  };

  const handleDrawByCoordinates = async (coordinates) => {
    if (!mapInstance || !L) return;

    try {
      const layer = L.polygon(coordinates, {
        color: "#4CAF50",
        fillColor: "#4CAF50",
        fillOpacity: 0.2,
        weight: 2,
      });

      const measurements = calculateAreaMeasurements(L, coordinates);
      const bounds = layer.getBounds();
      const center = bounds.getCenter();
      const locationInfo = await getLocationDetails(center.lat, center.lng);

      layer.addTo(mapInstance);
      drawnItems.addLayer(layer);

      setTempAreaDetails({
        layer,
        details: {
          id: Date.now(),
          coordinates,
          center: { lat: center.lat, lng: center.lng },
          measurements,
          location: locationInfo,
          timestamp: new Date().toLocaleString(),
        },
        isEditing: false,
      });

      setIsModalOpen(true);
      setShowCoordinatesInput(false);

      mapInstance.fitBounds(bounds, {
        padding: [50, 50],
        animate: true,
        duration: 1,
      });
    } catch (error) {
      console.error("Error drawing area by coordinates:", error);
    }
  };

  // Custom filter modal handlers
  const handleCustomFilterChange = (e) => {
    const { name, value } = e.target;
    setCustomFilterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormulaInput = (value) => {
    setFormulaInput(prev => prev + value);
  };

  const handleBandSelect = (bandId, position) => {
    if (position === 1) {
      setCustomFilterForm(prev => ({
        ...prev,
        band1: bandId
      }));
    } else {
      setCustomFilterForm(prev => ({
        ...prev,
        band2: bandId
      }));
    }
  };

  const handleCreateCustomFilter = () => {
    // Validate form
    if (!customFilterForm.band1 || !customFilterForm.band2 || !formulaInput) {
      toast.error("Please select both bands and enter a formula");
      return;
    }

    // Create the filter and get its ID
    const formula = formulaInput.replace("Band1", customFilterForm.band1).replace("Band2", customFilterForm.band2);
    const filterId = createCustomFilter({
      ...customFilterForm,
      formula
    });

    // Reset form
    setCustomFilterForm({
      name: "",
      description: "",
      band1: "",
      band2: "",
      formula: ""
    });
    setFormulaInput("");
    setIsCustomFilterModalOpen(false);

    // Switch to the new custom filter
    if (filterId) {
      handleLayerChange(filterId);
    }
  };

  const handleOpenCustomFilterModal = () => {
    setIsCustomFilterModalOpen(true);
  };

  const handleCloseCustomFilterModal = () => {
    setIsCustomFilterModalOpen(false);
    // Reset form when closing
    setCustomFilterForm({
      name: "",
      description: "",
      band1: "",
      band2: "",
      formula: ""
    });
    setFormulaInput("");
  };

  // MapControls handlers
  const handleInfoClick = (layerId) => {
    setInfoLayer(layers[layerId]);
    setShowInfo(true);
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
  };

  const handleToggleTileGenerationForm = () => {
    setShowTileGenerationForm(prev => !prev);
  };

  const handleDeleteFilter = (filter) => {
    // Create a custom toast for confirmation
    toast((t) => (
      <div className="flex flex-col p-2">
        <div className="font-medium mb-2">Delete Filter</div>
        <div className="text-sm mb-3">
          Are you sure you want to delete "{filter.name}"?
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              deleteCustomFilter(filter.id);
              toast.dismiss(t.id);
              toast.success(`"${filter.name}" has been deleted`);
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        borderRadius: '10px',
        background: '#fff',
        color: '#333',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
      },
    });
  };

  const value = {
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
    generatedTiles,

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
    handleDeleteArea,

    // UI state
    showCoordinatesInput,
    setShowCoordinatesInput,
    showSpatialAnalysis,
    setShowSpatialAnalysis,
    spatialAnalysisSettings,

    // Event handlers
    handleSpatialAnalysisChange,
    handleLocationSelect,
    handleSaveAreaDetails,
    handleModalClose,
    handleEdit,
    handleDrawByCoordinates,

    // Tile generation form state and handlers
    tileFormData,
    setTileFormData,
    useCurrentMapBounds,
    setUseCurrentMapBounds,
    advancedMode,
    setAdvancedMode,
    handleTileFormChange,
    handlePresetSelect,
    handleTileFormSubmit,
    COLMAPS,
    BANDS,
    PRESET_FORMULAS,

    // Custom filter modal state and handlers
    isCustomFilterModalOpen,
    customFilterForm,
    setCustomFilterForm,
    formulaInput,
    handleCustomFilterChange,
    handleFormulaInput,
    handleBandSelect,
    handleCreateCustomFilter,
    handleOpenCustomFilterModal,
    handleCloseCustomFilterModal,

    // MapControls state
    showInfo,
    infoLayer,
    showTileGenerationForm,
    baseLayers,
    filterLayers,

    // MapControls handlers
    handleInfoClick,
    handleCloseInfo,
    handleToggleTileGenerationForm,
    handleDeleteFilter,

    // Consolidated settings
    mapSettings,
    handleSettingsChange,
    setFormulaInput
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

// Custom hook to use the map context
export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
} 
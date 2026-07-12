"use client";
import React, { useState } from "react";
import { useMap } from "./context/MapContext";
import { useGetFarmAreasQuery } from "@/app/[locale]/lib/api/farmAreasSlice";
import { useTimeSeriesMutation } from "@/app/[locale]/lib/api/apiSlice";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import TimeSeriesResultModal from "./TimeSeriesResultModal";

const TileGenerationForm = () => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const {
    tileFormData,
    useCurrentMapBounds,
    setUseCurrentMapBounds,
    advancedMode,
    setAdvancedMode,
    handleTileFormChange,
    handlePresetSelect,
    handleTileFormSubmit,
    isGeneratingTiles,
    COLMAPS,
    BANDS,
    PRESET_FORMULAS,
    mapSettings,
    handleOpenCustomFilterModal,
    setTileFormData,
    mapInstance
  } = useMap();

  // Add direct API query
  const { data: areas = [], isLoading: isLoadingAreas } = useGetFarmAreasQuery();
  const [timeSeries, { isLoading: isTimeSeriesLoading }] = useTimeSeriesMutation();

  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [boundsSource, setBoundsSource] = useState('area'); // 'custom', 'map', or 'area'

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultPaths, setResultPaths] = useState({ gif: '', values: '' });

  // Handle area selection
  const handleAreaSelect = (areaId) => {
    setSelectedAreaId(areaId);
    setBoundsSource('area');
    setUseCurrentMapBounds(false);

    const selectedArea = areas.find(area => area.id === areaId);
    if (selectedArea && selectedArea.coordinates) {
      // Calculate bounds from area coordinates
      const lats = selectedArea.coordinates.map(coord => coord[0]);
      const lons = selectedArea.coordinates.map(coord => coord[1]);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      // Update form data with the bounds
      handleTileFormChange({
        target: {
          name: 'min_lat',
          value: minLat
        }
      });
      handleTileFormChange({
        target: {
          name: 'max_lat',
          value: maxLat
        }
      });
      handleTileFormChange({
        target: {
          name: 'min_lon',
          value: minLon
        }
      });
      handleTileFormChange({
        target: {
          name: 'max_lon',
          value: maxLon
        }
      });

      // Log the calculated bounds for debugging
      console.log('Calculated bounds:', {
        minLat,
        maxLat,
        minLon,
        maxLon,
        coordinates: selectedArea.coordinates
      });
    }
  };

  // Handle bounds source change
  const handleBoundsSourceChange = (source) => {
    setBoundsSource(source);
    if (source === 'map') {
      setUseCurrentMapBounds(true);
      setSelectedAreaId(null);
    } else if (source === 'custom') {
      setUseCurrentMapBounds(false);
      setSelectedAreaId(null);
    }
  };

  // Handle advanced mode toggle
  const handleAdvancedModeToggle = () => {
    if (!advancedMode) {
      // When switching to advanced mode, open the custom filter modal
      handleOpenCustomFilterModal();
    } else {
      // When switching back to simple mode, just update the state
      setAdvancedMode(false);
    }
  };

  // Handle time series generation
  const handleTimeSeriesSubmit = async (e) => {
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

    const loadingToast = toast.loading(t('tileGeneration.timeSeries.loading'), { duration: Infinity });

    try {
      const response = await timeSeries({
        ...tileFormData,
        lat: (tileFormData.min_lat + tileFormData.max_lat) / 2,
        lng: (tileFormData.min_lon + tileFormData.max_lon) / 2,
        zoom: tileFormData.zoom_level,
      }).unwrap();

      setResultPaths({
        gif: response.gif_file_path,
        values: response.values_file_path,
      });
      setResultModalOpen(true);
      toast.success(t('tileGeneration.timeSeries.success'));
      console.log('Time series response:', response);
    } catch (error) {
      console.error("Error generating time series:", error);
      // Handle different error response formats
      let errorMessage = 'Unknown error occurred';
      if (error.data) {
        if (error.data.error && error.data.detail) {
          errorMessage = `${error.data.error}: ${error.data.detail}`;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        }
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(
        <div className="flex flex-col">
          <div className="font-medium">{t('tileGeneration.timeSeries.errorTitle')}</div>
          <div className="text-sm mt-1">{errorMessage}</div>
        </div>,
        {
          duration: 6000,
          position: 'top-center',
          style: {
            borderRadius: '10px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            maxWidth: '400px',
          },
        }
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-fit sticky top-4 shadow-lg" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('tileGeneration.title')}
        </h3>
        <button
          type="button"
          onClick={handleAdvancedModeToggle}
          className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {advancedMode ? t('tileGeneration.analysisParameters.simpleMode') : t('tileGeneration.analysisParameters.advancedMode')}
        </button>
      </div>

      <form onSubmit={handleTileFormSubmit} className="space-y-3">
        {/* Bounds Section - Creative & Relaxed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('tileGeneration.areaBounds.title')}</h4>
          </div>

          {/* Bounds Source Selection - Creative Cards */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleBoundsSourceChange('custom')}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                boundsSource === 'custom'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="w-4 h-4 mx-auto mb-1">
                <svg className="w-full h-full text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('tileGeneration.areaBounds.custom')}</div>
            </button>

            <button
              type="button"
              onClick={() => handleBoundsSourceChange('map')}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                boundsSource === 'map'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="w-4 h-4 mx-auto mb-1">
                <svg className="w-full h-full text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('tileGeneration.areaBounds.currentMapView')}</div>
            </button>

            <button
              type="button"
              onClick={() => handleBoundsSourceChange('area')}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                boundsSource === 'area'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="w-4 h-4 mx-auto mb-1">
                <svg className="w-full h-full text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('tileGeneration.areaBounds.selectedArea')}</div>
            </button>
          </div>

          {/* Area Selection Dropdown - Enhanced */}
          {boundsSource === 'area' && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('tileGeneration.areaBounds.selectArea')}</label>
              </div>
              <select
                value={selectedAreaId || ''}
                onChange={(e) => handleAreaSelect(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isLoadingAreas}
              >
                <option value="" disabled>{isLoadingAreas ? 'Loading areas...' : 'Choose an area'}</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name || "Unnamed Area"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Coordinates Grid - Enhanced */}
          <div className={`transition-all duration-300 ${boundsSource === 'custom' ? 'opacity-100 max-h-96' : 'opacity-50 max-h-0 overflow-hidden'}`}>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Custom Coordinates</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    {t('tileGeneration.areaBounds.minLongitude')}
                  </label>
                  <input
                    type="number"
                    name="min_lon"
                    value={tileFormData.min_lon}
                    onChange={handleTileFormChange}
                    step="0.000001"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    {t('tileGeneration.areaBounds.maxLongitude')}
                  </label>
                  <input
                    type="number"
                    name="max_lon"
                    value={tileFormData.max_lon}
                    onChange={handleTileFormChange}
                    step="0.000001"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {t('tileGeneration.areaBounds.minLatitude')}
                  </label>
                  <input
                    type="number"
                    name="min_lat"
                    value={tileFormData.min_lat}
                    onChange={handleTileFormChange}
                    step="0.000001"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('tileGeneration.areaBounds.maxLatitude')}
                  </label>
                  <input
                    type="number"
                    name="max_lat"
                    value={tileFormData.max_lat}
                    onChange={handleTileFormChange}
                    step="0.000001"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date and Zoom Section - Compact */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('tileGeneration.timePeriod.title')}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.timePeriod.startDate')}</label>
              <input
                type="date"
                name="start_date"
                value={tileFormData.start_date}
                onChange={handleTileFormChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.timePeriod.endDate')}</label>
              <input
                type="date"
                name="end_date"
                value={tileFormData.end_date}
                onChange={handleTileFormChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('tileGeneration.timePeriod.zoomLevel')}: {mapSettings.zoomLevel}
              </label>
              <input
                type="range"
                name="zoom_level"
                min="8"
                max="16"
                value={mapSettings.zoomLevel}
                onChange={handleTileFormChange}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('tileGeneration.timePeriod.cloudCover')}: {mapSettings.cloudCover}%
              </label>
              <input
                type="range"
                name="cloud_cover"
                min="0"
                max="100"
                value={mapSettings.cloudCover}
                onChange={handleTileFormChange}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Bands and Formula Section - Compact */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('tileGeneration.analysisParameters.title')}</h4>

          {!advancedMode ? (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.presetFormulas')}</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {PRESET_FORMULAS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-start px-2 py-1.5 border rounded text-xs transition-colors ${
                        tileFormData.formula === preset.formula && tileFormData.band1 === preset.band1 && tileFormData.band2 === preset.band2
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                          : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.colorMap')}</label>
                <select
                  name="colormap_str"
                  value={tileFormData.colormap_str}
                  onChange={handleTileFormChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                >
                  {COLMAPS.map((colormap) => (
                    <option key={colormap.value} value={colormap.value}>
                      {colormap.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.band1')}</label>
                  <select
                    name="band1"
                    value={tileFormData.band1}
                    onChange={handleTileFormChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                  >
                    {BANDS.map((band) => (
                      <option key={band.value} value={band.value}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.band2')}</label>
                  <select
                    name="band2"
                    value={tileFormData.band2}
                    onChange={handleTileFormChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                  >
                    {BANDS.map((band) => (
                      <option key={band.value} value={band.value}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.formula')}</label>
                <input
                  type="text"
                  name="formula"
                  value={tileFormData.formula}
                  onChange={handleTileFormChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                  placeholder={t('tileGeneration.analysisParameters.formulaPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('tileGeneration.analysisParameters.formulaHelp')}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tileGeneration.analysisParameters.colorMap')}</label>
                <select
                  name="colormap_str"
                  value={tileFormData.colormap_str}
                  onChange={handleTileFormChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                >
                  {COLMAPS.map((colormap) => (
                    <option key={colormap.value} value={colormap.value}>
                      {colormap.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            disabled={isGeneratingTiles}
            className="py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isGeneratingTiles ? (
              <>
                <svg className="animate-spin -ms-1 me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('tileGeneration.generateButton.generating')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                {t('tileGeneration.generateButton.default')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTimeSeriesSubmit}
            disabled={isTimeSeriesLoading}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isTimeSeriesLoading ? (
              <>
                <svg className="animate-spin -ms-1 me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('tileGeneration.timeSeries.generating')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('tileGeneration.timeSeries.button')}
              </>
            )}
          </button>
        </div>
      </form>

      <TimeSeriesResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        gifFilePath={resultPaths.gif}
        valuesFilePath={resultPaths.values}
      />
    </div>
  );
};

export default TileGenerationForm;
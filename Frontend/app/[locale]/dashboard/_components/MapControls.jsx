"use client";
import React from "react";
import CustomFilterModal from "./CustomFilterModal";
import toast from "react-hot-toast";
import { useMap } from "./context/MapContext";
import { useTranslation } from "react-i18next";

const MapControls = () => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const {
    layers,
    activeLayer,
    handleLayerChange,
    isLayerLoading,
    customFilters,
    availableBands,
    isGeneratingTiles,
    handleOpenCustomFilterModal,
    showInfo,
    infoLayer,
    showTileGenerationForm,
    baseLayers,
    filterLayers,
    handleInfoClick,
    handleCloseInfo,
    handleToggleTileGenerationForm,
    handleDeleteFilter
  } = useMap();

  // Handle layer click with tile generation check
  const handleLayerClick = (layerId) => {
    if (isGeneratingTiles) {
      // Show a toast notification to inform the user
      toast.error(t('mapControls.waitForTiles'));
      return;
    }

    // If not generating tiles, proceed with layer change
    handleLayerChange(layerId);
  };

  return (
    <div className="rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center ">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t('mapControls.title')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleToggleTileGenerationForm}
            className={`px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center ${
              showTileGenerationForm 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isGeneratingTiles}
          >
            <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showTileGenerationForm ? t('mapControls.hideForm') : t('mapControls.generateTiles')}
          </button>
          <button
            onClick={handleOpenCustomFilterModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            disabled={isGeneratingTiles}
          >
            <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('mapControls.createCustomFilter')}
          </button>
        </div>
      </div>

      {isLayerLoading && (
        <div className="my-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center animate-fadeIn">
          <div className="animate-spin me-2 h-4 w-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent dark:border-t-transparent rounded-full"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">{t('mapControls.loadingLayer')}</span>
        </div>
      )}

      {isGeneratingTiles && (
        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center animate-fadeIn">
          <div className="animate-spin me-2 h-4 w-4 border-2 border-yellow-500 dark:border-yellow-400 border-t-transparent dark:border-t-transparent rounded-full"></div>
          <span className="text-sm text-yellow-700 dark:text-yellow-300">{t('mapControls.generatingTiles')}</span>
        </div>
      )}

      {/* Base Layers Section */}
      {/* <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('mapControls.baseLayers')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {baseLayers.map(([layerId, layer]) => (
            <div
              key={layerId}
              className={`relative rounded-lg border p-4 transition-all ${activeLayer === layerId
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                } ${isGeneratingTiles ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => handleLayerClick(layerId)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  {layer.name}
                </h4>
                <button
                  className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${isGeneratingTiles ? "cursor-not-allowed" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isGeneratingTiles) {
                      handleInfoClick(layerId);
                    }
                  }}
                  disabled={isGeneratingTiles}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {layer.description}
              </p>
              {activeLayer === layerId && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div> */}

      {/* Custom Filters Section */}
      {customFilters.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('mapControls.customFilters')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {customFilters.map((filter) => (
              <div
                key={`custom_${filter.id}`}
                className={`relative rounded-lg border p-4 cursor-pointer transition-all ${activeLayer === `custom_${filter.id}`
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                onClick={() => handleLayerChange(`custom_${filter.id}`)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    {filter.name}
                  </h4>
                  <div className="flex gap-1">
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {t('mapControls.custom')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFilter(filter);
                      }}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title={t('mapControls.deleteFilter')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {filter.description}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded">
                  {t('mapControls.formula')}: {filter.formula}
                </div>
                {activeLayer === `custom_${filter.id}` && (
                  <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer Info Modal */}
      {showInfo && infoLayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {infoLayer.name}
              </h3>
              <button
                onClick={handleCloseInfo}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300">
                {infoLayer.description}
              </p>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('mapControls.bands')}:</h4>
                <p className="text-gray-600 dark:text-gray-400">{infoLayer.bands}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('mapControls.applications')}:</h4>
                <p className="text-gray-600 dark:text-gray-400">{infoLayer.application}</p>
              </div>
            </div>
            <button
              onClick={handleCloseInfo}
              className="mt-6 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {t('mapControls.close')}
            </button>
          </div>
        </div>
      )}

      {/* Import the Custom Filter Modal component */}
      <CustomFilterModal />
    </div>
  );
};

export default MapControls;
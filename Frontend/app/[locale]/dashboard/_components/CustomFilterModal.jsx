"use client";
import React from "react";
import { useMap } from "./context/MapContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const CustomFilterModal = () => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const {
    isCustomFilterModalOpen,
    customFilterForm,
    setCustomFilterForm,
    formulaInput,
    setFormulaInput,
    availableBands,
    handleCustomFilterChange,
    handleFormulaInput,
    handleBandSelect,
    handleCreateCustomFilter,
    handleCloseCustomFilterModal,
    setAdvancedMode,
    handleTileFormChange,
    handleLayerChange
  } = useMap();

  // Handle creating custom filter and applying to tile generation form
  const handleCreateAndApply = () => {
    // Validate form
    if (!customFilterForm.band1 || !customFilterForm.band2 || !formulaInput) {
      toast.error("Please select both bands and enter a formula");
      return;
    }

    // Create the filter and get its ID
    const formula = formulaInput.replace("Band1", customFilterForm.band1).replace("Band2", customFilterForm.band2);
    const filterId = handleCreateCustomFilter({
      ...customFilterForm,
      formula
    });

    // Apply the custom filter settings to the tile generation form
    handleTileFormChange({
      target: {
        name: 'band1',
        value: customFilterForm.band1
      }
    });
    handleTileFormChange({
      target: {
        name: 'band2',
        value: customFilterForm.band2
      }
    });
    handleTileFormChange({
      target: {
        name: 'formula',
        value: formula
      }
    });

    // Set advanced mode to true to show the custom formula
    // setAdvancedMode(true);

    // Reset form
    setCustomFilterForm({
      name: "",
      description: "",
      band1: "",
      band2: "",
      formula: ""
    });
    setFormulaInput("");
    handleCloseCustomFilterModal();

    // Switch to the new custom filter
    if (filterId) {
      handleLayerChange(filterId);
    }
  };

  if (!isCustomFilterModalOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${isCustomFilterModalOpen ? '' : 'hidden'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t('customFilterModal.title')}
          </h3>
          <button
            onClick={handleCloseCustomFilterModal}
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

        <div className="space-y-4 overflow-y-auto pe-2 flex-grow">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customFilterModal.filterName.label')}
            </label>
            <input
              type="text"
              name="name"
              value={customFilterForm.name}
              onChange={handleCustomFilterChange}
              placeholder={t('customFilterModal.filterName.placeholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customFilterModal.description.label')}
            </label>
            <textarea
              name="description"
              value={customFilterForm.description}
              onChange={handleCustomFilterChange}
              placeholder={t('customFilterModal.description.placeholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows="2"
            ></textarea>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('customFilterModal.formula.title')}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t('customFilterModal.formula.help')}
            </p>

            {/* Band Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('customFilterModal.formula.bands.band1.label')}
                </label>
                <select
                  value={customFilterForm.band1}
                  onChange={(e) => handleBandSelect(e.target.value, 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{t('customFilterModal.formula.bands.band1.placeholder')}</option>
                  {availableBands.map(band => (
                    <option key={band.id} value={band.id}>
                      {band.name} - {band.wavelength}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('customFilterModal.formula.bands.band2.label')}
                </label>
                <select
                  value={customFilterForm.band2}
                  onChange={(e) => handleBandSelect(e.target.value, 2)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{t('customFilterModal.formula.bands.band2.placeholder')}</option>
                  {availableBands.map(band => (
                    <option key={band.id} value={band.id}>
                      {band.name} - {band.wavelength}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Formula Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('customFilterModal.formula.bands.label')}
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 min-h-[80px] text-gray-900 dark:text-gray-100">
                {formulaInput || t('customFilterModal.formula.bands.placeholder')}
              </div>
            </div>

            {/* Operators */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('customFilterModal.formula.operators.label')}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {['+', '-', '*', '/', '(', ')', '7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '^', 'Band1', 'Band2'].map((op) => (
                  <button
                    key={op}
                    onClick={() => handleFormulaInput(op)}
                    className="py-2 px-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors"
                  >
                    {op}
                  </button>
                ))}
                <button
                  onClick={() => setFormulaInput("")}
                  className="py-2 px-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 rounded text-red-800 dark:text-red-300 text-sm font-medium transition-colors col-span-2"
                >
                  {t('customFilterModal.formula.operators.clear')}
                </button>
              </div>
            </div>

            {/* Query Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('customFilterModal.formula.query.label')}
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm font-mono">
                {formulaInput
                  ? formulaInput.replace("Band1", customFilterForm.band1 || "Band1").replace("Band2", customFilterForm.band2 || "Band2")
                  : t('customFilterModal.formula.query.placeholder')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreateAndApply}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('customFilterModal.buttons.createAndApply')}
          </button>
          <button
            onClick={handleCloseCustomFilterModal}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
          >
            {t('customFilterModal.buttons.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFilterModal;
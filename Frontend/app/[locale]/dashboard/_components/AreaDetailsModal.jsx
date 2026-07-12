"use client";
import { useAddFarmAreaMutation, useUpdateFarmAreaMutation } from "@/app/[locale]/lib/api/farmAreasSlice";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { SERVER_URL } from "@/utils/constants";
import { useTranslation } from "react-i18next";

const AreaDetailsModal = ({ isOpen, onClose, initialData = {} }) => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    name: "",
    primaryCrop: "",
    secondaryCrops: "",
    soilType: "",
    irrigationSystem: "",
    fertilizers: "",
    fertilizationFrequency: "",
    fertilizationMethod: "",
    commonPests: "",
    pesticides: "",
    previousYield: "",
    soilTestResults: "",
    yieldLosses: "",
    additionalNotes: "",
  });

  // File upload states
  const [soilReports, setSoilReports] = useState(null);
  const [yieldData, setYieldData] = useState(null);
  const [cropPhotos, setCropPhotos] = useState(null);
  const [otherDocuments, setOtherDocuments] = useState(null);

  // API mutations
  const [addFarmArea] = useAddFarmAreaMutation();
  const [updateFarmArea] = useUpdateFarmAreaMutation();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData.name || "",
        primaryCrop: initialData.primaryCrop || "",
        secondaryCrops: initialData.secondaryCrops || "",
        soilType: initialData.soilType || "",
        irrigationSystem: initialData.irrigationSystem || "",
        fertilizers: initialData.fertilizers || "",
        fertilizationFrequency: initialData.fertilizationFrequency || "",
        fertilizationMethod: initialData.fertilizationMethod || "",
        commonPests: initialData.commonPests || "",
        pesticides: initialData.pesticides || "",
        previousYield: initialData.previousYield || "",
        soilTestResults: initialData.soilTestResults || "",
        yieldLosses: initialData.yieldLosses || "",
        additionalNotes: initialData.additionalNotes || "",
      });

      // Reset file upload states when modal opens
      setSoilReports(null);
      setYieldData(null);
      setCropPhotos(null);
      setOtherDocuments(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Combine form data with file references
      const completeData = {
        ...formData,
        coordinates: initialData.coordinates,
        center: initialData.center,
        files: {
          soilReports,
          yieldData,
          cropPhotos,
          otherDocuments
        }
      };

      if (initialData.name) {
        // Update existing area
        await updateFarmArea({
          id: initialData.id,
          ...completeData
        }).unwrap();
        toast.success(t('areaDetailsModal.messages.success.update'));
      } else {
        // Add new area
        await addFarmArea(completeData).unwrap();
        toast.success(t('areaDetailsModal.messages.success.add'));
      }

      onClose();
    } catch (error) {
      console.error('Failed to save area:', error);
      toast.error(error.data?.detail || t('areaDetailsModal.messages.error'));
    }
  };

  const handleFileChange = (setter) => (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Take only the first file if it's not a multiple file input
      const file = e.target.files[0];
      setter(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-start align-middle shadow-xl transition-all max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? "left-4" : " right-4"} text-gray-400 hover:text-gray-500 focus:outline-none z-10`}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title - Fixed at the top */}
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              {initialData.name ? t('areaDetailsModal.title.edit') : t('areaDetailsModal.title.add')}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('areaDetailsModal.description')}
            </p>
          </div>

          {/* Scrollable form content */}
          <div className="overflow-y-auto pe-2 flex-grow">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('areaDetailsModal.sections.farmInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.areaName.label')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.areaName.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="primaryCrop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.primaryCrop.label')}
                    </label>
                    <input
                      type="text"
                      id="primaryCrop"
                      value={formData.primaryCrop}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryCrop: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.primaryCrop.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="secondaryCrops" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.secondaryCrops.label')}
                    </label>
                    <input
                      type="text"
                      id="secondaryCrops"
                      value={formData.secondaryCrops}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryCrops: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.secondaryCrops.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="irrigationSystem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.irrigationSystem.label')}
                    </label>
                    <input
                      type="text"
                      id="irrigationSystem"
                      value={formData.irrigationSystem}
                      onChange={(e) => setFormData((prev) => ({ ...prev, irrigationSystem: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.irrigationSystem.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.soilType.label')}
                    </label>
                    <input
                      type="text"
                      id="soilType"
                      value={formData.soilType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, soilType: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.soilType.placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Crop Management */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('areaDetailsModal.sections.cropManagement')}</h4>

                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('areaDetailsModal.fields.fertilization.title')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="fertilizers" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.fertilization.types.label')}
                    </label>
                    <input
                      type="text"
                      id="fertilizers"
                      value={formData.fertilizers}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fertilizers: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.fertilization.types.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="fertilizationFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.fertilization.frequency.label')}
                    </label>
                    <input
                      type="text"
                      id="fertilizationFrequency"
                      value={formData.fertilizationFrequency}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fertilizationFrequency: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.fertilization.frequency.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="fertilizationMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.fertilization.method.label')}
                    </label>
                    <input
                      type="text"
                      id="fertilizationMethod"
                      value={formData.fertilizationMethod}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fertilizationMethod: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.fertilization.method.placeholder')}
                    />
                  </div>
                </div>

                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('areaDetailsModal.fields.pestManagement.title')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="commonPests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.pestManagement.pests.label')}
                    </label>
                    <input
                      type="text"
                      id="commonPests"
                      value={formData.commonPests}
                      onChange={(e) => setFormData((prev) => ({ ...prev, commonPests: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.pestManagement.pests.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="pesticides" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.pestManagement.pesticides.label')}
                    </label>
                    <input
                      type="text"
                      id="pesticides"
                      value={formData.pesticides}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pesticides: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.pestManagement.pesticides.placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Historical Data */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('areaDetailsModal.sections.historicalData')}</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="previousYield" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.historical.previousYield.label')}
                    </label>
                    <input
                      type="text"
                      id="previousYield"
                      value={formData.previousYield}
                      onChange={(e) => setFormData((prev) => ({ ...prev, previousYield: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.historical.previousYield.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="soilTestResults" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.historical.soilTest.label')}
                    </label>
                    <input
                      type="text"
                      id="soilTestResults"
                      value={formData.soilTestResults}
                      onChange={(e) => setFormData((prev) => ({ ...prev, soilTestResults: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.historical.soilTest.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="yieldLosses" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.historical.yieldLosses.label')}
                    </label>
                    <textarea
                      id="yieldLosses"
                      rows={2}
                      value={formData.yieldLosses}
                      onChange={(e) => setFormData((prev) => ({ ...prev, yieldLosses: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder={t('areaDetailsModal.fields.historical.yieldLosses.placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* File Uploads */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('areaDetailsModal.sections.documents')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="soilReports" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.documents.soilReports.label')}
                    </label>
                    {initialData.files?.soilReports ? (
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={`${SERVER_URL}${initialData.files.soilReports}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('areaDetailsModal.fields.documents.soilReports.viewExisting')}
                        </a>
                        <input
                          type="file"
                          id="soilReports"
                          onChange={handleFileChange(setSoilReports)}
                          className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        id="soilReports"
                        onChange={handleFileChange(setSoilReports)}
                        className="mt-1 block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                      />
                    )}
                  </div>

                  <div>
                    <label htmlFor="yieldData" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.documents.yieldData.label')}
                    </label>
                    {initialData.files?.yieldData ? (
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={`${SERVER_URL}${initialData.files.yieldData}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('areaDetailsModal.fields.documents.yieldData.viewExisting')}
                        </a>
                        <input
                          type="file"
                          id="yieldData"
                          onChange={handleFileChange(setYieldData)}
                          className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        id="yieldData"
                        onChange={handleFileChange(setYieldData)}
                        className="mt-1 block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                      />
                    )}
                  </div>

                  <div>
                    <label htmlFor="cropPhotos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.documents.cropPhotos.label')}
                    </label>
                    {initialData.files?.cropPhotos ? (
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={`${SERVER_URL}${initialData.files.cropPhotos}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('areaDetailsModal.fields.documents.cropPhotos.viewExisting')}
                        </a>
                        <input
                          type="file"
                          id="cropPhotos"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange(setCropPhotos)}
                          className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        id="cropPhotos"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange(setCropPhotos)}
                        className="mt-1 block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                      />
                    )}
                  </div>

                  <div>
                    <label htmlFor="otherDocuments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('areaDetailsModal.fields.documents.otherDocuments.label')}
                    </label>
                    {initialData.files?.otherDocuments ? (
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={`${SERVER_URL}${initialData.files.otherDocuments}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('areaDetailsModal.fields.documents.otherDocuments.viewExisting')}
                        </a>
                        <input
                          type="file"
                          id="otherDocuments"
                          multiple
                          onChange={handleFileChange(setOtherDocuments)}
                          className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        id="otherDocuments"
                        multiple
                        onChange={handleFileChange(setOtherDocuments)}
                        className="mt-1 block w-full text-sm text-gray-500 file:me-4 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('areaDetailsModal.sections.additionalInfo')}</h4>
                <div>
                  <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('areaDetailsModal.fields.additionalNotes.label')}
                  </label>
                  <textarea
                    id="additionalNotes"
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    placeholder={t('areaDetailsModal.fields.additionalNotes.placeholder')}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {t('areaDetailsModal.buttons.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                >
                  {t('areaDetailsModal.buttons.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaDetailsModal;
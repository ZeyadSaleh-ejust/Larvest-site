"use client";
import { useGetFarmAreasQuery, useDeleteFarmAreaMutation } from "@/app/[locale]/lib/api/farmAreasSlice";
import React, { useState } from "react";
import { FaSearch, FaSort, FaTrash, FaEdit, FaExpand, FaCompress, FaCloudSun } from "react-icons/fa";
import toast from 'react-hot-toast';
import { SERVER_URL } from "@/utils/constants";
import { useTranslation } from "react-i18next";

const DrawnAreasDetails = ({ onDelete, onEdit, onView, onViewWeather }) => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const [expandedAreaId, setExpandedAreaId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch areas from API
  const { data: areas = [], isLoading } = useGetFarmAreasQuery();
  const [deleteFarmArea] = useDeleteFarmAreaMutation();

  const toggleExpand = (areaId) => {
    setExpandedAreaId(expandedAreaId === areaId ? null : areaId);
  };

  // Filter areas based on search term
  const filteredAreas = areas.filter(area =>
    (area.name || "Unnamed Area").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.primaryCrop || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.soilType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort areas based on selected criteria
  const sortedAreas = [...filteredAreas].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "Unnamed Area").localeCompare(b.name || "Unnamed Area");
      case "size":
        return parseFloat(b.measurements?.acres || 0) - parseFloat(a.measurements?.acres || 0);
      case "crop":
        return (a.primaryCrop || "").localeCompare(b.primaryCrop || "");
      default:
        return 0;
    }
  });

  // Group areas by primary crop type for better organization
  const groupedByCrop = {};
  sortedAreas.forEach(area => {
    const cropType = area.primaryCrop || "Uncategorized";
    if (!groupedByCrop[cropType]) {
      groupedByCrop[cropType] = [];
    }
    groupedByCrop[cropType].push(area);
  });

  // Calculate total acreage
  const totalAcreage = areas.reduce((sum, area) =>
    sum + parseFloat(area.measurements?.acres || 0), 0
  ).toFixed(2);

  const handleDeleteClick = (areaId) => {
    setShowDeleteConfirm(areaId);
  };

  const handleDeleteConfirm = async (areaId) => {
    try {
      await deleteFarmArea(areaId).unwrap();
      toast.success(t('drawnAreas.messages.deleteSuccess'));
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error.data?.detail || t('drawnAreas.messages.deleteError'));
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {t('drawnAreas.title', { count: areas.length })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('drawnAreas.totalArea', { acres: totalAcreage })}
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder={t('drawnAreas.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-500 ps-10 pe-4`}
            />
            <FaSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 text-gray-400`} />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="name">{t('drawnAreas.sort.name')}</option>
            <option value="size">{t('drawnAreas.sort.size')}</option>
            <option value="crop">{t('drawnAreas.sort.crop')}</option>
          </select>
        </div>
      </div>

      {/* No results message */}
      {sortedAreas.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          {searchTerm ? (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('drawnAreas.noResults.search.title')}</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-green-600 dark:text-green-400 hover:underline"
              >
                {t('drawnAreas.noResults.search.clear')}
              </button>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('drawnAreas.noResults.empty.title')}</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                {t('drawnAreas.noResults.empty.subtitle')}
              </p>
            </>
          )}
        </div>
      )}

      {/* Areas list */}
      {sortedAreas.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByCrop).map(([cropType, areas]) => (
            <div key={cropType} className="space-y-3">
              <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full bg-green-500 me-2`}></span>
                {cropType} ({areas.length})
              </h3>

              <div className="space-y-3">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    <div
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${expandedAreaId === area.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                      onClick={() => toggleExpand(area.id)}
                    >
                      <div className="flex items-center">
                        <div className={`me-3`}>
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">
                            {area.name || "Unnamed Area"}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className={`me-3`}>{area.measurements?.acres || 0} acres</span>
                            {area.location && (
                              <span className="flex items-center">
                                <svg className={`w-3 h-3 me-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {area.location.details?.county || area.location.details?.state || ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="hidden sm:flex items-center me-4">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(area.lastEdited || area.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); onView(area.id); }}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                            title={t('drawnAreas.actions.view')}
                          >
                            <FaExpand />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewWeather(area.id); }}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                            title={t('drawnAreas.actions.weather', 'Weather')}
                          >
                            <FaCloudSun />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(area.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Delete area"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedAreaId === area.id && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Farm/Field Information */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('drawnAreas.sections.farmInfo')}
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {area.primaryCrop && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.primaryCrop')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.primaryCrop}</span>
                                </li>
                              )}
                              {area.secondaryCrops && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.secondaryCrops')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.secondaryCrops}</span>
                                </li>
                              )}
                              {area.irrigationSystem && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.irrigation')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.irrigationSystem}</span>
                                </li>
                              )}
                              {area.soilType && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.soilType')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.soilType}</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Crop Management */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('drawnAreas.sections.cropManagement')}
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {area.fertilizers && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.fertilizers')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.fertilizers}</span>
                                </li>
                              )}
                              {area.fertilizationFrequency && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.application')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.fertilizationFrequency}</span>
                                </li>
                              )}
                              {area.commonPests && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.commonPests')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.commonPests}</span>
                                </li>
                              )}
                              {area.pesticides && (
                                <li className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.pesticides')}</span>
                                  <span className="text-gray-800 dark:text-gray-200">{area.pesticides}</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Historical Data */}
                          {(area.previousYield || area.soilTestResults || area.yieldLosses) && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('drawnAreas.sections.historicalData')}
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {area.previousYield && (
                                  <li className="flex">
                                    <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.previousYield')}</span>
                                    <span className="text-gray-800 dark:text-gray-200">{area.previousYield}</span>
                                  </li>
                                )}
                                {area.soilTestResults && (
                                  <li className="flex">
                                    <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.soilTestResults')}</span>
                                    <span className="text-gray-800 dark:text-gray-200">{area.soilTestResults}</span>
                                  </li>
                                )}
                                {area.yieldLosses && (
                                  <li className="flex">
                                    <span className="text-gray-500 dark:text-gray-400 w-32">{t('drawnAreas.fields.yieldLosses')}</span>
                                    <span className="text-gray-800 dark:text-gray-200">{area.yieldLosses}</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Additional Notes */}
                          {area.additionalNotes && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('drawnAreas.sections.additionalNotes')}
                              </h4>
                              <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded-md">
                                {area.additionalNotes}
                              </p>
                            </div>
                          )}

                          {/* Files */}
                          {area.files && Object.values(area.files).some(file => file) && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('drawnAreas.sections.uploadedFiles')}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {area.files.soilReports && (
                                  <a
                                    href={`${SERVER_URL}${area.files.soilReports}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                  >
                                    <svg className={`w-3 h-3 me-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('drawnAreas.files.soilReports')}
                                  </a>
                                )}
                                {area.files.yieldData && (
                                  <a
                                    href={`${SERVER_URL}${area.files.yieldData}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                  >
                                    <svg className={`w-3 h-3 me-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('drawnAreas.files.yieldData')}
                                  </a>
                                )}
                                {area.files.cropPhotos && (
                                  <a
                                    href={`${SERVER_URL}${area.files.cropPhotos}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                                  >
                                    <svg className={`w-3 h-3 me-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {t('drawnAreas.files.cropPhotos')}
                                  </a>
                                )}
                                {area.files.otherDocuments && (
                                  <a
                                    href={`${SERVER_URL}${area.files.otherDocuments}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                  >
                                    <svg className={`w-3 h-3 me-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('drawnAreas.files.otherDocuments')}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('drawnAreas.deleteConfirm.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('drawnAreas.deleteConfirm.message')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {t('drawnAreas.deleteConfirm.cancel')}
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('drawnAreas.deleteConfirm.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this CSS to your global styles or component
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

export default DrawnAreasDetails;
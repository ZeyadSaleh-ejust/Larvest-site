import { SERVER_URL } from "@/utils/constants";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

const TimeSeriesResultModal = ({ open, onClose, gifFilePath, valuesFilePath }) => {
  const [tab, setTab] = useState('gif');
  const { t } = useTranslation('dashboard');

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-5xl w-full p-0 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-2 text-base font-medium ${tab === 'gif' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setTab('gif')}
          >
            {t('timeSeriesModal.gifTab', 'GIF Animation')}
          </button>
          <button
            className={`flex-1 py-2 text-base font-medium ${tab === 'values' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setTab('values')}
          >
            {t('timeSeriesModal.valuesTab', 'Values Over Time')}
          </button>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center min-h-[600px] max-h-[70vh]">
          {tab === 'gif' ? (
            <img src={`${SERVER_URL}/${gifFilePath}`} alt={t('timeSeriesModal.gifAlt', 'GIF Animation')} className="max-h-[540px] max-w-full rounded shadow-lg object-contain" />
          ) : (
            <img src={`${SERVER_URL}/${valuesFilePath}`} alt={t('timeSeriesModal.valuesAlt', 'Values Over Time')} className="max-h-[540px] max-w-full rounded shadow-lg object-contain" />
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? ReactDOM.createPortal(modalContent, document.body)
    : null;
};

export default TimeSeriesResultModal; 
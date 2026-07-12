"use client";
import React from 'react';

const WeatherMetricCard = ({ icon, label, value, unit, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center me-4">
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value !== undefined && value !== null ? value : '--'}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ms-1">
              {unit}
            </span>
          </div>
        </div>
      </div>
      {description && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </div>
      )}
    </div>
  );
};

export default WeatherMetricCard; 
"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const CoordinatesInput = ({ onDrawArea }) => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const [coordinates, setCoordinates] = useState("");
  const [error, setError] = useState("");
  const [validationStatus, setValidationStatus] = useState({
    hasMinPoints: false,
    validFormat: true,
    inRange: true,
  });
  const [parsedPoints, setParsedPoints] = useState([]);

  const validateCoordinates = (input) => {
    if (!input.trim()) {
      setValidationStatus({
        hasMinPoints: false,
        validFormat: true,
        inRange: true,
      });
      setParsedPoints([]);
      return;
    }

    try {
      const lines = input
        .split(/[\n]/)
        .map((line) => line.trim())
        .filter((line) => line !== "");

      const points = lines.map((line, index) => {
        const [lng, lat] = line.split(",").map((part) => parseFloat(part.trim()));

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(t('coordinatesInput.error.invalidFormat', { line: index + 1 }));
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error(t('coordinatesInput.error.outOfRange', { line: index + 1 }));
        }

        return { lat, lng };
      });

      setValidationStatus({
        hasMinPoints: points.length >= 3,
        validFormat: true,
        inRange: true,
      });
      setParsedPoints(points);
      setError("");
    } catch (err) {
      setValidationStatus({
        hasMinPoints: false,
        validFormat: !err.message.includes("Invalid format"),
        inRange: !err.message.includes("out of range"),
      });
      setError(err.message);
      setParsedPoints([]);
    }
  };

  useEffect(() => {
    validateCoordinates(coordinates);
  }, [coordinates]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validationStatus.hasMinPoints) {
      setError(t('coordinatesInput.error.minPoints'));
      return;
    }

    if (!validationStatus.validFormat || !validationStatus.inRange) {
      return;
    }

    onDrawArea(parsedPoints);
    setCoordinates("");
    setParsedPoints([]);
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 w-[450px] max-w-[calc(100%-2rem)] z-10 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm border border-gray-100/20 dark:border-gray-700/30 p-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
          {t('coordinatesInput.title')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('coordinatesInput.points', { count: parsedPoints.length })}
          </span>
          {validationStatus.hasMinPoints && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <textarea
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700/50 dark:text-white text-sm transition-all duration-200"
              placeholder={t('coordinatesInput.placeholder')}
              rows="6"
            />
            <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 flex flex-col gap-1`}>
              {Object.entries(validationStatus).map(([key, status]) => (
                <span
                  key={key}
                  className={`h-2 w-2 rounded-full ${status ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="space-y-1">
              <p className="font-medium">{t('coordinatesInput.requirements.title')}</p>
              <p>{t('coordinatesInput.requirements.onePerLine')}</p>
              <p>{t('coordinatesInput.requirements.useComma')}</p>
              <p>{t('coordinatesInput.requirements.minPoints')}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">{t('coordinatesInput.ranges.title')}</p>
              <p>{t('coordinatesInput.ranges.latitude')}</p>
              <p>{t('coordinatesInput.ranges.longitude')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!validationStatus.hasMinPoints || !validationStatus.validFormat || !validationStatus.inRange}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
          >
            {t('coordinatesInput.buttons.drawArea')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CoordinatesInput;

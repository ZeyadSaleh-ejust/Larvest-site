"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import WeatherCharts from './charts/WeatherCharts';
import WeatherMetricCard from './WeatherMetricCard';
import { useMap } from './context/MapContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const WeatherDashboard = ({ selectedArea }) => {
  const { t, i18n } = useTranslation("dashboard");
  const isRTL = i18n.language === 'ar';

  const [currentHourIndex, setCurrentHourIndex] = useState(new Date().getHours() % 24);
  const [currentForecastRange, setCurrentForecastRange] = useState(7);
  const [currentSelectedDailyIndex, setCurrentSelectedDailyIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('hourly');
  const [hourlyData, setHourlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [dataStatus, setDataStatus] = useState(t('weatherDashboard.realTime.loading'));
  const [isLoading, setIsLoading] = useState(false);
  const { mapInstance } = useMap();

  // Get location details from the selected area
  const getLocationDetails = useMemo(() => {
    if (!selectedArea) return t('weatherDashboard.areaDetails.location', { location: "No area selected" });

    const location = selectedArea.location?.details;
    const parts = [];

    if (location?.county) parts.push(location.county);
    if (location?.state) parts.push(location.state);
    if (location?.country) parts.push(location.country);

    return parts.length > 0 ? parts.join(", ") : t('weatherDashboard.areaDetails.location', { location: "Location not specified" });
  }, [selectedArea, t]);

  // Get area details for display
  const areaDetails = useMemo(() => {
    if (!selectedArea) return null;

    // Safely handle measurements.acres
    const getAcres = () => {
      const acres = selectedArea.measurements?.acres;
      if (acres === undefined || acres === null) return "0";
      // Convert to number if it's a string
      const numAcres = typeof acres === 'string' ? parseFloat(acres) : acres;
      return isNaN(numAcres) ? "0" : numAcres.toFixed(2);
    };

    return {
      name: selectedArea.name || t('weatherDashboard.areaDetails.title'),
      size: getAcres(),
      crop: selectedArea.primaryCrop || t('weatherDashboard.cropInfo.primaryCrop', { crop: "Not specified" }),
      soilType: selectedArea.soilType || t('weatherDashboard.cropInfo.soilType', { soilType: "Not specified" }),
      irrigation: selectedArea.irrigationSystem || t('weatherDashboard.management.irrigation', { irrigation: "Not specified" }),
      location: getLocationDetails,
      coordinates: selectedArea.coordinates,
      center: selectedArea.center
    };
  }, [selectedArea, getLocationDetails, t]);

  const hourlyVariablesMeta = [
    { key: "temperature_2m", name: t('weatherDashboard.metrics.temperature.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.temperature.desc') },
    { key: "relative_humidity_2m", name: t('weatherDashboard.metrics.humidity.name'), unit: "%", icon: "💧", desc: t('weatherDashboard.metrics.humidity.desc') },
    { key: "rain", name: t('weatherDashboard.metrics.rainfall.name'), unit: "mm/hr", icon: "🌧️", desc: t('weatherDashboard.metrics.rainfall.desc') },
    { key: "cloud_cover", name: t('weatherDashboard.metrics.cloudCover.name'), unit: "%", icon: "☁️", desc: t('weatherDashboard.metrics.cloudCover.desc') },
    { key: "et0_fao_evapotranspiration", name: t('weatherDashboard.metrics.et0.name'), unit: "mm", icon: "🌿", desc: t('weatherDashboard.metrics.et0.desc') },
    { key: "wind_speed_10m", name: t('weatherDashboard.metrics.windSpeed.name'), unit: "km/h", icon: "💨", desc: t('weatherDashboard.metrics.windSpeed.desc') },
    { key: "wind_direction_10m", name: t('weatherDashboard.metrics.windDirection.name'), unit: "°", icon: "🧭", desc: t('weatherDashboard.metrics.windDirection.desc') },
    { key: "vapour_pressure_deficit", name: t('weatherDashboard.metrics.vpd.name'), unit: "kPa", icon: "💨", desc: t('weatherDashboard.metrics.vpd.desc') }
  ];

  const dailyVariablesMeta = [
    { key: "temperature_2m_max", name: t('weatherDashboard.metrics.maxTemp.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.maxTemp.desc') },
    { key: "temperature_2m_min", name: t('weatherDashboard.metrics.minTemp.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.minTemp.desc') },
    { key: "sunshine_duration", name: t('weatherDashboard.metrics.sunshine.name'), unit: "hrs", icon: "☀️", desc: t('weatherDashboard.metrics.sunshine.desc'), multiplier: 1 / 3600 },
    { key: "rain_sum", name: t('weatherDashboard.metrics.totalRain.name'), unit: "mm", icon: "🌧️", desc: t('weatherDashboard.metrics.totalRain.desc') },
    { key: "precipitation_probability_max", name: t('weatherDashboard.metrics.rainChance.name'), unit: "%", icon: "💧", desc: t('weatherDashboard.metrics.rainChance.desc') },
    { key: "wind_speed_10m_max", name: t('weatherDashboard.metrics.maxWind.name'), unit: "km/h", icon: "💨", desc: t('weatherDashboard.metrics.maxWind.desc') },
    { key: "sunrise", name: t('weatherDashboard.metrics.sunrise.name'), unit: "", icon: "🌅", desc: t('weatherDashboard.metrics.sunrise.desc'), type: "time" },
    { key: "sunset", name: t('weatherDashboard.metrics.sunset.name'), unit: "", icon: "🌇", desc: t('weatherDashboard.metrics.sunset.desc'), type: "time" }
  ];

  const soilVariablesMeta = [
    { key: "soil_temperature_0cm", name: t('weatherDashboard.metrics.soilTemp.surface.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.soilTemp.surface.desc') },
    { key: "soil_temperature_6cm", name: t('weatherDashboard.metrics.soilTemp.shallow.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.soilTemp.shallow.desc') },
    { key: "soil_temperature_18cm", name: t('weatherDashboard.metrics.soilTemp.root.name'), unit: "°C", icon: "🌡️", desc: t('weatherDashboard.metrics.soilTemp.root.desc') },
    { key: "soil_moisture_0_to_1cm", name: t('weatherDashboard.metrics.soilMoisture.surface.name'), unit: "m³/m³", icon: "💧", desc: t('weatherDashboard.metrics.soilMoisture.surface.desc') },
    { key: "soil_moisture_1_to_3cm", name: t('weatherDashboard.metrics.soilMoisture.shallow.name'), unit: "m³/m³", icon: "💧", desc: t('weatherDashboard.metrics.soilMoisture.shallow.desc') },
    { key: "soil_moisture_3_to_9cm", name: t('weatherDashboard.metrics.soilMoisture.medium.name'), unit: "m³/m³", icon: "💧", desc: t('weatherDashboard.metrics.soilMoisture.medium.desc') },
    { key: "soil_moisture_9_to_27cm", name: t('weatherDashboard.metrics.soilMoisture.deep.name'), unit: "m³/m³", icon: "💧", desc: t('weatherDashboard.metrics.soilMoisture.deep.desc') },
    { key: "soil_moisture_27_to_81cm", name: t('weatherDashboard.metrics.soilMoisture.veryDeep.name'), unit: "m³/m³", icon: "💧", desc: t('weatherDashboard.metrics.soilMoisture.veryDeep.desc') }
  ];

  // Fetch weather data from Open-Meteo
  const fetchWeatherData = useCallback(async () => {
    if (!selectedArea?.center) return;

    setIsLoading(true);
    setDataStatus(t('weatherDashboard.realTime.loadingArea', { areaName: areaDetails.name }));

    try {
      const [lat, lng] = selectedArea.center;
      console.log(`Fetching weather data for coordinates: ${lat}, ${lng}`);

      // Fetch hourly forecast
      const hourlyResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,rain,cloud_cover,et0_fao_evapotranspiration,wind_speed_10m,wind_direction_10m,vapour_pressure_deficit&timezone=auto`
      );

      if (!hourlyResponse.ok) {
        throw new Error(`Hourly forecast failed: ${hourlyResponse.statusText}`);
      }

      const hourlyData = await hourlyResponse.json();

      // Process hourly data
      const processedHourlyData = {
        time: hourlyData.hourly.time.map(time => {
          const date = new Date(time);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }),
        temperature_2m: hourlyData.hourly.temperature_2m,
        relative_humidity_2m: hourlyData.hourly.relative_humidity_2m,
        rain: hourlyData.hourly.rain,
        cloud_cover: hourlyData.hourly.cloud_cover,
        et0_fao_evapotranspiration: hourlyData.hourly.et0_fao_evapotranspiration,
        wind_speed_10m: hourlyData.hourly.wind_speed_10m,
        wind_direction_10m: hourlyData.hourly.wind_direction_10m,
        vapour_pressure_deficit: hourlyData.hourly.vapour_pressure_deficit
      };

      // Fetch daily forecast with forecast_days parameter
      const dailyResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,sunshine_duration,rain_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&forecast_days=${currentForecastRange}&timezone=auto`
      );

      if (!dailyResponse.ok) {
        throw new Error(`Daily forecast failed: ${dailyResponse.statusText}`);
      }

      const dailyData = await dailyResponse.json();

      // Process daily data
      const processedDailyData = {
        date: dailyData.daily.time.map(time => {
          const date = new Date(time);
          return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        }),
        temperature_2m_max: dailyData.daily.temperature_2m_max,
        temperature_2m_min: dailyData.daily.temperature_2m_min,
        sunshine_duration: dailyData.daily.sunshine_duration.map(duration => duration / 3600), // Convert to hours
        rain_sum: dailyData.daily.rain_sum,
        precipitation_probability_max: dailyData.daily.precipitation_probability_max,
        wind_speed_10m_max: dailyData.daily.wind_speed_10m_max,
        sunrise: dailyData.daily.sunrise.map(time => new Date(time).getTime() / 1000),
        sunset: dailyData.daily.sunset.map(time => new Date(time).getTime() / 1000)
      };

      // Generate soil data (Open-Meteo doesn't provide soil data, so we'll use our mock data)
      const soilData = generateMockSoilData();

      setHourlyData(processedHourlyData);
      setDailyData(processedDailyData);
      setSoilData(soilData);

      setDataStatus(t('weatherDashboard.realTime.displaying', {
        areaName: areaDetails.name,
        time: new Date().toLocaleTimeString()
      }));

    } catch (error) {
      console.error('Error fetching weather data:', error);
      setDataStatus(t('weatherDashboard.realTime.error', { error: error.message }));
      toast.error(t('weatherDashboard.realTime.error', { error: error.message }), {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea, areaDetails.name, currentForecastRange, t]);

  // Generate mock soil data (since Open-Meteo doesn't provide soil data)
  const generateMockSoilData = useCallback((numHours = 24) => {
    const data = {
      time: [],
      soil_temperature_0cm: [],
      soil_temperature_6cm: [],
      soil_temperature_18cm: [],
      soil_moisture_0_to_1cm: [],
      soil_moisture_1_to_3cm: [],
      soil_moisture_3_to_9cm: [],
      soil_moisture_9_to_27cm: [],
      soil_moisture_27_to_81cm: []
    };

    const now = new Date();
    now.setMinutes(0, 0, 0);

    // Adjust base values based on soil type and irrigation
    const baseMoisture = selectedArea?.soilType?.toLowerCase().includes('clay') ? 0.05 : 0;
    const moistureRange = selectedArea?.irrigationSystem ? 0.3 : 0.2;

    for (let i = 0; i < numHours; i++) {
      const hourTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      data.time.push(hourTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      data.soil_temperature_0cm.push(parseFloat((18 + Math.random() * 10).toFixed(1)));
      data.soil_temperature_6cm.push(parseFloat((17 + Math.random() * 9).toFixed(1)));
      data.soil_temperature_18cm.push(parseFloat((16 + Math.random() * 8).toFixed(1)));
      data.soil_moisture_0_to_1cm.push(parseFloat((0.1 + baseMoisture + Math.random() * moistureRange).toFixed(2)));
      data.soil_moisture_1_to_3cm.push(parseFloat((0.15 + baseMoisture + Math.random() * moistureRange).toFixed(2)));
      data.soil_moisture_3_to_9cm.push(parseFloat((0.18 + baseMoisture + Math.random() * moistureRange).toFixed(2)));
      data.soil_moisture_9_to_27cm.push(parseFloat((0.20 + baseMoisture + Math.random() * moistureRange).toFixed(2)));
      data.soil_moisture_27_to_81cm.push(parseFloat((0.22 + baseMoisture + Math.random() * moistureRange).toFixed(2)));
    }
    return data;
  }, [selectedArea]);

  // Initialize data
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const renderMetricsGrid = (data, meta, index = 0) => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {meta.map(variable => {
          let value = data[variable.key] ? data[variable.key][index] : null;
          if (variable.type === 'time' && value) {
            value = new Date(value * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (value !== null && typeof value === 'number') {
            value = value.toFixed(variable.multiplier || variable.key.includes('sum') ? 1 : (variable.key.includes('temp') ? 1 : 0));
          }
          return (
            <WeatherMetricCard
              key={variable.key}
              icon={variable.icon}
              label={variable.name}
              value={value}
              unit={variable.unit}
              description={variable.desc}
            />
          );
        })}
      </div>
    );
  };

  const renderDailyForecastCards = () => {
    if (!dailyData) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {dailyData.date.slice(0, currentForecastRange).map((dateStr, index) => {
          let icon = '☀️';
          if (dailyData.rain_sum[index] > 5) icon = '🌧️';
          else if (dailyData.rain_sum[index] > 0) icon = '🌦️';
          else if (dailyData.temperature_2m_max[index] < 15) icon = '❄️';

          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${currentSelectedDailyIndex === index ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setCurrentSelectedDailyIndex(index)}
            >
              <div className="font-semibold text-green-600 dark:text-green-400 mb-1">
                {dateStr.split(',')[0]}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {dateStr.split(',').slice(1).join(',').trim()}
              </div>
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t('weatherDashboard.metrics.maxTemp.name')}: {dailyData.temperature_2m_max[index].toFixed(0)}°
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t('weatherDashboard.metrics.minTemp.name')}: {dailyData.temperature_2m_min[index].toFixed(0)}°
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dailyData.rain_sum[index].toFixed(1)}mm | {dailyData.precipitation_probability_max[index].toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700" >
      {/* <div className="header bg-gradient-to-r from-green-600 to-green-700 text-white p-12 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('weatherDashboard.title')}</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t('weatherDashboard.subtitle', { areaName: areaDetails?.name })}
            </p>
            {areaDetails && (
              <div className="mt-4 text-sm opacity-80">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div>
                    <p className="font-semibold">{t('weatherDashboard.areaDetails.title')}:</p>
                    <p>{t('weatherDashboard.areaDetails.size', { size: areaDetails.size })}</p>
                    <p>{t('weatherDashboard.areaDetails.location', { location: areaDetails.location })}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{t('weatherDashboard.cropInfo.title')}:</p>
                    <p>{t('weatherDashboard.cropInfo.primaryCrop', { crop: areaDetails.crop })}</p>
                    <p>{t('weatherDashboard.cropInfo.soilType', { soilType: areaDetails.soilType })}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{t('weatherDashboard.management.title')}:</p>
                    <p>{t('weatherDashboard.management.irrigation', { irrigation: areaDetails.irrigation })}</p>
                    {selectedArea?.fertilizationFrequency && (
                      <p>{t('weatherDashboard.management.fertilization', { frequency: selectedArea.fertilizationFrequency })}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> */}

      <div className="main-content p-8">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">{t('weatherDashboard.realTime.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('weatherDashboard.realTime.subtitle')}
              <span className={`ms-2`}>{dataStatus}</span>
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              {/* Weather Tabs */}
              <div className="flex justify-center mb-8">
                <div className="bg-white dark:bg-gray-700 rounded-xl p-2 shadow-md">
                  <button
                    className={`px-6 py-2 rounded-lg transition-all ${activeSection === 'hourly'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    onClick={() => setActiveSection('hourly')}
                  >
                    {t('weatherDashboard.tabs.hourly')}
                  </button>
                  <button
                    className={`px-6 py-2 rounded-lg transition-all ${activeSection === 'daily'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    onClick={() => setActiveSection('daily')}
                  >
                    {t('weatherDashboard.tabs.daily')}
                  </button>
                  <button
                    className={`px-6 py-2 rounded-lg transition-all ${activeSection === 'soil'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    onClick={() => setActiveSection('soil')}
                  >
                    {t('weatherDashboard.tabs.soil')}
                  </button>
                </div>
              </div>

              {/* Hourly Section */}
              {activeSection === 'hourly' && hourlyData && (
                <>
                  {renderMetricsGrid(hourlyData, hourlyVariablesMeta, currentHourIndex)}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">{t('weatherDashboard.hourly.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('weatherDashboard.hourly.subtitle')}
                      </p>
                    </div>
                    <WeatherCharts data={hourlyData} type="hourly" />
                  </div>
                </>
              )}

              {/* Daily Section */}
              {activeSection === 'daily' && dailyData && (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-2 shadow-md">
                      <button
                        className={`px-4 py-2 rounded-lg transition-all ${currentForecastRange === 7
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        onClick={() => {
                          setCurrentForecastRange(7);
                        }}
                      >
                        {t('weatherDashboard.daily.range.7days')}
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg transition-all ${currentForecastRange === 14
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        onClick={() => {
                          setCurrentForecastRange(14);
                        }}
                      >
                        {t('weatherDashboard.daily.range.14days')}
                      </button>
                    </div>
                  </div>
                  {renderDailyForecastCards()}
                  {renderMetricsGrid(dailyData, dailyVariablesMeta, currentSelectedDailyIndex)}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {t('weatherDashboard.daily.title', { days: currentForecastRange })}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('weatherDashboard.daily.subtitle')}
                      </p>
                    </div>
                    <WeatherCharts data={dailyData} type="daily" />
                  </div>
                </>
              )}

              {/* Soil Section */}
              {activeSection === 'soil' && soilData && (
                <>
                  {renderMetricsGrid(soilData, soilVariablesMeta, currentHourIndex)}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">{t('weatherDashboard.soil.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('weatherDashboard.soil.subtitle')}
                      </p>
                    </div>
                    <WeatherCharts data={soilData} type="soil" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard; 
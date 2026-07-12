"use client";
import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const WeatherCharts = ({ data, type }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const chartColors = {
    temp: '#059669',
    humidity: '#3b82f6',
    cloud: '#6b7280',
    rain: '#0ea5e9',
    soilTemp: '#f97316',
    soilMoisture: '#06b6d4'
  };

  useEffect(() => {
    if (!data) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    switch (type) {
      case 'hourly':
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.time,
            datasets: [
              {
                label: 'Temperature (°C)',
                data: data.temperature_2m,
                borderColor: chartColors.temp,
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                yAxisID: 'yTemp',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 2,
                fill: true
              },
              {
                label: 'Humidity (%)',
                data: data.relative_humidity_2m,
                borderColor: chartColors.humidity,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'yHumidity',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 2,
                fill: true
              },
              {
                label: 'Cloud Cover (%)',
                data: data.cloud_cover,
                borderColor: chartColors.cloud,
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                yAxisID: 'yCloud',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 2,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false } },
              yTemp: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Temp (°C)', color: chartColors.temp },
                grid: { drawOnChartArea: false }
              },
              yHumidity: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Humidity (%)', color: chartColors.humidity },
                grid: { drawOnChartArea: false },
                suggestedMin: 0,
                suggestedMax: 100
              },
              yCloud: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Cloud Cover (%)', color: chartColors.cloud },
                grid: { drawOnChartArea: false },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: { stepSize: 20 },
                offset: true
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.formattedValue} ${context.dataset.label.includes('°C') ? '°C' : '%'}`
                }
              }
            }
          }
        });
        break;

      case 'daily':
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.date,
            datasets: [
              {
                label: 'Max Temp (°C)',
                data: data.temperature_2m_max,
                type: 'line',
                borderColor: chartColors.temp,
                yAxisID: 'yTemp',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 4
              },
              {
                label: 'Min Temp (°C)',
                data: data.temperature_2m_min,
                type: 'line',
                borderColor: chartColors.humidity,
                yAxisID: 'yTemp',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 4
              },
              {
                label: 'Rain Sum (mm)',
                data: data.rain_sum,
                type: 'bar',
                backgroundColor: 'rgba(14, 165, 233, 0.6)',
                yAxisID: 'yRain',
                barPercentage: 0.6,
                categoryPercentage: 0.7
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false } },
              yTemp: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Temperature (°C)', color: chartColors.temp }
              },
              yRain: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Rain (mm)', color: chartColors.rain },
                grid: { drawOnChartArea: false }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.formattedValue} ${context.dataset.label.includes('°C') ? '°C' : 'mm'}`
                }
              }
            }
          }
        });
        break;

      case 'soil':
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.time,
            datasets: [
              {
                label: 'Surface Temp (°C)',
                data: data.soil_temperature_0cm,
                borderColor: chartColors.soilTemp,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3,
                fill: false
              },
              {
                label: 'Temp 6cm (°C)',
                data: data.soil_temperature_6cm,
                borderColor: 'rgba(249, 115, 22, 0.7)',
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3,
                fill: false
              },
              {
                label: 'Temp 18cm (°C)',
                data: data.soil_temperature_18cm,
                borderColor: 'rgba(217, 70, 239, 0.7)',
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.formattedValue}°C`
                }
              }
            }
          }
        });
        break;
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return (
    <div className="chart-container" style={{ height: '350px', width: '100%' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default WeatherCharts; 
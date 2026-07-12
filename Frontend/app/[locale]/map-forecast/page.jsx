'use client';

import { useEffect, useState, useRef } from 'react';
import { FiMap, FiWind, FiThermometer, FiDroplet, FiCloud, FiSun, FiCalendar, FiClock, FiRefreshCw, FiSettings, FiAlertCircle } from 'react-icons/fi';
import { API_URL } from '@/utils/constants';

const MapForecast = () => {
  const [windyAPI, setWindyAPI] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [pickerData, setPickerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('now');
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [rateLimitBlocked, setRateLimitBlocked] = useState(false);
  const [remainingUses, setRemainingUses] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const observerRef = useRef(null);
  const windyAPIRef = useRef(null);

  const timeRanges = [
    { id: 'now', name: 'Now', icon: <FiClock /> },
    { id: '24h', name: '24 Hours', icon: <FiCalendar /> },
    { id: '7d', name: '7 Days', icon: <FiCalendar /> },
  ];

  // Add pre-load script to disable particles
  useEffect(() => {
    // Check if we've already initialized
    if (window.__windyParticlesDisabled) {
      return;
    }

    const script = document.createElement('script');
    script.textContent = `
      if (!window.__windyParticlesDisabled) {
        window.__windyParticlesDisabled = true;
        window.windyInit = window.windyInit || {};
        window.windyInit.particles = false;
        window.windyInit.particleAnimation = false;
        window.windyInit.particleSystem = false;
        window.windyInit.features = {
          particles: false,
          particleAnimation: false,
          particleSystem: false
        };
        // Override requestAnimationFrame to prevent particle animation
        if (!window.__originalRAF) {
          window.__originalRAF = window.requestAnimationFrame;
          window.requestAnimationFrame = function(callback) {
            if (callback.toString().includes('particles') || 
                callback.toString().includes('gl-particles')) {
              return 0;
            }
            return window.__originalRAF.call(this, callback);
          };
        }
      }
    `;
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let windyInstance = null;
    let initializationInProgress = false;

    const loadScripts = async () => {
      try {
        // Check rate limit before loading Windy
        try {
          const res = await fetch(`${API_URL}/windy-access/`, {
            headers: {
              'ngrok-skip-browser-warning': 'any-value'
            }
          });
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          if (data && data.allowed === false) {
            setRateLimitBlocked(true);
            setIsLoading(false);
            return;
          }
          if (data && typeof data.remaining === 'number') {
            setRemainingUses(data.remaining);
          }
        } catch (err) {
          console.error('Rate limit check failed, proceeding anyway:', err);
        }

        // Prevent multiple initializations
        if (initializationInProgress) {
          return;
        }
        initializationInProgress = true;

        // Remove any existing map instances
        if (mapInstance.current) {
          try {
            // Properly cleanup the Windy API instance
            if (mapInstance.current.store) {
              mapInstance.current.store.off();
            }
            if (mapInstance.current.picker) {
              mapInstance.current.picker.off();
            }
            if (mapInstance.current.particles) {
              mapInstance.current.particles.destroy();
            }
            mapInstance.current.map.remove();
            mapInstance.current = null;
          } catch (error) {
            console.log('Error cleaning up existing map:', error);
          }
        }

        // Block particle system scripts
        observerRef.current = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT') {
                  const src = node.src || '';
                  if (src.includes('particles') || src.includes('gl-particles')) {
                    node.remove();
                  }
                }
              });
            }
          });
        });

        observerRef.current.observe(document.head, { childList: true, subtree: true });

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
        }

        // Load Leaflet
        if (!document.querySelector('script[src*="leaflet.js"]')) {
          const leafletScript = document.createElement('script');
          leafletScript.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
          await new Promise((resolve) => {
            leafletScript.onload = () => {
              // Ensure Leaflet is fully ready
              let checkL = 0;
              const interval = setInterval(() => {
                if (typeof window.L !== 'undefined') {
                  clearInterval(interval);
                  setTimeout(resolve, 100); // Extra delay to ensure full initialization
                } else if (checkL++ > 50) {
                  clearInterval(interval);
                  resolve(); // Timeout fallback
                }
              }, 50);
            };
            document.head.appendChild(leafletScript);
          });
        }

        // Wait a bit more before loading Windy to ensure Leaflet is fully ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Load Windy API with specific version
        if (!document.querySelector('script[src*="libBoot.js"]')) {
          const windyScript = document.createElement('script');
          windyScript.src = 'https://api.windy.com/assets/map-forecast/libBoot.js?v=2.0.0';

          await new Promise((resolve) => {
            windyScript.onload = () => {
              // Override particle system initialization
              if (window.windyInit && typeof window.windyInit === 'function') {
                const originalInit = window.windyInit;
                window.windyInit = function (options, callback) {
                  // Disable particle system in options
                  options.particles = false;
                  options.particleAnimation = false;
                  options.particleSystem = false;
                  options.features = {
                    ...options.features,
                    particles: false,
                    particleAnimation: false,
                    particleSystem: false
                  };

                  // Call original init with modified options
                  return originalInit(options, (api) => {
                    // Disable particle system after initialization
                    if (api && api.particles) {
                      api.particles.destroy();
                    }
                    callback(api);
                  });
                };
              }
              resolve();
            };
            document.head.appendChild(windyScript);
          });
        }

        // Wait for Windy API to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds maximum wait time

        while ((!window.windyInit || typeof window.windyInit !== 'function') && attempts < maxAttempts && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!isMounted) {
          observerRef.current.disconnect();
          initializationInProgress = false;
          return;
        }

        if (!window.windyInit || typeof window.windyInit !== 'function') {
          throw new Error('Windy API failed to initialize');
        }

        const options = {
          key: 'I2FFg09RruQeE1ieaSQqKHbIu66ohfk1',
          verbose: true,
          lat: 30.078,
          lon: 31.285,
          zoom: 5,
          overlay: 'wind',
          level: 'surface',
          // Enable all plugins and controls
          showPlugins: true,
          showControlPanel: true,
          showSettings: true,
          showSearch: true,
          showLocation: true,
          showUnits: true,
          showTime: true,
          showLevel: true,
          showOverlays: true,
          showWind: true,
          showTemp: true,
          showPressure: true,
          showClouds: true,
          showPrecipitation: true,
          showGust: true,
          showHumidity: true,
          showVisibility: true,
          showDewpoint: true,
          showFreezing: true,
          showIcing: true,
          showTurbulence: true,
          showLightning: true,
          showAirmet: true,
          showSigmet: true,
          showTaf: true,
          showMetar: true,
          showNotam: true,
          showWebcams: true,
          showStations: true,
          showBuoys: true,
          showShips: true,
          showPlanes: true,
          showTraffic: true,
          showBorders: true,
          showLabels: true,
          showTerrain: true,
          showTopography: true,
          showBathymetry: true,
          showSeamarks: true,
          showCoastlines: true,
          showCountries: true,
          showStates: true,
          showCounties: true,
          showCities: true,
          showAirports: true,
          showPorts: true,
          showHeliports: true,
          showNavaids: true,
          showVORs: true,
          showNDBs: true,
          showDMEs: true,
          showTACANs: true,
          showVORTACs: true,
          showILSs: true,
          // Disable particle system
          particleAnimation: false,
          particlesAnim: false,
          particlesNumber: 0,
          particlesMinOpacity: 0,
          particlesMaxOpacity: 0,
          particlesWidth: 0,
          particlesHeight: 0,
          particlesSpeed: 0,
          particlesLineWidth: 0,
          particlesBlur: 0,
          showParticles: false,
          disableParticles: true,
          disableParticleAnimation: true,
          disableParticleSystem: true,
          features: {
            particles: false,
            particleAnimation: false,
            particleSystem: false
          }
        };

        window.windyInit(options, api => {
          if (!isMounted) {
            // Properly cleanup if component unmounted during initialization
            if (api.store) {
              api.store.off();
            }
            if (api.picker) {
              api.picker.off();
            }
            if (api.particles) {
              api.particles.destroy();
            }
            api.map.remove();
            observerRef.current.disconnect();
            initializationInProgress = false;
            return;
          }

          windyInstance = api;
          mapInstance.current = api;
          windyAPIRef.current = api;
          setWindyAPI(api);
          setIsAPIReady(true);
          setIsLoading(false);

          // Disable particle system after initialization
          if (api.particles) {
            api.particles.destroy();
          }

          const { map, picker, utils, broadcast } = api;

          picker.on('pickerOpened', ({ lat, lon, values, overlay }) => {
            setIsPickerOpen(true);
            if (values) {
              const windObj = utils.wind2obj(values);
              setPickerData({
                lat: lat.toFixed(4),
                lon: lon.toFixed(4),
                wind: windObj,
                overlay,
              });
            }
          });

          picker.on('pickerMoved', ({ lat, lon, values, overlay }) => {
            if (values) {
              // Use utils.wind2obj to properly parse wind U/V components
              const windObj = utils.wind2obj(values);

              setPickerData({
                lat: lat.toFixed(4),
                lon: lon.toFixed(4),
                wind: windObj,
                overlay,
              });

              setWeatherData({
                temperature: values.temp !== undefined ? Math.round(values.temp - 273.15) : null,
                windSpeed: Math.round(windObj.wind),
                windDirection: Math.round(windObj.dir),
                humidity: values.rh !== undefined ? Math.round(values.rh) : null,
                pressure: values.pressure !== undefined ? Math.round(values.pressure / 100) : null,
                precipitation: values.past3hprecip !== undefined ? (Math.round(values.past3hprecip * 100) / 100) : 0,
                clouds: values.lclouds !== undefined ? Math.round(values.lclouds) : null,
                gust: values.gust !== undefined ? Math.round(values.gust) : null,
                timestamp: new Date().toLocaleString()
              });
            }
          });

          picker.on('pickerClosed', () => {
            setIsPickerOpen(false);
          });

          // Auto-open picker at map center after map finishes first render
          broadcast.once('redrawFinished', () => {
            if (isMounted) {
              picker.open({ lat: options.lat, lon: options.lon });
            }
          });

          // Wait for store to be ready before setting values
          api.store.on('ready', () => {
            try {
              // Set initial overlay
              api.store.set('overlays', ['wind']);

              // Enable all plugins and controls
              const storeSettings = {
                showPlugins: true,
                showControlPanel: true,
                showSettings: true,
                showSearch: true,
                showLocation: true,
                showUnits: true,
                showTime: true,
                showLevel: true,
                showOverlays: true,
                showWind: true,
                showTemp: true,
                showPressure: true,
                showClouds: true,
                showPrecipitation: true,
                showGust: true,
                showHumidity: true,
                showVisibility: true,
                showDewpoint: true,
                showFreezing: true,
                showIcing: true,
                showTurbulence: true,
                showLightning: true,
                showAirmet: true,
                showSigmet: true,
                showTaf: true,
                showMetar: true,
                showNotam: true,
                showWebcams: true,
                showStations: true,
                showBuoys: true,
                showShips: true,
                showPlanes: true,
                showTraffic: true,
                showBorders: true,
                showLabels: true,
                showTerrain: true,
                showTopography: true,
                showBathymetry: true,
                showSeamarks: true,
                showCoastlines: true,
                showCountries: true,
                showStates: true,
                showCounties: true,
                showCities: true,
                showAirports: true,
                showPorts: true,
                showHeliports: true,
                showNavaids: true,
                showVORs: true,
                showNDBs: true,
                showDMEs: true,
                showTACANs: true,
                showVORTACs: true,
                showILSs: true,
                // Add positioning options
                pluginsPosition: 'top',
                controlPanelPosition: 'top',
                settingsPosition: 'top',
                searchPosition: 'top',
                locationPosition: 'top',
                unitsPosition: 'top',
                timePosition: 'top',
                levelPosition: 'top',
                overlaysPosition: 'top',
                // Ensure plugins are expanded by default
                pluginsExpanded: true,
                controlPanelExpanded: true,
                settingsExpanded: true,
                searchExpanded: true,
                locationExpanded: true,
                unitsExpanded: true,
                timeExpanded: true,
                levelExpanded: true,
                overlaysExpanded: true,
                // Layer visibility settings
                layersAlwaysVisible: true,
                layersOnTop: true,
                layersExpanded: true,
                layersPosition: 'top'
              };

              // Apply all settings
              Object.entries(storeSettings).forEach(([key, value]) => {
                try {
                  api.store.set(key, value);
                } catch (error) {
                  console.log(`Error setting ${key}:`, error);
                }
              });


            } catch (error) {
              console.log('Error setting initial settings:', error);
            }
          });
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoading(false);
      }
    };

    loadScripts();

    return () => {
      isMounted = false;
      if (windyInstance) {
        try {
          // Properly cleanup all Windy API components
          if (windyInstance.store) {
            windyInstance.store.off();
          }
          if (windyInstance.picker) {
            windyInstance.picker.off();
          }
          if (windyInstance.particles) {
            windyInstance.particles.destroy();
          }
          windyInstance.map.remove();
          windyInstance = null;
        } catch (error) {
          console.log('Error cleaning up map:', error);
        }
      }
      if (mapInstance.current) {
        mapInstance.current = null;
      }
      // Disconnect the observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const openPicker = () => {
    const api = windyAPIRef.current;
    if (api && isAPIReady) {
      try {
        api.picker.open({ lat: 30.078, lon: 31.285 });
      } catch (error) {
        console.error('Error opening picker:', error);
      }
    }
  };

  const closePicker = () => {
    const api = windyAPIRef.current;
    if (api && isAPIReady) {
      try {
        api.picker.close();
      } catch (error) {
        console.error('Error closing picker:', error);
      }
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (windyAPI && isAPIReady) {
      try {
        // Implement time range change logic
        console.log('Time range changed to:', range);
      } catch (error) {
        console.error('Error changing time range:', error);
      }
    }
  };

  const refreshData = () => {
    if (!isAPIReady) return;

    setIsLoading(true);
    try {
      // Implement refresh logic
      if (windyAPI) {
        // Force a refresh of the current data
        const currentOverlay = 'wind';
        windyAPI.store.set('overlays', []);
        setTimeout(() => {
          windyAPI.store.set('overlays', [currentOverlay]);
          setIsLoading(false);
        }, 500);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-agri-600/90 via-agri-600/80 to-transparent pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-agri-600/30 to-agri-500/30 backdrop-blur-[2px]" />

          {/* Animated lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-y-2 left-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-y-2 right-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-white/30 to-white/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-gradient-to-br from-white/30 to-white/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-br from-white/30 to-white/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16">
          <div className="text-center space-y-8">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Weather Forecast
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
            <p className="text-lg max-w-2xl mx-auto text-white/90 drop-shadow leading-relaxed">
              Real-time weather data and forecasts powered by Windy
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 inset-x-0">
          <div className="h-40 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/4 left-1/4 animate-float" />
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/3 right-1/3 animate-float animation-delay-1000" />
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/2 left-1/2 animate-float animation-delay-2000" />
          <div className="absolute h-3 w-3 bg-white/20 rounded-full bottom-1/4 right-1/4 animate-float animation-delay-3000" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated background shapes */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-agri-600/10 to-agri-500/10 dark:from-agri-600/20 dark:to-agri-500/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-agri-800/10 to-agri-700/10 dark:from-agri-800/20 dark:to-agri-700/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-end">
            {/* Time Range Selection */}
            <div className="flex flex-wrap gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => handleTimeRangeChange(range.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm transition-all duration-300 ${timeRange === range.id
                    ? 'bg-agri-500/20 text-white border border-agri-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                    }`}
                >
                  {range.icon}
                  <span>{range.name}</span>
                </button>
              ))}
            </div>

            {/* Picker Toggle Button */}
            <button
              onClick={isPickerOpen ? closePicker : openPicker}
              disabled={!isAPIReady}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
                isPickerOpen
                  ? 'bg-agri-500/30 text-white border-agri-400/50 hover:bg-agri-500/40'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 border-white/10'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <FiMap className="w-5 h-5" />
              <span>{isPickerOpen ? 'Close Picker' : 'Open Picker'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10 transition-all duration-300"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Map */}
          {rateLimitBlocked ? (
            <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="flex flex-col items-center justify-center h-[600px] px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                  <FiAlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Daily Limit Reached
                </h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mb-2">
                  You have used all <span className="font-semibold text-agri-600">3 free forecast views</span> for today.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Your limit resets at midnight. Come back tomorrow for more weather forecasts!
                </p>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="relative">
                <div ref={mapContainerRef} id="windy" className="h-[600px] w-full" />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-agri-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              {remainingUses !== null && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200/50 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 text-center">
                  {remainingUses} forecast {remainingUses === 1 ? 'view' : 'views'} remaining today
                </div>
              )}
            </div>
          )}

          {/* Picker Info Card */}
          {pickerData && (
            <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-agri-500/20 border border-agri-400/30 flex items-center justify-center">
                    <FiMap className="w-4 h-4 text-agri-400" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-800 dark:text-white">Picker Location</h2>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-full bg-agri-500/10 text-agri-600 dark:text-agri-400 border border-agri-500/20 font-mono">
                    {pickerData.lat}°N
                  </span>
                  <span className="px-3 py-1 rounded-full bg-agri-500/10 text-agri-600 dark:text-agri-400 border border-agri-500/20 font-mono">
                    {pickerData.lon}°E
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize text-xs">
                    {pickerData.overlay}
                  </span>
                </div>
              </div>
              {pickerData.wind && (
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <FiWind className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{Math.round(pickerData.wind.wind)} m/s</span>
                    <span className="text-gray-400">wind</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 text-agri-400"
                      style={{ transform: `rotate(${pickerData.wind.dir}deg)` }}
                    >
                      ↑
                    </div>
                    <span className="font-medium">{Math.round(pickerData.wind.dir)}°</span>
                    <span className="text-gray-400">direction</span>
                  </div>
                  <p className="ml-auto text-xs text-gray-400 italic">Drag the pin on the map to update</p>
                </div>
              )}
            </div>
          )}

          {/* Weather Information */}
          {weatherData && (
            <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Weather Information</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FiClock className="w-4 h-4" />
                  <span>Last updated: {weatherData.timestamp}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiThermometer className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Temperature</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.temperature}°C
                  </p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiWind className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Wind</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.windSpeed} km/h
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Direction: {weatherData.windDirection}°</p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiDroplet className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Humidity</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.humidity}%
                  </p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCloud className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Pressure</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.pressure} hPa
                  </p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiDroplet className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Precipitation</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.precipitation} mm
                  </p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCloud className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Clouds</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.clouds}%
                  </p>
                </div>
                <div className="group p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiWind className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-medium text-gray-600 dark:text-gray-300">Wind Gust</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-agri-500 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {weatherData.gust} km/h
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapForecast; 
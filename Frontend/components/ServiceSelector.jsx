"use client";
import { useState, useRef, useEffect } from "react";

export default function ServiceSelector({ services, locale, comingSoonText }) {

  const isRTL = locale === 'ar';
  const [activeService, setActiveService] = useState(services[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState("next"); // 'next' or 'prev'
  const detailsRef = useRef(null);

  const handleServiceChange = (serviceId) => {
    if (isAnimating) return;
    setDirection(serviceId > activeService.id ? "next" : "prev");
    setIsAnimating(true);
    setActiveService(services.find((service) => service.id === serviceId));
  };

  useEffect(() => {
    if (detailsRef.current) {
      const element = detailsRef.current;

      // Initial state
      element.style.opacity = "0";
      element.style.transform =
        direction === "next" ? "translateY(30px)" : "translateY(-30px)";

      // Trigger animation
      requestAnimationFrame(() => {
        element.style.transition = "all 600ms cubic-bezier(0.4, 0, 0.2, 1)";
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";

        // Reset animation state
        setTimeout(() => {
          setIsAnimating(false);
          element.style.transition = "";
        }, 600);
      });
    }
  }, [activeService, direction]);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Service List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="lg:hidden relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-agri-50/30 dark:via-agri-900/30 to-transparent blur-xl"></div>

          {/* Tabs container */}
          <div className="relative flex flex-wrap gap-2 p-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceChange(service.id)}
                className={`group relative flex-shrink-0 px-4 py-2.5 rounded-xl  overflow-hidden ${activeService.id === service.id
                  ? "bg-gradient-to-br from-agri-50 to-agri-100 dark:from-agri-900/80 dark:to-agri-800/80 shadow-lg shadow-agri-500/10 dark:shadow-agri-500/5"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                {/* Background animation */}
                <div className={`absolute inset-0 bg-gradient-to-r from-agri-100/0 via-agri-200/10 to-agri-100/0 dark:from-agri-400/0 dark:via-agri-400/5 dark:to-agri-400/0 
                  ${activeService.id === service.id ? 'animate-shine' : ''}`}></div>

                <div className={`relative flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                  {/* Icon container with pulse effect */}
                  <div className={`relative ${activeService.id === service.id
                    ? "text-agri-600 dark:text-agri-400"
                    : "text-gray-400 dark:text-gray-500"
                    }`}>
                    {service.icon}
                    {activeService.id === service.id && (
                      <span className="absolute -inset-1 bg-agri-400/20 dark:bg-agri-400/10 rounded-full blur animate-pulse"></span>
                    )}
                  </div>

                  {/* Title */}
                  <span className={`whitespace-nowrap font-medium ${activeService.id === service.id
                    ? "text-agri-900 dark:text-agri-100"
                    : "text-gray-700 dark:text-gray-300"
                    } group-hover:text-agri-700 dark:group-hover:text-agri-300 `}>
                    {service.title}
                  </span>

                  {service.status === 'coming-soon' && (
                    <span className="text-xs font-semibold bg-yellow-400/20 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-500 px-2 py-0.5 rounded-md ms-2">
                      {comingSoonText}
                    </span>
                  )}

                  {/* Active indicator dot */}
                  {activeService.id === service.id && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-agri-500 dark:bg-agri-400"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceChange(service.id)}
              className={`w-full text-start p-4 rounded-xl relative ${activeService.id === service.id
                ? "bg-agri-50 dark:bg-agri-900/50 border-agri-200 dark:border-agri-700"
                : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                } border`}
            >
              {service.status === 'coming-soon' && (
                <span className={`absolute top-3 text-xs font-semibold bg-yellow-400/20 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-500 px-2 py-0.5 rounded-md ${isRTL ? 'left-3' : 'right-3'}`}>
                  {comingSoonText}
                </span>
              )}
              <div className="flex items-center">
                <div
                  className={`${activeService.id === service.id
                    ? "text-agri-600 dark:text-agri-400"
                    : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                  {service.icon}
                </div>
                <div className={`ms-4`}>
                  <h3
                    className={`font-medium ${activeService.id === service.id
                      ? "text-agri-900 dark:text-agri-100"
                      : "text-gray-900 dark:text-gray-100"
                      }`}
                  >
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {service.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Service Details */}
      <div className="lg:col-span-2">
        <div
          ref={detailsRef}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 lg:p-8 h-full"
        >
          <div className="lg:hidden mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {activeService.description}
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-agri-200 dark:via-agri-700 to-transparent"></div>
          </div>

          <h3 className="hidden lg:block text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {activeService.title}
          </h3>
          <p className="hidden lg:block text-gray-600 dark:text-gray-300 mb-8">
            {activeService.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {activeService.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center p-3 lg:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-agri-200 dark:hover:border-agri-700 group"
              >
                <div className={`w-2 h-2 rounded-full bg-agri-500 dark:bg-agri-400 ${isRTL ? 'ml-3' : 'mr-3'} group-hover:scale-125 transition-transform duration-300`}></div>
                <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

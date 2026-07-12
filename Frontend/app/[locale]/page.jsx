import CTASection from "@/components/CTASection";
import Link from "next/link";
import initTranslations from '@/app/i18n';

import HeroSection from '../../components/HeroSection';

export default async function Home({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['home']);


  const features = [
    {
      // AI-Powered Assessments — brain/chip icon
      title: t('features.aiInsights.title'),
      description: t('features.aiInsights.description'),
      bgImage: '/feature-ai-assessments.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      ),
    },
    {
      // Predictive Flood Modeling — water/waves icon
      title: t('features.realTimeMonitoring.title'),
      description: t('features.realTimeMonitoring.description'),
      bgImage: '/gemini_changed_color.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      ),
    },
    {
      // Precision Agriculture Zoning — map/grid icon
      title: t('features.precisionAgriculture.title'),
      description: t('features.precisionAgriculture.description'),
      bgImage: '/feature-agriculture-zoning.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      ),
    },
    {
      // Futuristic Spatial Planning — city/buildings icon
      title: t('features.scalableSolutions.title'),
      description: t('features.scalableSolutions.description'),
      bgImage: '/feature-spatial-planning.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
    },
    {
      // Climatological Resilience Profiling — thermometer/climate icon
      title: t('features.sustainability.title'),
      description: t('features.sustainability.description'),
      bgImage: '/feature-climate-resilience.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
    },
    {
      // R&D Vanguard Methodologies — flask/beaker icon
      title: t('features.userFriendly.title'),
      description: t('features.userFriendly.description'),
      bgImage: '/feature-rd-methodologies.png',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      ),
    },
  ];

  const howItWorksSteps = [
    {
      // Geospatial Data Acquisition — satellite dish icon
      title: t('howItWorks.dataIntegration.title'),
      description: t('howItWorks.dataIntegration.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      ),
    },
    {
      // Algorithmic Signal Processing — chip/cpu icon
      title: t('howItWorks.aiAnalysis.title'),
      description: t('howItWorks.aiAnalysis.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
        />
      ),
    },
    {
      // Coupled Planetary Modeling — globe icon
      title: t('howItWorks.tailoredInsights.title'),
      description: t('howItWorks.tailoredInsights.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      ),
    },
    {
      // Interactive Spatial Visualization — map icon
      title: t('howItWorks.realTimeMonitoring.title'),
      description: t('howItWorks.realTimeMonitoring.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      ),
    },
    {
      // Strategic Consultancy & Blueprinting — document/plan icon
      title: t('howItWorks.actionableSolutions.title'),
      description: t('howItWorks.actionableSolutions.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <HeroSection />

        {/* Features Section */}
        <section className="relative py-24 overflow-hidden bg-agri-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                {t('features.title')}
              </h2>
              <p className="text-agri-300 text-lg">
                {t('features.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group relative overflow-hidden rounded-2xl min-h-[260px] cursor-pointer">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${feature.bgImage}')` }}
                  />

                  {/* Dark gradient overlay — stronger at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                  {/* Teal tint overlay on hover */}
                  <div className="absolute inset-0 bg-agri-500/0 group-hover:bg-agri-500/10 transition-colors duration-500" />

                  {/* Border */}
                  <div className="absolute inset-0 rounded-2xl border border-agri-500/20 group-hover:border-agri-400/50 transition-colors duration-300" />

                  {/* Content */}
                  <div className="relative h-full p-6 flex flex-col justify-between min-h-[260px]">
                    {/* Icon top-left */}
                    <div className="w-10 h-10 rounded-lg bg-agri-500/20 border border-agri-400/30 flex items-center justify-center backdrop-blur-sm">
                      <svg
                        className="h-5 w-5 text-agri-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {feature.icon}
                      </svg>
                    </div>

                    {/* Title & description at bottom */}
                    <div>
                      <h3 className="text-base font-bold text-white mb-2 leading-tight tracking-wide">
                        {feature.title}
                      </h3>
                      <p className="text-agri-200/80 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-24 bg-gray-50 dark:bg-gray-900/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-16 text-agri-900 dark:text-white bg-gradient-to-r from-agri-400 to-agri-300 bg-clip-text dark:text-transparent">
              {t('howItWorks.title')}
            </h2>
            <div className="relative">
              {/* Vertical Line - Hidden on Mobile */}
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-agri-700 dark:bg-agri-600 transform -translate-x-1/2 hidden md:block"></div>

              {/* Timeline Items */}
              <div className="space-y-12">
                {howItWorksSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                      } items-center gap-8`}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
                      <div className="w-12 h-12 rounded-full bg-agri-700 dark:bg-agri-600 text-white flex items-center justify-center font-bold z-10 shadow-lg">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {step.icon}
                        </svg>
                      </div>
                    </div>

                    {/* Content Card */}
                    <div
                      className={`w-full md:w-1/2 backdrop-blur-lg bg-white/80 dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-white/20 dark:border-gray-700 hover:border-agri-500/30 dark:hover:border-agri-500 ${index % 2 === 0 ? "md:text-right" : "md:text-left"
                        }`}
                    >
                      <h3 className="text-2xl font-semibold mb-4 text-agri-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection locale={locale} />
      </main>
    </div>
  );
}

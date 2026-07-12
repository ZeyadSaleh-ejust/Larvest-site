import CTASection from "@/components/CTASection";
import ServiceSelector from "../../../components/ServiceSelector";
import initTranslations from '@/app/i18n';

const services = [
  {
    id: 1,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: 2,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
  },
  {
    id: 3,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 4,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 5,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 6,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      </svg>
    ),
  },
  {
    id: 7,
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16.667c0-2.024 1.642-3.667 3.667-3.667s3.667 1.643 3.667 3.667C15.334 18.33 12 21.667 12 21.667S8.667 18.33 8 16.667zM12 7v6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 7V2M7 12H2M17 12h5"
        />
      </svg>
    ),
    status: 'coming-soon'
  },
];

const results = [
  {
    id: 1,
    image: "/results/fertilizer-map.webp",
  },
  {
    id: 2,
    image: "/results/health-analysis.jpg",
  },
  {
    id: 3,
    image: "/results/yield-prediction.webp",
  },
  {
    id: 4,
    image: "/results/soil-health.webp",
  },
  {
    id: 5,
    image: "/results/weather-data.webp",
  },
];

export default async function Services({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['services']);
  const isRTL = locale === 'ar';

  const servicesWithTranslations = services.map((service, index) => {
    const serviceKeys = [
      'locationTools',
      'fertilizerMaps',
      'diseaseDetection',
      'biomassEstimation',
      'nutrientAnalysis',
      'weatherForecasting',
      'irrigationManagement'
    ];
    const key = serviceKeys[index];
    return {
      ...service,
      title: t(`services.${key}.title`),
      description: t(`services.${key}.description`),
      features: t(`services.${key}.features`, { returnObjects: true })
    };
  });

  const resultsWithTranslations = results.map((result, index) => {
    const resultKeys = ['fertilizer', 'disease', 'yield', 'soil', 'weather'];
    const key = resultKeys[index];
    return {
      ...result,
      title: t(`results.items.${key}.title`),
      description: t(`results.items.${key}.description`)
    };
  });

  const comingSoonText = t('comingSoon');

  const heroFeatures = [
    {
      title: t('hero.features.aiAssessments.title'),
      description: t('hero.features.aiAssessments.description'),
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
      title: t('hero.features.floodModeling.title'),
      description: t('hero.features.floodModeling.description'),
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
      title: t('hero.features.precisionZoning.title'),
      description: t('hero.features.precisionZoning.description'),
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
      title: t('hero.features.spatialPlanning.title'),
      description: t('hero.features.spatialPlanning.description'),
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
      title: t('hero.features.climateProfiling.title'),
      description: t('hero.features.climateProfiling.description'),
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
      title: t('hero.features.rdVanguard.title'),
      description: t('hero.features.rdVanguard.description'),
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

  return (
    <main className="min-h-screen">
      {/* Hero Section — Feature Cards */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-agri-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroFeatures.map((feature, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl min-h-[260px] cursor-pointer">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${feature.bgImage}')` }}
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                {/* Teal tint on hover */}
                <div className="absolute inset-0 bg-agri-500/0 group-hover:bg-agri-500/10 transition-colors duration-500" />
                {/* Border */}
                <div className="absolute inset-0 rounded-2xl border border-agri-500/20 group-hover:border-agri-400/50 transition-colors duration-300" />
                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between min-h-[260px]">
                  <div className="w-10 h-10 rounded-lg bg-agri-500/20 border border-agri-400/30 flex items-center justify-center backdrop-blur-sm">
                    <svg className="h-5 w-5 text-agri-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
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

      {/* Services Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceSelector services={servicesWithTranslations} locale={locale} comingSoonText={comingSoonText} />
        </div>
      </section>

      {/* Results Gallery */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-agri-50 dark:bg-agri-900/50 text-agri-600 dark:text-agri-400 mb-4 border border-agri-100 dark:border-agri-800">
              <span className={`w-2 h-2 rounded-full bg-agri-500 dark:bg-agri-400 me-2 animate-pulse`}></span>
              {t('results.title')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {t('results.subtitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('results.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resultsWithTranslations.map((result) => (
              <div
                key={result.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-agri-400 transition-colors duration-300">
                      {result.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex-grow flex flex-col justify-between">
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {result.description}
                  </p>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection locale={locale} />
    </main>
  );
}

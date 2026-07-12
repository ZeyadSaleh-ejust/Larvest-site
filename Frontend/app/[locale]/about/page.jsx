import CTASection from "@/components/CTASection";
import TeamSlider from "@/components/TeamSlider";
import initTranslations from '@/app/i18n';

const About = async ({ params: { locale } }) => {
  const { t } = await initTranslations(locale, ['about']);
  const isRTL = locale === 'ar';

  const stats = [
    { number: "10+", label: t('stats.yearsExperience') },
    { number: "500+", label: t('stats.happyClients') },
    { number: "95%", label: t('stats.successRate') },
    { number: "20+", label: t('stats.awardsWon') },
  ];

  const values = [
    {
      title: t('values.excellence.title'),
      description: t('values.excellence.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      ),
    },
    {
      title: t('values.innovation.title'),
      description: t('values.innovation.description'),
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
      title: t('values.integrity.title'),
      description: t('values.integrity.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
    },
    {
      title: t('values.sustainability.title'),
      description: t('values.sustainability.description'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  const visionPoints = [
    {
      title: t('vision.points.FloodRisk.title'),
      description: t('vision.points.FloodRisk.description'),
      image: "/vision-flood-risk.png",
    },
    {
      title: t('vision.points.EnvironmentalImpact.title'),
      description: t('vision.points.EnvironmentalImpact.description'),
      image: "/vision-environmental-impact.png",
    },
    {
      title: t('vision.points.AgriculturalSpatial.title'),
      description: t('vision.points.AgriculturalSpatial.description'),
      image: "/vision-agricultural-spatial.png",
    },
    {
      title: t('vision.points.Geospatial.title'),
      description: t('vision.points.Geospatial.description'),
      image: "/vision-geospatial.png",
    }
  ];

  const achievements = [
    {
      year: "2024",
      title: "Industry Innovation Award",
      description:
        "Recognized for breakthrough agricultural technology solutions",
    },
    {
      year: "2023",
      title: "Sustainability Excellence",
      description: "Leading environmental conservation in agriculture",
    },
    {
      year: "2022",
      title: "Global Expansion",
      description: "Successfully expanded operations to 3 new continents",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-agri-900 via-agri-950 to-agri-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.4),_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,_rgba(4,120,87,0.3),_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white group transition-all duration-300 hover:bg-white/20">
                <span className={`w-2 h-2 rounded-full bg-agri-400 me-2 group-hover:animate-pulse`}></span>
                {t('sections.aboutUs')}
              </div>
              <h1 className="text-5xl font-bold text-white leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                {t('hero.description')}
              </p>
            </div>
            <div className="relative group h-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-agri-400 to-agri-300 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="/about.png"
                  alt="Smart farming in action"
                  className="object-cover w-full h-full transform group-hover:scale-105 transition duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-agri-50 dark:bg-agri-900/50 text-agri-600 dark:text-agri-400 mb-4 border border-agri-100 dark:border-agri-800">
              <span className={`w-2 h-2 rounded-full bg-agri-500 dark:bg-agri-400 me-2 animate-pulse`}></span>
              {t('sections.ourVision')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('vision.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('vision.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 items-start pb-16">
            {visionPoints.map((point, index) => (
              <div key={index} className={`group h-full ${index % 2 !== 0 ? 'lg:mt-16' : ''}`}>
                <div className="relative p-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-gray-800 min-h-[380px] flex flex-col justify-end">
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    style={{ backgroundImage: `url(${point.image})` }}
                  />
                  {/* Dark Overlays for high readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-gray-900/20 mix-blend-multiply opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
                  <div className="absolute inset-0 bg-gradient-to-br from-agri-950/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Content (Title & Description) */}
                  <div className="relative z-10 text-white">
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-agri-400 transition-colors duration-300">
                      {point.title}
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed font-medium">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:14px_14px]"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-agri-500/10 dark:bg-agri-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-agri-400/10 dark:bg-agri-400/5 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="relative p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white dark:border-gray-700 hover:border-agri-200 dark:hover:border-agri-700 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-agri-500/5 dark:from-agri-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
                  <div className="relative">
                    <div className="text-5xl font-bold bg-gradient-to-r from-agri-600 to-agri-500 dark:from-agri-400 dark:to-agri-300 bg-clip-text text-transparent mb-3">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 w-1/3 h-1/3 bg-gradient-to-br from-agri-100 dark:from-agri-900 to-transparent opacity-30`}></div>
          <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} bottom-0 w-1/3 h-1/3 bg-gradient-to-tr from-agri-50 dark:from-agri-900 to-transparent opacity-30`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-agri-50 dark:bg-agri-900/50 text-agri-600 dark:text-agri-400 mb-4 border border-agri-100 dark:border-agri-800">
              <span className={`w-2 h-2 rounded-full bg-agri-500 dark:bg-agri-400 me-2 animate-pulse`}></span>
              {t('sections.ourValues')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('values.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('values.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="group">
                <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-agri-200 dark:hover:border-agri-600 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-agri-50 dark:from-agri-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-agri-50 dark:bg-agri-900 rounded-full opacity-0 group-hover:opacity-30 transform group-hover:scale-150 transition-all duration-700"></div>
                  <div className="relative">
                    <div className="mb-6 text-agri-600 dark:text-agri-400 bg-agri-50 dark:bg-agri-900/50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {value.icon}
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_${isRTL ? '0%' : '100%'}_20%,_rgba(16,185,129,0.1),_transparent_50%)] dark:bg-[radial-gradient(circle_at_${isRTL ? '0%' : '100%'}_20%,_rgba(16,185,129,0.05),_transparent_50%)]`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-agri-50 dark:bg-agri-900/50 text-agri-600 dark:text-agri-400 mb-4 border border-agri-100 dark:border-agri-800">
              <span className={`w-2 h-2 rounded-full bg-agri-500 dark:bg-agri-400 me-2 animate-pulse`}></span>
              {t('sections.ourPurpose')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('mission.title')}
            </h2>
          </div>
          <div className="space-y-12">
            {[
              {
                year: "01",
                title: t('mission.steps.optimizeYields.title'),
                description: t('mission.steps.optimizeYields.description'),
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
              {
                year: "02",
                title: t('mission.steps.foodSecurity.title'),
                description: t('mission.steps.foodSecurity.description'),
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                year: "03",
                title: t('mission.steps.sustainability.title'),
                description: t('mission.steps.sustainability.description'),
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ].map((mission, index) => (
              <div
                key={index}
                className="group relative hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 w-px h-full bg-gradient-to-b from-transparent via-agri-500 to-transparent transform ${isRTL ? 'translate-x-1/2' : '-translate-x-1/2'} ms-8 opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className={`relative ${isRTL ? 'pr-16' : 'pl-16'}`}>
                  <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 w-16 h-16 bg-gradient-to-br from-agri-400 to-agri-600 rounded-2xl transform ${isRTL ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 transition-all duration-300 opacity-90`}>
                    <div className="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-transparent bg-clip-text bg-gradient-to-br from-agri-500 to-agri-600 font-bold text-xl">
                        {mission.year}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x'} gap-3 mb-4`}>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-agri-400 to-agri-600 text-white">
                        {mission.icon}
                      </div>
                      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-agri-500 to-agri-600">
                        {mission.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {mission.description}
                    </p>

                    <div className={`absolute -bottom-2 ${isRTL ? '-left-2' : '-right-2'} w-24 h-24 bg-gradient-to-br from-agri-400 to-agri-600 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`}></div>
                  </div>
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
};

export default About;

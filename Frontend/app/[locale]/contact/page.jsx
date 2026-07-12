import initTranslations from '@/app/i18n';

export default async function Contact({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['contact']);
  const isRTL = locale === 'ar';

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-agri-600/90 via-agri-600/80 to-transparent pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-agri-600/30 to-agri-500/30 backdrop-blur-[2px]" />

          {/* Animated lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-agri-200/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-agri-200/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-y-2 left-0 w-px bg-gradient-to-b from-transparent via-agri-200/40 to-transparent animate-shimmer" />
            <div className="absolute -inset-y-2 right-0 w-px bg-gradient-to-b from-transparent via-agri-200/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-agri-400/30 to-agri-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-gradient-to-br from-agri-500/30 to-agri-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-br from-agri-300/30 to-agri-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center space-y-8">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {t('hero.title')}
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
            <p className="text-lg max-w-2xl mx-auto text-white/90 drop-shadow leading-relaxed">
              {t('hero.description')}
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 inset-x-0">
          <div className="h-40 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-agri-200/20 to-transparent" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/4 left-1/4 animate-float" />
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/3 right-1/3 animate-float animation-delay-1000" />
          <div className="absolute h-2 w-2 bg-white/20 rounded-full top-1/2 left-1/2 animate-float animation-delay-2000" />
          <div className="absolute h-3 w-3 bg-white/20 rounded-full bottom-1/4 right-1/4 animate-float animation-delay-3000" />
        </div>
      </div>

      {/* Contact Info Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 ">
        {/* Content */}
        <div className="grid grid-cols-1 gap-8 lg:gap-12 mb-20 pb-8 sm:pb-0">
          <div>
            {/* Contact Methods */}
            <div
              className="h-full p-6 sm:p-10 rounded-3xl backdrop-blur-lg 
              bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 
              border border-gray-200/50 dark:border-gray-700/50 
              shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-gray-900/30
              hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] transition-all duration-300
              flex flex-col justify-center space-y-8 sm:space-y-10 "
            >
              {/* Title */}
              <div className="text-center mb-2 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('contactInfo.title')}
                </h2>
                <div className="w-16 sm:w-20 h-1 bg-agri-600/30 dark:bg-agri-400/30 mx-auto rounded-full"></div>
              </div>

              {/* Email */}
              <div
                className={`flex flex-row items-center space-y-0 ${isRTL ? 'space-x-reverse' : 'space-x'} gap-6 group sm:p-4 rounded-2xl
                hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300`}
              >
                <div
                  className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-agri-50 to-agri-100/50 dark:from-agri-900/50 dark:to-agri-800/30
                  group-hover:from-agri-100 group-hover:to-agri-50 dark:group-hover:from-agri-800/50 dark:group-hover:to-agri-900/30 
                  transition-all duration-300"
                >
                  <svg
                    className="w-6 sm:w-7 h-6 sm:h-7 text-agri-600 dark:text-agri-400 transform group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-agri-600 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {t('contactInfo.email.title')}
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 hover:text-agri-600 dark:hover:text-agri-400 transition-colors duration-300 cursor-pointer break-all">
                    <bdo dir="ltr">{t('contactInfo.email.address')}</bdo>
                  </p>
                </div>
              </div>

              {/* Location */}
              <div
                className={`flex items-center space-y-0 ${isRTL ? 'space-x-reverse' : 'space-x'} gap-6 group sm:p-4 rounded-2xl
                hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300`}
              >
                <div
                  className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-agri-50 to-agri-100/50 dark:from-agri-900/50 dark:to-agri-800/30
                  group-hover:from-agri-100 group-hover:to-agri-50 dark:group-hover:from-agri-800/50 dark:group-hover:to-agri-900/30 
                  transition-all duration-300"
                >
                  <svg
                    className="w-6 sm:w-7 h-6 sm:h-7 text-agri-600 dark:text-agri-400 transform group-hover:scale-110 transition-transform duration-300"
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
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-agri-600 dark:group-hover:text-agri-400 transition-colors duration-300">
                    {t('contactInfo.location.title')}
                  </h3>
                  <a
                    href="https://maps.app.goo.gl/3upKShfadtcvjF9A9?g_st=aw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base sm:text-lg text-gray-600 dark:text-gray-400 hover:text-agri-600 dark:hover:text-agri-400 transition-colors duration-300"
                  >
                    {t('contactInfo.location.address')}
                    <br />
                    <span className="text-gray-500 dark:text-gray-500">
                      {t('contactInfo.location.city')}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

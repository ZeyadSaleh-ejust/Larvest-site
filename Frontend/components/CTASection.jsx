"use client";
import { useTranslation } from "react-i18next";

const CTASection = () => {
  const { t } = useTranslation('common');

  return (
    <section className="relative bg-gradient-to-br from-agri-900 via-agri-800 to-agri-950 dark:from-gray-900 dark:via-agri-950 dark:to-gray-950 text-white py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.avif')] bg-cover opacity-40 dark:opacity-30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1),_transparent_50%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_50%)]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-8 backdrop-blur-lg bg-white/10 dark:bg-white/5 p-12 rounded-3xl border border-white/10 dark:border-white/5">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 dark:from-agri-100 dark:to-white bg-clip-text text-transparent">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 text-agri-100 dark:text-gray-300">
            {t('cta.description')}
          </p>
          <a
            href="mailto:contact@larvest.ai"
            className="inline-flex items-center bg-white/90 dark:bg-agri-600 backdrop-blur-sm text-agri-900 dark:text-white px-8 py-4 rounded-lg font-semibold hover:bg-white dark:hover:bg-agri-500 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-agri-500/20"
          >
            {t('cta.button')}
            <svg
              className="w-5 h-5 ms-2"
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
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

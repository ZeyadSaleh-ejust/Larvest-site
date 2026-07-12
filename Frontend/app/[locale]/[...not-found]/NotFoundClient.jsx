'use client';

import Link from "next/link";

export default function NotFoundClient({ params }) {
  const locale = params?.locale || 'en';
  const isRTL = locale === 'ar';

  const messages = {
    en: {
      title: 'Page Not Found',
      description: 'Oops! The page you are looking for does not exist.',
      button: 'Back to Home',
    },
    ar: {
      title: 'الصفحة غير موجودة',
      description: 'عذراً! الصفحة التي تبحث عنها غير موجودة.',
      button: 'العودة للرئيسية',
    },
  };

  const t = messages[locale] || messages.en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        {/* Weather Animation Container */}
        <div className="relative h-48 mb-8">
          {/* Sun/Moon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16">
            <div className="relative w-full h-full animate-spin-slow">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 dark:from-gray-300 dark:to-gray-400 animate-pulse" />
              <div className="absolute inset-0 dark:opacity-0">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-8 bg-amber-300 rounded-full origin-bottom"
                    style={{
                      transform: `rotate(${i * 45}deg) translateX(-50%)`,
                      left: "50%",
                      transformOrigin: "50% 100%",
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 dark:opacity-100 opacity-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-gray-500/20 rounded-full"
                    style={{
                      top: ["20%", "40%", "60%"][i],
                      left: ["30%", "60%", "40%"][i],
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Clouds */}
          <div className="absolute top-20 left-0 right-0 flex justify-center">
            <div className="relative -mr-4">
              <div className="w-12 h-12 bg-white/80 dark:bg-gray-600/80 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/80 dark:bg-gray-600/80 rounded-full" />
              <div className="absolute -bottom-2 -right-4 w-14 h-14 bg-white/80 dark:bg-gray-600/80 rounded-full" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white dark:bg-gray-600 rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-18 h-18 bg-white dark:bg-gray-600 rounded-full" />
            </div>
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 inset-x-0">
            <div className="h-16 bg-gradient-to-t from-agri-600/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-8 flex items-end justify-around">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 bg-agri-600/30 rounded-t-full"
                  style={{ height: ["16px", "24px", "20px", "22px", "18px", "24px"][i] }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.description}
          </p>
          <Link
            href={`/${locale}/`}
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r 
              from-agri-600 to-agri-500 text-white font-semibold shadow-lg 
              shadow-agri-500/25 hover:shadow-agri-500/40 transition-shadow
              relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <span className="relative">{t.button}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

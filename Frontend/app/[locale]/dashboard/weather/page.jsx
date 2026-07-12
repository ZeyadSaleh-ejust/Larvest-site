import initTranslations from '@/app/i18n';
import WeatherPageClient from './client';

export default async function WeatherPage({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['dashboard']);

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {t('weatherDashboard.title')}
          </h1>
        </div>
        <WeatherPageClient />
      </div>
    </div>
  );
} 
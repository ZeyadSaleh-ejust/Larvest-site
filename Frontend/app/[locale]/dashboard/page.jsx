import MapLayers from "./_components/MapLayers";
import React from "react";
import initTranslations from '@/app/i18n';

export default async function MapLayersDocumentation({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['dashboard']);

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {t('mapLayers.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('mapLayers.description')}
          </p>
        </div>

        <div className="mt-12">
          <MapLayers />
        </div>
      </div>
    </div>
  );
}

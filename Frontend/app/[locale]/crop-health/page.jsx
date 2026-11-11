import initTranslations from '@/app/i18n';
import CropHealthApp from './_components/CropHealthApp';

export async function generateMetadata({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['cropHealth']);
  return { title: `${t('title')} | Larvest`, description: t('subtitle') };
}

export default async function CropHealthPage({ params: { locale } }) {
  const { t } = await initTranslations(locale, ['cropHealth']);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-16 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-[1700px] px-3 py-6 sm:px-5">
        <header className="mb-5 max-w-4xl">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{t('subtitle')}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('provenance')}</p>
        </header>
        <CropHealthApp />
      </div>
    </div>
  );
}

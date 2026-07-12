import i18nConfig from '@/i18nConfig';
import NotFoundClient from './NotFoundClient';

// Required for static export with dynamic catch-all routes
export function generateStaticParams() {
  const locales = i18nConfig.locales;
  return locales.map((locale) => ({
    locale,
    'not-found': ['not-found'],
  }));
}

export default function NotFound({ params }) {
  return <NotFoundClient params={params} />;
}

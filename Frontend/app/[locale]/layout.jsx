import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "../../components/providers/providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TranslationsProvider from '@/components/TranslationsProvider';
import initTranslations from '../i18n';
import i18nConfig from '@/i18nConfig';
import { dir } from 'i18next';

const inter = Inter({ subsets: ["latin"] });
const cairo = Cairo({
  subsets: ["arabic"],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

export const metadata = {
  title: "Larvest",
  description: "AI-Remote Sensing Solutions",
};

const i18nNamespaces = ['common', 'home', "about", "services", "contact", "pricing", "dashboard"]; // Add your namespaces here

export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function RootLayout({ children, params: { locale } }) {
  const { resources } = await initTranslations(locale, i18nNamespaces);
  const font = locale === 'ar' ? cairo : inter;

  return (
    <html lang={locale} dir={dir(locale)} suppressHydrationWarning>
      <body className={`${font.className} dark:bg-agri-950`} suppressHydrationWarning>
        <TranslationsProvider
          namespaces={i18nNamespaces}
          locale={locale}
          resources={resources}>
          <Providers>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer locale={locale} />
          </Providers>
        </TranslationsProvider>
      </body>
    </html>
  );
}

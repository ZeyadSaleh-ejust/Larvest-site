
import Link from "next/link";
import initTranslations from '@/app/i18n';

export default async function Footer({ locale }) {
  const { t } = await initTranslations(locale, ['common']);

  const quickLinks = [
    { title: t('navigation.about'), url: `/${locale}/about/` },
    { title: t('navigation.services'), url: `/${locale}/services/` },
    { title: t('navigation.contact'), url: `/${locale}/contact/` },
    { title: t('navigation.blog'), url: `/${locale}/blog/` },
  ];

  const services = [
    { title: t('footer.servicesList.fertilizerZoning'), url: `/${locale}/services/` },
    { title: t('footer.servicesList.diseaseDetection'), url: `/${locale}/services/` },
    { title: t('footer.servicesList.biomassYield'), url: `/${locale}/services/` },
    { title: t('footer.servicesList.nutrientAnalysis'), url: `/${locale}/services/` },
    { title: t('footer.servicesList.weatherForecasting'), url: `/${locale}/services/` },
  ];

  const socialLinks = [
    {
      name: "Gmail",
      email: "contact@larvest.ai",
      icon: (
        <path
          d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ),
    },
    {
      name: "X (Twitter)",
      href: "https://x.com/larvest_llc",
      path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61571743936061&mibextid=ZbWKwL",
      path: "M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/larvest-ai",
      path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    },
  ];

  return (
    <footer className="bg-agri-950 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Company Info - Spans 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-agri-500 to-agri-700 bg-clip-text text-transparent">
              Larvest
            </h3>
            <p className="text-white/90">
              {t('footer.companyDescription')}
            </p>
            <div className="flex gap-6 pt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.email ? `mailto:${social.email}` : social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-agri-600 transform hover:scale-110 transition-all duration-300"
                >
                  <span className="sr-only">{social.name}</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {social.icon || <path d={social.path} />}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - Spans 2 columns */}
          <div className="lg:col-span-2 flex flex-col items-start lg:items-center">
            <h3 className="text-lg font-semibold mb-6 text-agri-600">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-4 w-full lg:w-fit lg:items-center">
              {quickLinks.map(({ title, url }) => (
                <li key={url} className="w-full lg:w-fit">
                  <Link
                    href={url}
                    className="text-white/80 hover:text-agri-600 transition-all duration-300 flex items-center group relative px-4 py-1 rounded-lg hover:bg-white/5 w-full lg:w-auto"
                  >
                    <span className="absolute left-0 opacity-0 group-hover:opacity-100 group-hover:left-2 transition-all duration-300">
                      →
                    </span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">
                      {title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services - Spans 2 columns */}
          <div className="lg:col-span-2 flex flex-col items-start lg:items-start lg:ms-auto">
            <h3 className="text-lg font-semibold mb-6 text-agri-600">
              {t('footer.services')}
            </h3>
            <ul className="space-y-4 w-full">
              {services.map(({ title, url }) => (
                <li key={title} className="w-full">
                  <Link
                    href={url}
                    className="text-white/80 hover:text-agri-600 transition-all duration-300 flex items-center group relative px-4 py-1 rounded-lg hover:bg-white/5 w-full lg:w-auto"
                  >
                    <span className="absolute left-0 opacity-0 group-hover:opacity-100 group-hover:left-2 transition-all duration-300">
                      →
                    </span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">
                      {title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-agri-900/50 mt-12 pt-8 text-center text-white/80">
          <p className="group">
            &copy; {new Date().getFullYear()} Larvest. {t('footer.copyright')}
            <span className="inline-block transition-transform duration-300 group-hover:rotate-[360deg]">
              {" "}
              🌱
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import ThemeToggler from "./ThemeToggler";
import LanguageChanger from "./LanguageChanger";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const theme = useTheme().theme;

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const currentLocale = i18n.language;

  const navigationLinks = [
    { title: t('navbar.home'), url: `/${currentLocale}/` },
    { title: t('navbar.about'), url: `/${currentLocale}/about/` },
    { title: t('navbar.services'), url: `/${currentLocale}/services/` },
    { title: 'Forecast', url: `/${currentLocale}/map-forecast/` },
    { title: t('navbar.cropHealth'), url: `/${currentLocale}/dashboard/` },
    { title: t('navbar.contact'), url: `/${currentLocale}/contact/` },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${scrolled
        ? "bg-agri-950"
        : "bg-gradient-to-r from-white/90 via-agri-50/80 to-white/90 bg-agri-950 dark:from-transparent dark:via-transparent dark:to-transparent"
        }`}
      role="navigation"
      aria-label="Main navigation"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Pattern Overlay */}
      <div
        className={`absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none transition-opacity duration-500 ${scrolled ? "opacity-0" : ""
          }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "20px 20px",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link
              href={`/${currentLocale}/`}
              className="flex-shrink-0 flex items-center group"
              aria-label="Home"
            >
              <div className="relative w-28 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={mounted && (scrolled || theme === 'dark') ? "/white-logo.png" : "/logo.png"}
                  alt="Larvest Logo"
                  className={`h-full w-auto ${mounted && (scrolled || theme === 'dark') ? "p-2":""}`}
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:gap-8">
            {navigationLinks.map(({ title, url }) => (
              <Link
                key={url}
                href={url}
                className={`relative group py-2 px-1 ${scrolled
                  ? "text-gray-200 hover:text-agri-400"
                  : "text-agri-950 hover:text-agri-700 dark:text-gray-200 dark:hover:text-agri-400"
                  }`}
              >
                {title}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 ${pathname === url
                    ? "w-full bg-current"
                    : "w-0 group-hover:w-full bg-current"
                    } transition-all duration-300 ease-out`}
                />
              </Link>
            ))}

            <LanguageChanger scrolled={scrolled} />

            <ThemeToggler
              className={`p-2 rounded-lg  ${scrolled
                ? "text-gray-200 dark:hover:bg-gray-800"
                : "text-agri-950 hover:bg-agri-100 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
            />

            <a
              href="mailto:contact@larvest.ai"
              className={`px-6 py-2 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 ${scrolled
                ? "bg-gradient-to-r from-agri-600 to-agri-700 text-white hover:shadow-lg hover:shadow-agri-500/20"
                : "bg-agri-600 text-white hover:bg-agri-700 dark:bg-agri-700 dark:text-white dark:hover:bg-agri-600 hover:shadow-lg hover:shadow-agri-500/20"
                }`}
            >
              {t('navbar.contactUs')}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex gap-2 justify-center items-center sm:hidden">
            <LanguageChanger />
            <ThemeToggler
              className={`p-2 rounded-lg transition-colors duration-300 ${scrolled
                ? "text-gray-200 dark:hover:bg-gray-800"
                : "text-agri-950 hover:bg-agri-100 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
            />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-300 ${scrolled
                ? "text-gray-200 dark:hover:bg-gray-800"
                : "text-agri-950 hover:bg-agri-100 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <span
                  className={`absolute w-6 h-0.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-current" : "bg-agri-950 dark:bg-white"
                    } ${isMenuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
                    }`}
                />
                <span
                  className={`absolute w-6 h-0.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-current" : "bg-agri-950 dark:bg-white"
                    } ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute w-6 h-0.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-current" : "bg-agri-950 dark:bg-white"
                    } ${isMenuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "" : "max-h-0"
          }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-agri-950 backdrop-blur-lg">
          {[...navigationLinks].map(
            ({ title, url }) => (
              <Link
                key={url}
                href={url}
                className={`block px-3 py-2 rounded-lg  ${pathname === url
                  ? "bg-agri-50 text-agri-600 dark:bg-agri-900/20 dark:text-agri-400"
                  : " hover:text-agri-600 text-gray-200 hover:bg-gray-800/50 dark:hover:text-agri-400"
                  }`}
              >
                {title}
              </Link>
            )
          )}
          <a
            href="mailto:contact@larvest.ai"
            className="block px-3 py-2 rounded-lg text-agri-400 font-medium hover:bg-agri-900/30 transition-colors duration-300"
          >
            {t('navbar.contactUs')}
          </a>
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18nConfig from '@/i18nConfig';
import { useState, useRef, useEffect } from 'react';

export default function LanguageChanger({ scrolled }) {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const currentPathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const handleChange = (newLocale) => {
    // set cookie for next-i18n-router
    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = date.toUTCString();
    document.cookie = `NEXT_LOCALE=${newLocale};expires=${expires};path=/`;

    // redirect to the new locale path
    let newPathname = currentPathname;
    
    // Remove the current locale from the path if it exists
    if (currentPathname.startsWith(`/${currentLocale}/`)) {
      newPathname = currentPathname.replace(`/${currentLocale}`, '');
    } else if (currentPathname === `/${currentLocale}`) {
      newPathname = '/';
    }
    
    // Add the new locale to the path
    if (newLocale === i18nConfig.defaultLocale && i18nConfig.prefixDefault === false) {
      router.push(newPathname === '/' ? '/' : newPathname);
    } else {
      router.push('/' + newLocale + (newPathname === '/' ? '/' : newPathname));
    }

    setIsOpen(false);
    router.refresh();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages.find(lang => lang.code === currentLocale);
  const isRTL = currentLocale === 'ar';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${scrolled
          ? "text-gray-200 hover:bg-gray-800/50"
          : "text-agri-950 hover:bg-agri-100 dark:text-gray-200 dark:hover:bg-gray-800/50"
          }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm hidden sm:inline-block">{currentLanguage?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 ${isRTL ? 'left-0' : 'right-0'
            }`}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleChange(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${currentLocale === language.code ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function HeroSection() {
  const { t } = useTranslation("home");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-agri-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-agri-900 via-agri-950 to-agri-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.4),_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,_rgba(4,120,87,0.3),_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-agri-500/10 to-agri-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-agri-400/10 to-agri-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div className="relative">
            {/* Glass Card */}
            <div className="relative backdrop-blur-xl bg-agri-900/[0.08] rounded-3xl p-8 lg:p-14 border border-white/10 shadow-2xl">
              {/* Highlight Lines */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-agri-500/50 to-transparent"></div>
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-agri-400/30 to-transparent"></div>

              <h1 className="relative text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                <span className="block text-white mb-2">
                  {t('hero.title')}
                </span>
                <span className="block bg-gradient-to-r from-agri-300 via-agri-200 to-agri-300 bg-clip-text text-transparent">
                  {t('hero.subtitle')}
                </span>
              </h1>

              <p className="text-xl mb-8 text-agri-100/90 font-light">
                {t('hero.description')}
              </p>
            </div>
          </div>

          {/* Image Side */}
          <div className="hidden lg:block relative">
            <div className="relative aspect-square">
              {/* Image Container with Glow */}
              <div className="group relative w-full h-full rounded-3xl overflow-hidden">
                <div className="absolute -inset-2 bg-gradient-to-r from-agri-500/20 to-agri-300/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative w-full h-full bg-[url('/hero-dashboard.jpg')] bg-cover bg-center rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-500">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
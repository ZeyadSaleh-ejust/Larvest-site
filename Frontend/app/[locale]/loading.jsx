export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      {/* Growing Plant Animation */}
      <div className="relative">
        {/* Soil */}
        <div className="w-24 h-8 bg-gradient-to-r from-amber-800/80 to-amber-700/80 rounded-full mx-auto mb-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-30" />
        </div>

        {/* Plant Container */}
        <div className="relative h-32 w-32 mx-auto">
          {/* Stem */}
          <div className="absolute bottom-0 left-1/2 w-1.5 bg-gradient-to-t from-agri-600 to-agri-500 rounded-full origin-bottom animate-grow-height" />

          {/* Leaves */}
          <div className="absolute bottom-8 left-1/2 -translate-x-6 w-4 h-8">
            <div className="w-full h-full bg-gradient-to-tr from-agri-500 to-agri-400 rounded-tl-full rounded-br-full origin-bottom-right animate-grow-leaf-left" />
          </div>
          <div className="absolute bottom-16 left-1/2 translate-x-2 w-4 h-8">
            <div className="w-full h-full bg-gradient-to-tl from-agri-500 to-agri-400 rounded-tr-full rounded-bl-full origin-bottom-left animate-grow-leaf-right" />
          </div>
          <div className="absolute bottom-24 left-1/2 -translate-x-6 w-4 h-8">
            <div className="w-full h-full bg-gradient-to-tr from-agri-500 to-agri-400 rounded-tl-full rounded-br-full origin-bottom-right animate-grow-leaf-left animation-delay-500" />
          </div>

          {/* Loading Text */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              {/* Growing */}
              <span className="inline-flex w-8 justify-center">
                <span className="animate-loading-dot delay-100">.</span>
                <span className="animate-loading-dot delay-200">.</span>
                <span className="animate-loading-dot delay-300">.</span>
              </span>
            </p>
          </div>

          {/* Floating Particles */}
          <div className="absolute inset-0">
            <div className="absolute h-1 w-1 bg-agri-400/40 rounded-full top-4 left-4 animate-float-particle" />
            <div className="absolute h-1 w-1 bg-agri-400/40 rounded-full top-12 right-8 animate-float-particle animation-delay-300" />
            <div className="absolute h-1 w-1 bg-agri-400/40 rounded-full bottom-8 right-4 animate-float-particle animation-delay-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

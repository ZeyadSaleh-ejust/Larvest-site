"use client";
import { useRef, useEffect, useState } from "react";

const team = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief Agricultural Scientist",
    image: "/person.jpg",
    bio: "Leading expert in agricultural technology with 15+ years of experience in crop science",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Michael Rodriguez",
    role: "Head of AI Development",
    image: "/person.jpg",
    bio: "AI specialist focused on developing cutting-edge agricultural analysis systems",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Emma Thompson",
    role: "Precision Agriculture Expert",
    image: "/person.jpg",
    bio: "Specializes in implementing precision farming techniques and data analysis",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Dr. James Wilson",
    role: "Research Director",
    image: "/person.jpg",
    bio: "Leading research initiatives in sustainable farming practices",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Lisa Kumar",
    role: "UX Design Lead",
    image: "/person.jpg",
    bio: "Creating intuitive interfaces for agricultural technology solutions",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
];

export default function TeamSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  const slideToIndex = (index, dir) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const nextSlide = () => {
    const nextIndex = (currentIndex + 1) % team.length;
    slideToIndex(nextIndex, 1);
  };

  const prevSlide = () => {
    const prevIndex = (currentIndex - 1 + team.length) % team.length;
    slideToIndex(prevIndex, -1);
  };

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex]);

  const getVisibleTeam = () => {
    const prev = (currentIndex - 1 + team.length) % team.length;
    const next = (currentIndex + 1) % team.length;
    return [team[prev], team[currentIndex], team[next]];
  };

  const getSlideStyles = (index) => {
    const baseStyles = "transform transition-all duration-700 w-full max-w-sm";
    if (index === 1) {
      return `${baseStyles} scale-100 opacity-100 translate-x-0`;
    }
    if (index === 0) {
      return `${baseStyles} scale-90 opacity-50 -translate-x-[120%] hover:opacity-75`;
    }
    return `${baseStyles} scale-90 opacity-50 translate-x-[120%] hover:opacity-75`;
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1),_transparent_70%)]"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-agri-50 text-agri-600 mb-4 border border-agri-100">
            <span className="w-2 h-2 rounded-full bg-agri-500 mr-2 animate-pulse"></span>
            Our Team
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet the Experts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dedicated professionals working to revolutionize agriculture through
            technology
          </p>
        </div>

        <div className="relative px-4" ref={sliderRef}>
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/80 shadow-lg hover:bg-white transition-all duration-200 -translate-x-1/2 hover:scale-110"
            disabled={isAnimating}
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/80 shadow-lg hover:bg-white transition-all duration-200 translate-x-1/2 hover:scale-110"
            disabled={isAnimating}
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Team Cards Container */}
          <div className="relative flex justify-center items-center gap-6 h-[600px] overflow-hidden">
            {getVisibleTeam().map((member, index) => (
              <div
                key={member.name}
                className={`absolute ${getSlideStyles(index)}`}
                style={{
                  zIndex: index === 1 ? 20 : 10,
                }}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-500">
                  <div className="aspect-w-3 aspect-h-4 relative overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex gap-3">
                          <a
                            href={member.social.linkedin}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors duration-300 transform hover:scale-110"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                          <a
                            href={member.social.twitter}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors duration-300 transform hover:scale-110"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-agri-600 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {team.map((_, index) => (
              <button
                key={index}
                onClick={() =>
                  slideToIndex(index, index > currentIndex ? 1 : -1)
                }
                className={`transition-all duration-500 rounded-full ${currentIndex === index
                  ? "w-8 h-2 bg-agri-500"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                disabled={isAnimating}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

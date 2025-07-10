import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AboutPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Title */}
      <section className="max-w-5xl mx-auto text-center mb-16" data-aos="fade-down">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 drop-shadow-md">
          About Forts of Bharath
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Dive into the legendary past of India's majestic forts.
        </p>
      </section>

      {/* Info Sections */}
      <div className="max-w-5xl mx-auto space-y-14">
        {/* Mission */}
        <section
          className="p-6 rounded-xl shadow-lg border border-orange-200 dark:border-orange-500 bg-gradient-to-br from-orange-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 transition-all duration-300"
          data-aos="fade-up"
        >
          <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-3">
            🎯 Our Mission
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            To preserve and promote India’s fort legacy through immersive storytelling and technology.
          </p>
        </section>

        {/* Offerings */}
        <section
          className="p-6 rounded-xl shadow-lg border border-pink-200 dark:border-pink-500 bg-gradient-to-br from-pink-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
          data-aos="fade-right"
        >
          <h2 className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-4">
            🚀 What We Offer
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Interactive fort maps by Indian state</li>
            <li>Rich details: history, photos, timelines</li>
            <li>Virtual tours and 360° views</li>
            <li>AI-powered chatbot guides</li>
            <li>Try-on photo booth with fort backdrops</li>
            <li>Personalized recommendations</li>
            <li>Nearby places, entry fees, and tips</li>
          </ul>
        </section>

        {/* Importance */}
        <section
          className="p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-500 bg-gradient-to-br from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
          data-aos="fade-left"
        >
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
            🏰 Why Forts Matter
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Forts are not just stones — they’re symbols of India’s resilience, architecture, and cultural brilliance.
          </p>
        </section>

        {/* Team */}
        <section
          className="p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-500 bg-gradient-to-br from-green-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
          data-aos="fade-up"
        >
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">
            👨‍💻 Who We Are
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            A team of tech-savvy history lovers building a platform with React, FastAPI, and MongoDB to revive India’s heritage.
          </p>
        </section>

        {/* Vision */}
        <section
          className="p-6 rounded-xl shadow-lg border border-purple-200 dark:border-purple-500 bg-gradient-to-br from-purple-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
          data-aos="zoom-in"
        >
          <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-3">
            🌅 Our Vision
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            To become India’s leading digital platform for fort lovers — from tourists and students to history buffs.
          </p>
        </section>
      </div>

      {/* CTA */}
      <section
        className="max-w-4xl mx-auto text-center mt-20"
        data-aos="fade-up"
      >
        <p className="text-xl mb-6 text-gray-900 dark:text-white font-semibold">
          Your history adventure begins now!
        </p>
        <a
          href="/explore"
          className="inline-block px-8 py-3 rounded-full text-white text-lg font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-pink-500 hover:to-orange-500 transition-all duration-300 shadow-xl hover:scale-105"
        >
          🌍 Explore Forts
        </a>
      </section>
    </div>
  );
};

export default AboutPage;

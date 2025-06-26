import React, { useState, useEffect } from "react";
import IndianMap from "../components/IndianMap";
import fortsData from "../data/fortsData";
import "../components/IndianMap.css";
import { MapPin } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./ExplorePage.css";


const ExplorePage = () => {
  const [selectedState, setSelectedState] = useState(null);
  const [forts, setForts] = useState([]);

  const liveSentences = [
    "Zoom into history... Click on any state to begin your journey!",
    "Every state tells a story. Discover the forgotten tales.",
    "From Kashmir to Kanyakumari – Forts await your curiosity.",
    "Which fort will you unlock today?",
  ];
  const [liveSentence, setLiveSentence] = useState(liveSentences[0]);

  useEffect(() => {
    AOS.init({ duration: 800 });

    const interval = setInterval(() => {
      setLiveSentence(
        (prev) =>
          liveSentences[(liveSentences.indexOf(prev) + 1) % liveSentences.length]
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStateClick = (stateId) => {
    setSelectedState(stateId);
    setForts(fortsData[stateId] || []);

    setTimeout(() => {
      const fortsSection = document.getElementById("forts-section");
      if (fortsSection) {
        fortsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-indigo-100 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <h1
        className="text-5xl font-extrabold text-center mb-3 text-indigo-700 dark:text-indigo-400 animate-title-glow"
        data-aos="fade-down"
      >
        🏰 Explore the Forts of India
      </h1>

      <p
        className="text-lg italic text-center mb-12 text-gray-700 dark:text-gray-300 animate-fadeInUp"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        {liveSentence}
      </p>

      <div data-aos="zoom-in" className="mb-16">
        <IndianMap onStateClick={handleStateClick} />
      </div>

      {selectedState && (
        <div
          id="forts-section"
          className="mt-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-blue-800 dark:text-blue-300">
            Forts in {selectedState}
          </h2>

          {forts.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto px-2">
              {forts.map((fort, index) => (
                <li
                  key={index}
                  className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xl hover:scale-105 hover:shadow-2xl hover:bg-indigo-50 dark:hover:bg-gray-700 transform transition duration-300"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="text-indigo-500 dark:text-indigo-300" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {fort.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {fort.description}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-lg text-gray-700 dark:text-gray-300">
              No forts available for this state.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;

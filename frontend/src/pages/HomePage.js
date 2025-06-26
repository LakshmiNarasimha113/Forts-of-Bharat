import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 🎥 Fullscreen Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/forts-intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🌓 Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10"></div>

      {/* ✨ Centered Animated Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-6">
        <motion.h1
          className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-white to-[#138808] text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          Forts of Bharath Explorer
          <motion.div
            className="absolute bottom-0 left-1/2 w-0 h-1 bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
          ></motion.div>
        </motion.h1>

        <motion.p
          className="text-white text-lg md:text-xl font-medium mb-8 opacity-80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          Step into the legacy of India's most iconic forts.
        </motion.p>

        <Link to="/explore">
          <motion.button
            className="px-8 py-3 bg-white bg-opacity-10 backdrop-blur-md text-white text-lg font-bold rounded-full shadow-md border border-white border-opacity-30 hover:bg-opacity-20 transition duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Now
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;

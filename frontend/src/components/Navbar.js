import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Import ThemeContext

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode, toggleTheme } = useContext(ThemeContext); // ✅ Access context

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md px-6 py-3 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <motion.div
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Forts of Bharath
        </motion.div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-lg font-medium items-center">
          <motion.li
            whileHover={{ scale: 1.1 }}
            className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400 transition duration-300"
          >
            <Link to="/">Home</Link>
          </motion.li>
          {["Explore", "About", "Contact"].map((item, index) => (
            <motion.li
              key={index}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400 transition duration-300"
            >
              <Link to={`/${item.toLowerCase()}`}>{item}</Link>
            </motion.li>
          ))}

          {/* Theme Toggle Button */}
          <li>
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            className="text-gray-700 dark:text-gray-200 focus:outline-none"
            onClick={toggleTheme}
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <button
            className="text-gray-700 dark:text-gray-200 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 shadow-md p-4 space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/"
            className="block text-lg text-gray-700 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400 transition duration-300"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          {["Explore", "About", "Contact"].map((item, index) => (
            <Link
              key={index}
              to={`/${item.toLowerCase()}`}
              className="block text-lg text-gray-700 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400 transition duration-300"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </Link>
          ))}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;

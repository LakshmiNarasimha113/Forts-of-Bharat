import React from 'react';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#0f172a] text-white py-12 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1 */}
        <div>
          <h3 className="text-xl font-bold mb-2">Forts of Bharat Explorer</h3>
          <p className="text-sm text-gray-300 mb-4">
            Discover India's rich heritage through its magnificent forts and palaces.
          </p>
          <div className="flex space-x-4 text-lg">
            <FaFacebookF className="hover:text-yellow-400 transition" />
            <FaTwitter className="hover:text-yellow-400 transition" />
            <FaInstagram className="hover:text-yellow-400 transition" />
            <FaYoutube className="hover:text-yellow-400 transition" />
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Explore More Forts</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>Red Fort, Delhi</li>
            <li>Amber Fort, Jaipur</li>
            <li>Gwalior Fort, Madhya Pradesh</li>
            <li>Jaisalmer Fort, Rajasthan</li>
            <li>Chittorgarh Fort, Rajasthan</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>About Us</li>
            <li>Heritage Conservation</li>
            <li>Educational Resources</li>
            <li>Virtual Tours</li>
            <li>Contact Us</li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Newsletter</h3>
          <p className="text-sm text-gray-300 mb-3">
            Subscribe to receive updates on new features and historical discoveries.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full px-4 py-2 rounded-l-md bg-gray-800 border-none text-white text-sm"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 px-4 rounded-r-md">
              📩
            </button>
          </div>
          <div className="flex gap-3 mt-4 text-xl text-gray-300">
            <FaCcVisa />
            <FaCcMastercard />
            <FaCcPaypal />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <p>© 2025 Forts of Bharat Explorer. All rights reserved.</p>
        <p className="mt-2 md:mt-0">
          Privacy Policy | Terms of Service
        </p>
      </div>
    </footer>
  );
};

export default Footer;

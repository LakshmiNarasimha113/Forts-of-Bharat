import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const ContactPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12" data-aos="fade-down">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-md">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Have questions, suggestions, or feedback? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Card */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-gradient-to-br from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-8 rounded-xl shadow-2xl border border-blue-200 dark:border-blue-500"
          data-aos="zoom-in"
        >
          {/* Contact Form */}
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600"
                placeholder="example@domain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                rows="4"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-600"
                placeholder="How can we help you?"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 text-white font-semibold shadow-md hover:shadow-xl transition-all duration-300"
            >
              📤 Send Message
            </button>
          </form>

          {/* Contact Info */}
          <div className="space-y-6 text-base text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                📍 Office Address
              </h3>
              <p>
                Fort Heritage HQ, Hyderabad, Telangana<br />
                India – 500001
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
                📧 Email
              </h3>
              <p>support@fortsofbharath.in</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-pink-600 dark:text-pink-400 mb-2">
                📞 Phone
              </h3>
              <p>+91 98765 43210</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                🕐 Working Hours
              </h3>
              <p>Mon – Fri: 9:00 AM – 6:00 PM</p>
              <p>Sat – Sun: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

import React, { useState } from 'react';
import { TrainFront, BusFront, Car } from 'lucide-react';

const TransportBooking = ({ fort }) => {
  const [transportType, setTransportType] = useState('train');
  const [startPoint, setStartPoint] = useState('');
  const [date, setDate] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const transportOptions = [
    { type: 'train', label: 'Train', icon: <TrainFront className="w-5 h-5 mr-2" /> },
    { type: 'bus', label: 'Bus', icon: <BusFront className="w-5 h-5 mr-2" /> },
    { type: 'car', label: 'Car', icon: <Car className="w-5 h-5 mr-2" /> },
  ];

  const handleBooking = () => {
    if (!startPoint || !date) {
      alert('Please fill all fields');
      return;
    }

    const urls = {
      train: 'https://www.irctc.co.in',
      bus: 'https://www.abhibus.com',
      car: 'https://www.olacabs.com',
    };

    window.open(urls[transportType], '_blank');
    setShowConfirmation(true);
  };

  return (
    <section
      data-aos="fade-up"
      className="mb-16"
    >
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-yellow-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-yellow-200 dark:border-yellow-600">
        <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-6 flex items-center gap-2">
          🧭 Book Your Transport
        </h2>

        <div className="space-y-6">
          {/* Transport Options */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Select Transport Type:</label>
            <div className="flex gap-4">
              {transportOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setTransportType(option.type)}
                  className={`flex items-center px-4 py-2 rounded-lg transition border ${
                    transportType === option.type
                      ? 'bg-yellow-200 dark:bg-yellow-700 text-black dark:text-white border-yellow-400 dark:border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Point */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Starting Point:</label>
            <input
              type="text"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              placeholder="Enter your location"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Travel Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
          </div>

          {/* Book Button */}
          <button
            onClick={handleBooking}
            className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-transform transform hover:scale-105"
          >
            🚀 Book Now
          </button>

          {/* Confirmation */}
          {showConfirmation && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
              ✅ Booking portal opened in a new tab. Please complete your booking.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TransportBooking;

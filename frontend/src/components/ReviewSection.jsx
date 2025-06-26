import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function ReviewSection({ fortSlug }) {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800 });
    fetchReviews();
  }, [fortSlug]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/reviews/${fortSlug}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/reviews', {
        ...form,
        fortSlug,
      });
      setForm({ name: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      console.error("Error submitting review:", err.message);
    }
    setSubmitting(false);
  };

  const renderStars = (count) => (
    <div className="text-yellow-400">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </div>
  );

  return (
    <section
      data-aos="fade-up"
      className="mt-10 p-6 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
    >
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">User Reviews</h2>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <input
          type="text"
          required
          placeholder="Your name"
          className="w-full p-2 rounded-lg border dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
          className="w-full p-2 rounded-lg border dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Star{r !== 1 && 's'}
            </option>
          ))}
        </select>
        <textarea
          required
          placeholder="Your review"
          className="w-full p-2 rounded-lg border dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-800 dark:text-white">{rev.name}</span>
                {renderStars(rev.rating)}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">{rev.comment}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {new Date(rev.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

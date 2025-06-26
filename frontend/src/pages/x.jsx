import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useNavigate } from 'react-router-dom';
import AIPhotoBooth from '../components/AIPhotoBooth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';





const FortDetailPage = () => {
  const { slug } = useParams();
  const [fort, setFort] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPhotoBooth, setShowPhotoBooth] = React.useState(false);

   const navigate = useNavigate();

  // ✅ Define the function here
  const handleChatClick = () => {
    navigate('/chatbot');
  };
  const handleDownloadPDF = () => {
    const content = document.getElementById('fort-details');
    html2canvas(content).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${fort.name}-details.pdf`);
    });
  };
  

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    AOS.refresh();
  }, []);

  useEffect(() => {
    const fetchFort = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/forts/${slug}`);
        setFort(res.data);
      } catch (error) {
        console.error('Error fetching fort details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFort();
  }, [slug]);

  if (loading) return <div className="p-6 text-center text-lg text-gray-700 dark:text-gray-300">Loading...</div>;
  if (!fort) return <div className="p-6 text-center text-red-600 dark:text-red-400">Fort not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-24 transition-colors duration-300 font-sans">
      <div className="glass-card max-w-5xl mx-auto bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/20 rounded-xl shadow-md text-gray-900 dark:text-gray-100 p-6">

        {/* Header with Parallax */}
        <div className="h-[400px] bg-fixed bg-center bg-cover flex items-center justify-center text-white mb-12 rounded-xl overflow-hidden"
          style={{ backgroundImage: `url(${fort.image})` }}>
          <h1 className="text-5xl font-bold bg-black/50 px-8 py-4 rounded-xl shadow-lg">
            {fort.name}
          </h1>
        </div>

        <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 mb-10">{fort.history}</p>

        {/* Highlights */}
        {fort.highlights && (
          <section data-aos="fade-up" className="mb-10">
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-3">Highlights</h2>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
              {fort.highlights.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </section>
        )}
        

        {/* Virtual Tour */}
        {fort.virtualTour && (
          <div className="glass-card my-10">
            <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-6">🔭 360° Virtual Tour of {fort.name}</h2>
            <div className="w-full h-[600px] rounded-lg overflow-hidden">
              <iframe
                src={fort.virtualTour}
                title={`360° Virtual Tour of ${fort.name}`}
                width="100%" height="100%" allowFullScreen
                className="w-full h-full border-none"
              ></iframe>
            </div>
          </div>
        )}
    <div>
      {/* Your existing gallery */}
      {fort.moreImages?.length > 0 && (
        <section data-aos="fade-up" className="mb-10">
          <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fort.moreImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`View ${i + 1}`}
                className="rounded-xl object-cover w-full h-56 shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => {
                  // your existing lightbox open code here if any
                }}
              />
            ))}
          </div>
          {/* Button to open AI Photo Booth */}
          <button
            onClick={() => setShowPhotoBooth(true)}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            🎨 Try AI Fort Photo Booth
          </button>
        </section>
      )}

      {showPhotoBooth && (
        <AIPhotoBooth
          fortImages={fort.moreImages}
          onClose={() => setShowPhotoBooth(false)}
        />
      )}
    </div>
  



        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={fort.moreImages.map((url) => ({ src: url }))}
            index={currentIndex}
            plugins={[Captions, Thumbnails]}
          />
        )}

        {/* SVG Wave */}
        <div className="overflow-hidden -mt-4">
          <svg viewBox="0 0 1440 100" className="w-full" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#c7d2fe"
              className="dark:fill-indigo-800"
              d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,58.7C1200,85,1320,139,1380,165.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>

        {/* Fort Info */}
        <section data-aos="fade-up" className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow mb-10">
          <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">Fort Info</h2>
          <ul className="text-gray-800 dark:text-gray-200 space-y-2">
            <li><strong>Built By:</strong> {fort.builtBy}</li>
            <li><strong>Year Built:</strong> {fort.yearBuilt}</li>
            <li><strong>Architecture Style:</strong> {fort.architectureStyle}</li>
            <li><strong>Timing:</strong> {fort.timing}</li>
            <li><strong>Entry Fee:</strong> {fort.entryFee}</li>
            <li><strong>Location:</strong> {fort.location}</li>
            <li><strong>State:</strong> {fort.state}</li>
          </ul>
        </section>

        {/* How to Reach */}
        {fort.howToReach && (
          <section data-aos="fade-up" className="mb-10">
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">How to Reach</h2>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Nearest Airport:</strong> {fort.howToReach.nearestAirport}</li>
              <li><strong>Nearest Railway Station:</strong> {fort.howToReach.nearestRailwayStation}</li>
              <li><strong>By Road:</strong> {fort.howToReach.roadConnectivity}</li>
            </ul>
          </section>
        )}

        {/* Google Map */}
        {fort.maps?.googleMapsEmbedUrl && (
          <section data-aos="fade-up" className="mb-10">
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">Map Location</h2>
            {/* SVG Wave */}
        <div className="overflow-hidden -mt-4">
          <svg viewBox="0 0 1440 100" className="w-full" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#c7d2fe"
              className="dark:fill-indigo-800"
              d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,58.7C1200,85,1320,139,1380,165.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <iframe
                title={`${fort.name} Map`}
                src={fort.maps.googleMapsEmbedUrl}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full rounded-xl"
              ></iframe>
            </div>
          </section>
        )}

        {/* Travel Tips */}
        {fort.tips && (
          <section data-aos="fade-up" className="mb-10">
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">Travel Tips</h2>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
              {fort.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </section>
        )}
        

        {/* Fun Facts */}
        {fort.funFacts && (
          <section data-aos="fade-up" className="mb-10">
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">Did You Know?</h2>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
              {fort.funFacts.map((fact, i) => <li key={i}>{fact}</li>)}
            </ul>
          </section>
        )}
        {/* Download PDF */}
        <div className="text-right mb-10">
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2 bg-indigo-700 text-white rounded-lg shadow hover:bg-indigo-800 transition"
          >
            📄 Download Fort Info as PDF
          </button>
        </div>
        
        {/* Chatbot Floating Button */}
{/* Stylish Floating Chatbot Button */}
<div
  style={{
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 9999,
  }}
>
  <div className="flex flex-col items-end space-y-2">
    {/* Tooltip / Quote */}
    <div className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-pulse">
      💬 Need help? Ask our AI Guide!
    </div>

    {/* Chatbot Button */}
    <button
      onClick={handleChatClick}
      aria-label="Chat with AI"
      className="bg-indigo-700 hover:bg-indigo-800 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform duration-300 transform hover:scale-110"
    >
      {/* Chat Icon using Heroicons or FontAwesome */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.842L3 20l1.112-3.23A8.964 8.964 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  </div>
</div>


      </div>

    </div>
  );
};

export default FortDetailPage;

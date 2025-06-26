import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails.css";
import AIPhotoBooth from '../components/AIPhotoBooth';
import ReviewSection from "../components/ReviewSection";
import TransportBooking from '../components/TransportBooking';
import Footer from '../components/Footer';
import translateText from '../utils/translateText';

import {
  Hammer, Calendar, Landmark, Clock, Coins, MapPin, Globe, Bus, TrainFront,
  Plane, Car, Map, Info, Train, Sparkles, Video, CalendarCheck, Ruler, Mountain,
  Building2, Globe2
} from 'lucide-react';
import {
  ShieldCheck,
  AlertTriangle,
  HandHelping,
  
  PhoneCall,
  Link2
} from "lucide-react";


const FortDetailPage = () => {
  const { slug } = useParams();
  const [fort, setFort] = useState(null);
  const [translatedFort, setTranslatedFort] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPhotoBooth, setShowPhotoBooth] = useState(false);
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!fort?.moreImages?.length) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % fort.moreImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [fort]);

  const headerImage = fort?.moreImages?.[currentImageIndex] || fort?.image;

  const handleChatClick = () => navigate('/chatbot');

  const handleDownloadPDF = () => {
    const content = document.getElementById('fort-details');
    if (!content) return;
    html2canvas(content).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${fort.name}-details.pdf`);
    });
  };

  const iconMap = {
    "Established": <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />,
    "Dynasty": <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />,
    "Area": <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />,
    "Elevation": <Mountain className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />,
    "Architectural Style": <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />,
    "UNESCO Status": <Globe2 className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
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
        console.error('Error fetching fort:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFort();
  }, [slug]);

  useEffect(() => {
  const translateFortContent = async () => {
    if (!fort || selectedLanguage === "en") {
      setTranslatedFort(fort); // No translation needed
      return;
    }

    try {
      const response = await axios.post("https://libretranslate.de/translate", {
        q: JSON.stringify({
          historicalOverview: fort.historicalOverview,
          highlights: fort.highlights,
          timeline: fort.timeline,
          tips: fort.tips,
          funFacts: fort.funFacts
        }),
        source: "en",
        target: selectedLanguage,
        format: "text"
      }, {
        headers: { accept: "application/json", "Content-Type": "application/json" }
      });

      const translated = JSON.parse(response.data.translatedText);

      setTranslatedFort({
        ...fort,
        historicalOverview: translated.historicalOverview,
        highlights: translated.highlights,
        timeline: translated.timeline,
        tips: translated.tips,
        funFacts: translated.funFacts
      });
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedFort(fort); // fallback
    }
  };

  translateFortContent();
}, [fort, selectedLanguage]);


  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!translatedFort) return <div className="p-6 text-center text-red-500">Fort not found.</div>;


  return (
    

    <div
      id="fort-details"
      className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-24 transition-colors duration-300 font-sans"
    >
      {/* 🌐 Language Selector */}
      <div className="flex justify-end px-6">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-3 py-2 rounded-md border border-indigo-300 text-gray-800 dark:text-gray-100 dark:bg-gray-800"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="te">Telugu</option>
          <option value="ta">Tamil</option>
          <option value="ml">Malayalam</option>
          <option value="kn">Kannada</option>
        </select>
      </div>
      <div className="glass-card max-w-5xl mx-auto bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/20 rounded-xl shadow-md text-gray-900 dark:text-gray-100 p-6">
        
        {/* 🔁 Header with Image Slideshow */}
        <div
          className="h-[400px] bg-fixed bg-center bg-cover flex items-center justify-center text-white mb-12 rounded-xl overflow-hidden transition-all duration-700"
          style={{ backgroundImage: `url(${headerImage})` }}
        >
          <h1 className="text-5xl font-bold bg-black/50 px-8 py-4 rounded-xl shadow-lg backdrop-blur-sm">
            {translatedFort.name}
          </h1>
        </div>

        {/* Historical Overview */}

{translatedFort?.historicalOverview && (
  <section
    data-aos="fade-up"
    className="mb-10 bg-[#f8f9fa] dark:bg-gradient-to-br dark:from-[#0d1117] dark:to-[#1f2937] p-6 md:p-8 rounded-3xl shadow-2xl border border-yellow-300 dark:border-yellow-600"
  >
    {/* 🏰 Historical Overview + Key Facts */}
    <div className="flex flex-col lg:flex-row gap-10 items-start">

      {/* Overview Text */}
      <div className="lg:w-2/3">
        <h2 className="text-3xl font-bold text-[#1e3a8a] dark:text-yellow-400 mb-5 flex items-center gap-2">
          <Info className="w-6 h-6 text-yellow-500 dark:text-yellow-300" />
          Historical Overview
        </h2>
        <p className="text-slate-700 dark:text-zinc-300 text-[1.08rem] leading-[1.8] tracking-wide font-serif text-justify">
          {translatedFort?.historicalOverview}
        </p>
      </div>

      {/* Key Facts */}
      {fort.keyFacts && (
        <div className="lg:w-1/3 bg-white/70 dark:bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-md">
          <h3 className="text-xl font-semibold text-[#1e3a8a] dark:text-yellow-300 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-300" />
            Key Facts
          </h3>
          <ul className="space-y-4">
            {Object.entries(fort.keyFacts).map(([label, value], i) => (
              <li
                key={i}
                className="flex justify-between items-start text-base text-slate-800 dark:text-gray-300"
              >
                <span className="font-medium text-indigo-900 dark:text-yellow-200 flex gap-2 items-center">
                  {iconMap[label]} {label}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-right">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* 🕰️ Historical Timeline */}
    {fort.timeline && (
      <div className="mt-14">
        <h2 className="text-3xl font-bold text-[#1e3a8a] dark:text-yellow-400 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-yellow-500 dark:text-yellow-300" />
          Historical Timeline
        </h2>

        <div className="relative border-l-4 border-yellow-400 dark:border-yellow-600 pl-6 space-y-12">
          {fort.timeline.map((item, index) => (
            <div key={index} className="relative group">
              <div className="absolute -left-3 w-4 h-4 rounded-full bg-yellow-500 dark:bg-yellow-400 border-2 border-white dark:border-[#0d1117] shadow-md"></div>
              <h4 className="text-lg font-bold text-indigo-800 dark:text-yellow-200 font-mono">
                {item.year}
              </h4>
              <p className="text-[1.05rem] text-slate-800 dark:text-gray-300 leading-relaxed tracking-wide text-justify font-serif">
                {item.event}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
  </section>
)}



        {/* Highlights */}
        
{fort?.highlights && (
  <section
    data-aos="fade-up"
    className="mb-10 bg-[#f8f9fa] dark:bg-gradient-to-br dark:from-[#0d1117] dark:to-[#1f2937] p-6 md:p-8 rounded-3xl shadow-2xl border border-yellow-300 dark:border-yellow-600"
  >
    <h2 className="text-3xl font-bold text-[#1e3a8a] dark:text-yellow-400 mb-5 flex items-center gap-2">
      <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-300" />
      Highlights
    </h2>

    <ul className="ml-6 space-y-3 text-slate-800 dark:text-zinc-300 list-disc text-[1.05rem] leading-relaxed font-serif">
      {fort.highlights.map((point, i) => (
        <li key={i}>{point}</li>
      ))}
    </ul>
  </section>
)}

        {/* Virtual Tour */}
        
{fort?.virtualTour && (
  <section
    data-aos="fade-up"
    className="bg-[#f8f9fa] dark:bg-gradient-to-br dark:from-[#0d1117] dark:to-[#1f2937] p-8 md:p-10 rounded-3xl shadow-2xl my-12 border border-yellow-300 dark:border-yellow-600"
  >
    <h2 className="text-3xl font-bold text-center text-[#1e3a8a] dark:text-yellow-400 mb-6 flex items-center justify-center gap-3">
      <Video className="w-6 h-6 text-yellow-500 dark:text-yellow-300" />
      360° Virtual Tour of {fort.name}
    </h2>

    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-yellow-200 dark:border-yellow-700">
      <iframe
        src={fort.virtualTour}
        title={`360° Virtual Tour of ${fort.name}`}
        allowFullScreen
        className="w-full h-full border-none"
      ></iframe>
    </div>
  </section>
)}



       {fort?.moreImages?.length > 0 && (
  <section
    data-aos="fade-up"
    className="mb-16 bg-[#f8f9fa] dark:bg-gradient-to-br dark:from-[#0d1117] dark:to-[#1f2937] p-8 md:p-10 rounded-3xl shadow-2xl border border-yellow-300 dark:border-yellow-600"
  >
    <h2 className="text-3xl font-bold text-[#1e3a8a] dark:text-yellow-400 mb-6 flex items-center gap-3">
      🖼️ Pose at the Fort!-
    </h2>

    <div className="flex flex-col lg:flex-row gap-10 items-start">
      {/* Left Side */}
      <div className="flex-1 space-y-6">
        {/* Instructions */}
        <div>
          <h3 className="text-xl font-semibold text-[#1e3a8a] dark:text-yellow-300 mb-2">Create Your Memory</h3>
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
            Take a photo or upload one to create a memorable souvenir with <strong>{fort.name}</strong> as your backdrop.
            Choose from various historical scenes and share your creation with friends and family.
          </p>
        </div>

        {/* Backdrop Selector */}
        <div>
          <h4 className="text-lg font-semibold text-[#1e3a8a] dark:text-yellow-300 mb-2">Choose a backdrop:</h4>
          <div className="flex gap-4 flex-wrap">
            {fort.moreImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Backdrop ${i + 1}`}
                onClick={() => {
                  setCurrentIndex(i);
                  setLightboxOpen(true);
                }}
                className={`w-28 h-20 rounded-lg shadow-md object-cover cursor-pointer border-4 ${
                  i === currentIndex
                    ? 'border-yellow-500 ring-2 ring-yellow-300'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <div>
          <h4 className="text-lg font-semibold text-[#1e3a8a] dark:text-yellow-300 mb-2">Upload your photo:</h4>
          <div className="border-2 border-dashed border-yellow-400 dark:border-yellow-700 p-6 rounded-xl text-center bg-white/60 dark:bg-white/10 backdrop-blur-sm">
            <div className="text-yellow-700 dark:text-yellow-300 mb-3">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              Drag and drop your photo here
            </div>

            {/* Button */}
            <button
              onClick={() => setShowPhotoBooth(true)}
              className="relative group bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <div className="absolute -inset-0.5 bg-yellow-300 opacity-30 blur rounded-xl group-hover:opacity-50 transition-opacity duration-300"></div>
              <span className="relative z-10 text-lg flex items-center gap-2">
                🎨 Try AI Fort Photo Booth
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Preview */}
      <div className="flex-1 flex justify-center items-center">
        <div className="w-full max-w-md h-[420px] relative rounded-xl overflow-hidden shadow-xl border border-yellow-300 dark:border-yellow-700">
          <img
            src={fort.moreImages[currentIndex]}
            alt="Selected backdrop"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
            👤 Your photo will appear here
          </div>
        </div>
      </div>
    </div>

    {/* Lightbox */}
    {lightboxOpen && (
      <Suspense fallback={<div>Loading Lightbox...</div>}>
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={fort.moreImages.map((url) => ({ src: url }))}
          index={currentIndex}
          plugins={[Captions, Thumbnails]}
        />
      </Suspense>
    )}

    {/* AI Photo Booth Component */}
    {showPhotoBooth && (
      <AIPhotoBooth
        fortImages={fort.moreImages}
        onClose={() => setShowPhotoBooth(false)}
      />
    )}
  </section>
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
        <section data-aos="fade-up" className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl mb-12 border border-indigo-200 dark:border-indigo-700">
  <h2 className="text-3xl font-bold text-indigo-700 dark:text-pink-400 mb-6 text-center">
    Fort Information
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-800 dark:text-gray-100">
    <div className="flex items-start space-x-4">
      <Hammer className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Built By:</p>
        <p className="text-sm">{fort.builtBy}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <Calendar className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Year Built:</p>
        <p className="text-sm">{fort.yearBuilt}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <Landmark className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Architecture Style:</p>
        <p className="text-sm">{fort.architectureStyle}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <Clock className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Timing:</p>
        <p className="text-sm">{fort.timing}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <Coins className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Entry Fee:</p>
        <p className="text-sm">{fort.entryFee}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <MapPin className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">Location:</p>
        <p className="text-sm">{fort.location}</p>
      </div>
    </div>
    <div className="flex items-start space-x-4">
      <Globe className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-1" />
      <div>
        <p className="font-semibold">State:</p>
        <p className="text-sm">{fort.state}</p>
      </div>
    </div>
  </div>
</section>


        {/* How to Reach */}
       {fort?.howToReach && (
  <section
    data-aos="fade-up"
    className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl mb-12 border border-indigo-200 dark:border-indigo-600"
  >
    <h2 className="text-3xl font-bold text-indigo-700 dark:text-pink-400 mb-6 text-center">
      How to Reach
    </h2>
    <ul className="space-y-4 text-gray-800 dark:text-gray-100 text-lg">
      {fort.howToReach.nearestAirport && (
        <li className="flex items-start gap-3">
          <Plane className="text-indigo-600 dark:text-indigo-300 w-6 h-6 mt-1" />
          <span><strong>Nearest Airport:</strong> {fort.howToReach.nearestAirport}</span>
        </li>
      )}
      {fort.howToReach.nearestRailwayStation && (
        <li className="flex items-start gap-3">
          <Train className="text-indigo-600 dark:text-indigo-300 w-6 h-6 mt-1" />
          <span><strong>Nearest Railway Station:</strong> {fort.howToReach.nearestRailwayStation}</span>
        </li>
      )}
      {fort.howToReach.roadConnectivity && (
        <li className="flex items-start gap-3">
          <Bus className="text-indigo-600 dark:text-indigo-300 w-6 h-6 mt-1" />
          <span><strong>By Road:</strong> {fort.howToReach.roadConnectivity}</span>
        </li>
      )}
    </ul>
  </section>
)}
<TransportBooking fort={fort} />




        {/* Google Map */}
        {fort.maps?.googleMapsEmbedUrl && (
  <section data-aos="fade-up" className="mb-10">
    <h2 className="text-2xl font-bold text-indigo-700 dark:text-pink-400 mb-4 flex items-center gap-2">
      <MapPin className="w-6 h-6 text-indigo-600 dark:text-pink-300" />
      Map Location
    </h2>

    {/* SVG Wave */}
    <div className="overflow-hidden -mt-4">
      <svg
        viewBox="0 0 1440 100"
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#c7d2fe"
          className="dark:fill-indigo-800"
          d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,58.7C1200,85,1320,139,1380,165.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
    </div>

    <div className="rounded-xl overflow-hidden shadow-xl border border-indigo-200 dark:border-indigo-600">
      <iframe
        title={`${fort.name} Map`}
        src={fort.maps.googleMapsEmbedUrl}
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-[450px] rounded-xl"
      ></iframe>
    </div>
  </section>
)}

        {/* Travel Tips */}
       {fort?.tips && (
  <section
    data-aos="fade-up"
    className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-xl mb-12 border border-indigo-200 dark:border-indigo-600"
  >
    <h2 className="text-3xl font-bold text-indigo-700 dark:text-pink-400 mb-6 text-center">
      Travel Tips
    </h2>
    <ul className="space-y-4 text-gray-800 dark:text-gray-100 text-lg">
      {fort.tips.map((tip, i) => (
        <li key={i} className="flex items-start gap-3">
          <Info className="text-indigo-600 dark:text-indigo-300 w-5 h-5 mt-1" />
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </section>
)}
{translatedFort?.nearbyAttractions?.length > 0 && (
  <section className="mt-12 px-4" data-aos="fade-up">
    <h2 className="text-3xl font-bold mb-6 text-indigo-700 dark:text-yellow-400">
      Nearby Attractions
    </h2>
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {translatedFort.nearbyAttractions.map((place, index) => (
        <a
          key={index}
          href={place.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transform hover:-translate-y-1 transition-all overflow-hidden"
        >
          <img
            src={place.image}
            alt={place.name}
            className="h-40 w-full object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{place.name}</h3>
            <p className="text-sm text-indigo-600 dark:text-yellow-400 font-medium">{place.type}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{place.description}</p>
          </div>
        </a>
      ))}
    </div>
  </section>
)}


        
{fort?.funFacts && (
  <section
    data-aos="fade-up"
    className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-xl mb-12 border border-indigo-200 dark:border-indigo-600"
  >
    <h2 className="text-3xl font-bold text-indigo-700 dark:text-pink-400 mb-6 text-center">
      Did You Know?
    </h2>
    <ul className="space-y-4 text-gray-800 dark:text-gray-100 text-lg">
      {fort.funFacts.map((fact, i) => (
        <li key={i} className="flex items-start gap-3">
          <Sparkles className="text-pink-600 dark:text-indigo-300 w-5 h-5 mt-1" />
          <span>{fact}</span>
        </li>
      ))}
    </ul>
  </section>
)}
{translatedFort?.conservation && (
  <section
    id="conservation"
    className="my-12 p-6 md:p-8 rounded-2xl shadow-xl bg-white/20 dark:bg-gray-800 border border-green-400 text-white"
    data-aos="fade-up"
  >
    {/* 🔰 Title */}
    <h2 className="text-3xl font-bold mb-6 text-green-300 flex items-center gap-3">
      <ShieldCheck className="w-7 h-7 text-green-400" />
      Conserve This Fort
    </h2>

    {/* ⚠️ Threats */}
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2 text-red-300 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        Threats
      </h3>
      <ul className="list-disc list-inside pl-4 space-y-1 text-red-200">
        {translatedFort.conservation.threats.map((threat, i) => (
          <li key={i}>{threat}</li>
        ))}
      </ul>
    </div>

    {/* 💪 Efforts */}
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2 text-yellow-300 flex items-center gap-2">
        <HandHelping className="w-5 h-5 text-yellow-400" />
        Ongoing Conservation Efforts
      </h3>
      <ul className="list-disc list-inside pl-4 space-y-1 text-yellow-200">
        {translatedFort.conservation.efforts.map((effort, i) => (
          <li key={i}>{effort}</li>
        ))}
      </ul>
    </div>

    {/* 🙌 How to Help */}
    <div>
      <h3 className="text-xl font-semibold mb-2 text-blue-300 flex items-center gap-2">
        <HandHelping className="w-5 h-5 text-blue-400" />
        How You Can Help
      </h3>

      {/* 💸 Donate */}
      <p className="text-blue-200 mb-2 flex items-center gap-2">
        <Coins className="w-5 h-5 text-blue-300" />
        <span className="font-semibold">Donate:</span>
        <a
          href={translatedFort.conservation.howToHelp.donationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-400"
        >
          {translatedFort.conservation.howToHelp.donationLink}
        </a>
      </p>

      {/* 📞 Volunteer Info */}
      <p className="text-blue-200 mb-2 flex items-center gap-2">
        <PhoneCall className="w-5 h-5 text-blue-300" />
        <span className="font-semibold">Volunteer:</span> {translatedFort.conservation.howToHelp.volunteerInfo}
      </p>

      {/* 🏛️ Authority */}
      <p className="text-blue-200 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-blue-300" />
        <span className="font-semibold">Contact Authority:</span> {translatedFort.conservation.howToHelp.contactAuthority}
      </p>
    </div>
  </section>
)}


         
   

   <div className="flex justify-center my-14">
  <button
    onClick={handleDownloadPDF}
    className="relative bg-indigo-700 hover:bg-indigo-800 text-white py-3 px-6 rounded-xl text-lg font-medium shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
    Download Fort Info as PDF
  </button>
</div>
<ReviewSection fortSlug={fort.slug} />


        {/* Chatbot Floating Button */}
       
      </div>
       <Footer />
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
              {/* Chat Icon */}
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
    
    
  );
};


export default FortDetailPage;

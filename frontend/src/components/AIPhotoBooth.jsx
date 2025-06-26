import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Rnd } from 'react-rnd';

export default function AIPhotoBooth({ fortImages = [], onClose }) {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // For controlling fade+scale animation
  const [showAnimation, setShowAnimation] = useState(false);

  // Track user image position and size in the preview container
  const [userImagePosition, setUserImagePosition] = useState({ x: 100, y: 100 });
  const [userImageSize, setUserImageSize] = useState({ width: 150, height: 200 });

  // On mount trigger animation in
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 20); // slight delay to trigger transition
    return () => clearTimeout(timer);
  }, []);

  // Close with animation out
  const handleClose = () => {
    setShowAnimation(false);
    // wait for animation to finish before calling parent's onClose
    setTimeout(() => {
      onClose();
    }, 300); // match transition duration below
  };

  // Upload and remove background via remove.bg API
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setOriginalImage(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('size', 'auto');

    try {
      const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
          'X-Api-Key': 'JSyZ8JaAGjXykSUWHc3nKGvo',  // <-- Replace with your real remove.bg API key
        },
        responseType: 'blob',
      });

      const resultUrl = URL.createObjectURL(response.data);
      setProcessedImage(resultUrl);
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download combined preview as PNG by drawing to canvas
  const downloadCombinedImage = async () => {
    if (!selectedBackground || !processedImage) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const bgImg = new Image();
      const userImg = new Image();

      // Set crossOrigin before src for proper CORS handling
      bgImg.crossOrigin = "anonymous";
      userImg.crossOrigin = "anonymous";

      // Helper to load image and handle errors
      const loadImage = (img, src) => new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });

      // Wait for images to load
      await Promise.all([
        loadImage(bgImg, selectedBackground),
        loadImage(userImg, processedImage),
      ]);

      // Set canvas size to background image size
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;

      // Draw background
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // Calculate scale from preview container to real canvas
      const preview = previewRef.current;
      const previewRect = preview.getBoundingClientRect();

      const scaleX = canvas.width / previewRect.width;
      const scaleY = canvas.height / previewRect.height;

      const drawX = userImagePosition.x * scaleX;
      const drawY = userImagePosition.y * scaleY;
      const drawWidth = userImageSize.width * scaleX;
      const drawHeight = userImageSize.height * scaleY;

      // Draw processed user image
      ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);

      // Export to PNG and download
      const finalImageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'fort-photo.png';
      link.href = finalImageURL;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
      alert('Failed to generate download image. Please check console for details.');
    }
  };

  // Fullscreen toggle only on preview area
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      if (previewRef.current.requestFullscreen) {
        previewRef.current.requestFullscreen();
      } else if (previewRef.current.webkitRequestFullscreen) {
        previewRef.current.webkitRequestFullscreen();
      } else if (previewRef.current.msRequestFullscreen) {
        previewRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (e.g. ESC key)
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4 z-50 overflow-auto
        transition-opacity duration-300
        ${showAnimation ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-4xl w-full grid gap-6 md:grid-cols-2 items-start bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg
          transform transition-transform duration-300
          ${showAnimation ? 'scale-100' : 'scale-95'}
        `}
      >
        <button
          onClick={handleClose}
          className="self-end mb-4 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Close
        </button>

        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">🎨 AI Fort Photo Booth</h1>

        {/* Upload & Background selection */}
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">📸 Upload Your Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">🏰 Select a Fort Background:</label>
            {fortImages.length === 0 && (
              <p className="text-sm text-gray-600">No fort background images available.</p>
            )}
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {fortImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBackground(img)}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    selectedBackground === img ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <img src={img} alt={`Fort background ${i + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block font-medium text-lg">🖼 Preview:</label>
            {processedImage && selectedBackground && (
              <button
                onClick={handleFullscreenToggle}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              </button>
            )}
          </div>

          <div
            ref={previewRef}
            className="relative w-full aspect-video bg-white dark:bg-zinc-700 border border-dashed rounded-lg overflow-hidden shadow-inner"
          >
            {selectedBackground && (
              <img
                src={selectedBackground}
                alt="Fort Background"
                className="absolute top-0 left-0 w-full h-full object-cover z-0 transition-all duration-500"
              />
            )}

            {processedImage && (
              <Rnd
                bounds="parent"
                size={userImageSize}
                position={userImagePosition}
                minWidth={50}
                minHeight={60}
                lockAspectRatio={true}
                style={{ zIndex: 10, cursor: 'move' }}
                onDragStop={(e, d) => setUserImagePosition({ x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setUserImageSize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  });
                  setUserImagePosition(position);
                }}
              >
                <img
                  src={processedImage}
                  alt="Processed User"
                  style={{ width: '100%', height: '100%', borderRadius: '10px', boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}
                />
              </Rnd>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 z-20">
                <span className="text-lg font-medium">Processing image...</span>
              </div>
            )}
          </div>

          {processedImage && selectedBackground && (
            <div className="flex justify-center">
              <button
                onClick={downloadCombinedImage}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                📥 Download Fort Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { resizeImage, createThumbnail, computePerceptualHash } from '../lib/imageProcessing.js';

/**
 * UploadZone component
 * Supports drag-and-drop, standard file picker, mobile camera capture, and 1-click test receipt presets.
 */
export default function UploadZone({ onImageProcessed, isProcessing = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WebP, or SVG).');
      return;
    }
    setErrorMessage('');

    try {
      // 1. Downscale large images on canvas (max ~1600px)
      const resized = await resizeImage(file, 1600, 'image/jpeg', 0.85);

      // 2. Generate ~200px JPEG thumbnail for lightweight localStorage persistence
      const thumbnail = await createThumbnail(resized.dataUrl);

      // 3. Compute 64-bit Average Perceptual Hash (aHash) for visual duplicate matching
      const imageHash = await computePerceptualHash(resized.dataUrl);

      onImageProcessed({
        file,
        dataUrl: resized.dataUrl,
        base64Data: resized.base64Data,
        mimeType: resized.mimeType,
        thumbnail,
        imageHash,
        dimensions: { width: resized.width, height: resized.height },
      });
    } catch (err) {
      console.error('Error processing image:', err);
      setErrorMessage('Failed to process image: ' + err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Helper to load sample test receipts from public folder
  const handleLoadSample = async (samplePath) => {
    try {
      setErrorMessage('');
      const response = await fetch(samplePath);
      if (!response.ok) throw new Error('Could not fetch sample receipt');
      const blob = await response.blob();
      const file = new File([blob], samplePath.split('/').pop(), { type: blob.type || 'image/svg+xml' });
      processFile(file);
    } catch (err) {
      setErrorMessage('Failed to load sample: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          card p-8 md:p-12 text-center border-2 border-dashed transition-smooth cursor-pointer
          ${isDragOver
            ? 'border-primary bg-primary-50/50 scale-[1.005]'
            : 'border-primary-mid/30 hover:border-primary-mid/60 bg-white'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload receipt area. Drag and drop receipt or click to browse"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Drop your receipt snapshot here
        </h3>
        <p className="text-sm text-muted mb-4 max-w-md mx-auto">
          High-res photos will automatically be downscaled and hashed for AI-assisted analysis
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-mid transition-smooth cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Choose File
          </button>

          {/* Mobile Camera Capture */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="px-4 py-2 bg-white text-primary border border-primary/30 text-xs font-semibold rounded-lg hover:bg-primary-50 transition-smooth cursor-pointer flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Camera Capture
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Mobile camera input with capture="environment" */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Quick Test Sample Presets Card for Judges & Hackathon Demo */}
      <div className="card p-4 border border-accent/30 bg-accent-50/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent" />
            CYRUS Hackathon Quick-Test Receipts
          </div>
          <span className="text-[11px] text-muted">1-Click Load</span>
        </div>
        <p className="text-xs text-muted mb-3">
          Click any preset below to test extraction and trigger intelligence engine rules:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleLoadSample('/sample-receipts/starbucks_420.svg')}
            className="p-2.5 bg-white border border-gray-200 hover:border-accent hover:shadow-sm rounded-lg text-left transition-smooth cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900 group-hover:text-primary">Starbucks Coffee</span>
              <span className="text-xs font-bold text-green-700">₹420</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Food &middot; Triggers <span className="font-semibold text-amber-700">Potential Duplicate</span> alert
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('/sample-receipts/croma_electronics_8499.svg')}
            className="p-2.5 bg-white border border-gray-200 hover:border-accent hover:shadow-sm rounded-lg text-left transition-smooth cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900 group-hover:text-primary">Croma Megastore</span>
              <span className="text-xs font-bold text-amber-700">₹8,499</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Electronics &middot; Triggers <span className="font-semibold text-amber-700">Unusual Expense</span> alert
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('/sample-receipts/amazon_gst_2499.svg')}
            className="p-2.5 bg-white border border-gray-200 hover:border-accent hover:shadow-sm rounded-lg text-left transition-smooth cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900 group-hover:text-primary">Amazon India</span>
              <span className="text-xs font-bold text-primary">₹2,499</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Electronics &middot; Normal range with 18% IGST
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

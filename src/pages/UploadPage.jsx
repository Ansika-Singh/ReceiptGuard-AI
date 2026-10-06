import { useState } from 'react';
import UploadZone from '../components/UploadZone.jsx';
import { extractReceiptUnified } from '../lib/aiExtractor.js';
import {
  getAiProvider,
  setAiProvider,
  getCustomApiKey,
  setCustomApiKey,
  getGroqApiKey,
  setGroqApiKey,
} from '../lib/storage.js';

/**
 * UploadPage component
 * Handles receipt capture, image preprocessing, and multi-provider AI extraction:
 * - Local In-Browser Engine (Zero-Key, 100% Offline)
 * - Groq Vision API (Llama-3.2 Vision)
 * - Google Gemini Vision API (Gemini Flash)
 * - Graceful fallback to manual entry mode
 */
export default function UploadPage({ onExtracted, onDirectManualEntry }) {
  const [provider, setProviderState] = useState(getAiProvider());
  const [isReading, setIsReading] = useState(false);
  const [readingStep, setReadingStep] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState(getCustomApiKey());
  const [groqKeyInput, setGroqKeyInput] = useState(getGroqApiKey());
  const [showConfig, setShowConfig] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const handleProviderChange = (newProvider) => {
    setProviderState(newProvider);
    setAiProvider(newProvider);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setCustomApiKey(geminiKeyInput);
    setGroqApiKey(groqKeyInput);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleImageProcessed = async (processed) => {
    setIsReading(true);
    setReadingStep('Pre-processing image and generating 64-bit perceptual hash…');

    setTimeout(async () => {
      const providerLabel =
        provider === 'local'
          ? 'Local In-Browser Engine'
          : provider === 'groq'
          ? 'Groq Llama-3.2 Vision API'
          : 'Google Gemini Vision API';

      setReadingStep(`Extracting receipt details with ${providerLabel}…`);

      try {
        const extracted = await extractReceiptUnified(processed, {
          provider,
          file: processed.file,
        });

        setIsReading(false);

        // Hand over to review screen with extracted data
        onExtracted({
          ...extracted,
          thumbnail: processed.thumbnail,
          fullImage: processed.dataUrl,
          imageHash: processed.imageHash,
          dimensions: processed.dimensions,
          sourceMode: 'ai_extracted',
          activeEngine: provider,
        });
      } catch (err) {
        console.warn(`Extraction with ${provider} encountered issue:`, err.message);

        // If cloud provider failed, attempt automatic local engine fallback first!
        if (provider !== 'local') {
          try {
            setReadingStep('Cloud API returned error, applying Local In-Browser Engine fallback…');
            const fallbackExtracted = await extractReceiptUnified(processed, { provider: 'local' });
            setIsReading(false);
            onExtracted({
              ...fallbackExtracted,
              thumbnail: processed.thumbnail,
              fullImage: processed.dataUrl,
              imageHash: processed.imageHash,
              dimensions: processed.dimensions,
              sourceMode: 'ai_extracted',
              activeEngine: 'local_fallback',
            });
            return;
          } catch (innerErr) {
            console.error('Local fallback failed:', innerErr);
          }
        }

        setIsReading(false);

        // Fallback banner info
        let fallbackReason = 'Extraction encountered an error or network was offline.';
        if (err.message.includes('MISSING')) {
          fallbackReason = 'API key was not supplied. Switched to manual entry mode.';
        } else {
          fallbackReason = err.message;
        }

        // Automatic fallback to review screen in manual entry mode with image preserved
        onExtracted({
          merchant: '',
          date: new Date().toISOString().split('T')[0],
          total: 0,
          currency: 'INR',
          tax: { total: 0, breakdown: [] },
          items: [],
          suggestedCategory: 'Other',
          thumbnail: processed.thumbnail,
          fullImage: processed.dataUrl,
          imageHash: processed.imageHash,
          dimensions: processed.dimensions,
          sourceMode: 'manual_fallback',
          fallbackReason,
        });
      }
    }, 350);
  };

  const handleStartManualBlank = () => {
    onExtracted({
      merchant: '',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      currency: 'INR',
      tax: { total: 0, breakdown: [] },
      items: [],
      suggestedCategory: 'Food',
      thumbnail: null,
      fullImage: null,
      imageHash: null,
      sourceMode: 'manual_direct',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Add Expense Receipt
            </h2>
            {/* Active AI Engine Badge */}
            <span
              className={`badge text-[11px] font-semibold cursor-pointer ${
                provider === 'local'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : provider === 'groq'
                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
              onClick={() => setShowConfig(true)}
              title="Click to change AI engine or API key"
            >
              {provider === 'local' && '⚡ Local Offline Engine'}
              {provider === 'groq' && '🚀 Groq Vision API'}
              {provider === 'gemini' && '🔮 Gemini Vision API'}
            </span>
          </div>
          <p className="text-sm text-muted mt-0.5">
            Capture or drop your receipt snapshot. Our AI extracts structured details automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Entry Button */}
          <button
            type="button"
            onClick={handleStartManualBlank}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-smooth cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Manual Entry
          </button>

          {/* AI Settings / Model Switcher Button */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 bg-primary-50 text-primary hover:bg-primary-100 text-xs font-semibold rounded-lg transition-smooth cursor-pointer flex items-center gap-1.5"
            title="Configure AI extraction engine (Local / Groq / Gemini)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            AI Engine
          </button>
        </div>
      </div>

      {/* AI Provider Config Accordion */}
      {showConfig && (
        <div className="card p-5 border border-primary-mid/30 bg-primary-50/20 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Choose AI Extraction Engine</h3>
              <p className="text-xs text-muted">Select how receipt data is extracted</p>
            </div>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              &times; Close
            </button>
          </div>

          {/* Engine Selector Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Local Engine */}
            <div
              onClick={() => handleProviderChange('local')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-smooth ${
                provider === 'local'
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  ⚡ Local Built-in
                </span>
                {provider === 'local' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-emerald-800 font-medium">100% Offline &amp; Free</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Runs directly in the browser. Zero API key, zero latency, guaranteed to work.
              </p>
            </div>

            {/* 2. Groq Vision */}
            <div
              onClick={() => handleProviderChange('groq')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-smooth ${
                provider === 'groq'
                  ? 'bg-orange-50/80 border-orange-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  🚀 Groq Vision
                </span>
                {provider === 'groq' && (
                  <span className="w-2 h-2 rounded-full bg-orange-600" />
                )}
              </div>
              <p className="text-[11px] text-orange-800 font-medium">Llama-3.2 Vision</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Ultra-fast (~300ms) OCR. Free keys from console.groq.com.
              </p>
            </div>

            {/* 3. Gemini Vision */}
            <div
              onClick={() => handleProviderChange('gemini')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-smooth ${
                provider === 'gemini'
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  🔮 Gemini Vision
                </span>
                {provider === 'gemini' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-[11px] text-blue-800 font-medium">gemini-1.5-flash</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Google AI Studio API key via .env or input below.
              </p>
            </div>
          </div>

          {/* Optional API Key Inputs */}
          {provider !== 'local' && (
            <form onSubmit={handleSaveSettings} className="space-y-3 pt-2 border-t border-gray-200">
              {provider === 'groq' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Groq API Key (gsk_...)
                  </label>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={groqKeyInput}
                    onChange={(e) => setGroqKeyInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-50"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Get a free instant key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary underline">console.groq.com</a> or set <code>VITE_GROQ_API_KEY</code>.
                  </p>
                </div>
              )}

              {provider === 'gemini' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Gemini API Key (AIzaSy...)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-50"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    From Google AI Studio or set <code>VITE_GEMINI_API_KEY</code>.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-mid transition-smooth cursor-pointer"
                >
                  Save API Key
                </button>
                {savedNotification && (
                  <span className="text-xs text-emerald-700 font-semibold">Saved successfully!</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Loading State Overlay */}
      {isReading ? (
        <div className="card p-12 text-center border border-primary/20 bg-white/90 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h5" />
              <path d="M17 12h5" />
              <path d="M12 2v5" />
              <path d="M12 17v5" />
              <path d="M4.93 4.93l3.54 3.54" />
              <path d="M15.54 15.54l3.54 3.54" />
              <path d="M4.93 19.07l3.54-3.54" />
              <path d="M15.54 8.46l3.54-3.54" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Reading receipt...</h3>
          <p className="text-sm text-primary font-medium mb-6">{readingStep}</p>

          {/* Skeleton placeholders */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-4 skeleton rounded-full w-3/4 mx-auto" />
            <div className="h-4 skeleton rounded-full w-1/2 mx-auto" />
            <div className="h-4 skeleton rounded-full w-2/3 mx-auto" />
          </div>
        </div>
      ) : (
        /* Upload Area */
        <UploadZone onImageProcessed={handleImageProcessed} isProcessing={isReading} />
      )}
    </div>
  );
}

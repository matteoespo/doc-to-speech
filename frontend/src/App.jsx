import { useState, useRef } from 'react';

const EXTRACT_URL = 'http://localhost:8000/api/extract-text';
const GENERATE_URL = 'http://localhost:8000/api/generate-audio';

const VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Warm, Narration)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm, Professional)' },
  { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew (News, Authoritative)' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde (Conversational, Friendly)' }
];

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [audioUrl, setAudioUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (droppedFile) => {
    const ext = droppedFile.name.split('.').pop().toLowerCase();
    if (ext === 'pdf' || ext === 'txt') {
      setFile(droppedFile);
      setExtractedText('');
      setAudioUrl(null);
      handleExtract(droppedFile);
    } else {
      setError('Please upload a .pdf or .txt file.');
    }
  };

  const handleExtract = async (targetFile) => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const response = await fetch(EXTRACT_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setExtractedText(data.text);
    } catch (err) {
      setError(err.message || 'Failed to extract text.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!extractedText.trim()) {
      setError('Text is empty.');
      return;
    }

    setLoading(true);
    setError('');
    setAudioUrl(null);

    try {
      const response = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          voice_id: selectedVoice
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${response.status}`);
      }

      // Stream the audio blob directly for immediate playback support
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during audio generation.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
              Document Audio Reader
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Upload a PDF or text file, edit the extracted text, select a voice, and listen!
          </p>
        </header>

        {/* Main Card */}
        <main className="w-full max-w-2xl">
          <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/20 p-8 transition-all duration-500">
            
            {/* Step 1: Upload */}
            {!extractedText && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-10 text-center group ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                    : 'border-white/10 hover:border-indigo-400/40 hover:bg-white/[0.02]'
                } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                     <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                     <p className="text-slate-300 font-medium">Extracting text from document...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.04] group-hover:bg-indigo-500/10 transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium">Drop your document here</p>
                      <p className="text-slate-500 text-sm mt-1">or click to browse &middot; PDF and TXT supported</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Edit Text & Select Voice */}
            {extractedText && (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                
                {/* File Info */}
                <div className="flex items-center justify-between bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file?.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file?.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setExtractedText(''); setFile(null); setAudioUrl(null); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Change File
                  </button>
                </div>

                {/* Text Editor */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Review & Edit Text (Max 2000 chars)</label>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-right">
                    {extractedText.length} / 2000 characters
                  </p>
                </div>

                {/* Voice Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select AI Voice</label>
                  <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    {VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  onClick={handleGenerateAudio}
                  disabled={loading || !extractedText.trim()}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold text-sm transition-all duration-300 ${
                    loading
                      ? 'bg-indigo-600/50 cursor-wait'
                      : extractedText
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/[0.06] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="animate-pulse">Generating Audio...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Generate High-Quality Audio
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm animate-[fadeIn_0.3s_ease-out]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Step 3: Audio Player */}
            {audioUrl && (
              <div className="mt-8 pt-6 border-t border-white/[0.05] animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-400">Audio ready to play</span>
                  </div>
                  <a href={audioUrl} download="elevenlabs_document.mp3" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download MP3
                  </a>
                </div>
                <audio controls autoPlay src={audioUrl} className="w-full rounded-lg shadow-lg shadow-black/40" id="audio-player" />
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs mt-8">
            Powered by ElevenLabs API &middot; Supports PDF and TXT files up to 2,000 characters
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;

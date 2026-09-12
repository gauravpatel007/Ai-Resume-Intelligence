import React, { useState } from 'react';

import api from '../api/axios';

const formatLine = (text) => {
  if (typeof text !== 'string') return text;
  // 1. Strip leading bullet points or hyphens so we don't get double bullets
  let cleanText = text.replace(/^[\s•\-\*]+/, '');
  
  // 2. Bold dates and years (e.g., "09 Jul 2007 – 04 Aug 2026" or "2013")
  const dateRegex = /(\b(?:(?:\d{1,2}\s+[A-Za-z]{3,}\s+)?(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:Present|Current)|\b(?:\d{1,2}\s+[A-Za-z]{3,}\s+)?(?:19|20)\d{2}\b))?))\b/gi;
  
  const parts = cleanText.split(dateRegex);
  if (parts.length === 1) return cleanText;
  
  return parts.map((part, index) => {
    // Capturing group matches are at odd indices
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-slate-800">{part}</strong>;
    }
    return part;
  });
};

const UploadResume = ({ setCurrentView }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [preview, setPreview] = useState('');
  const [resumeSections, setResumeSections] = useState({ education: [], experience: [], skills: [], abilities: [] });
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setSuccess('');
    setParsedData(null);
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload/resume', formData);
      setParsedData(res.data.parsed_data);
      setPreview(res.data.extracted_preview);
      if (res.data.parsed_data?.sections) {
        setResumeSections(res.data.parsed_data.sections);
      }
      setSuccess(res.data.message);
      setFile(null); // Clear file input
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="glass-panel p-8 md:p-12 mb-8 bg-white border border-slate-200">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Upload Your Resume</h1>
        <p className="text-slate-500 font-medium mb-8">Upload your PDF resume so our NLP AI can automatically extract your profile information.</p>

        {error && <div className="mb-6 text-red-600 bg-red-50/80 backdrop-blur p-4 rounded-xl border border-red-100 font-semibold">{error}</div>}
        {success && <div className="mb-6 text-green-700 bg-green-50/80 backdrop-blur p-4 rounded-xl border border-green-200 font-semibold">{success}</div>}

        {!parsedData && !uploading && (
          <div
            className={`upload-zone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className={`w-16 h-16 transition-colors duration-300 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-lg font-bold text-slate-700">
                {isDragging ? 'Drop it here!' : 'Drag and drop your PDF here'}
              </p>
              <p className="text-sm text-slate-500 font-medium">or</p>
              <label className="btn-outline cursor-pointer">
                <span>Browse Files</span>
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileSelect} />
              </label>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-indigo-600 font-bold animate-pulse">Uploading & NLP Analyzing...</p>
          </div>
        )}

        {file && !parsedData && !uploading && (
          <div className="mt-6 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center space-x-3 text-indigo-800">
              <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
              <span className="font-semibold">{file.name}</span>
              <span className="text-sm text-indigo-400 font-medium">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
            <button onClick={handleUpload} className="btn-primary">
              Run Extraction
            </button>
          </div>
        )}

        {/* NLP Results */}
        {parsedData && (
          <div className="mt-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                NLP Extracted Data
              </h2>
              <button onClick={() => { setFile(null); setParsedData(null); setSuccess(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">
                Upload Another
              </button>
            </div>

            <div className="glass-card p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Predicted Job Role</p>
                  <p className="text-xl font-black text-indigo-600">{parsedData.predicted_role || 'No Prediction Available'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Possible Names</p>
                  <p className="font-bold text-slate-700">{parsedData.entities?.name_guesses?.join(', ') || 'Not found'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Email</p>
                  <p className="font-bold text-slate-700">{parsedData.contact?.email || 'Not found'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Phone</p>
                  <p className="font-bold text-slate-700">{parsedData.contact?.phone || 'Not found'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">Matched Database Skills</p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.matched_skills && parsedData.matched_skills.length > 0 ? (
                    parsedData.matched_skills.map((skill, index) => (
                      <span key={index} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic font-medium">No standard skills matched in database.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Sections Block */}
            <div className="mb-8 border-t border-slate-100 pt-8">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Detailed Sections
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Experience</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {resumeSections.experience.length > 0 ? (
                      resumeSections.experience.slice(0, 15).map((line, i) => <li key={i} className="line-clamp-2 pb-1 border-b border-slate-50 last:border-0">• {formatLine(line)}</li>)
                    ) : (
                      <li className="italic text-slate-400">Could not extract structured experience.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Education</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {resumeSections.education.length > 0 ? (
                      resumeSections.education.slice(0, 15).map((line, i) => <li key={i} className="line-clamp-2 pb-1 border-b border-slate-50 last:border-0">• {formatLine(line)}</li>)
                    ) : (
                      <li className="italic text-slate-400">Could not extract structured education.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Profile & Abilities</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {resumeSections.abilities.length > 0 ? (
                      resumeSections.abilities.map((line, i) => <li key={i} className="pb-1 border-b border-slate-50 last:border-0">• {formatLine(line)}</li>)
                    ) : (
                      <li className="italic text-slate-400">No profile summary found.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extracted Skills Text</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {resumeSections.skills.length > 0 ? (
                      resumeSections.skills.slice(0, 15).map((line, i) => <li key={i} className="pb-1 border-b border-slate-50 last:border-0">• {formatLine(line)}</li>)
                    ) : (
                      <li className="italic text-slate-400">Could not extract raw skills section.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 ml-1">Profile Summary</p>
              <div className="bg-slate-800 text-slate-300 p-6 rounded-xl overflow-y-auto max-h-64 text-sm font-mono shadow-inner border border-slate-700 whitespace-pre-wrap">
                {preview}
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentView && setCurrentView('overview')}
                className="btn-outline"
              >
                Return to Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadResume;

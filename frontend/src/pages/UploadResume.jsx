import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Upload, Sparkles, Briefcase, GraduationCap, Mail, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/StatCard';

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
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [preview, setPreview] = useState('');
  const [resumeSections, setResumeSections] = useState({ education: [], experience: [], skills: [], abilities: [] });
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchLatestResume = async () => {
      try {
        const res = await api.get('/upload/resume/latest');
        if (res.data.has_resume) {
          setParsedData(res.data.parsed_data);
          setPreview(res.data.extracted_preview);
          if (res.data.parsed_data?.sections) {
            setResumeSections(res.data.parsed_data.sections);
          }
          setFile({ name: res.data.filename || 'Resume.pdf', size: 0, isExisting: true });
        }
      } catch (err) {
        console.error("Failed to fetch latest resume", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchLatestResume();
  }, []);

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to remove your uploaded resume? Your profile data in My Profile will remain intact.")) return;
    setUploading(true);
    try {
      await api.delete('/upload/resume');
      setFile(null);
      setParsedData(null);
      setPreview('');
      setResumeSections({ education: [], experience: [], skills: [], abilities: [] });
      setSuccess("Resume removed successfully. Your profile data in My Profile remains intact.");
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete resume.');
    } finally {
      setUploading(false);
    }
  };

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
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
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
      <div className="glass-panel p-8 md:p-12 mb-8 bg-white border border-slate-200 rounded-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Upload Resume</h1>
        <p className="text-slate-500 font-medium mb-8">Drop your PDF and let AI parse skills, experience, education, and contact info.</p>

        {error && <div className="mb-6 text-red-600 bg-red-50/80 backdrop-blur p-4 rounded-xl border border-red-100 font-semibold">{error}</div>}
        {success && <div className="mb-6 text-green-700 bg-green-50/80 backdrop-blur p-4 rounded-xl border border-green-200 font-semibold">{success}</div>}

        {loadingInitial && (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loadingInitial && !parsedData && !uploading && (
          <div className="space-y-12">
            {/* DROPZONE */}
            <div
              className={`border-2 border-dashed rounded-3xl p-16 transition-colors duration-300 ${isDragging ? 'bg-blue-100 border-blue-400' : 'bg-blue-50/40 border-blue-200'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-[1rem] flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                  <CloudUpload className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isDragging ? 'Drop it here!' : 'Drag and drop your resume here'}
                </h3>
                <p className="text-slate-500 font-medium mb-6">PDF files only, up to 10MB</p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl cursor-pointer transition-colors shadow-md shadow-blue-500/20 flex items-center gap-2">
                  <span>Browse Files</span>
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="application/pdf" onChange={handleFileSelect} />
                </label>
              </div>
            </div>

            {/* WHAT GETS EXTRACTED */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6">What gets extracted</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  value="Skills"
                  valueClassName="text-xl sm:text-2xl"
                  subtitle="Separates technical abilities from soft skills."
                  icon={Sparkles}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  value="Experience"
                  valueClassName="text-xl sm:text-2xl"
                  subtitle="Job titles, companies and responsibilities."
                  icon={Briefcase}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  value="Education"
                  valueClassName="text-xl sm:text-2xl"
                  subtitle="Degrees, institutions, and graduation years."
                  icon={GraduationCap}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  value="Contact Info"
                  valueClassName="text-xl sm:text-2xl"
                  subtitle="Emails, phone numbers, LinkedIn and GitHub links."
                  icon={Mail}
                  colorClass="bg-blue-600 text-blue-600"
                />
              </div>
            </div>

            {/* PROCESSING STATUS */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6">Processing status</h3>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">Uploading file</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loadingInitial && uploading && (
          <div className="mt-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-blue-600 font-bold animate-pulse">Uploading & NLP Analyzing...</p>
          </div>
        )}

        {!loadingInitial && file && !parsedData && !uploading && (
          <div className="mt-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center space-x-3 text-blue-900">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
              <span className="font-semibold">{file.name}</span>
              <span className="text-sm text-blue-500 font-medium">
                {file.size > 0 ? `(${(file.size / (1024 * 1024)).toFixed(2)} MB)` : ''}
              </span>
            </div>
            <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 rounded-lg px-6 py-2.5">
              Run Extraction
            </button>
          </div>
        )}

        {/* NLP Results */}
        {!loadingInitial && parsedData && (
          <div className="mt-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                NLP Extracted Data
              </h2>
              <div className="flex gap-4">
                <button onClick={() => { setFile(null); setParsedData(null); setSuccess(''); }} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                  Upload Another
                </button>
                <button onClick={handleDeleteResume} className="text-sm font-bold text-red-600 hover:text-red-800 transition">
                  Remove Resume
                </button>
              </div>
            </div>

            <div className="glass-card p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Predicted Job Role</p>
                  <p className="text-xl font-black text-blue-600">{parsedData.predicted_role || 'No Prediction Available'}</p>
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
                onClick={() => {
                  if (setCurrentView) {
                    setCurrentView('dashboard');
                  } else {
                    navigate('/candidate/dashboard');
                  }
                }}
                className="btn-outline inline-flex items-center gap-2 hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadResume;

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UploadResume from './UploadResume';
import ExtractedProfile from './ExtractedProfile';
import SkillGapReport from './SkillGapReport';
import CandidateInterview from './CandidateInterview';

const CandidateDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                AI
              </div>
              <div className="font-extrabold text-xl tracking-tight text-slate-800">
                Resume<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Intel</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-2">Candidate Portal</p>
          </div>

          <nav className="px-4 mt-4 space-y-1">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('upload')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'upload' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Upload Resume
            </button>
            <button 
              onClick={() => setCurrentView('profile')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              My Profile
            </button>
            <button 
              onClick={() => setCurrentView('skill_gaps')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'skill_gaps' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Skill Gaps
            </button>
            <button 
              onClick={() => setCurrentView('interview')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'interview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Interview
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2 truncate">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
              {user?.email?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Candidate</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Welcome back, {user?.email}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setCurrentView('upload')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Resume</h3>
                  <p className="text-slate-500 text-sm mb-4">Upload a new PDF resume. Our AI will automatically extract your skills, abilities, and work experience.</p>
                  <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Go to Upload &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => setCurrentView('skill_gaps')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Analyze Skill Gaps</h3>
                  <p className="text-slate-500 text-sm mb-4">Select a target job role and see exactly what skills you're missing, along with practice tasks to learn them.</p>
                  <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Analyze Gaps &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => setCurrentView('interview')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-200 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">AI Interview</h3>
                  <p className="text-slate-500 text-sm mb-4">Practice your interview skills with AI-generated questions tailored to your profile and target job role.</p>
                  <span className="text-purple-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start Interview &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'upload' && (
          <div className="flex-1 overflow-y-auto">
            <UploadResume setCurrentView={setCurrentView} />
          </div>
        )}

        {currentView === 'profile' && (
          <div className="flex-1 overflow-y-auto">
            <ExtractedProfile setCurrentView={setCurrentView} />
          </div>
        )}

        {currentView === 'skill_gaps' && (
          <div className="flex-1 overflow-y-auto">
            <SkillGapReport setCurrentView={setCurrentView} />
          </div>
        )}

        {currentView === 'interview' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <CandidateInterview />
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;

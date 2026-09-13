import React, { useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import UploadResume from './UploadResume';
import ExtractedProfile from './ExtractedProfile';
import SkillGapReport from './SkillGapReport';
import CandidateInterview from './CandidateInterview';
import StatCard from '../components/StatCard';
import { FileText, Activity, Users, CheckCircle, LogOut } from 'lucide-react';

const CandidateDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('dashboard');
  const [candidateName, setCandidateName] = useState(user?.name || '');
  const [stats, setStats] = useState({
    resumesAnalyzed: 0,
    skillScore: 0,
    interviews: 0,
    profileScore: 0
  });

  // Fetch candidate profile on load to get the full name
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      try {
        const response = await api.get('/candidate/me');
        if (response.data?.name) {
          setCandidateName(response.data.name);
        }
      } catch (error) {
        console.error('Failed to fetch candidate profile', error);
      }
    };
    fetchCandidateProfile();
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard') {
      const fetchStats = async () => {
        try {
          const response = await api.get('/candidate/dashboard/stats');
          if (response.data?.candidate_name) {
            setCandidateName(response.data.candidate_name);
          }
          setStats({
            resumesAnalyzed: response.data.resumes_analyzed || 0,
            skillScore: response.data.skill_score || 0,
            interviews: response.data.interviews || 0,
            profileScore: response.data.profile_score || 0
          });
        } catch (error) {
          console.error('Failed to fetch stats', error);
        }
      };
      fetchStats();
    }
  }, [currentView]);

  // Extract first name or first word of candidate's full name
  const getCandidateFirstName = () => {
    const fullName = candidateName || user?.name;
    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      const firstWord = fullName.trim().split(/\s+/)[0];
      if (firstWord) return firstWord;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Candidate';
  };

  const getCandidateInitial = () => {
    const firstName = getCandidateFirstName();
    return firstName.charAt(0).toUpperCase() || 'C';
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo Section */}
          <div className="p-6">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setCurrentView('dashboard')}
              title="Go to Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
                AI
              </div>
              <div className="font-extrabold text-xl tracking-tight text-slate-800">
                Resume<span className="text-blue-600">Intel</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 mt-2 space-y-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${currentView === 'upload' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"></path></svg>
              Upload Resume
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${currentView === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              My Profile
            </button>
            <button
              onClick={() => setCurrentView('skill_gaps')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${currentView === 'skill_gaps' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Skill Gaps
            </button>
            <button
              onClick={() => setCurrentView('interview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${currentView === 'interview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              Interview
            </button>
          </nav>
        </div>

        {/* Bottom User & Logout Section */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* User Profile Card */}
          <button
            type="button"
            onClick={() => setCurrentView('profile')}
            title="Open My Profile"
            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer group ${
              currentView === 'profile'
                ? 'bg-blue-50/80 border-blue-200 ring-1 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20 ring-2 ring-white group-hover:scale-105 transition-transform">
                  {getCandidateInitial()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={candidateName || user?.email}>
                    {getCandidateFirstName()}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                    Candidate
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate" title={user?.email}>
                  {user?.email}
                </p>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 py-2.5 px-3 rounded-xl transition-all group"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
        {currentView === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-8 md:p-12">
            <div className="max-w-6xl mx-auto">

              {/* Header Section */}
              <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome back{getCandidateFirstName() !== 'Candidate' ? `, ${getCandidateFirstName()}` : ''}
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm">
                    {user?.email} · Profile {stats.profileScore}% complete
                  </p>
                </div>
                <div className="bg-[#ecfdf3] text-[#027a48] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#abefc6]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-xs font-bold">Resume synced</span>
                </div>
              </div>

              {/* Top Stats Grid (4 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                  title="Resumes Analyzed"
                  value={stats.resumesAnalyzed.toString()}
                  subtitle="Total parsed"
                  icon={FileText}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  title="Skill Score"
                  value={`${stats.skillScore}%`}
                  subtitle="Average match"
                  icon={Activity}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  title="Interviews"
                  value={stats.interviews.toString()}
                  subtitle="Mock sessions"
                  icon={Users}
                  colorClass="bg-blue-600 text-blue-600"
                />
                <StatCard
                  title="Profile Score"
                  value={`${stats.profileScore}%`}
                  subtitle="Ready for apply"
                  icon={CheckCircle}
                  colorClass="bg-blue-600 text-blue-600"
                />
              </div>

              {/* Quick Actions Title */}
              <h3 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h3>

              {/* Quick Actions Grid (3 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Quick Action 1: Upload Resume */}
                <div
                  onClick={() => setCurrentView('upload')}
                  className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex flex-col h-full group"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-blue-600 flex items-center justify-center mb-6 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Upload Resume</h4>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">
                    Parse your resume with AI and extract structured data instantly.
                  </p>
                  <div className="text-blue-600 font-bold text-sm flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    Get started <span className="text-lg leading-none">&rarr;</span>
                  </div>
                </div>

                {/* Quick Action 2: Skill Gaps */}
                <div
                  onClick={() => setCurrentView('skill_gaps')}
                  className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex flex-col h-full group"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-blue-600 flex items-center justify-center mb-6 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Analyze Skill Gaps</h4>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">
                    Compare your profile against a target role and find what's missing.
                  </p>
                  <div className="text-blue-600 font-bold text-sm flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    Get started <span className="text-lg leading-none">&rarr;</span>
                  </div>
                </div>

                {/* Quick Action 3: AI Interview */}
                <div
                  onClick={() => setCurrentView('interview')}
                  className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex flex-col h-full group"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-blue-600 flex items-center justify-center mb-6 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Start AI Interview</h4>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">
                    Practice with mock questions tailored to your resume and role.
                  </p>
                  <div className="text-blue-600 font-bold text-sm flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    Get started <span className="text-lg leading-none">&rarr;</span>
                  </div>
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
            <ExtractedProfile 
              setCurrentView={setCurrentView} 
              onProfileUpdate={(updatedName) => {
                if (updatedName) setCandidateName(updatedName);
              }}
            />
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

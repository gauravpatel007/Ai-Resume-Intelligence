import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { IT_ROLES_CATALOG } from '../data/rolesCatalog';

const SkillGapReport = ({ setCurrentView }) => {
  const [rolesCatalog, setRolesCatalog] = useState(IT_ROLES_CATALOG);
  const [selectedRole, setSelectedRole] = useState(IT_ROLES_CATALOG[0]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customRoleData, setCustomRoleData] = useState({
    name: "",
    req_skills: "",
    pref_skills: "",
    min_exp: 0
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [hasNoSkills, setHasNoSkills] = useState(false);
  
  // Fetch candidate profile & update catalog if backend has newer roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setError('');

        const profileRes = await api.get('/candidate/me').catch(e => {
          if (e.response?.status === 404) return { data: { all_skills: [] } };
          throw e;
        });
        
        const allSkills = profileRes.data?.all_skills || [];
        if (allSkills.length === 0) {
          setHasNoSkills(true);
        } else {
          setHasNoSkills(false);
          const targetRoleName = profileRes.data?.target_role;
          if (targetRoleName) {
            const match = rolesCatalog.find(r => r.name.toLowerCase() === targetRoleName.toLowerCase());
            if (match) setSelectedRole(match);
          }
        }

        // Try updating catalog from backend in background
        try {
          const catalogRes = await api.get('/candidate/roles/catalog');
          if (catalogRes.data?.roles && Array.isArray(catalogRes.data.roles) && catalogRes.data.roles.length > 0) {
            setRolesCatalog(catalogRes.data.roles);
          }
        } catch (catErr) {
          // Fallback to static catalog already in state
        }

      } catch (err) {
        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          // Still allow catalog browsing
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  const domains = useMemo(() => {
    const d = new Set((rolesCatalog || []).map(r => r.domain));
    return ["All", ...Array.from(d).filter(Boolean).sort()];
  }, [rolesCatalog]);

  const filteredRoles = useMemo(() => {
    return (rolesCatalog || []).filter(r => {
      const matchesSearch = (r.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "All" || r.domain === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [rolesCatalog, searchQuery, activeTab]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    
    let payload;
    if (isCustomMode) {
      const reqList = customRoleData.req_skills.split(',').map(s => s.trim()).filter(Boolean);
      const prefList = customRoleData.pref_skills.split(',').map(s => s.trim()).filter(Boolean);
      if (!customRoleData.name.trim()) {
        setError("Please enter a role name.");
        setLoading(false);
        return;
      }
      if (reqList.length === 0) {
        setError("Please add at least one required skill for the custom role.");
        setLoading(false);
        return;
      }
      payload = {
        target_role: customRoleData.name.trim(),
        req_skills: reqList,
        pref_skills: prefList,
        min_exp: Number(customRoleData.min_exp) || 0,
        req_degree: "Any"
      };
    } else {
      if (!selectedRole) {
        setError("Please select a target role from the list.");
        setLoading(false);
        return;
      }
      payload = {
        target_role: selectedRole.name,
        req_skills: selectedRole.req_skills || [],
        pref_skills: selectedRole.pref_skills || [],
        min_exp: selectedRole.min_exp || 0,
        req_degree: "Any"
      };
    }

    try {
      const response = await api.post('/candidate/gap-report', payload);
      setReport(response.data);
      // Scroll down to show the report results
      setTimeout(() => {
        document.getElementById('gap-report-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Make sure you are logged in as a candidate.");
      } else if (err.response?.status === 500) {
        setError("Server error during analysis. Please ensure you have uploaded a resume and try again.");
      } else {
        setError(err.response?.data?.detail || `Failed to generate skill gap report. (${err.message})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    let payload;
    let roleName = "Custom_Role";
    if (isCustomMode) {
      payload = {
        target_role: customRoleData.name.trim() || "Custom Role",
        req_skills: customRoleData.req_skills.split(',').map(s => s.trim()).filter(Boolean),
        pref_skills: customRoleData.pref_skills.split(',').map(s => s.trim()).filter(Boolean),
        min_exp: Number(customRoleData.min_exp) || 0,
        req_degree: "Any"
      };
      roleName = payload.target_role;
    } else {
      payload = {
        target_role: selectedRole.name,
        req_skills: selectedRole.req_skills || [],
        pref_skills: selectedRole.pref_skills || [],
        min_exp: selectedRole.min_exp || 0,
        req_degree: "Any"
      };
      roleName = selectedRole.name;
    }

    try {
      const response = await api.post('/export/candidate-gap-report', payload, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Skill_Gap_Report_${roleName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError("Failed to download PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-72">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Skill Gap Intelligence...</p>
      </div>
    );
  }

  if (hasNoSkills) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center py-16 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No skills found in your profile yet</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">Upload a resume or manually add your skills in "My Profile" to run gap analysis against target IT roles.</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setCurrentView('upload')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition">
              Upload Resume
            </button>
            <button onClick={() => setCurrentView('profile')} className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-xl font-bold transition shadow-sm">
              Add Skills Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER PANEL */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Skill Gap & Role Analysis</h1>
            <p className="text-slate-500 mt-1">Explore requirements across 40+ IT industry roles or test a custom job spec.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button 
              onClick={() => setIsCustomMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!isCustomMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Role Catalog (40+ Roles)
            </button>
            <button 
              onClick={() => setIsCustomMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isCustomMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              + Custom Role Spec
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {!isCustomMode ? (
          <div className="space-y-6">
            {/* Search & Domain Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search 40+ IT roles (e.g. Backend, DevOps, Data Scientist, SRE)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {domains.map(domain => (
                  <button 
                    key={domain}
                    onClick={() => setActiveTab(domain)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === domain ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-2">
              {filteredRoles.length > 0 ? filteredRoles.map(role => {
                const isSelected = selectedRole?.name === role.name;
                return (
                  <div 
                    key={role.name} 
                    onClick={() => setSelectedRole(role)}
                    className={`cursor-pointer p-4 rounded-xl border transition text-left ${isSelected ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500 shadow-sm' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {role.domain}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1.5">{role.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">Min. Experience: {role.min_exp || 0} years</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(role.req_skills || []).slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">{s}</span>
                      ))}
                      {(role.req_skills || []).length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[11px] font-medium">+{(role.req_skills || []).length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                  No roles match your search query "{searchQuery}".
                </div>
              )}
            </div>
            
            {/* Generate Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-100 gap-4">
              <div className="text-sm text-slate-500">
                Target Role: <strong className="text-slate-800">{selectedRole?.name || "None"}</strong>
              </div>
              <button 
                onClick={handleGenerateReport} 
                disabled={loading || !selectedRole}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Run Skill Gap Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Custom Role Builder */
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-4 rounded-xl text-sm flex gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <p className="font-semibold">Define Any Job Specification</p>
                <p className="text-xs text-indigo-700 mt-0.5">Enter any custom or niche job role and its skill requirements. The intelligence engine will evaluate your profile against it.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Role Title *</label>
                <input 
                  type="text" 
                  value={customRoleData.name}
                  onChange={(e) => setCustomRoleData({...customRoleData, name: e.target.value})}
                  placeholder="e.g., Staff AI Infrastructure Engineer"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Minimum Experience (Years)</label>
                <input 
                  type="number" 
                  min="0"
                  value={customRoleData.min_exp}
                  onChange={(e) => setCustomRoleData({...customRoleData, min_exp: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Required Skills (Comma separated) *</label>
                <input 
                  type="text"
                  value={customRoleData.req_skills}
                  onChange={(e) => setCustomRoleData({...customRoleData, req_skills: e.target.value})}
                  placeholder="e.g. Python, Kubernetes, Terraform, Rust, CI/CD"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Preferred / Nice-to-have Skills (Comma separated)</label>
                <input 
                  type="text"
                  value={customRoleData.pref_skills}
                  onChange={(e) => setCustomRoleData({...customRoleData, pref_skills: e.target.value})}
                  placeholder="e.g. AWS, PyTorch, Prometheus, ArgoCD"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={handleGenerateReport} 
                disabled={loading || !customRoleData.name.trim() || !customRoleData.req_skills.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing Custom Role...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Evaluate Custom Spec
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GAP REPORT RESULTS */}
      {report && (
        <div id="gap-report-results" className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-fade-in space-y-8">
          {/* TOP REPORT BANNER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-slate-800">
                  {report.target_role}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                  (report.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' : 
                  (report.score || 0) >= 60 ? 'bg-amber-100 text-amber-800' : 
                  'bg-rose-100 text-rose-800'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  {Math.round(report.score || 0)}% Match Score
                </span>
              </div>
              <p className="text-slate-500 text-sm">Personalized readiness evaluation and actionable roadmap.</p>
            </div>

            <button 
              onClick={handleDownloadPdf} 
              disabled={downloading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Download PDF Report
                </>
              )}
            </button>
          </div>
          
          {/* MATCHED VS MISSING SKILLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MATCHED SKILLS */}
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
              <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Present / Matched Skills ({(report.present_skills?.length || report.matched_skills?.length || 0)})
              </h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const displaySkills = (report.present_skills?.length > 0 ? report.present_skills : report.matched_skills) || [];
                  return displaySkills.length > 0 ? (
                    displaySkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-xs">
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm italic">No overlapping required skills found. Add more skills in My Profile or upload a resume.</span>
                  );
                })()}
              </div>
            </div>

            {/* MISSING SKILLS / GAPS */}
            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
              <h3 className="font-bold text-rose-900 mb-3 flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Identified Skill Gaps ({((report.missing_skills) || []).length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {(report.missing_skills && report.missing_skills.length > 0) ? (
                  report.missing_skills.map((item, idx) => {
                    const skillName = typeof item === 'object' ? item.skill : item;
                    return (
                      <span key={idx} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-800 rounded-xl text-xs font-bold shadow-xs">
                        ✕ {skillName}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-emerald-700 font-bold text-sm">🎉 You meet all required skills for this role!</span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONABLE LEARNING ROADMAP */}
          {report.missing_skills && report.missing_skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                Targeted Learning & Project Roadmap
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.missing_skills.map((item, idx) => {
                  const skillName = typeof item === 'object' ? item.skill : item;
                  const advice = typeof item === 'object' ? item.advice : "Build a project demonstrating this skill.";
                  return (
                    <div key={idx} className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <h4 className="font-extrabold text-indigo-950 text-sm">{skillName}</h4>
                        </div>
                        <p className="text-xs text-indigo-900 leading-relaxed">{advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXPLANATIONS / TRANSPARENCY MATRIX */}
          {report.explanations && report.explanations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                Detailed Verification Matrix
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Requirement</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Evidence / Finding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {report.explanations.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">{exp.requirement}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            exp.finding === 'Verified' || exp.finding === 'Meets requirement' || exp.finding === 'Requirement met' ? 'bg-emerald-100 text-emerald-800' :
                            exp.finding === 'Evidence found' || exp.finding === 'Past Experience Match' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {exp.finding}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{exp.evidence || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapReport;

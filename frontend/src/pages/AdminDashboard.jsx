import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import ExploreDashboard from './ExploreDashboard';
import CandidateComparison from './CandidateComparison';


const DEFAULT_COLLECTIONS = [
  { id: '1', name: 'Software Engineer', color: 'indigo', target_job_role: 'Software Engineer', required_skills: 'React, Node.js', min_experience_years: '3', required_degree: 'Bachelor' },
  { id: '2', name: 'Product Designer', color: 'orange', target_job_role: 'Product Designer', required_skills: 'Figma, UI/UX', min_experience_years: '2', required_degree: 'Any' },
  { id: '3', name: 'Data Scientist', color: 'blue', target_job_role: 'Data Scientist', required_skills: 'Python, SQL, Machine Learning', min_experience_years: '4', required_degree: 'Master' },
  { id: '4', name: 'Project Manager', color: 'green', target_job_role: 'Project Manager', required_skills: 'Agile, Scrum', min_experience_years: '5', required_degree: 'Bachelor' },
  { id: '5', name: 'Marketing Specialist', color: 'pink', target_job_role: 'Marketing Specialist', required_skills: 'SEO, Content Marketing', min_experience_years: '2', required_degree: 'Any' }
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState('search'); // 'search' or 'audits'
  const [collections, setCollections] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', target_job_role: '', required_skills: '', min_experience_years: '', required_degree: 'Any', color: 'indigo' });
  const [showKnowledgeHub, setShowKnowledgeHub] = useState(false);
  const [compareList, setCompareList] = useState([]);

  useEffect(() => {
    const savedCollections = localStorage.getItem('adminCollections');
    if (savedCollections) {
      try {
        let parsed = JSON.parse(savedCollections);
        parsed = parsed.map(c => {
          if (c.required_degree === "Bachelor's") c.required_degree = "Bachelor";
          if (c.required_degree === "Master's") c.required_degree = "Master";
          return c;
        });
        setCollections(parsed);
        localStorage.setItem('adminCollections', JSON.stringify(parsed));
      } catch (e) {
        setCollections(DEFAULT_COLLECTIONS);
      }
    } else {
      setCollections(DEFAULT_COLLECTIONS);
      localStorage.setItem('adminCollections', JSON.stringify(DEFAULT_COLLECTIONS));
    }
  }, []);

  const [formData, setFormData] = useState({
    target_job_role: '',
    required_skills: '',
    preferred_skills: '',
    min_experience_years: '',
    required_degree: 'Any'
  });
  
  const [submittedPayload, setSubmittedPayload] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [nameSearchQuery, setNameSearchQuery] = useState('');
  const [nameSearchResults, setNameSearchResults] = useState(null);
  const [trendingRoles, setTrendingRoles] = useState([]);
  const [audits, setAudits] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [candidatesStats, setCandidatesStats] = useState({ saved: 0, searches: 0, trend: [] });

  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('1M');
  const [detailedTrendData, setDetailedTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const fetchDetailedTrend = () => {
    if (showTrendModal) {
      api.get(`/search/stats/trend?period=${trendPeriod}`)
        .then(res => setDetailedTrendData(res.data.trend))
        .catch(err => console.error("Failed to fetch detailed trend", err));
    }
  };

  useEffect(() => {
    if (showTrendModal) {
      setLoadingTrend(true);
      fetchDetailedTrend();
      setLoadingTrend(false);
      
      const interval = setInterval(fetchDetailedTrend, 5000);
      return () => clearInterval(interval);
    }
  }, [showTrendModal, trendPeriod]);

  const fetchDashboardStats = () => {
    if (user?.role === 'admin') {
      api.get('/search/stats/roles')
        .then(res => setTrendingRoles(res.data.roles))
        .catch(err => console.error("Failed to load role stats", err));
        
      api.get('/search/stats/candidates')
        .then(res => setCandidatesStats(res.data))
        .catch(err => console.error("Failed to load candidate stats", err));
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchDashboardStats, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && currentView === 'audits') {
      api.get('/export/history')
        .then(res => setAudits(res.data))
        .catch(err => console.error("Failed to load audits", err));
    }
  }, [user, currentView]);

  useEffect(() => {
    if (user?.role === 'admin' && currentView === 'users') {
      api.get('/candidate/all')
        .then(res => setUsersList(res.data.candidates))
        .catch(err => console.error("Failed to load users", err));
    }
  }, [user, currentView]);

  const effectiveRole = user?.role || localStorage.getItem('role');
  if (effectiveRole !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-2xl text-rose-600 font-bold">Unauthorized. Admin access only.</h2>
        </div>
      </div>
    );
  }

  const handleCollectionClick = (collection) => {
    setFormData({
      target_job_role: collection.target_job_role || '',
      required_skills: collection.required_skills || '',
      preferred_skills: '',
      min_experience_years: collection.min_experience_years || '',
      required_degree: collection.required_degree || 'Any'
    });
    setCurrentView('search');
  };

  const handleRemoveCollection = (e, id) => {
    e.stopPropagation();
    const updatedCollections = collections.filter(c => c.id !== id);
    setCollections(updatedCollections);
    localStorage.setItem('adminCollections', JSON.stringify(updatedCollections));
  };

  const handleSaveCollection = () => {
    if (!newCollection.name) return;
    let updatedCollections;
    if (newCollection.id) {
      updatedCollections = collections.map(c => c.id === newCollection.id ? newCollection : c);
    } else {
      const newColl = { ...newCollection, id: Date.now().toString() };
      updatedCollections = [...collections, newColl];
    }
    setCollections(updatedCollections);
    localStorage.setItem('adminCollections', JSON.stringify(updatedCollections));
    setShowCollectionModal(false);
    setNewCollection({ name: '', target_job_role: '', required_skills: '', min_experience_years: '', required_degree: 'Any', color: 'indigo' });
  };

  const handleEditCollection = (e, collection) => {
    e.stopPropagation();
    setNewCollection(collection);
    setShowCollectionModal(true);
  };

  const handleOpenNewCollectionModal = () => {
    setNewCollection({ name: '', target_job_role: '', required_skills: '', min_experience_years: '', required_degree: 'Any', color: 'indigo' });
    setShowCollectionModal(true);
  };

  const handleNameSearch = async (e) => {
    if (e.key === 'Enter') {
      if (!nameSearchQuery.trim()) return;
      setLoading(true);
      setError('');
      try {
        const payload = {
          target_job_role: 'Any',
          search_name: nameSearchQuery.trim()
        };
        setSubmittedPayload(payload);
        const response = await api.post('/search/candidates', payload);
        setNameSearchResults(response.data);
        setCurrentView('name_search');
      } catch (err) {
        setError('Failed to fetch candidates by name.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };


  const handleNewCollectionChange = (e) => {
    setNewCollection({ ...newCollection, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.target_job_role) {
      setError("Target Job Role is required.");
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const payload = {
      target_job_role: formData.target_job_role,
      required_skills: formData.required_skills ? formData.required_skills.split(',').map(s => s.trim()) : [],
      preferred_skills: formData.preferred_skills ? formData.preferred_skills.split(',').map(s => s.trim()) : [],
      min_experience_years: formData.min_experience_years ? parseInt(formData.min_experience_years) : null,
      required_degree: formData.required_degree
    };

    setSubmittedPayload(payload);

    try {
      const response = await api.post('/search/candidates', payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async (candidateId) => {
    setExporting(candidateId);
    try {
      const payload = submittedPayload || {
        target_job_role: formData.target_job_role,
        required_skills: formData.required_skills ? formData.required_skills.split(',').map(s => s.trim()) : [],
        preferred_skills: formData.preferred_skills ? formData.preferred_skills.split(',').map(s => s.trim()) : [],
        min_experience_years: formData.min_experience_years ? parseInt(formData.min_experience_years) : null,
        required_degree: formData.required_degree
      };

      const response = await api.post(`/export/candidate/${candidateId}/pdf`, payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `candidate_${candidateId}_resume.pdf`);
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const handleToggleCompare = (e, candidate) => {
    e.stopPropagation();
    if (compareList.some(c => c.candidate_id === candidate.candidate_id)) {
      setCompareList(compareList.filter(c => c.candidate_id !== candidate.candidate_id));
    } else {
      if (compareList.length >= 3) {
        alert("You can only compare up to 3 candidates at a time.");
        return;
      }
      setCompareList([...compareList, candidate]);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans relative z-0 overflow-hidden bg-[#f8fafc]">
      {/* GLOBAL NAVBAR INJECTED */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm w-full flex-shrink-0">
        <div className="w-full px-8 h-16 flex justify-between items-center">
          <div className="w-1/4 flex items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                AI
              </div>
              <div className="font-extrabold text-xl tracking-tight text-slate-800">
                Resume<span className="text-blue-600">Intel</span>
              </div>
            </div>
          </div>
          
          {/* SEARCH BOX HERE */}
          <div className="flex-1 max-w-xl flex justify-center relative">
            <div className="relative w-full">
              <svg className="w-4 h-4 absolute left-4 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search candidates by name..."
                value={nameSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setNameSearchQuery(val);
                  if (val.trim() === '' && currentView === 'name_search') {
                    setCurrentView('search');
                  }
                }}
                onKeyDown={handleNameSearch}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-4 items-center w-1/4 justify-end">
            <span className="text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">{user?.email || 'admin@gmail.com'}</span>
            <button onClick={logout} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-all">Logout</button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden w-full">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
        <div>
          {/* AdminPanel text removed */}

          <nav className="px-4 pt-6 space-y-1">
            <button onClick={() => setCurrentView('search')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${currentView === 'search' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              Dashboard
            </button>
            <button onClick={() => setCurrentView('audits')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'audits' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Audits
            </button>
            <button onClick={() => setCurrentView('users')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'users' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Users
            </button>
            <button onClick={() => setCurrentView('explore')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'explore' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Explore
            </button>
            <button 
              onClick={() => setCurrentView('compare')} 
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'compare' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Compare
              </div>
              {compareList.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{compareList.length}/3</span>
              )}
            </button>
          </nav>

          <div className="px-4 mt-8">
            <div className="flex justify-between items-center px-3 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Collections</span>
              <button onClick={handleOpenNewCollectionModal} className="text-slate-400 hover:text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></button>
            </div>

            <div className="space-y-1">
              {collections.map(c => (
                <div key={c.id} className="group flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => handleCollectionClick(c)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded bg-${c.color || 'indigo'}-100 flex items-center justify-center`}><div className={`w-2 h-2 bg-${c.color || 'indigo'}-500 rounded-sm`}></div></div>
                    <span className="text-slate-600 font-medium text-sm truncate max-w-[130px]">{c.name}</span>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditCollection(e, c)} className="text-slate-300 hover:text-blue-500 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={(e) => handleRemoveCollection(e, c.id)} className="text-slate-300 hover:text-red-500 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 relative">
          {showKnowledgeHub && (
            <>
              {/* Click away overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setShowKnowledgeHub(false)}></div>
              <div className="absolute bottom-12 left-4 w-56 bg-slate-800 text-white p-4 rounded-xl shadow-xl z-50 text-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
                <h4 className="font-bold mb-3 text-sm text-slate-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Core Features
              </h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                  <span className="text-slate-300">AI-Powered Parsing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></div>
                  <span className="text-slate-300">Semantic Matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0"></div>
                  <span className="text-slate-300">Automated Scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0"></div>
                  <span className="text-slate-300">One-Click PDF Exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                  <span className="text-slate-300">Interactive Collections</span>
                </li>
              </ul>
              {/* Pointer arrow */}
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
            </div>
            </>
          )}
          <button 
            onClick={() => setShowKnowledgeHub(!showKnowledgeHub)} 
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 px-2 w-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Knowledge Hub
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Old header removed entirely to shift content up */}

        {currentView === 'explore' ? (
          <ExploreDashboard />
        ) : currentView === 'compare' ? (
          <CandidateComparison
            compareList={compareList}
            criteria={submittedPayload}
            onClose={() => setCurrentView('search')}
          />
        ) : currentView === 'audits' ? (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Exported PDFs History</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Date Exported</th>
                    <th className="px-6 py-4">Candidate Name</th>
                    <th className="px-6 py-4">Target Role</th>
                    <th className="px-6 py-4">Exported By</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audits.length > 0 ? audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium">{audit.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{audit.candidateName}</td>
                      <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-semibold text-xs border border-indigo-100">{audit.role || 'Any Role'}</span></td>
                      <td className="px-6 py-4 font-medium">{user?.email}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-400 font-semibold text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{audit.action}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">No export history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : currentView === 'users' ? (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Registered Candidates (Users)</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Gmail Account</th>
                    <th className="px-6 py-4">Latest Upload</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length > 0 ? usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 font-medium">{u.email}</td>
                      <td className="px-6 py-4 font-medium">{u.upload_date || 'No resume uploaded'}</td>
                      <td className="px-6 py-4 text-right">
                        {u.extracted_text && (
                          <button onClick={() => setSelectedUserForDetails(u)} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                            Show More
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">No candidates found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : currentView === 'name_search' ? (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Name Search Results for "{nameSearchQuery}"</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="font-semibold">Searching candidates...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-20 text-rose-500 font-bold">{error}</div>
              ) : nameSearchResults?.results?.length > 0 ? (
                nameSearchResults.results.map((candidate, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-inner">
                          {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                            {candidate.calculated_experience_years || 0} yrs exp
                          </span>
                          <button 
                            onClick={(e) => handleToggleCompare(e, candidate)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                              compareList.some(c => c.candidate_id === candidate.candidate_id)
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {compareList.some(c => c.candidate_id === candidate.candidate_id) ? '✓ Added' : '+ Compare'}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{candidate.name || 'Unknown Candidate'}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-1">{candidate.predicted_job_role || candidate.role || 'Role not specified'}</p>
                    </div>

                    <button onClick={() => setExpandedCandidate(candidate)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors border border-slate-200 mt-4">
                      View Profile
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-500 font-medium">No candidates found matching "{nameSearchQuery}".</div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* SCROLLABLE GRID */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* --- LEFT WIDGETS (Takes up 2 cols) --- */}
                <div className="lg:col-span-2 space-y-6">


                  {/* ROW 2: AI Search Filters (Replaces Schedule) */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-slate-800 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        AI Candidate Search Engine
                      </h3>
                      {error && <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">{error}</span>}
                    </div>

                    <form onSubmit={handleSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Job Role *</label>
                          <input
                            type="text"
                            name="target_job_role"
                            value={formData.target_job_role}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            placeholder="e.g. Data Scientist"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Degree Category</label>
                          <select
                            name="required_degree"
                            value={formData.required_degree}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none"
                          >
                            <option value="Any">Any Degree</option>
                            <option value="Bachelor">Bachelor's Degree</option>
                            <option value="Master">Master's Degree</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Required Skills</label>
                          <input
                            type="text"
                            name="required_skills"
                            value={formData.required_skills}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            placeholder="Python, SQL"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preferred Skills</label>
                          <input
                            type="text"
                            name="preferred_skills"
                            value={formData.preferred_skills}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            placeholder="AWS, Docker"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Experience</label>
                          <input
                            type="number"
                            name="min_experience_years"
                            value={formData.min_experience_years}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            placeholder="Years"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {loading ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : "Generate Matches"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ROW 3: Trending Skills & Line Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Trending Roles */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                      <h3 className="text-slate-800 font-bold mb-5">Trending Roles</h3>
                      <div className="space-y-4">
                        {trendingRoles.length > 0 ? trendingRoles.map((role, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span>{role.name} ({role.count})</span>
                              <span>{role.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-8 flex items-center overflow-hidden">
                              <div className={`${idx === 0 ? 'bg-blue-100' : 'bg-slate-200'} h-full rounded-r-lg`} style={{ width: `${Math.max(5, role.percentage)}%` }}></div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm text-slate-400 font-medium pt-4 text-center">No role data available</div>
                        )}
                      </div>
                    </div>

                    {/* Candidates Line Chart */}
                    <div 
                      className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                      onClick={() => setShowTrendModal(true)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-800 font-bold">Candidates</h3>
                        <span className="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> Expand</span>
                      </div>
                      <div className="flex gap-6 mb-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Saved
                          </div>
                          <div className="text-xl font-black text-slate-800">{candidatesStats.saved}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                            <div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Searches
                          </div>
                          <div className="text-xl font-black text-slate-800">{candidatesStats.searches}</div>
                        </div>
                      </div>
                      <div className="flex-1 -mx-2 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={candidatesStats.trend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="saved" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="searched" stroke="#fb923c" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </div>

                {/* --- RIGHT WIDGETS (Sidebar, Takes 1 col) --- */}
                <div className="space-y-6">

                  {/* Curated Highlight (REAL SEARCH RESULTS) */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full min-h-[500px]">
                    <div className="mb-5">
                      <h3 className="text-slate-800 font-bold">Curated Highlight</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {results ? `Found ${results.total_filtered} candidates matching parameters` : 'Search to generate AI recommendations'}
                      </p>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto">
                      {!results && !loading && (
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                          <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                          <p className="text-sm font-medium text-slate-500">Awaiting Search query...</p>
                        </div>
                      )}

                      {loading && (
                        <div className="flex justify-center items-center h-32">
                          <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                      )}

                      {results?.results.length === 0 && (
                        <div className="text-center text-sm text-slate-500 mt-10">No candidates found.</div>
                      )}

                      {results?.results.map((candidate, index) => {
                        const isCompared = compareList.some(c => c.candidate_id === candidate.candidate_id);
                        return (
                        <div
                          key={candidate.candidate_id}
                          className={`flex flex-col p-3 rounded-xl transition-colors group cursor-pointer border ${
                            isCompared ? 'bg-indigo-50/50 border-indigo-200' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                          }`}
                          onClick={() => setExpandedCandidate(candidate)}
                        >
                          <div className="flex gap-3 items-start">
                            {/* Avatar Mock */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                              {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{candidate.name || 'Unknown'}</h4>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                  {candidate.score_breakdown.total_score}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{candidate.predicted_job_role}</p>

                              <div className="mt-2 flex gap-2 items-center justify-between">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleExportPdf(candidate.candidate_id); }}
                                  disabled={exporting === candidate.candidate_id}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  {exporting === candidate.candidate_id ? 'Exporting...' : '📄 Export PDF'}
                                </button>

                                <button
                                  onClick={(e) => handleToggleCompare(e, candidate)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                                    isCompared ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 opacity-0 group-hover:opacity-100'
                                  }`}
                                >
                                  {isCompared ? '✓ Added' : '+ Compare'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>



                  </div>

                </div>

              </div>
            </div>
          </>
        )}
      </main>

      {/* DETAILED TREND MODAL */}
      {showTrendModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowTrendModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Growth Trends</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Detailed breakdown of candidate saves and searches over time.</p>
              </div>
              <button onClick={() => setShowTrendModal(false)} className="bg-white p-2 border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm font-bold text-slate-700">Saved Candidates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                    <span className="text-sm font-bold text-slate-700">Searches Executed</span>
                  </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60">
                  {['1W', '1M', '2M', '3M', '6M'].map(period => (
                    <button
                      key={period}
                      onClick={() => setTrendPeriod(period)}
                      className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                        trendPeriod === period
                          ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[400px] w-full relative">
                {loadingTrend ? (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-10">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-slate-500 font-bold text-sm">Crunching data...</span>
                  </div>
                ) : null}
                
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailedTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={15}
                      minTickGap={30}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="saved" name="Saved Candidates" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="searched" name="Searches" stroke="#fb923c" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#fb923c', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL (Old Style) */}
      {expandedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setExpandedCandidate(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Score and Basic Info */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start shrink-0 relative">
              <button
                onClick={() => setExpandedCandidate(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-slate-800">{expandedCandidate.name || 'Unknown Candidate'}</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                    ID: {expandedCandidate.candidate_id}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-slate-600 font-medium text-lg">
                  {expandedCandidate.predicted_job_role}
                  {expandedCandidate.is_role_uncertain && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Uncertain</span>
                  )}
                </p>
                {(() => {
                  let alts = [];
                  try {
                    if (expandedCandidate.alternative_roles) {
                      alts = JSON.parse(expandedCandidate.alternative_roles);
                    }
                  } catch(e) {}
                  
                  if (alts.length > 0) {
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Alternative Roles:</span>
                        {alts.map((alt, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium">
                            {alt.role} <span className="opacity-50 ml-1">({alt.score})</span>
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={() => handleExportPdf(expandedCandidate.candidate_id)}
                  disabled={exporting === expandedCandidate.candidate_id}
                  className="mt-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  {exporting === expandedCandidate.candidate_id ? 'Exporting...' : '📄 Export Full PDF Report'}
                </button>
              </div>

              <div className="flex flex-col items-center mr-8">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                    <circle
                      cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - expandedCandidate.score_breakdown.total_score / 100)}`}
                      className={
                        expandedCandidate.score_breakdown.total_score >= 80 ? 'text-emerald-500' :
                          expandedCandidate.score_breakdown.total_score >= 50 ? 'text-amber-500' : 'text-rose-500'
                      }
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-slate-800">{expandedCandidate.score_breakdown.total_score}</span>
                </div>
                <span className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wide">Total Match</span>
              </div>
            </div>

            {/* Body: Skills, Experience, Education */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Skills Section */}
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Matching Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {expandedCandidate.score_breakdown?.matched_required && expandedCandidate.score_breakdown.matched_required.length > 0 ? (
                        expandedCandidate.score_breakdown.matched_required.map((skill, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-semibold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm">No exact matches found.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {expandedCandidate.score_breakdown?.missing_required && expandedCandidate.score_breakdown.missing_required.length > 0 ? (
                        expandedCandidate.score_breakdown.missing_required.map((skill, i) => (
                          <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-sm font-semibold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm">All required skills present!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience & Details Section */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Candidate Profile</h4>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Total Experience</span>
                        <span className="text-slate-800 font-bold text-lg">
                          {expandedCandidate.calculated_experience_years ? `${expandedCandidate.calculated_experience_years} years` : 'Not specified'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Highest Degree</span>
                        <span className="text-slate-800 font-bold">
                          {expandedCandidate.education_level || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <span className="text-slate-500 font-medium">Contact Information</span>
                        {expandedCandidate.email || expandedCandidate.phone ? (
                          <>
                            {expandedCandidate.email && (
                              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-3 py-2 rounded-lg border border-slate-200">
                                ✉️ {expandedCandidate.email}
                              </div>
                            )}
                            {expandedCandidate.phone && (
                              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-3 py-2 rounded-lg border border-slate-200">
                                📱 {expandedCandidate.phone}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No contact info available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Profile Text Section */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Extracted Profile Skills
                </h4>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                  {expandedCandidate.profile_text || "No profile text extracted from the database."}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* COLLECTION MODAL */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCollectionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Create Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Name</label>
                <input type="text" name="name" value={newCollection.name} onChange={handleNewCollectionChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., Frontend Dev" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Job Role</label>
                <input type="text" name="target_job_role" value={newCollection.target_job_role} onChange={handleNewCollectionChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Required Skills</label>
                <input type="text" name="required_skills" value={newCollection.required_skills} onChange={handleNewCollectionChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Comma separated" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Min Exp (Years)</label>
                  <input type="number" name="min_experience_years" value={newCollection.min_experience_years} onChange={handleNewCollectionChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Degree</label>
                  <select name="required_degree" value={newCollection.required_degree} onChange={handleNewCollectionChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="Any">Any</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Color Theme</label>
                <div className="hidden bg-teal-500 bg-teal-100 bg-blue-500 bg-blue-100 bg-customgray-500 bg-customgray-100 bg-orange-500 bg-orange-100 bg-red-500 bg-red-100 bg-purple-500 bg-purple-100 bg-amber-500 bg-amber-100"></div>
                <div className="flex gap-2">
                  {['teal', 'blue', 'customgray', 'orange', 'red', 'purple', 'amber'].map(color => (
                    <button key={color} onClick={() => setNewCollection({ ...newCollection, color })} className={`w-6 h-6 rounded-full bg-${color}-500 flex items-center justify-center transition-transform ${newCollection.color === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}>
                      {newCollection.color === color && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCollectionModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSaveCollection} disabled={!newCollection.name} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">Save Collection</button>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* SHOW MORE MODAL FOR USERS */}
      {selectedUserForDetails && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedUserForDetails(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Extraction Results</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">{selectedUserForDetails.name} • {selectedUserForDetails.email}</p>
              </div>
              <button onClick={() => setSelectedUserForDetails(null)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full p-2 shadow-sm transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white space-y-8">
              {/* Top stats block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <p className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-2">AI Predicted Role</p>
                  <h4 className="text-3xl font-black tracking-tight">{selectedUserForDetails.predicted_job_role || 'Unknown'}</h4>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Contact Info Extracted</p>
                  <p className="text-slate-800 font-semibold mb-1">📞 {selectedUserForDetails.phone || 'No phone found'}</p>
                  <p className="text-slate-800 font-semibold">✉️ {selectedUserForDetails.email || 'No email found'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">Matched Database Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUserForDetails.matched_skills && selectedUserForDetails.matched_skills.length > 0 ? (
                    selectedUserForDetails.matched_skills.map((skill, index) => (
                      <span key={index} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic font-medium">No standard skills matched in database.</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 ml-1">Raw Extracted Text from PDF</p>
                <div className="bg-slate-800 text-slate-300 p-6 rounded-xl overflow-y-auto max-h-80 text-sm font-mono shadow-inner border border-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedUserForDetails.extracted_text}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedUserForDetails(null)} className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING COMPARE TRAY */}
      {compareList.length > 0 && currentView !== 'compare' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 p-3 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">Compare</span>
            <div className="flex gap-2">
              {compareList.map(c => (
                <div key={c.candidate_id} className="relative group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-sm shadow-sm">
                    {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <button 
                    onClick={(e) => handleToggleCompare(e, c)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    {c.name} ({c.score_breakdown?.total_score})
                  </div>
                </div>
              ))}
              {/* Empty slots placeholders */}
              {Array.from({length: 3 - compareList.length}).map((_, i) => (
                <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pr-1 border-l border-slate-100 pl-4">
            <button 
              onClick={() => setCompareList([])}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
            >
              Clear
            </button>
            <button 
              onClick={() => {
                if (compareList.length < 2) {
                  alert("Please add at least 2 candidates to compare.");
                  return;
                }
                setCurrentView('compare');
              }}
              className={`text-white text-sm font-bold py-2 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 ${compareList.length < 2 ? 'bg-slate-400 opacity-80 cursor-not-allowed hover:bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Compare {compareList.length} Candidates
              {compareList.length < 2 && (
                <span className="text-[10px] bg-slate-500/50 px-1.5 py-0.5 rounded font-semibold ml-1">Need 2+</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

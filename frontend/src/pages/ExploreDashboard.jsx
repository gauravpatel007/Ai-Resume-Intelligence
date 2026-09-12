import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Briefcase, Award, Star, Loader2, ChevronDown, Filter } from 'lucide-react';
import api from '../api/axios';
import CandidateModal from './CandidateModal';

const ExploreDashboard = () => {
  const [filters, setFilters] = useState({
    target_job_role: '',
    required_skills: '',
    min_experience_years: '',
    required_degree: 'Any',
    location: ''
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [offset, setOffset] = useState(0);
  const INITIAL_LIMIT = 16;
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  
  // Autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [submittedFilters, setSubmittedFilters] = useState(null);

  useEffect(() => {
    fetchResults(true);
  }, []); // Initial load

  const fetchResults = async (reset = false, customLimit = limit) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      
      let requestPayload;
      if (reset) {
        requestPayload = {
          target_job_role: filters.target_job_role || 'Any',
          required_skills: filters.required_skills ? filters.required_skills.split(',').map(s => s.trim()) : [],
          min_experience_years: filters.min_experience_years ? parseInt(filters.min_experience_years) : null,
          required_degree: filters.required_degree || 'Any',
          location: filters.location || null
        };
        setSubmittedFilters(requestPayload);
      } else {
        requestPayload = submittedFilters || {
          target_job_role: filters.target_job_role || 'Any',
          required_skills: filters.required_skills ? filters.required_skills.split(',').map(s => s.trim()) : [],
          min_experience_years: filters.min_experience_years ? parseInt(filters.min_experience_years) : null,
          required_degree: filters.required_degree || 'Any',
          location: filters.location || null
        };
      }
      
      const payload = {
        ...requestPayload,
        limit: customLimit,
        offset: currentOffset
      };

      const res = await api.post('/search/explore', payload);
      
      if (reset) {
        setResults(res.data.results);
      } else {
        setResults(prev => [...prev, ...res.data.results]);
      }
      
      setTotalCandidates(res.data.total_candidates);
      setTotalFiltered(res.data.total_filtered);
      
      if (reset) {
        setOffset(customLimit);
      } else {
        setOffset(currentOffset + customLimit);
      }
      
    } catch (err) {
      console.error("Failed to fetch explore results", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLocationChange = async (e) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, location: val }));
    
    if (val.length > 0) {
      try {
        const res = await api.get(`/search/explore/locations?q=${val}`);
        setLocationSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const selectLocation = (loc) => {
    setFilters(prev => ({ ...prev, location: loc }));
    setShowSuggestions(false);
  };
  
  const handleSearchClick = () => {
    setLimit(INITIAL_LIMIT);
    fetchResults(true, INITIAL_LIMIT);
  };
  
  const handleLoadMore = () => {
    const remaining = totalFiltered - results.length;
    if (remaining > 0) {
      const nextLimit = Math.min(48, remaining);
      fetchResults(false, nextLimit);
    }
  };
  
  const handleOpenProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCandidate(null), 200); // delay to allow fade out animation
  };

  const handleExportPdf = async (candidateId) => {
    setExportingId(candidateId);
    try {
      const payload = submittedFilters || {
        target_job_role: filters.target_job_role || 'Any',
        required_skills: filters.required_skills ? filters.required_skills.split(',').map(s => s.trim()) : [],
        min_experience_years: filters.min_experience_years ? parseInt(filters.min_experience_years) : null,
        required_degree: filters.required_degree || 'Any',
        location: filters.location || null
      };

      const response = await api.post(`/export/candidate/${candidateId}/pdf`, payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `candidate_${candidateId}_profile.pdf`);
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setExportingId(null);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="bg-white border-b border-slate-200 p-6 z-10 shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Search className="text-indigo-600 w-6 h-6" /> Explore Talent Pool
            </h1>
            <p className="text-slate-500 text-sm mt-1">Discover and filter through {totalCandidates} candidates in the database.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Job Role</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" name="target_job_role" value={filters.target_job_role} onChange={handleFilterChange} placeholder="e.g. Software Engineer" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
            </div>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Skills (comma separated)</label>
            <div className="relative">
              <Star className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" name="required_skills" value={filters.required_skills} onChange={handleFilterChange} placeholder="React, Python..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
            </div>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Min Experience (Yrs)</label>
            <input type="number" name="min_experience_years" value={filters.min_experience_years} onChange={handleFilterChange} placeholder="e.g. 3" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Degree</label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select name="required_degree" value={filters.required_degree} onChange={handleFilterChange} className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none">
                <option value="Any">Any Degree</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="md:col-span-1 relative" ref={suggestionRef}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" name="location" value={filters.location} onChange={handleLocationChange} onFocus={() => filters.location && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="City, State, Country" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" autoComplete="off" />
            </div>
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {locationSuggestions.map((loc, idx) => (
                  <div key={idx} onMouseDown={() => selectLocation(loc)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 transition-colors">
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="md:col-span-1">
            <button onClick={handleSearchClick} disabled={loading} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 text-sm font-semibold text-slate-500 flex justify-between items-center">
          <span>Showing {results.length} of {totalFiltered} results</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((candidate, idx) => (
            <div 
              key={candidate.candidate_id || idx} 
              onClick={() => handleOpenProfile(candidate)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer hover:border-indigo-300"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200 shrink-0">
                    {candidate.name ? candidate.name.charAt(0) : 'U'}
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
                    {Math.round(candidate.score_breakdown.total_score)}% Match
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">{candidate.name || 'Unknown Candidate'}</h3>
                <p className="text-sm font-medium text-indigo-600 mb-3 line-clamp-1">{candidate.role || candidate.predicted_job_role || 'No Role Specified'}</p>
                
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{(candidate.profile_text || '').split('\n')[0]?.replace('📍 LOCATION: ', '') || 'Location Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.calculated_experience_years || 0} Years Exp.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{candidate.education_level || 'Degree Not Specified'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 border-t border-slate-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProfile(candidate);
                  }}
                  className="w-full py-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-slate-200 rounded transition-colors"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {!loading && results.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No candidates found</h3>
            <p className="text-slate-500 mt-1 text-sm">Try adjusting your filters to find more matches.</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}
        
        {!loading && results.length > 0 && results.length < totalFiltered && (
          <div className="mt-8 flex justify-center pb-8">
            <button 
              onClick={handleLoadMore}
              className="bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold py-2.5 px-6 rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              Show {Math.min(48, totalFiltered - results.length)} more
            </button>
          </div>
        )}
      </div>

      {/* Candidate Profile Modal */}
      {isModalOpen && (
        <CandidateModal 
          candidate={selectedCandidate}
          onClose={handleCloseModal}
          onExport={handleExportPdf}
          exportingId={exportingId}
        />
      )}
    </div>
  );
};

export default ExploreDashboard;

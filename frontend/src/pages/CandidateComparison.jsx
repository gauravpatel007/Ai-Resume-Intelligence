import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const COLORS = ['#6366f1', '#10b981', '#f59e0b']; // Indigo, Emerald, Amber

const CandidateComparison = ({ compareList, criteria, onClose }) => {
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  if (!compareList || compareList.length === 0) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Candidates Selected</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Please select 2 or 3 candidates to compare by clicking <span className="font-semibold text-indigo-600">+ Compare</span> on candidate cards in Dashboard.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (compareList.length < 2) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Need at Least 2 Candidates</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          You currently have 1 candidate selected ({compareList[0]?.name || 'Candidate 1'}). Add at least 1 more candidate to view the side-by-side comparison matrix.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Add More from Dashboard
        </button>
      </div>
    );
  }

  // Prepare chart data
  // We want dimensions on X-axis, and candidates as bars.
  // Dimensions: Total, Skills, Experience, Role, Education
  const chartData = [
    { name: 'Total Score' },
    { name: 'Skills' },
    { name: 'Experience' },
    { name: 'Role Match' },
    { name: 'Edu/Abilities' }
  ];

  compareList.forEach((c) => {
    const candidateName = c.name || `Candidate ${c.candidate_id}`;
    chartData[0][candidateName] = c.score_breakdown?.total_score || 0;
    chartData[1][candidateName] = c.score_breakdown?.skills_score || 0;
    chartData[2][candidateName] = c.score_breakdown?.experience_score || 0;
    chartData[3][candidateName] = c.score_breakdown?.role_score || 0;
    chartData[4][candidateName] = c.score_breakdown?.education_abilities_score || 0;
  });

  const handleExportPdf = async (candidate) => {
    setExportingId(candidate.candidate_id);
    try {
      // Use the snapshot criteria that was saved with the candidate
      const payload = criteria || {
        target_job_role: "Any",
        required_skills: [],
        preferred_skills: [],
        min_experience_years: null,
        required_degree: "Any"
      };

      const response = await api.post(`/export/candidate/${candidate.candidate_id}/pdf`, payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `candidate_${candidate.candidate_id}_comparison_report.pdf`);
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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Candidate Comparison
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Criteria Snapshot:</span>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">Role: {criteria?.target_job_role || 'Any'}</span>
              {(criteria?.required_skills?.length > 0) && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">Skills: {criteria.required_skills.join(', ')}</span>
              )}
              {criteria?.min_experience_years && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">Min Exp: {criteria.min_experience_years}yr</span>
              )}
              {criteria?.required_degree && criteria.required_degree !== 'Any' && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">Degree: {criteria.required_degree}</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Score Overview Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Score Breakdown Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                {compareList.map((c, idx) => (
                  <Bar 
                    key={c.candidate_id} 
                    dataKey={c.name || `Candidate ${c.candidate_id}`} 
                    fill={COLORS[idx % COLORS.length]} 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs w-1/5">Dimension</th>
                  {compareList.map((c, idx) => (
                    <th key={c.candidate_id} className="p-4 border-l border-slate-200 w-[26%]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                          <span className="font-extrabold text-slate-800 text-base">{c.name || `Candidate ${c.candidate_id}`}</span>
                        </div>
                        <span className="text-slate-500 text-xs font-semibold">{c.predicted_job_role || 'Unknown Role'}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Total Score */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Total Score</td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${(c.score_breakdown?.total_score || 0) >= 80 ? 'text-emerald-600' : (c.score_breakdown?.total_score || 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {c.score_breakdown?.total_score ?? '—'}
                        </span>
                        <span className="text-slate-400 font-bold text-xs">/ 100</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Experience */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                    Experience
                    {criteria?.min_experience_years && <div className="text-xs text-slate-400 font-medium mt-0.5">Min: {criteria.min_experience_years} yrs</div>}
                  </td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100 group relative">
                      <div className="font-bold text-slate-800">{c.calculated_experience_years || 0} yrs</div>
                      {/* Tooltip for faculty demo: Explaining experience vs score */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
                        Score component: {c.score_breakdown?.experience_score ?? 0}/20
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Education */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Highest Degree</td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100">
                      <span className="font-semibold text-slate-700">{c.education_level || 'Not Specified'}</span>
                    </td>
                  ))}
                </tr>

                {/* Required Skills Matched */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Required Skills ✓</td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {c.score_breakdown.matched_required?.length > 0 ? (
                          c.score_breakdown.matched_required.map((skill, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                              ✓ {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Required Skills Missing */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Required Skills ✗</td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {c.score_breakdown.missing_required?.length > 0 ? (
                          c.score_breakdown.missing_required.map((skill, i) => (
                            <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">
                              ✗ {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Preferred Skills Matched */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Preferred Skills ✓</td>
                  {compareList.map(c => (
                    <td key={c.candidate_id} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {c.score_breakdown.matched_preferred?.length > 0 ? (
                          c.score_breakdown.matched_preferred.map((skill, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                              ★ {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recruiter Decision Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Recruiter Decision</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareList.map(c => (
                <div 
                  key={c.candidate_id}
                  onClick={() => setSelectedWinner(c.candidate_id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedWinner === c.candidate_id 
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-800">{c.name || `Candidate ${c.candidate_id}`}</div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedWinner === c.candidate_id ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'
                    }`}>
                      {selectedWinner === c.candidate_id && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">{c.predicted_job_role}</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleExportPdf(c); }}
                    disabled={exportingId === c.candidate_id}
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1.5"
                  >
                    {exportingId === c.candidate_id ? (
                      <><svg className="animate-spin h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Exporting...</>
                    ) : (
                      <><svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export PDF</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateComparison;

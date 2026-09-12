import React, { useState } from 'react';
import { X, Download, MapPin, Mail, Phone, Briefcase, Award, Star, Zap, Loader2 } from 'lucide-react';

const CandidateModal = ({ candidate, onClose, onExport, exportingId }) => {
  if (!candidate) return null;

  // Parse the profile text into sections
  const parseProfileText = (text) => {
    if (!text) return { education: [], abilities: [], skills: [], raw: '' };
    
    const sections = {
      education: [],
      abilities: [],
      skills: [],
      raw: text
    };
    
    const blocks = text.split('\n\n');
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      const header = lines[0];
      const contentLines = lines.slice(1);
      
      if (header.includes('EDUCATION DETAILS')) {
        sections.education = contentLines.map(l => l.replace(/^•\s*/, ''));
      } else if (header.includes('ABILITIES & HIGHLIGHTS')) {
        sections.abilities = contentLines.map(l => l.replace(/^•\s*/, ''));
      } else if (header.includes('SKILLS')) {
        sections.skills = contentLines.join(' ').split(',').map(s => s.trim());
      }
    });
    
    return sections;
  };

  const parsedData = parseProfileText(candidate.profile_text);
  const matchScore = Math.round(candidate.score_breakdown?.total_score || 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-600 p-6 sm:p-8 shrink-0 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg">
              {candidate.name ? candidate.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl sm:text-3xl font-normal tracking-wide" style={{ fontFamily: '"Milton", sans-serif' }}>
                  {candidate.name || 'Unknown Candidate'}
                </h2>
                <span className="bg-emerald-400 text-emerald-950 text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
                  {matchScore}% Match
                </span>
              </div>
              <p className="text-indigo-100 font-medium text-lg mb-4">{candidate.role || candidate.predicted_job_role || 'Role Not Specified'}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-indigo-50 font-medium">
                <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                  <Mail className="w-4 h-4 text-indigo-200" />
                  {candidate.email || 'No email provided'}
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                    <Phone className="w-4 h-4 text-indigo-200" />
                    {candidate.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4 text-indigo-200" />
                  {candidate.profile_text?.split('\n')[0].replace('📍 LOCATION: ', '') || 'Location unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Experience summary block */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <Briefcase className="w-5 h-5 text-indigo-500" /> Professional Experience
                </h3>
                <p className="text-slate-600 font-medium">
                  Candidate possesses <span className="font-bold text-indigo-700">{candidate.calculated_experience_years || 0} years</span> of calculated experience.
                </p>
              </div>

              {/* Skills */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <Star className="w-5 h-5 text-emerald-500" /> Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.length > 0 ? parsedData.skills.map((skill, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                      {skill}
                    </span>
                  )) : (
                    <span className="text-slate-500 text-sm">No skills explicitly listed.</span>
                  )}
                </div>
              </div>

              {/* Abilities */}
              {parsedData.abilities.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <Zap className="w-5 h-5 text-amber-500" /> Key Abilities & Highlights
                  </h3>
                  <ul className="space-y-3">
                    {parsedData.abilities.map((ability, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                        {ability}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Action Button */}
              <button 
                onClick={() => onExport(candidate.candidate_id)}
                disabled={exportingId === candidate.candidate_id}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-70 group"
              >
                {exportingId === candidate.candidate_id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                )}
                Export Full PDF Report
              </button>

              {/* Education */}
              {parsedData.education.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-purple-500" /> Education Background
                  </h3>
                  <ul className="space-y-4">
                    {parsedData.education.map((edu, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-slate-700 font-semibold text-sm leading-tight mb-1">{edu.split('(')[0]}</p>
                          {edu.includes('(') && <p className="text-slate-500 text-xs">{edu.substring(edu.indexOf('(')).replace(/[()]/g, '')}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Score Breakdown (Optional visual) */}
              {candidate.score_breakdown && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Match Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Role</span>
                      <span className="text-slate-700 font-bold">{Math.round(candidate.score_breakdown.role_score)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${candidate.score_breakdown.role_score}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className="text-slate-500 font-medium">Skills</span>
                      <span className="text-slate-700 font-bold">{Math.round(candidate.score_breakdown.skill_score)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${candidate.score_breakdown.skill_score}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className="text-slate-500 font-medium">Experience</span>
                      <span className="text-slate-700 font-bold">{Math.round(candidate.score_breakdown.experience_score)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${candidate.score_breakdown.experience_score}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Explanations Panel */}
            {candidate.score_breakdown?.explanations && candidate.score_breakdown.explanations.length > 0 && (
              <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-2">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Why this match?</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-1/4">Requirement</th>
                        <th className="py-3 px-4 w-1/4">Finding</th>
                        <th className="py-3 px-4 w-1/2">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {candidate.score_breakdown.explanations.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{exp.requirement}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              exp.finding.includes('Not found') 
                                ? 'bg-red-100 text-red-800' 
                                : exp.finding.includes('verification') 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {exp.finding}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic">
                            {exp.evidence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateModal;

import React, { useState } from 'react';
import api from '../api/axios';
import { Search, Loader2, Sparkles, Zap, BrainCircuit, CheckCircle2, XCircle, FileText, Download, Scale, ArrowRight, UserCheck, BookOpen } from 'lucide-react';
import CandidateModal from './CandidateModal';

const TEMPLATES = [
  {
    name: '🐍 Python Backend',
    role: 'Backend Engineer',
    jd: 'We are seeking an experienced Backend Engineer to design, build, and optimize scalable RESTful APIs and microservices. Must have hands-on experience with Python, asynchronous programming, relational databases (PostgreSQL/MySQL), caching with Redis, and containerized deployment with Docker and Kubernetes. Strong knowledge of system architecture and API security is required.',
    skills: 'Python, PostgreSQL, Docker, Redis'
  },
  {
    name: '⚛️ React Full-Stack',
    role: 'Full-Stack Developer',
    jd: 'Looking for a Senior Full-Stack Developer with expertise in React, TypeScript, Node.js, and modern web application development. Responsible for crafting responsive, accessible user interfaces, state management, REST/GraphQL integration, and writing clean, maintainable unit and integration tests.',
    skills: 'React, TypeScript, Node.js, Tailwind'
  },
  {
    name: '📊 Data Scientist / ML',
    role: 'Data Scientist',
    jd: 'Seeking a Data Scientist with a strong background in Machine Learning, statistical modeling, and deep learning. Proficiency in Python (NumPy, Pandas, Scikit-Learn, PyTorch/TensorFlow) and experience working with large datasets, feature engineering, NLP or Computer Vision pipelines, and model evaluation.',
    skills: 'Python, Machine Learning, Pandas, PyTorch'
  },
  {
    name: '☁️ DevOps & Cloud',
    role: 'DevOps Engineer',
    jd: 'Join our infrastructure team to automate cloud infrastructure, CI/CD pipelines, and observability. Hands-on experience with AWS/GCP, Terraform, Docker, Kubernetes, Linux system administration, and infrastructure as code is essential.',
    skills: 'Docker, Kubernetes, AWS, Terraform, CI/CD'
  }
];

const SemanticSearchTab = ({ compareList = [], onToggleCompare, onExportPdf, exportingId }) => {
  const [jobDescription, setJobDescription] = useState(TEMPLATES[0].jd);
  const [requiredSkills, setRequiredSkills] = useState(TEMPLATES[0].skills);
  const [method, setMethod] = useState('tfidf'); // 'tfidf' (instant) or 'semantic' (neural)
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState(null);

  const handleApplyTemplate = (tpl) => {
    setJobDescription(tpl.jd);
    setRequiredSkills(tpl.skills);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setLatency(null);
    const start = Date.now();

    try {
      const skillsArray = requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.post('/search/semantic', {
        job_description: jobDescription,
        method: method,
        required_skills: skillsArray,
        top_k: parseInt(topK) || 5
      });

      setResults(res.data || []);
      setLatency(Date.now() - start);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during semantic search.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    const pct = score * 100;
    if (pct >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pct >= 50) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getScoreBadge = (score) => {
    const pct = (score * 100).toFixed(1);
    return `${pct}% Match`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-6 sm:p-8 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Semantic Job Description Search
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  AI Powered
                </span>
              </h2>
              <p className="text-sm text-slate-500">
                Paste any job description to discover contextually relevant candidate resumes using neural embeddings.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Info Pill */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Transparent separation: Explicit must-haves vs semantic relevance.</span>
        </div>
      </div>

      {/* Main Grid: Search Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Inputs): 5 cols on lg */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Presets */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              One-Click Job Description Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="text-left px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-200 transition-all truncate"
                  title={tpl.jd}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
            {/* Job Description Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Job Description *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {jobDescription.length} chars
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={7}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-slate-800 leading-relaxed resize-y"
                placeholder="Paste the target job description or requirements document here..."
                required
              />
            </div>

            {/* Must-Have Skills */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Explicit Must-Have Skills (Optional)
              </label>
              <input
                type="text"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-slate-800"
                placeholder="e.g. Python, SQL, Docker (comma separated)"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Candidates will be checked against each must-have skill independently from similarity.
              </p>
            </div>

            {/* Matching Model Options */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Matching Algorithm
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('tfidf')}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    method === 'tfidf'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className={`w-4 h-4 ${method === 'tfidf' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">TF-IDF (Ultra Fast)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Instant cosine similarity baseline (&lt; 0.1s across 55k+ candidates).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('semantic')}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    method === 'semantic'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className={`w-4 h-4 ${method === 'semantic' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">Neural Semantic</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Deep contextual reranking via local Sentence Transformers (~1s).
                  </span>
                </button>
              </div>
            </div>

            {/* Top K limit */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Max Results
              </label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
              >
                <option value={5}>Top 5 Candidates</option>
                <option value={10}>Top 10 Candidates</option>
                <option value={20}>Top 20 Candidates</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Resumes with AI...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Semantic Matches
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (Results): 7 cols on lg */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header of Results */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Matching Results</span>
              {results.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {results.length} found
                </span>
              )}
            </h3>

            {latency !== null && (
              <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Latency: <strong className="text-slate-800">{latency}ms</strong>
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-base">Performing Semantic Encoding</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Computing dense vector cosine similarities against candidate resumes using {method === 'semantic' ? 'SentenceTransformers' : 'TF-IDF'}...
                </p>
              </div>
            </div>
          )}

          {/* Empty State before search */}
          {!loading && results.length === 0 && !error && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-base">Ready for Semantic Search</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Choose a preset or paste any job description on the left, then click <strong>Find Semantic Matches</strong> to rank the most relevant candidates in the database.
                </p>
              </div>
            </div>
          )}

          {/* Result Cards */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((candidate, idx) => {
                const isCompared = compareList.some((c) => c.candidate_id === candidate.candidate_id);
                return (
                  <div
                    key={candidate.candidate_id || idx}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Row: Candidate details & Score */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                          {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-base">
                              {candidate.name || `Candidate #${candidate.candidate_id}`}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              ID: {candidate.candidate_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {candidate.predicted_job_role || candidate.role || 'Role not specified'}
                            {candidate.calculated_experience_years ? ` • ${candidate.calculated_experience_years} yrs exp` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Similarity Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm ${getScoreColor(candidate.similarity_score)}`}>
                          {getScoreBadge(candidate.similarity_score)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Semantic Relevance
                        </span>
                      </div>
                    </div>

                    {/* Semantic Evidence Excerpt */}
                    {candidate.evidence && (
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed italic relative">
                        <div className="font-semibold text-slate-400 not-italic text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-600" /> Matched Resume Passage
                        </div>
                        "{candidate.evidence}"
                      </div>
                    )}

                    {/* Transparent Requirement Check: Matched vs Missing */}
                    {(candidate.matched_required?.length > 0 || candidate.missing_required?.length > 0) && (
                      <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                          Must-Have Check:
                        </span>
                        {candidate.matched_required?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {skill}
                          </span>
                        ))}
                        {candidate.missing_required?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium"
                          >
                            <XCircle className="w-3 h-3 text-rose-500" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateForModal(candidate)}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        View Full Profile
                      </button>

                      <div className="flex items-center gap-2">
                        {onToggleCompare && (
                          <button
                            type="button"
                            onClick={() => onToggleCompare(candidate)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              isCompared
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5" />
                            {isCompared ? '✓ Added to Compare' : '+ Compare'}
                          </button>
                        )}

                        {onExportPdf && (
                          <button
                            type="button"
                            onClick={() => onExportPdf(candidate.candidate_id)}
                            disabled={exportingId === candidate.candidate_id}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {exportingId === candidate.candidate_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Export PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Modal */}
      {selectedCandidateForModal && (
        <CandidateModal
          candidate={selectedCandidateForModal}
          onClose={() => setSelectedCandidateForModal(null)}
          onExport={onExportPdf}
          exportingId={exportingId}
        />
      )}
    </div>
  );
};

export default SemanticSearchTab;

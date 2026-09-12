import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { IT_ROLES_CATALOG } from '../data/rolesCatalog';

const CandidateInterview = () => {
  const [rolesCatalog, setRolesCatalog] = useState(IT_ROLES_CATALOG);
  const [formData, setFormData] = useState({
    job_role: IT_ROLES_CATALOG[0]?.name || "",
    package: "",
    skills: "",
    experience: "",
    interview_type: "mcq"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  
  // MCQ state
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  // Normal Interview state
  const [normalAnswers, setNormalAnswers] = useState({});

  useEffect(() => {
    // Try to fetch updated roles catalog just in case
    api.get('/candidate/roles/catalog')
      .then(res => {
        if (res.data?.roles && res.data.roles.length > 0) {
          setRolesCatalog(res.data.roles);
        }
      })
      .catch(err => console.error("Could not fetch roles catalog", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!formData.job_role) {
      setError("Job Role is required.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);
    setSubmitted(false);
    setAnswers({});
    setScore(null);
    setNormalAnswers({});

    try {
      const response = await api.post('/candidate/interview/generate', formData);
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMCQChange = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNormalChange = (questionId, text) => {
    setNormalAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmitInterview = () => {
    setSubmitted(true);
    if (formData.interview_type === 'mcq') {
      let correctCount = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });
      setScore(correctCount);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Normal interview submitted logic
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 mb-2">AI Interview Generator</h2>
        <p className="text-slate-500 mb-6 text-sm">Generate 10 personalized interview questions based on your profile and target job.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Job Role *</label>
            <select
              name="job_role"
              value={formData.job_role}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a Role</option>
              {rolesCatalog.map((r, i) => (
                <option key={i} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Package (Optional)</label>
            <select
              name="package"
              value={formData.package}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Package Tier</option>
              <option value="< 5 LPA">Less than 5 LPA (Fresher)</option>
              <option value="5-10 LPA">5 - 10 LPA</option>
              <option value="10-20 LPA">10 - 20 LPA</option>
              <option value="20+ LPA">20+ LPA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skills (Optional)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, Python"
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Experience (Optional)</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Experience</option>
              <option value="Fresher">Fresher (0 years)</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interview Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setFormData({ ...formData, interview_type: 'mcq' })}
              className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all font-bold ${
                formData.interview_type === 'mcq'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              MCQ Interview
              <span className="block text-xs font-normal opacity-80 mt-1">10 Multiple Choice Questions</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, interview_type: 'normal' })}
              className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all font-bold ${
                formData.interview_type === 'normal'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              Normal Interview
              <span className="block text-xs font-normal opacity-80 mt-1">10 Open-ended Questions</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !formData.job_role}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-md disabled:opacity-50 transition-all flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Interview...
            </>
          ) : (
            'Generate Interview'
          )}
        </button>
      </div>

      {/* Results Header (If Submitted) */}
      {submitted && formData.interview_type === 'mcq' && score !== null && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center animate-in zoom-in duration-300">
          <h3 className="text-3xl font-black text-slate-800 mb-2">Interview Completed!</h3>
          <p className="text-slate-500 font-medium mb-6">Here is your automated score for the MCQ round.</p>
          <div className="inline-block relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle
                cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 10)}`}
                className={score >= 7 ? 'text-emerald-500' : score >= 4 ? 'text-amber-500' : 'text-rose-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-800">{score}</span>
              <span className="text-xs font-bold text-slate-400">/ 10</span>
            </div>
          </div>
        </div>
      )}

      {submitted && formData.interview_type === 'normal' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-200 bg-emerald-50 text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-2xl font-black text-emerald-800 mb-2">Interview Submitted!</h3>
          <p className="text-emerald-700 font-medium">Your answers have been saved cleanly. AI Evaluation is coming soon!</p>
        </div>
      )}

      {/* Questions Render */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isMCQ = Array.isArray(q.options) && q.options.length > 0;
            const userAnswer = answers[q.id];
            
            let borderColor = "border-slate-200";
            if (submitted && isMCQ) {
              borderColor = userAnswer === q.correct_answer ? "border-emerald-300 bg-emerald-50/30" : "border-rose-300 bg-rose-50/30";
            }

            return (
              <div key={q.id} className={`bg-white rounded-2xl p-6 shadow-sm border ${borderColor} transition-colors`}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{q.question}</h3>
                    
                    {isMCQ ? (
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = userAnswer === opt;
                          const isCorrect = submitted && opt === q.correct_answer;
                          const isWrongSelection = submitted && isSelected && !isCorrect;
                          
                          let optionClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700";
                          if (isSelected && !submitted) optionClass = "border-indigo-600 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600";
                          
                          if (submitted) {
                            if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                            else if (isWrongSelection) optionClass = "border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500";
                            else optionClass = "border-slate-200 opacity-50";
                          }

                          return (
                            <label key={oIdx} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${optionClass}`}>
                              <input
                                type="radio"
                                name={`question_${q.id}`}
                                value={opt}
                                checked={isSelected}
                                onChange={() => !submitted && handleMCQChange(q.id, opt)}
                                disabled={submitted}
                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                              />
                              <span className="ml-3 font-medium text-sm">{opt}</span>
                              
                              {submitted && isCorrect && (
                                <svg className="w-5 h-5 ml-auto text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              )}
                              {submitted && isWrongSelection && (
                                <svg className="w-5 h-5 ml-auto text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={normalAnswers[q.id] || ''}
                          onChange={(e) => handleNormalChange(q.id, e.target.value)}
                          disabled={submitted}
                          placeholder="Type your answer here..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        ></textarea>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!submitted && (
            <button
              onClick={handleSubmitInterview}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4"
            >
              Submit Interview
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateInterview;

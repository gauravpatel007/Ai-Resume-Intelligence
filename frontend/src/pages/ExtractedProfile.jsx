import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const POPULAR_SKILL_SUGGESTIONS = [
  "Docker", "Kubernetes", "AWS", "SQL", "FastAPI", "React", "PyTorch", "Git", "PostgreSQL", "Machine Learning", "TypeScript", "Python"
];

const TARGET_ROLE_OPTIONS = [
  "ML Engineer", "Data Scientist", "Backend Developer", "Frontend Developer",
  "Full Stack Developer", "DevOps Engineer", "Data Engineer", "Cloud Architect"
];

const ExtractedProfile = ({ setCurrentView }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    city: '',
    state: '',
    country: '',
    predicted_job_role: '',
    alternative_roles: [],
    is_role_uncertain: false,
    current_role: '',
    target_role: '',
    all_skills: [],
    experiences: [],
    educations: [],
    abilities: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleConfirmReset = async () => {
    setShowResetConfirm(false);
    setError('');
    await fetchProfile();
    setSuccess("Profile data has been reset to database version.");
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/candidate/me');
      const data = response.data;
      let parsedAlternatives = [];
      try {
        if (data.alternative_roles) {
          parsedAlternatives = JSON.parse(data.alternative_roles);
        }
      } catch(e) {}

      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        linkedin: data.linkedin || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        predicted_job_role: data.predicted_job_role || '',
        alternative_roles: parsedAlternatives,
        is_role_uncertain: !!data.is_role_uncertain,
        current_role: data.current_role || '',
        target_role: data.target_role || '',
        all_skills: data.all_skills || [],
        experiences: data.experiences || [],
        educations: data.educations || [],
        abilities: data.abilities || []
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("No profile found. Please upload a resume first.");
      } else {
        setError(err.response?.data?.detail || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- SAVE ENTIRE PROFILE TO DATABASE ---
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Separate skills into extracted vs manual
    const manualSkillsList = profile.all_skills
      .filter(s => s.source === 'manual')
      .map(s => s.name.trim())
      .filter(Boolean);

    const extractedSkillsList = profile.all_skills
      .filter(s => s.source !== 'manual')
      .map(s => s.name.trim())
      .filter(Boolean);

    const payload = {
      name: profile.name,
      phone: profile.phone,
      linkedin: profile.linkedin,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      predicted_job_role: profile.predicted_job_role,
      current_role: profile.current_role,
      target_role: profile.target_role,
      manual_skills: manualSkillsList.join(', '),
      extracted_skills: extractedSkillsList,
      experiences: profile.experiences.map(exp => ({
        title: exp.title || '',
        firm: exp.firm || '',
        start_date: exp.start_date || '',
        end_date: exp.end_date || '',
        location: exp.location || ''
      })),
      educations: profile.educations.map(edu => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        specific_field: edu.specific_field || '',
        start_date: edu.start_date || '',
        location: edu.location || ''
      })),
      abilities: profile.abilities.map(ab => ({
        description: ab.description || ''
      }))
    };

    try {
      const response = await api.put('/candidate/me', payload);
      if (response.data) {
        const d = response.data;
        setProfile(prev => ({
          ...prev,
          name: d.name ?? prev.name,
          phone: d.phone ?? prev.phone,
          linkedin: d.linkedin ?? prev.linkedin,
          city: d.city ?? prev.city,
          state: d.state ?? prev.state,
          country: d.country ?? prev.country,
          predicted_job_role: d.predicted_job_role ?? prev.predicted_job_role,
          current_role: d.current_role ?? prev.current_role,
          target_role: d.target_role ?? prev.target_role,
          all_skills: d.all_skills ?? prev.all_skills,
          experiences: d.experiences ?? prev.experiences,
          educations: d.educations ?? prev.educations,
          abilities: d.abilities ?? prev.abilities
        }));
      }

      setSuccess("Profile and all changes saved to database successfully!");
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.detail || "Failed to save profile changes.");
      }
    } finally {
      setSaving(false);
    }
  };

  // --- SKILLS CRUD ---
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;

    const exists = profile.all_skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewSkillInput('');
      return;
    }

    setProfile(prev => ({
      ...prev,
      all_skills: [...prev.all_skills, { name: trimmed, source: 'manual' }]
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillNameToRemove) => {
    setProfile(prev => ({
      ...prev,
      all_skills: prev.all_skills.filter(s => s.name.toLowerCase() !== skillNameToRemove.toLowerCase())
    }));
  };

  const handleEditSkillName = (index, newName) => {
    setProfile(prev => {
      const updated = [...prev.all_skills];
      updated[index] = { ...updated[index], name: newName };
      return { ...prev, all_skills: updated };
    });
  };

  const handleToggleSkillSource = (index) => {
    setProfile(prev => {
      const updated = [...prev.all_skills];
      const currentSource = updated[index].source;
      updated[index] = { ...updated[index], source: currentSource === 'manual' ? 'extracted' : 'manual' };
      return { ...prev, all_skills: updated };
    });
  };

  // --- WORK EXPERIENCE CRUD ---
  const handleAddExperience = () => {
    const newExp = {
      title: '',
      firm: '',
      start_date: '',
      end_date: 'Present',
      location: ''
    };
    setProfile(prev => ({
      ...prev,
      experiences: [newExp, ...prev.experiences]
    }));
  };

  const handleUpdateExperience = (index, field, value) => {
    setProfile(prev => {
      const updated = [...prev.experiences];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experiences: updated };
    });
  };

  const handleRemoveExperience = (index) => {
    setProfile(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  // --- EDUCATION CRUD ---
  const handleAddEducation = () => {
    const newEdu = {
      institution: '',
      degree: '',
      specific_field: '',
      start_date: '',
      location: ''
    };
    setProfile(prev => ({
      ...prev,
      educations: [newEdu, ...prev.educations]
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    setProfile(prev => {
      const updated = [...prev.educations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, educations: updated };
    });
  };

  const handleRemoveEducation = (index) => {
    setProfile(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  // --- ABILITIES & HIGHLIGHTS CRUD ---
  const handleAddAbility = () => {
    const newAb = { description: '' };
    setProfile(prev => ({
      ...prev,
      abilities: [...prev.abilities, newAb]
    }));
  };

  const handleUpdateAbility = (index, value) => {
    setProfile(prev => {
      const updated = [...prev.abilities];
      updated[index] = { ...updated[index], description: value };
      return { ...prev, abilities: updated };
    });
  };

  const handleRemoveAbility = (index) => {
    setProfile(prev => ({
      ...prev,
      abilities: prev.abilities.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Candidate Profile...</p>
      </div>
    );
  }

  const verifiedSkillsCount = profile.all_skills.filter(s => s.source !== 'manual').length;
  const manualSkillsCount = profile.all_skills.filter(s => s.source === 'manual').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-28">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Candidate Profile
            </span>
            {lastSaved && (
              <span className="text-xs text-slate-400">
                Last synced at {lastSaved}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your personal details, career trajectory, skills, and full background.</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving to Database...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Save Profile to Database
            </>
          )}
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-start gap-3 shadow-xs">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-start gap-3 shadow-xs">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* HERO AVATAR & STATS BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-md">
            {(profile.name || profile.email || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800">{profile.name || "Candidate Name"}</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✓ Verified Account
              </span>
            </div>
            <p className="text-slate-500 text-sm">{profile.email}</p>
            <p className="text-xs font-bold text-indigo-600 mt-1">
              Current: {profile.current_role || "Not specified"} &bull; Target: {profile.target_role || "Not specified"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center min-w-[100px] flex-1 md:flex-none">
            <p className="text-2xl font-black text-slate-800">{profile.all_skills.length}</p>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Skills</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center min-w-[100px] flex-1 md:flex-none">
            <p className="text-2xl font-black text-emerald-700">{verifiedSkillsCount}</p>
            <p className="text-[11px] font-bold uppercase text-emerald-600">Verified</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-center min-w-[100px] flex-1 md:flex-none">
            <p className="text-2xl font-black text-indigo-700">{manualSkillsCount}</p>
            <p className="text-[11px] font-bold uppercase text-indigo-600">Self-Added</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: PERSONAL INFORMATION (EMAIL PROTECTED) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              👤
            </div>
            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Email is locked as permanent login account</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              placeholder="e.g. Gaurav Patel"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Email Address <span className="text-slate-400 text-[10px] lowercase font-normal">(Read-only)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium pr-10"
              />
              <svg className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
              placeholder="+1 555-0199"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={profile.city}
              onChange={handleInputChange}
              placeholder="e.g. San Francisco"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">State / Province</label>
            <input
              type="text"
              name="state"
              value={profile.state}
              onChange={handleInputChange}
              placeholder="e.g. California"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={profile.country}
              onChange={handleInputChange}
              placeholder="e.g. USA"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">LinkedIn Profile URL</label>
            <input
              type="text"
              name="linkedin"
              value={profile.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CAREER & ROLES */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            💼
          </div>
          <h3 className="text-lg font-bold text-slate-800">Career Trajectory & Target Roles</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Current Job Title</label>
            <input
              type="text"
              name="current_role"
              value={profile.current_role}
              onChange={handleInputChange}
              placeholder="e.g. Junior Python Developer"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Target Job Role</label>
            <input
              type="text"
              name="target_role"
              value={profile.target_role}
              onChange={handleInputChange}
              placeholder="e.g. ML Engineer"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TARGET_ROLE_OPTIONS.slice(0, 4).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, target_role: role }))}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-0.5 rounded-md transition font-medium"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              AI Predicted Role
              {profile.is_role_uncertain && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold tracking-normal normal-case">
                  Uncertain
                </span>
              )}
            </label>
            <input
              type="text"
              name="predicted_job_role"
              value={profile.predicted_job_role}
              onChange={handleInputChange}
              placeholder="e.g. Machine Learning Engineer"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
            />
            
            {profile.alternative_roles && profile.alternative_roles.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">Alternative Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.alternative_roles.map((alt, i) => (
                    <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[11px] text-slate-700 font-medium">{alt.role}</span>
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">Score: {alt.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Classification computed by LinearSVC model based on resume text.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: SKILLS MATRIX (ADD, EDIT, REMOVE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Skills Matrix</h3>
              <p className="text-xs text-slate-400">Add new skills, click any skill to edit its name, or toggle manual vs verified status.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              ✅ Verified (Resume Extracted)
            </span>
            <span className="flex items-center gap-1 font-bold text-indigo-700">
              ⚪ Manually Added
            </span>
          </div>
        </div>

        {/* Skill Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
            placeholder="Type a new skill name and press Enter (e.g. Rust, PyTorch, GraphQL)..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
          />
          <button
            type="button"
            onClick={() => handleAddSkill()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs transition"
          >
            + Add Skill
          </button>
        </div>

        {/* Popular chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-slate-400 font-bold mr-1">Quick Add:</span>
          {POPULAR_SKILL_SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleAddSkill(s)}
              className="text-xs bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-2.5 py-1 rounded-lg transition font-medium"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Skill Badges Cloud */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {profile.all_skills.length > 0 ? profile.all_skills.map((skill, index) => {
            const isManual = skill.source === 'manual';
            return (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${isManual
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSkillSource(index)}
                  title="Click to toggle Verified / Manual status"
                  className="hover:opacity-75 cursor-pointer text-sm"
                >
                  {isManual ? '⚪' : '✅'}
                </button>

                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => handleEditSkillName(index, e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded outline-none font-bold text-xs"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  title="Remove skill"
                  className="text-slate-400 hover:text-red-600 transition font-black ml-1 text-sm"
                >
                  ✕
                </button>
              </div>
            );
          }) : (
            <p className="text-sm text-slate-400 italic">No skills registered yet. Use the bar above to add skills.</p>
          )}
        </div>
      </div>

      {/* SECTION 4: WORK EXPERIENCE (ADD, EDIT, REMOVE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              🏢
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Work Experience</h3>
              <p className="text-xs text-slate-400">Add, edit, or remove past job positions and employment records.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddExperience}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            + Add Position
          </button>
        </div>

        <div className="space-y-4">
          {profile.experiences.length > 0 ? profile.experiences.map((exp, index) => (
            <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative group">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Position #{profile.experiences.length - index}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(index)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                >
                  🗑️ Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    value={exp.title || ''}
                    onChange={(e) => handleUpdateExperience(index, 'title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Company / Firm</label>
                  <input
                    type="text"
                    value={exp.firm || ''}
                    onChange={(e) => handleUpdateExperience(index, 'firm', e.target.value)}
                    placeholder="e.g. Google, Stripe, Startup"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={exp.location || ''}
                    onChange={(e) => handleUpdateExperience(index, 'location', e.target.value)}
                    placeholder="e.g. Remote / NYC"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label>
                  <input
                    type="text"
                    value={exp.start_date || ''}
                    onChange={(e) => handleUpdateExperience(index, 'start_date', e.target.value)}
                    placeholder="e.g. Jan 2021"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label>
                  <input
                    type="text"
                    value={exp.end_date || ''}
                    onChange={(e) => handleUpdateExperience(index, 'end_date', e.target.value)}
                    placeholder="e.g. Present"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-400 mb-2">No work experiences listed yet.</p>
              <button
                type="button"
                onClick={handleAddExperience}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add your first work experience
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: EDUCATION (ADD, EDIT, REMOVE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              🎓
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Education & Degrees</h3>
              <p className="text-xs text-slate-400">Add, edit, or remove academic degrees, majors, and universities.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddEducation}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            + Add Education
          </button>
        </div>

        <div className="space-y-4">
          {profile.educations.length > 0 ? profile.educations.map((edu, index) => (
            <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Degree #{profile.educations.length - index}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(index)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                >
                  🗑️ Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Degree Level / Type</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                    placeholder="e.g. Bachelor of Science, Master"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Institution / University</label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => handleUpdateEducation(index, 'institution', e.target.value)}
                    placeholder="e.g. MIT, Stanford University"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={edu.specific_field || ''}
                    onChange={(e) => handleUpdateEducation(index, 'specific_field', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Graduation Year / Dates</label>
                  <input
                    type="text"
                    value={edu.start_date || ''}
                    onChange={(e) => handleUpdateEducation(index, 'start_date', e.target.value)}
                    placeholder="e.g. 2018 - 2022"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={edu.location || ''}
                    onChange={(e) => handleUpdateEducation(index, 'location', e.target.value)}
                    placeholder="e.g. Boston, MA"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-400 mb-2">No education records registered yet.</p>
              <button
                type="button"
                onClick={handleAddEducation}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add your degree or education
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6: KEY ABILITIES & SUMMARY (ADD, EDIT, REMOVE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              🌟
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Key Abilities & Accomplishments</h3>
              <p className="text-xs text-slate-400">Add highlight statements, leadership milestones, or technical abilities.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddAbility}
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            + Add Ability
          </button>
        </div>

        <div className="space-y-3">
          {profile.abilities.length > 0 ? profile.abilities.map((ab, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-teal-600 font-black mt-2 text-sm">✦</span>
              <textarea
                rows="2"
                value={ab.description || ''}
                onChange={(e) => handleUpdateAbility(index, e.target.value)}
                placeholder="Describe a key ability, project achievement, or technical competency..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleRemoveAbility(index)}
                className="text-slate-400 hover:text-red-600 transition text-sm font-black p-2 mt-1"
                title="Delete ability"
              >
                ✕
              </button>
            </div>
          )) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-400 mb-2">No key abilities or highlights registered yet.</p>
              <button
                type="button"
                onClick={handleAddAbility}
                className="text-xs font-bold text-teal-600 hover:text-teal-800"
              >
                + Add your first ability statement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ACTION DOCK (Modern Pill Shape) */}
      <div className="fixed bottom-6 right-6 sm:right-10 z-30 flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5 rounded-2xl p-2 transition-all hover:shadow-[0_16px_44px_rgba(15,23,42,0.18)]">
        {lastSaved && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pl-2.5 pr-2 border-r border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Synced {lastSaved}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          disabled={saving}
          className="px-3.5 py-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50/80 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          title="Reset profile data to database version"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Profile
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving Changes...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Save Profile to Database
            </>
          )}
        </button>
      </div>

      {/* RESET PERMISSION CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Reset Profile Data?</h3>
                <p className="text-xs text-slate-500">Permission required before discarding modifications</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to reset all profile data? All unsaved modifications in personal information, skills, experiences, and education will be discarded and reverted to the last version saved in the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel, Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Yes, Reset Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractedProfile;

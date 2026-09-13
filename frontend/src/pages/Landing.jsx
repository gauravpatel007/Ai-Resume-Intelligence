import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Brain, Search, Users, ShieldCheck, Activity, Database, Cpu } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#0b0f17] font-sans overflow-x-hidden selection:bg-[#3b5bff]/20">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#f7f8fb]/80 backdrop-blur-md border-b border-[#e6e9ef]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              AI
            </div>
            <div className="font-extrabold text-xl tracking-tight text-slate-800">
              Resume<span className="text-blue-600">Intel</span>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-[#5a6472]">
            <a href="#how-it-works" className="hover:text-[#0b0f17] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#0b0f17] transition-colors">Features</a>
            <a href="#ranking" className="hover:text-[#0b0f17] transition-colors">Scoring</a>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={handleLoginRedirect}
              className="text-sm font-medium text-[#5a6472] hover:text-[#0b0f17] transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={handleLoginRedirect}
              className="group flex items-center gap-2 bg-[#3b5bff] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3b5bff]/90 transition-colors shadow-sm"
            >
              Upload resume
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#edf1ff] border border-[#3b5bff]/20 text-[#3b5bff] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#3b5bff] animate-pulse" />
            NLP-powered screening
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-[#0b0f17] leading-[1.1]">
            Automate resume <br className="hidden md:block"/>
            screening & ranking
          </h1>
          
          <p className="text-lg md:text-xl text-[#5a6472] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Extract key skills, experience, and education instantly using advanced NLP. Get a weighted AI candidate ranking to find the perfect fit.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3b5bff] text-white font-semibold hover:bg-[#3b5bff]/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Upload your resume
            </button>
            <button 
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-[#e6e9ef] text-[#0b0f17] font-semibold hover:bg-[#f7f8fb] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Open admin dashboard
            </button>
          </div>
        </div>

        {/* Dashboard Preview Mock */}
        <div className="max-w-5xl mx-auto mt-20 relative z-10 hidden sm:block">
          <div className="rounded-2xl border border-[#e6e9ef] bg-white p-2 shadow-xl shadow-[#0b0f17]/5 overflow-hidden">
            <div className="rounded-xl overflow-hidden border border-[#e6e9ef] bg-[#f7f8fb] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-xl border border-[#e6e9ef] p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#edf1ff] border border-[#3b5bff]/20 flex items-center justify-center text-[#3b5bff]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-[#e6e9ef] rounded-md mb-2" />
                    <div className="h-3 w-48 bg-[#f7f8fb] rounded-md" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-[#f7f8fb] rounded-md" />
                  <div className="h-3 w-5/6 bg-[#f7f8fb] rounded-md" />
                  <div className="h-3 w-4/6 bg-[#f7f8fb] rounded-md" />
                </div>
                <div className="flex gap-2 pt-6 mt-6 border-t border-[#e6e9ef]">
                  <div className="px-3 py-1 bg-[#edf1ff] text-[#3b5bff] rounded-md text-xs font-semibold">Python</div>
                  <div className="px-3 py-1 bg-[#edf1ff] text-[#3b5bff] rounded-md text-xs font-semibold">React</div>
                  <div className="px-3 py-1 bg-[#edf1ff] text-[#3b5bff] rounded-md text-xs font-semibold">PostgreSQL</div>
                </div>
              </div>
              <div className="col-span-1 bg-white rounded-xl border border-[#e6e9ef] p-6 flex flex-col justify-center items-center relative overflow-hidden shadow-sm">
                <div className="text-sm font-semibold text-[#5a6472] mb-2 uppercase tracking-wide">Match Score</div>
                <div className="text-6xl font-extrabold text-[#0b0f17] mb-2">94<span className="text-2xl text-[#5a6472]">%</span></div>
                <div className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md mb-6">Highly Recommended</div>
                <div className="w-full bg-[#f7f8fb] rounded-full h-2">
                  <div className="bg-[#3b5bff] h-2 rounded-full w-[94%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline / How it works */}
      <section id="how-it-works" className="py-24 bg-white border-y border-[#e6e9ef]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#3b5bff] font-semibold text-sm tracking-wide uppercase mb-3">How it works</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0b0f17]">The extraction pipeline</h2>
            <p className="text-[#5a6472] text-lg max-w-2xl mx-auto">From raw PDF document to highly structured candidate profile.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f7f8fb] border border-[#e6e9ef] rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#e6e9ef] flex items-center justify-center text-[#3b5bff] shadow-sm mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0b0f17]">1. Upload PDF</h3>
              <p className="text-[#5a6472] leading-relaxed">
                Candidates upload their resumes in PDF format. We safely store the file and initiate the processing pipeline.
              </p>
            </div>
            
            <div className="bg-[#f7f8fb] border border-[#e6e9ef] rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#e6e9ef] flex items-center justify-center text-[#3b5bff] shadow-sm mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0b0f17]">2. NLP Extraction</h3>
              <p className="text-[#5a6472] leading-relaxed">
                Our SpaCy-powered model extracts text, identifies entities, and maps exact skills, experience, and education arrays.
              </p>
            </div>
            
            <div className="bg-[#f7f8fb] border border-[#e6e9ef] rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#e6e9ef] flex items-center justify-center text-[#3b5bff] shadow-sm mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0b0f17]">3. Rank & Search</h3>
              <p className="text-[#5a6472] leading-relaxed">
                Admins view fully structured data, run semantic searches, and get automated weighted scores based on job requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[#3b5bff] font-semibold text-sm tracking-wide uppercase mb-3">Capabilities</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#0b0f17]">Deep resume intelligence</h2>
              <p className="text-lg text-[#5a6472] mb-8 leading-relaxed">
                Our platform goes beyond basic keyword matching. We understand context, duration of experience, and the hierarchy of skills.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#edf1ff] border border-[#3b5bff]/20 w-10 h-10 rounded-lg flex items-center justify-center text-[#3b5bff] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-[#0b0f17]">Standardized Output</h4>
                    <p className="text-[#5a6472] leading-relaxed">All resumes, regardless of format, are converted into a uniform JSON structure for easy comparison and filtering.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#edf1ff] border border-[#3b5bff]/20 w-10 h-10 rounded-lg flex items-center justify-center text-[#3b5bff] shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-[#0b0f17]">Real-time Admin Dashboard</h4>
                    <p className="text-[#5a6472] leading-relaxed">Live feed of new candidates, instant filtering by skill sets, and downloadable PDF profiles.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative hidden md:block">
              <div className="bg-white border border-[#e6e9ef] rounded-2xl p-8 shadow-xl shadow-[#0b0f17]/5 relative z-10">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#e6e9ef]">
                  <div className="font-bold text-[#0b0f17]">Extracted Data Map</div>
                  <div className="text-xs bg-[#f7f8fb] border border-[#e6e9ef] text-[#5a6472] px-2 py-1 rounded font-mono">JSON</div>
                </div>
                <pre className="text-sm text-[#0b0f17] font-mono overflow-x-auto bg-[#f7f8fb] p-4 rounded-xl border border-[#e6e9ef]">
{`{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "education": [
    "B.S. Computer Science"
  ],
  "experience": "4 years",
  "skills": [
    "Python",
    "React",
    "PostgreSQL",
    "AWS"
  ],
  "score": 92.5
}`}
                </pre>
              </div>
              <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#edf1ff] rounded-2xl -rotate-6 z-0 border border-[#e6e9ef]" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white border-t border-[#e6e9ef]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#0b0f17]">Ready to streamline hiring?</h2>
          <p className="text-lg text-[#5a6472] mb-10 max-w-2xl mx-auto">Join the platform and start processing resumes with AI precision today.</p>
          
          <button 
            onClick={handleLoginRedirect}
            className="px-8 py-4 rounded-xl bg-[#3b5bff] text-white font-semibold text-lg hover:bg-[#3b5bff]/90 transition-all shadow-md inline-flex items-center gap-2"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f7f8fb] border-t border-[#e6e9ef] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#5a6472]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              AI
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800">Resume<span className="text-blue-600">Intel</span> © 2026</span>
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-[#0b0f17] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0b0f17] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0b0f17] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

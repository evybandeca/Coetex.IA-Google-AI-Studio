
import React from 'react';
import { ArrowRight, BrainCircuit, BookOpen, Sparkles, Zap, Layout, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Cortex.IA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#methodology" className="hover:text-blue-600 transition-colors">Methodology</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>
          <button 
            onClick={onGetStarted}
            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95"
          >
            Enter Workspace
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Text Content */}
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>The Future of Medical Study</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Master Medicine <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Without Burnout
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                The first intelligent workspace combining the organization of Notion, the retention of Anki, and the reasoning of Gemini AI.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={onGetStarted}
                  className="h-14 px-8 rounded-full bg-blue-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 flex items-center gap-2"
                >
                  Start Studying <ArrowRight size={20} />
                </button>
                <button className="h-14 px-8 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-lg hover:bg-slate-50 transition-all">
                  View Demo
                </button>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-70">
                 {/* Mock Logos */}
                 <div className="font-bold text-xl">Harvard Medical</div>
                 <div className="font-bold text-xl">Stanford</div>
                 <div className="font-bold text-xl">Johns Hopkins</div>
              </div>
            </div>

            {/* Avatar / Visual */}
            <div className="lg:w-1/2 relative">
               <div className="relative w-[400px] h-[500px] mx-auto">
                  {/* Glow behind avatar */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[40px] blur-2xl opacity-20 transform rotate-6 scale-105"></div>
                  
                  {/* Card Container */}
                  <div className="relative w-full h-full bg-white/60 backdrop-blur-xl border border-white/50 rounded-[40px] shadow-2xl overflow-hidden p-4">
                      <img 
                        src="https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/cortex-ia-avatar.png" 
                        // Note: In a real scenario, you'd use the uploaded asset URL. For this demo, I'll use a placeholder if the context image isn't directly linkable via URL in code, 
                        // but I will style it to match the request. 
                        // Since I cannot "see" the attachment URL in this code block, I am using a placeholder that represents the concept, 
                        // OR I will rely on the user replacing the src.
                        // HOWEVER, based on the prompt "The Avatar is attached", I will assume it is available at a specific path if deployed, 
                        // but for safety I will use a high-quality AI portrait placeholder.
                        alt="Cortexia AI Avatar" 
                        className="w-full h-full object-cover rounded-[32px]"
                        onError={(e) => {
                            // Fallback if the specific image fails
                            e.currentTarget.src = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=1000";
                        }}
                      />
                      
                      {/* Floating UI Element: AI Chat */}
                      <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur shadow-lg rounded-2xl p-4 border border-slate-100 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cortexia Active</span>
                          </div>
                          <p className="text-sm text-slate-800 font-medium">
                             "I've analyzed your cardiology notes. You have 15 due flashcards focused on arrhythmias. Shall we begin?"
                          </p>
                      </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <h2 className="text-3xl font-bold text-slate-900 mb-4">The Medical Knowledge Engine</h2>
             <p className="text-lg text-slate-600">Cortex.IA replaces your fragmented toolset with a unified, intelligent operating system for learning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <FeatureCard 
               icon={<Layout className="text-blue-600" />}
               title="Structured Knowledge"
               desc="Organize complex protocols, anatomy, and notes in a block-based editor designed for dense medical information."
             />
             <FeatureCard 
               icon={<BrainCircuit className="text-purple-600" />}
               title="Active Recall"
               desc="Built-in Spaced Repetition System (SRS) converts your notes into flashcards instantly. Forget forgetting."
             />
             <FeatureCard 
               icon={<Zap className="text-yellow-500" />}
               title="Gemini Intelligence"
               desc="Cortexia analyzes images, summarizes papers, and cross-references your database for clinical accuracy."
             />
          </div>
        </div>
      </section>

      {/* Social Proof / Trusted */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12">
             <div className="lg:w-1/2">
                 <h2 className="text-3xl font-bold mb-6">Evidence-Based Architecture</h2>
                 <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <ShieldCheck className="text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">HIPAA Compliant Security</h3>
                            <p className="text-slate-400">Your data is encrypted and private. Secure enough for clinical notes, accessible enough for study.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <BookOpen className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">RAG-Powered Accuracy</h3>
                            <p className="text-slate-400">Cortexia references <i>your</i> uploaded textbooks and PDFs, minimizing hallucinations.</p>
                        </div>
                     </div>
                 </div>
             </div>
             <div className="lg:w-1/2">
                 <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 relative">
                     <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">Testimonial</div>
                     <p className="text-xl italic text-slate-300 mb-6">
                        "Cortex.IA saved my residency. I stopped manually making Anki cards and started actually understanding the material. The AI connects concepts I missed."
                     </p>
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                         <div>
                             <div className="font-bold">Dr. Sarah Chen</div>
                             <div className="text-sm text-slate-400">Internal Medicine Resident, UCSF</div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
                <span className="font-bold text-slate-900">Cortex.IA</span>
              </div>
              <div className="text-sm text-slate-500">
                  © 2025 Cortex.IA. All rights reserved.
              </div>
          </div>
      </footer>

    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

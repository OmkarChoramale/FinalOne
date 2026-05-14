import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, PieChart, Shield, 
  Calendar, Layers, CheckCircle, Search, 
  Hash, Loader2, AlertTriangle, ShieldCheck, Zap, 
  Activity, Globe, FileSearch
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../services/api'; //
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// --- INDIAN-CENTRIC SCOPE CONFIGURATION ---
const SCOPES = [
  { 
    id: 'SITE', 
    label: 'Heritage Sites', 
    icon: <Layers size={24} />, 
    color: 'from-orange-600 to-red-700', 
    // High-def image of Hampi, Karnataka
    img: 'https://images.unsplash.com/photo-1581012733671-912f36f6036a?auto=format&fit=crop&q=80&w=1200' 
  },
  { 
    id: 'EVENT', 
    label: 'Cultural Events', 
    icon: <Calendar size={24} />, 
    color: 'from-pink-600 to-purple-700', 
    // Indian Festival / Celebration
    img: 'https://images.unsplash.com/photo-1532375811400-d754e3e3d286?auto=format&fit=crop&q=80&w=1200' 
  },
  { 
    id: 'PROGRAM', 
    label: 'Gov Programs', 
    icon: <PieChart size={24} />, 
    color: 'from-blue-600 to-indigo-800', 
    // Digital India / Administrative Context
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200' 
  },
  { 
    id: 'COMPLIANCE', 
    label: 'Compliance Audit', 
    icon: <ShieldCheck size={24} />, 
    color: 'from-emerald-600 to-teal-800', 
    // Official Legal/Audit documentation
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200' 
  },
];

const ReportPage = () => {
  const userRole = localStorage.getItem('role');
  const isAuthorized = userRole !== 'TOURIST'; //

  const [selectedScope, setSelectedScope] = useState('SITE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    try {
      setLoadingLoading(true);
      const response = await reportApi.getHistory({ scope: null, date: null }); //
      setHistory(response.data);
    } catch (err) {
      triggerAlert("Archive Sync Interrupted.", "error");
    } finally {
      setLoadingLoading(false);
    }
  };

  useEffect(() => { if (isAuthorized) fetchHistory(); }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await reportApi.generate({ scope: selectedScope }); //
      triggerAlert(`EXECUTIVE BRIEFING: ${selectedScope} compiled and encrypted.`, "success");
      fetchHistory();
    } catch (err) {
      triggerAlert("System generation protocol failed.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await reportApi.download(id); //
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TourismGov_Brief_${id}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      triggerAlert("Secure transfer failed.", "error");
    }
  };

  const triggerAlert = (msg, type = "success") => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 4000);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(report => 
      report.reportId.toString().includes(searchQuery) || 
      report.scope.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans pb-20">
      <Navbar />

      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-12 right-10 z-[1000] flex items-center gap-4 px-8 py-5 rounded-2xl shadow-3xl border ${alert.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}
          >
            <Zap size={20} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest">{alert.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-44">
        {!isAuthorized ? (
          /* */
          <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-xl p-12">
            <AlertTriangle size={80} className="text-rose-500 mb-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter">Security Denied</h2>
            <p className="text-slate-400 mt-4 font-bold max-w-sm">Tourist credentials do not meet the security clearance for Departmental Intelligence.</p>
            <Link to="/dashboard" className="mt-12 bg-[#1A237E] text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#FF6D00] transition-all">Exit Module</Link>
          </div>
        ) : (
          <div className="space-y-16">
            {/* REDUCED HEADER SIZE */}
            <header className="relative">
               <span className="text-[9px] font-black text-[#FF6D00] uppercase tracking-[0.5em] mb-3 block">Tourism Government of India</span>
               <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-[#1A237E]">
                 Strategic <br /><span className="text-[#FF6D00]">Insights.</span>
               </h1>
            </header>

            {/* IMMERSIVE SCOPE CARDS WITH INDIAN IMAGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SCOPES.map((scope) => (
                <motion.div 
                  key={scope.id} 
                  whileHover={{ scale: 1.02 }} 
                  onClick={() => setSelectedScope(scope.id)}
                  className={`relative h-[380px] rounded-[3rem] p-8 cursor-pointer transition-all duration-700 overflow-hidden group shadow-2xl border-4 ${selectedScope === scope.id ? 'border-[#FF6D00]' : 'border-transparent'}`}
                >
                   <img src={scope.img} alt={scope.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
                   <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-[#1A237E]/60 to-transparent transition-opacity duration-500 ${selectedScope === scope.id ? 'opacity-90' : 'opacity-70 grayscale group-hover:grayscale-0'}`} />

                   <div className="relative h-full flex flex-col justify-end">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 shadow-2xl bg-gradient-to-br ${scope.color}`}>
                        {scope.icon}
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">{scope.label}</h3>
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Authorized Briefing</p>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* ENHANCED GENERATE BUTTON WITH SCANNING ANIMATION */}
            <motion.button
              whileTap={{ scale: 0.98 }} 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className={`relative w-full py-9 rounded-[3rem] font-black uppercase tracking-[0.3em] text-xs shadow-3xl flex items-center justify-center gap-6 overflow-hidden transition-all duration-500 ${isGenerating ? 'bg-slate-900 text-white' : 'bg-[#1A237E] text-white hover:bg-[#FF6D00]'}`}
            >
              {isGenerating ? (
                <>
                  {/* SCANNING RADAR LOGO */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="relative"
                  >
                    <Activity size={24} className="text-[#FF6D00]" />
                  </motion.div>
                  <span className="animate-pulse">Compiling Intelligence Matrix...</span>
                </>
              ) : (
                <><Globe size={18}/> Initialize {selectedScope} Executive Briefing</>
              )}
            </motion.button>

            {/* AUDIT ARCHIVE */}
            <section className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-3xl border border-white">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-8">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Audit Ledger</h2>
                  <div className="h-1.5 w-16 bg-gradient-to-r from-[#FF6D00] to-orange-300 rounded-full mt-3" />
                </div>

                <div className="flex items-center gap-4 bg-[#F8F9FF] p-2 rounded-full border border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" placeholder="Filter Briefs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent pl-14 pr-6 py-4 rounded-full text-xs font-bold focus:outline-none w-64 text-[#1A237E]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {loadingHistory ? (
                   <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-[#FF6D00]" size={40} /></div>
                ) : filteredHistory.length > 0 ? filteredHistory.map((report) => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={report.reportId} 
                    className="group flex flex-col md:flex-row justify-between items-center bg-slate-50/50 p-7 rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#FF6D00]/10"
                  >
                    <div className="flex items-center gap-7">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#FF6D00] border border-slate-50"><Hash size={20} /></div>
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">System Brief #TR-{report.reportId}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Scope: {report.scope} • Generated: {new Date(report.generatedDate).toLocaleString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownload(report.reportId)} 
                      className="mt-6 md:mt-0 bg-[#1A237E] p-4 rounded-2xl text-white shadow-xl hover:bg-[#FF6D00] transition-all"
                    >
                      <Download size={20} />
                    </button>
                  </motion.div>
                )) : (
                  <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] border-4 border-dashed border-slate-50 rounded-[3rem]">Archive Secure & Empty</div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReportPage;
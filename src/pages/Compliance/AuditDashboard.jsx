import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuditAPI } from '../../services/api';
import AuditModal from './AuditModal';
import ReviewAuditModal from './ReviewAuditModal';

const AuditDashboard = () => {
    // --- Modal States ---
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);

    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- Data States ---
    const [audits, setAudits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Fetch Data ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const auditData = await AuditAPI.getAll();
                setAudits(auditData || []);
            } catch (error) {
                console.error("Failed to load audit data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // --- Computed Metrics ---
    const auditMetrics = useMemo(() => {
        return {
            total: audits.length,
            completed: audits.filter(a => a.status === 'COMPLETED').length,
            inProgress: audits.filter(a => a.status === 'IN_PROGRESS').length,
            underReview: audits.filter(a => a.status === 'UNDER_REVIEW').length,
            planned: audits.filter(a => a.status === 'PLANNED').length,
        };
    }, [audits]);

    // --- Filter Logic ---
    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            // Search by Audit ID or Scope
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = audit.auditId?.toString().includes(searchLower) || 
                                  audit.scope?.toLowerCase().includes(searchLower);

            const matchesStatus = filterStatus === 'ALL' || audit.status === filterStatus;

            let matchesDate = true;
            const recordDateStr = audit.date;
            if (recordDateStr) {
                const recordDate = new Date(recordDateStr).setHours(0, 0, 0, 0);
                if (startDate) matchesDate = matchesDate && recordDate >= new Date(startDate).setHours(0, 0, 0, 0);
                if (endDate) matchesDate = matchesDate && recordDate <= new Date(endDate).setHours(0, 0, 0, 0);
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [audits, searchTerm, filterStatus, startDate, endDate]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterStatus('ALL');
        setStartDate('');
        setEndDate('');
    };

    // --- API Handlers ---
    const handleCreateAudit = async (formData) => {
        try {
            const newAudit = await AuditAPI.create(formData);
            setAudits([newAudit, ...audits]);
            alert("Audit created successfully!");
        } catch (error) {
            console.error("Audit submission failed", error);
            alert("Error creating audit. Ensure you are logged in.");
        }
    };

    const handleUpdateAudit = async (auditId, updateData) => {
        try {
            const updatedAudit = await AuditAPI.update(auditId, updateData);
            setAudits(prev => prev.map(a => a.auditId === auditId ? updatedAudit : a));
            alert("Audit reviewed successfully!");
        } catch (error) {
            console.error("Audit update failed", error);
            alert("Error updating audit.");
        }
    };

    // --- UI Helpers ---
    const openReviewModal = (audit) => {
        setSelectedAudit(audit);
        setIsReviewModalOpen(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            COMPLETED: 'bg-[#004D40]/10 text-[#004D40]',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
            PLANNED: 'bg-gray-200 text-gray-700',
            CANCELLED: 'bg-red-100 text-red-800'
        };
        const colorClass = styles[status] || 'bg-gray-100 text-gray-600';
        return <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{status ? status.replace('_', ' ') : 'UNKNOWN'}</span>;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[#1A237E] font-bold text-xl">Loading Audit Registry...</div>;

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] selection:bg-[#FF6D00] selection:text-white pb-20">
            <header className="pt-32 md:pt-40 pb-8 px-6 md:px-12 max-w-screen-2xl mx-auto">
                <span className="text-[#FF6D00] font-bold uppercase tracking-widest text-xs mb-2 block">Administration</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-[#1A237E] leading-none">
                    Official <br /> Audits
                </h1>
            </header>

            <main className="max-w-screen-2xl mx-auto px-4 md:px-6">

                {/* --- METRICS CARDS --- */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-[1rem] p-5 shadow-sm border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#004D40] mb-2">Total Audits</span>
                        <span className="text-3xl font-black text-[#1A237E]">{auditMetrics.total}</span>
                    </div>
                    <div className="bg-[#f0fdf4] rounded-[1rem] p-5 shadow-sm border border-green-100 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-2">Completed</span>
                        <span className="text-3xl font-black text-green-800">{auditMetrics.completed}</span>
                    </div>
                    <div className="bg-blue-50 rounded-[1rem] p-5 shadow-sm border border-blue-100 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">In Progress</span>
                        <span className="text-3xl font-black text-blue-800">{auditMetrics.inProgress}</span>
                    </div>
                    <div className="bg-yellow-50 rounded-[1rem] p-5 shadow-sm border border-yellow-100 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-700 mb-2">Under Review</span>
                        <span className="text-3xl font-black text-yellow-800">{auditMetrics.underReview}</span>
                    </div>
                    <div className="bg-gray-50 rounded-[1rem] p-5 shadow-sm border border-gray-200 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Planned</span>
                        <span className="text-3xl font-black text-gray-700">{auditMetrics.planned}</span>
                    </div>
                </div>

                {/* --- FILTER BAR --- */}
                <div className="flex flex-col lg:flex-row justify-between items-center bg-white rounded-[1.5rem] p-3 shadow-md border border-gray-100 mb-8 gap-4">
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full lg:w-48">
                            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search Scope or ID..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1A237E]/20" 
                            />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full lg:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1A237E]/20">
                            <option value="ALL">All Status</option>
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full lg:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/20" />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full lg:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/20" />
                        <button onClick={handleClearFilters} className="w-full lg:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-colors">Clear</button>
                    </div>

                    <button onClick={() => setIsAuditModalOpen(true)} className="w-full lg:w-auto bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-3 text-xs rounded-xl hover:bg-[#1A237E] shadow-md transition-all duration-300">
                        + New Audit
                    </button>
                </div>

                {/* --- TABLE --- */}
                <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60">Audit ID</th>
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60">Scope</th>
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60">Findings</th>
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60">Status</th>
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60">Date</th>
                                    <th className="p-6 font-black uppercase tracking-widest text-xs text-[#1A237E]/60 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudits.length === 0 && (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-medium">No official audits found matching your criteria.</td></tr>
                                )}
                                {filteredAudits.map((audit) => (
                                    <tr key={audit.auditId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6 font-bold text-[#1A237E]">#{audit.auditId}</td>
                                        <td className="p-6 font-medium">{audit.scope}</td>
                                        <td className="p-6 text-sm text-gray-600 truncate max-w-xs">{audit.findings || '-'}</td>
                                        <td className="p-6">{getStatusBadge(audit.status)}</td>
                                        <td className="p-6 text-sm text-gray-500">
                                            {audit.date ? new Date(audit.date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-6 text-right">
                                            <button onClick={() => openReviewModal(audit)} className="px-4 py-2 bg-[#1A237E]/10 text-[#1A237E] hover:bg-[#FF6D00] hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300">
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <AuditModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} onSubmit={handleCreateAudit} />
            <ReviewAuditModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleUpdateAudit} audit={selectedAudit} />
        </div>
    );
};

export default AuditDashboard;
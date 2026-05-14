import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ComplianceAPI } from '../../services/api';
import ComplianceModal from './ComplianceModal';
import UpdateComplianceModal from './UpdateComplianceModal';

const ComplianceDashboard = () => {
    const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedCompliance, setSelectedCompliance] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [complianceRecords, setComplianceRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const compData = await ComplianceAPI.getAll();
                setComplianceRecords(compData.content || []);
            } catch (error) {
                console.error("Failed to load compliance data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const complianceMetrics = useMemo(() => {
        return {
            total: complianceRecords.length,
            compliant: complianceRecords.filter(r => r.result === 'COMPLIANT').length,
            partially: complianceRecords.filter(r => r.result === 'PARTIALLY_COMPLIANT').length,
            non: complianceRecords.filter(r => r.result === 'NON_COMPLIANT').length,
            review: complianceRecords.filter(r => r.result === 'PENDING_REVIEW').length,
        };
    }, [complianceRecords]);

    const filteredComplianceRecords = useMemo(() => {
        return complianceRecords.filter(record => {
            const matchesSearch = record.complianceId?.toString().includes(searchTerm) ||
                                  record.entityId?.toString().includes(searchTerm);
            const matchesStatus = filterStatus === 'ALL' || record.result === filterStatus;
            const matchesType = filterType === 'ALL' || record.type === filterType;
            
            let matchesDate = true;
            const recordDateStr = record.date || record.createdAt;
            if (recordDateStr) {
                const recordDate = new Date(recordDateStr).setHours(0, 0, 0, 0);
                if (startDate) matchesDate = matchesDate && recordDate >= new Date(startDate).setHours(0, 0, 0, 0);
                if (endDate) matchesDate = matchesDate && recordDate <= new Date(endDate).setHours(0, 0, 0, 0);
            }
            return matchesSearch && matchesStatus && matchesType && matchesDate;
        });
    }, [complianceRecords, searchTerm, filterStatus, filterType, startDate, endDate]);

    const handleClearFilters = () => {
        setSearchTerm(''); setFilterStatus('ALL'); setFilterType('ALL'); setStartDate(''); setEndDate('');
    };

    const handleCreateCompliance = async (formData) => {
        try {
            const newRecord = await ComplianceAPI.create(formData);
            setComplianceRecords([newRecord, ...complianceRecords]);
            alert("Compliance Record created successfully!");
        } catch (error) {
            console.error(error);
            alert("Error creating compliance record.");
        }
    };

    const handleUpdateComplianceResult = async (recordId, newResult) => {
        try {
            const updatedRecord = await ComplianceAPI.updateResult(recordId, newResult);
            setComplianceRecords(prev => prev.map(r => r.complianceId === recordId ? updatedRecord : r));
            alert("Record updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Error updating result.");
        }
    };

    const handleDeleteCompliance = async (recordId) => {
        if (!window.confirm("Are you sure you want to delete this compliance record? This action cannot be undone.")) return;
        try {
            await ComplianceAPI.delete(recordId);
            setComplianceRecords(prev => prev.filter(r => r.complianceId !== recordId));
        } catch (error) {
            console.error("Delete failed", error);
            alert("Error deleting record.");
        }
    };

    const openUpdateModal = (record) => {
        setSelectedCompliance(record);
        setIsUpdateModalOpen(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            COMPLIANT: 'bg-[#E8F5E9] text-[#2E7D32]',
            PENDING_REVIEW: 'bg-[#FFF3E0] text-[#E65100]',
            PARTIALLY_COMPLIANT: 'bg-[#E3F2FD] text-[#1565C0]',
            NON_COMPLIANT: 'bg-[#FFEBEE] text-[#C62828]',
            EXEMPT: 'bg-gray-100 text-gray-600'
        };
        const colorClass = styles[status] || 'bg-gray-100 text-gray-600';
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{status ? status.replace('_', ' ') : 'UNKNOWN'}</span>;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[#1A237E] font-bold text-xl bg-[#FAFAFA]">Loading Compliance Data...</div>;

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#1A237E] selection:bg-[#FF6D00] selection:text-white pb-20 font-sans">
            <div className="max-w-screen-2xl mx-auto px-6 pt-32 pb-8 flex justify-between items-end">
                <div>
                    <span className="text-[#FF6D00] font-bold uppercase tracking-widest text-[11px] mb-2 block">Administration</span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#1A237E] leading-none">
                        Compliance<br/>Registry
                    </h1>
                </div>
            </div>

            <main className="max-w-screen-2xl mx-auto px-6">
                
                {/* MATCHING METRICS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#004D40] mb-4">Total Records</span>
                        <span className="text-4xl font-medium text-[#1A237E]">{complianceMetrics.total}</span>
                    </div>
                    <div className="bg-[#F0FDF4] rounded-2xl p-6 border border-[#DCFCE7] shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#15803D] mb-4">Compliant</span>
                        <span className="text-4xl font-medium text-[#15803D]">{complianceMetrics.compliant}</span>
                    </div>
                    <div className="bg-[#F0F5FF] rounded-2xl p-6 border border-[#E0E7FF] shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1D4ED8] mb-4">Partially Compliant</span>
                        <span className="text-4xl font-medium text-[#1D4ED8]">{complianceMetrics.partially}</span>
                    </div>
                    <div className="bg-[#FFF0F2] rounded-2xl p-6 border border-[#FFE4E6] shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#BE123C] mb-4">Non Compliant</span>
                        <span className="text-4xl font-medium text-[#BE123C]">{complianceMetrics.non}</span>
                    </div>
                    <div className="bg-[#FFFDF0] rounded-2xl p-6 border border-[#FEF3C7] shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] mb-4">Under Review</span>
                        <span className="text-4xl font-medium text-[#B45309]">{complianceMetrics.review}</span>
                    </div>
                </div>

                {/* MATCHING FILTER BAR */}
                <div className="flex flex-col xl:flex-row justify-between items-center bg-white rounded-2xl p-3 shadow-sm border border-gray-200 mb-8 gap-4">
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full xl:w-auto">
                        <div className="relative w-full md:w-64">
                            <span className="absolute left-4 top-3.5 text-gray-400 text-sm">🔍</span>
                            <input type="text" placeholder="Search ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-[#1A237E] focus:outline-none focus:border-[#FF6D00]" />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto px-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-[#1A237E] focus:outline-none">
                            <option value="ALL">All Status</option>
                            <option value="COMPLIANT">Compliant</option>
                            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                            <option value="NON_COMPLIANT">Non Compliant</option>
                            <option value="PENDING_REVIEW">Under Review</option>
                        </select>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full md:w-auto px-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-[#1A237E] focus:outline-none">
                            <option value="ALL">All Types</option>
                            <option value="SITE">Site</option>
                            <option value="EVENT">Event</option>
                            <option value="PROGRAM">Program</option>
                        </select>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-auto px-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none" />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-auto px-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none" />
                        
                        <button onClick={handleClearFilters} className="w-full md:w-auto px-8 py-3 bg-[#F3F4F6] hover:bg-gray-200 text-[#1A237E] font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors">Clear</button>
                    </div>

                    <button onClick={() => setIsComplianceModalOpen(true)} className="w-full xl:w-auto bg-[#FF6D00] text-white font-black uppercase tracking-widest px-8 py-3.5 text-[11px] rounded-xl hover:bg-[#E65100] shadow-md transition-all duration-300">
                        + New Check
                    </button>
                </div>

                {/* MATCHING TABLE UI */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto p-6">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100">Compliance ID</th>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100">Entity Type</th>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100">Entity ID</th>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100">Status</th>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100">Date Logged</th>
                                    <th className="pb-4 font-black uppercase tracking-[0.15em] text-[10px] text-[#9FA8DA] border-b border-gray-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplianceRecords.length === 0 && (
                                    <tr><td colSpan="6" className="py-10 text-center text-gray-400 font-medium">No records found.</td></tr>
                                )}
                                {filteredComplianceRecords.map((record) => (
                                    <tr key={record.complianceId} className="group border-b border-gray-50 hover:bg-[#F8F9FA] transition-colors">
                                        <td className="py-5 font-bold text-[#1A237E] text-sm">#{record.complianceId}</td>
                                        <td className="py-5 font-medium text-gray-600 text-sm">{record.type}</td>
                                        <td className="py-5 font-medium text-[#1A237E] text-sm">#{record.entityId}</td>
                                        <td className="py-5">{getStatusBadge(record.result)}</td>
                                        <td className="py-5 text-sm text-gray-500 font-medium">
                                            {record.createdAt || record.date ? new Date(record.createdAt || record.date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-5 text-right space-x-2">
                                            <button onClick={() => openUpdateModal(record)} className="px-5 py-2 bg-[#E8EAF6] text-[#1A237E] hover:bg-[#1A237E] hover:text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300">
                                                Update &rarr;
                                            </button>
                                            <button onClick={() => handleDeleteCompliance(record.complianceId)} className="px-5 py-2 bg-[#FFEBEE] text-[#C62828] hover:bg-[#C62828] hover:text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <ComplianceModal isOpen={isComplianceModalOpen} onClose={() => setIsComplianceModalOpen(false)} onSubmit={handleCreateCompliance} />
            <UpdateComplianceModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} onSubmit={handleUpdateComplianceResult} record={selectedCompliance} />
        </div>
    );
};

export default ComplianceDashboard;
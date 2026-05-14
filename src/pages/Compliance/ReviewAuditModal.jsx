import React, { useState, useEffect } from 'react';
 
const ReviewAuditModal = ({ isOpen, onClose, onSubmit, audit }) => {
    const [formData, setFormData] = useState({ findings: '', status: '' });
    const [loading, setLoading] = useState(false);
 
    useEffect(() => {
        if (audit) {
            setFormData({ findings: audit.findings || '', status: audit.status || 'PLANNED' });
        }
    }, [audit]);
 
    if (!isOpen || !audit) return null;
 
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(audit.auditId, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
 
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A237E]/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-[#1A237E] p-6 text-white flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6D00] block mb-1">Review Audit</span>
                        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest leading-none">Audit #{audit.auditId}</h2>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-xl">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Audit Scope</span>
                            <span className="text-sm font-black text-[#1A237E] leading-snug">{audit.scope}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Date Created</span>
                            <span className="text-xs font-medium text-gray-600">{audit.date ? new Date(audit.date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]">Update Audit Status *</label>
                        <select required name="status" value={formData.status} onChange={handleChange} className="px-4 py-3.5 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:border-[#FF6D00] text-sm font-black text-[#1A237E]">
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]">Audit Findings / Notes</label>
                        <textarea maxLength="2000" name="findings" value={formData.findings} onChange={handleChange} rows="4" className="px-4 py-3.5 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:border-[#FF6D00] text-sm font-medium resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-[#1A237E] bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading || (formData.status === audit.status && formData.findings === audit.findings)} className="bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-3 text-[10px] rounded-full hover:bg-[#1A237E] disabled:opacity-50">{loading ? 'Saving...' : 'Save Review'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
 
export default ReviewAuditModal;
 
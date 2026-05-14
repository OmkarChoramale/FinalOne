import React, { useState, useEffect } from 'react';
 
const UpdateComplianceModal = ({ isOpen, onClose, onSubmit, record }) => {
    const [selectedResult, setSelectedResult] = useState('');
    const [loading, setLoading] = useState(false);
 
    useEffect(() => {
        if (record) setSelectedResult(record.result);
    }, [record]);
 
    if (!isOpen || !record) return null;
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(record.complianceId, selectedResult);
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6D00] block mb-1">Update Record</span>
                        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest leading-none">{record.referenceNumber}</h2>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-xl">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Entity Type</span>
                            <span className="text-sm font-black text-[#1A237E]">{record.type}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Entity ID</span>
                            <span className="text-sm font-black text-[#1A237E]">#{record.entityId}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]">Update Compliance Result *</label>
                        <select required value={selectedResult} onChange={(e) => setSelectedResult(e.target.value)} className="px-4 py-3.5 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:border-[#FF6D00] text-sm font-black text-[#1A237E]">
                            <option value="PENDING_REVIEW">Pending Review</option>
                            <option value="COMPLIANT">Compliant</option>
                            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                            <option value="NON_COMPLIANT">Non Compliant</option>
                            <option value="EXEMPT">Exempt</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-[#1A237E] bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading || selectedResult === record.result} className="bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-3 text-[10px] rounded-full hover:bg-[#1A237E] disabled:opacity-50">{loading ? 'Updating...' : 'Update Status'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
 
export default UpdateComplianceModal;
 
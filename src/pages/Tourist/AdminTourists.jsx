import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Users, FileText, CheckCircle, XCircle, Trash2, X, AlertTriangle, Check, Info, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import api from '../../services/api';

const AdminTourists = () => {
    const [tourists, setTourists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    const [selectedTourist, setSelectedTourist] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [remarks, setRemarks] = useState({});
    const [processingDoc, setProcessingDoc] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    const fetchTourists = useCallback(async (page = 0, currentStatus = 'ALL') => {
        setLoading(true);
        try {
            const statusParam = currentStatus !== 'ALL' ? `&status=${currentStatus}` : '';
            const response = await api.get(`/tourismgov/v1/tourist/admin?page=${page}&size=10${statusParam}`);
            setTourists(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setCurrentPage(response.data.number || 0);
        } catch { showToast("Failed to load records. Check permissions.", "error"); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTourists(currentPage, statusFilter); }, [currentPage, statusFilter, fetchTourists]);

    const handleViewDetails = async (touristId) => {
        setIsModalOpen(true);
        setLoadingDetails(true);
        try {
            const response = await api.get(`/tourismgov/v1/tourist/${touristId}`);
            setSelectedTourist(response.data);
            setRemarks({});
        } catch { showToast("Could not retrieve full details.", "error"); setIsModalOpen(false); } 
        finally { setLoadingDetails(false); }
    };

    const handleViewDocument = async (documentId) => {
        try {
            const { data } = await api.get(`/tourismgov/v1/touristdoc/documents/${documentId}/view`);
            if (data?.fileUri) window.open(data.fileUri, '_blank');
            else showToast("Document link unavailable.", "error");
        } catch { showToast("Could not retrieve document.", "error"); }
    };

    const handleVerifyDocument = async (touristId, documentId, status) => {
        setProcessingDoc(documentId);
        try {
            await api.patch(`/tourismgov/v1/touristdoc/${touristId}/documents/${documentId}/verify`, {
                status, remarks: remarks[documentId] || (status === 'VERIFIED' ? 'Approved' : 'Rejected')
            });
            showToast(`Document ${status.toLowerCase()}!`, "success");
            await handleViewDetails(touristId);
        } catch (err) { showToast(err.response?.data?.message || "Update failed.", "error"); } 
        finally { setProcessingDoc(null); }
    };

    const triggerConfirm = (title, message, onConfirm) => {
        setConfirmDialog({ show: true, title, message, onConfirm: async () => {
            setConfirmDialog({ show: false });
            await onConfirm();
        }});
    };

    const deleteDoc = async (tId, dId) => {
        setProcessingDoc(dId);
        try {
            await api.delete(`/tourismgov/v1/touristdoc/${tId}/documents/${dId}`);
            showToast("Document deleted.", "success");
            await handleViewDetails(tId);
        } catch { showToast("Failed to delete document.", "error"); } 
        finally { setProcessingDoc(null); }
    };

    const deleteProfile = async (tId) => {
        try {
            await api.delete(`/tourismgov/v1/tourist/${tId}`);
            showToast("Profile deleted.", "success");
            setIsModalOpen(false); setSelectedTourist(null); fetchTourists(currentPage, statusFilter);
        } catch { showToast("Failed to delete profile.", "error"); }
    };

    const displayedTourists = tourists.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.touristId.toString().includes(searchTerm));

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans pt-32 pb-20 px-6 relative">
            
            {/* TOAST & CONFIRM DIALOGS */}
            {toast.show && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border ${toast.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                </div>
            )}
            {confirmDialog.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1A237E]/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                        <AlertTriangle size={48} className="mx-auto text-rose-600 mb-4 bg-rose-100 p-3 rounded-full" />
                        <h2 className="text-2xl font-black uppercase text-[#1A237E] mb-2">{confirmDialog.title}</h2>
                        <p className="text-sm font-medium text-slate-500 mb-8">{confirmDialog.message}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmDialog({ show: false })} className="flex-1 py-3 bg-gray-100 text-gray-500 font-black uppercase rounded-full hover:bg-gray-200">Cancel</button>
                            <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-rose-600 text-white font-black uppercase rounded-full hover:bg-rose-700">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN DASHBOARD */}
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3"><Users className="text-[#FF6D00]" size={36} /> Directory</h1>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }} className="border border-gray-200 p-3 rounded-full text-xs font-bold outline-none bg-gray-50 text-[#1A237E] focus:border-[#FF6D00]">
                            <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                        </select>
                        <input type="text" placeholder="Search by ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 border border-gray-200 p-3 rounded-full text-xs font-bold outline-none bg-gray-50 text-[#1A237E] focus:border-[#FF6D00]" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 border-b uppercase tracking-widest bg-gray-50">
                                <th className="p-4">ID</th><th className="p-4">Tourist Name</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" className="p-10 text-center animate-pulse font-bold text-[#1A237E]">Loading...</td></tr> : 
                             displayedTourists.length === 0 ? <tr><td colSpan="4" className="p-10 text-center font-bold text-gray-400">No records found.</td></tr> : 
                             displayedTourists.map(t => (
                                <tr key={t.touristId} onClick={() => handleViewDetails(t.touristId)} className="border-b hover:bg-[#F8F9FF] cursor-pointer transition-colors">
                                    <td className="p-4 text-xs font-bold text-gray-500">#{t.touristId}</td>
                                    <td className="p-4 text-sm font-bold text-[#1A237E]">{t.name}</td>
                                    <td className="p-4 text-center"><span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{t.status}</span></td>
                                    <td className="p-4 text-right text-gray-300 font-black">View →</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || loading} className="px-4 py-2 text-[10px] font-black uppercase bg-white border border-gray-200 rounded-xl disabled:opacity-50">Prev</button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page {currentPage + 1} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1 || loading} className="px-4 py-2 text-[10px] font-black uppercase bg-white border border-gray-200 rounded-xl disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && selectedTourist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A237E]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 z-10"><X size={20} /></button>
                        
                        {loadingDetails ? <div className="p-32 text-center flex flex-col items-center"><Loader2 className="animate-spin text-[#FF6D00] mb-4" size={40} /><p className="font-black text-xs uppercase tracking-widest">Loading...</p></div> : (
                            <div className="p-8 md:p-12 overflow-y-auto">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-8 mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-[#1A237E] text-white rounded-full flex items-center justify-center text-2xl font-black shadow-lg">{selectedTourist.name.charAt(0)}</div>
                                        <div>
                                            <h2 className="text-3xl font-black uppercase tracking-tight text-[#1A237E]">{selectedTourist.name}</h2>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ID: #{selectedTourist.touristId} | {selectedTourist.status}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => triggerConfirm('Delete Profile', 'Permanently delete this profile?', () => deleteProfile(selectedTourist.touristId))} className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 font-black uppercase text-[10px] rounded-full hover:bg-rose-600 hover:text-white border border-rose-100">
                                        <Trash2 size={14} /> Delete Profile
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div><p className="text-[9px] font-black uppercase text-gray-400 mb-1">Email</p><p className="text-xs font-bold text-[#1A237E]">{selectedTourist.email}</p></div>
                                    <div><p className="text-[9px] font-black uppercase text-gray-400 mb-1">Phone</p><p className="text-xs font-bold text-[#1A237E]">{selectedTourist.contactInfo}</p></div>
                                    <div><p className="text-[9px] font-black uppercase text-gray-400 mb-1">DOB</p><p className="text-xs font-bold text-[#1A237E]">{selectedTourist.dob}</p></div>
                                    <div><p className="text-[9px] font-black uppercase text-gray-400 mb-1">Gender</p><p className="text-xs font-bold text-[#1A237E]">{selectedTourist.gender}</p></div>
                                </div>

                                <h3 className="text-lg font-black uppercase flex items-center gap-2 mb-4"><FileText className="text-[#FF6D00]" size={20} /> Documents</h3>
                                <div className="space-y-4">
                                    {!selectedTourist.documents?.length ? <p className="text-center text-xs font-bold text-gray-400 p-8 border border-dashed rounded-3xl">No documents uploaded.</p> : 
                                    selectedTourist.documents.map(doc => (
                                        <div key={doc.documentId} className="bg-[#F8F9FF] p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">📄</div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-[#1A237E]">{doc.docType.replace('_', ' ')}</p>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest ${doc.verificationStatus === 'VERIFIED' ? 'text-green-600' : doc.verificationStatus === 'REJECTED' ? 'text-rose-600' : 'text-orange-500'}`}>{doc.verificationStatus}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                {/* 🔥 HIDE INPUT AND APPROVE/REJECT IF VERIFIED 🔥 */}
                                                {doc.verificationStatus !== 'VERIFIED' ? (
                                                    <>
                                                        <input type="text" placeholder="Remarks..." value={remarks[doc.documentId] || ''} onChange={(e) => setRemarks({...remarks, [doc.documentId]: e.target.value})} className="w-32 text-[10px] font-bold border rounded-lg px-3 py-2 outline-none focus:border-[#FF6D00]" />
                                                        <button onClick={() => handleVerifyDocument(selectedTourist.touristId, doc.documentId, 'VERIFIED')} className="bg-green-50 text-green-600 px-3 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-green-600 hover:text-white border border-green-200"><Check size={14}/></button>
                                                        <button onClick={() => handleVerifyDocument(selectedTourist.touristId, doc.documentId, 'REJECTED')} className="bg-rose-50 text-rose-600 px-3 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-rose-600 hover:text-white border border-rose-200"><X size={14}/></button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded-lg mr-2">
                                                        <CheckCircle size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Approved</span>
                                                    </div>
                                                )}
                                                
                                                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                                <button onClick={() => handleViewDocument(doc.documentId)} className="bg-[#1A237E] text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-[#FF6D00]">View</button>
                                                <button onClick={() => triggerConfirm('Delete Document', 'Delete this document forever?', () => deleteDoc(selectedTourist.touristId, doc.documentId))} className="text-gray-400 hover:text-rose-600 p-2"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTourists;
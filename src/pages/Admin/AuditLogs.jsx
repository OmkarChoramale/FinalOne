import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from "../../components/Footer";

const AuditLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterAction, setFilterAction] = useState('');

  // Adjust base URL if your Spring Boot runs on a different port/host
  const API_BASE_URL = 'http://localhost:8383/tourismgov/v1/audit-logs';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}?page=${page}&size=10&sort=timestamp,desc`;
      
      // If filtering by action
      if (filterAction) {
        url = `${API_BASE_URL}/action/${filterAction}?page=${page}&size=10&sort=timestamp,desc`;
      }

      const token = localStorage.getItem('token');

      // Make the fetch request with the Authorization header
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized: Your session may have expired. Please log in again.');
        }
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.content || []); 
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Security check
    if (!token || !storedUser || (storedUser.role !== 'ADMIN' && storedUser.role !== 'OFFICER')) {
      navigate('/login');
      return;
    }
    
    fetchLogs();
  }, [page, filterAction, navigate]);

  const handleFilterChange = (e) => {
    setFilterAction(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] selection:bg-[#FF6D00] selection:text-white flex flex-col">
      <main className="flex-grow max-w-screen-2xl mx-auto px-4 md:px-6 pt-32 pb-16 w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#1A237E] leading-none">
              System <br /> <span className="text-[#FF6D00]">Audit Logs</span>
            </h1>
            <p className="mt-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              Monitor user activities and system events
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by Action (e.g. LOGIN)"
              value={filterAction}
              onChange={handleFilterChange}
              className="px-4 py-2 border-2 border-[#1A237E]/20 rounded-full focus:outline-none focus:border-[#FF6D00] text-sm font-medium"
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A237E] text-white uppercase text-[10px] tracking-widest">
                  <th className="p-4 font-bold">Log ID</th>
                  <th className="p-4 font-bold">User ID</th>
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#1A237E]/50 font-bold">Loading logs...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-red-500 font-bold">Error: {error}</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#1A237E]/50 font-bold">No audit logs found.</td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr key={log.auditId || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-[#1A237E]/70">#{log.auditId}</td>
                      <td className="p-4">{log.userId || 'System'}</td>
                      <td className="p-4">
                        <span className="bg-[#FF6D00]/10 text-[#FF6D00] px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-[#1A237E]/70">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 max-w-xs truncate" title={`${log.resource} - ${log.status}`}>
                        {log.resource} - {log.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="p-4 flex justify-between items-center border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1A237E] disabled:opacity-30 hover:text-[#FF6D00] transition-colors"
              >
                &larr; Previous
              </button>
              <span className="text-xs font-bold opacity-70">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1A237E] disabled:opacity-30 hover:text-[#FF6D00] transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuditLogs;
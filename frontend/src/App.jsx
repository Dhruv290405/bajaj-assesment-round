import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Filter, AlertTriangle, Clock, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';

const API_BASE = 'https://deskflow-api-dhruv.vercel.app/tickets';

const App = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({ priority: '', breached: false });
    const [formError, setFormError] = useState('');

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        customerEmail: '',
        priority: 'medium'
    });

    const fetchTickets = useCallback(async () => {
        try {
            const params = {};
            if (filters.priority) params.priority = filters.priority;
            if (filters.breached) params.breached = true;
            
            const res = await axios.get(API_BASE, { params });
            setTickets(res.data);
        } catch (err) {
            console.error('Fetch tickets error:', err);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Fetch stats error:', err);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchTickets(), fetchStats()]);
            setLoading(false);
        };
        load();
    }, [fetchTickets, fetchStats]);

    // Format age
    const formatAge = (mins) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const res = await axios.post(API_BASE, newTicket);
            setTickets([res.data, ...tickets]);
            setShowModal(false);
            setNewTicket({ subject: '', description: '', customerEmail: '', priority: 'medium' });
            fetchStats();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Something went wrong');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await axios.patch(`${API_BASE}/${id}`, { status: newStatus });
            // Update local state instead of refetching everything
            setTickets(tickets.map(t => t._id === id ? res.data : t));
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Transition failed');
        }
    };

    const deleteTicket = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await axios.delete(`${API_BASE}/${id}`);
            setTickets(tickets.filter(t => t._id !== id));
            fetchStats();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const getStatusTickets = (status) => tickets.filter(t => t.status === status);

    const statuses = [
        { key: 'open', label: 'Open' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'resolved', label: 'Resolved' },
        { key: 'closed', label: 'Closed' }
    ];

    return (
        <div className="app-container">
            <header>
                <div>
                    <h1>DeskFlow</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Support Ticket Board</p>
                </div>
                
                {stats && (
                    <div className="stats-strip">
                        <div className="stat-item">
                            <span className="stat-label">Urgent Breaches</span>
                            <span className="stat-value" style={{ color: 'var(--urgent)' }}>{stats.openBreachedCount}</span>
                        </div>
                        {statuses.map(s => (
                            <div className="stat-item" key={s.key}>
                                <span className="stat-label">{s.label}</span>
                                <span className="stat-value">{stats.statusCounts[s.key]}</span>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> New Ticket
                </button>
            </header>

            <div className="filters-bar">
                <div className="filter-group">
                    <Filter size={18} color="var(--text-secondary)" />
                    <select 
                        value={filters.priority} 
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    
                    <label className="breached-only-toggle">
                        <input 
                            type="checkbox" 
                            checked={filters.breached}
                            onChange={(e) => setFilters({ ...filters, breached: e.target.checked })}
                        />
                        <span style={{ fontSize: '0.9rem' }}>SLA Breached Only</span>
                    </label>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div className="board">
                    {statuses.map((status, idx) => (
                        <div key={status.key} className="column">
                            <div className="column-header">
                                <span>{status.label}</span>
                                <span style={{ opacity: 0.5 }}>{getStatusTickets(status.key).length}</span>
                            </div>
                            
                            {getStatusTickets(status.key).map(ticket => (
                                <div 
                                    key={ticket._id} 
                                    className={`ticket-card ${ticket.slaBreached ? 'breached' : ''}`}
                                >
                                    <span className={`priority-badge priority-${ticket.priority}`}>
                                        {ticket.priority}
                                    </span>
                                    
                                    {ticket.slaBreached && (
                                        <div className="badge-breached">
                                            <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                                            SLA BREACHED
                                        </div>
                                    )}

                                    <div className="ticket-subject">{ticket.subject}</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        {ticket.description.length > 60 ? ticket.description.substring(0,60) + '...' : ticket.description}
                                    </p>

                                    <div className="ticket-meta">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} />
                                            {formatAge(ticket.ageMinutes)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {ticket.customerEmail}
                                        </div>
                                    </div>

                                    <div className="ticket-actions">
                                        {/* Back Action */}
                                        {idx > 0 && idx < 3 && (
                                            <button 
                                                className="action-btn"
                                                onClick={() => updateStatus(ticket._id, statuses[idx-1].key)}
                                                title={`Move to ${statuses[idx-1].label}`}
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                        )}
                                        {/* Forward Action */}
                                        {idx < 3 && (
                                            <button 
                                                className="action-btn"
                                                onClick={() => updateStatus(ticket._id, statuses[idx+1].key)}
                                                title={`Move to ${statuses[idx+1].label}`}
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        )}
                                        <button 
                                            className="action-btn"
                                            onClick={() => deleteTicket(ticket._id)}
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Ticket</h2>
                        <form onSubmit={handleCreateTicket} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                                    placeholder="e.g. Cannot access dashboard"
                                />
                            </div>
                            <div className="form-group">
                                <label>Customer Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={newTicket.customerEmail}
                                    onChange={e => setNewTicket({...newTicket, customerEmail: e.target.value})}
                                    placeholder="customer@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select 
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                                >
                                    <option value="urgent">Urgent (1h)</option>
                                    <option value="high">High (4h)</option>
                                    <option value="medium">Medium (24h)</option>
                                    <option value="low">Low (72h)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    rows="4" 
                                    required
                                    value={newTicket.description}
                                    onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                                    placeholder="Provide details about the issue..."
                                />
                            </div>
                            
                            {formError && <p className="error-text">{formError}</p>}

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'white', border: 'none' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

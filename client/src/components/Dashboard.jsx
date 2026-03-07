import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import api from '../axios/api';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [protectedData, setProtectedData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await api.get('/protected');
                setProtectedData(response.data);
            } catch (err) {
                console.error("Failed to fetch protected data", err);
                setError('Failed to fetch protected data. You might need to log in again.');
            }
        };

        fetchProtectedData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Dashboard</h2>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--success-text)', fontSize: '0.9rem' }}>
                        ● Authenticated Session Active
                    </p>
                </div>
                <button className="danger" onClick={handleLogout}>
                    Sign Out
                </button>
            </header>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                        User Profile Context
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user?.name}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user?.email}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</span>
                            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: 'full', fontSize: '0.85rem', borderRadius: '999px', marginTop: '0.25rem' }}>
                                End User
                            </span>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
                    <h3 style={{ color: 'var(--success-text)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid var(--success-border)', paddingBottom: '0.75rem' }}>
                        Protected API Response
                    </h3>

                    {error ? (
                        <div style={{ color: 'var(--danger-bg)', fontSize: '0.9rem' }}>{error}</div>
                    ) : protectedData ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                {JSON.stringify(protectedData, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            <span style={{ display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                                Fetching secure data...
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                `}
            </style>
        </div>
    );
};

export default Dashboard;

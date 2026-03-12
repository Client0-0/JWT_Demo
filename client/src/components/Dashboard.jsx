import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthProvider';
import api from '../axios/api';
import ProfileSettingsModal from './ProfileSettingsModal';
import { useCountdown } from '../hooks/useCountdown';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [protectedData, setProtectedData] = useState(null);
    const [error, setError] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // We add a piece of state just to force a re-render when we do a background refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Read expiries from local storage
    const accessTokenExp = Number(localStorage.getItem('accessTokenExp'));
    const refreshTokenExp = Number(localStorage.getItem('refreshTokenExp'));

    const {
        formattedTime: accTime,
        isExpired: accExpired
    } = useCountdown(accessTokenExp);

    const {
        formattedTime: refTime,
        isExpired: refExpired
    } = useCountdown(refreshTokenExp);

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await api.get('/api/protected');
                setProtectedData(response.data);
            } catch (err) {
                console.error("Failed to fetch protected data", err);
                setError('Failed to fetch protected data. You might need to log in again.');
            }
        };

        fetchProtectedData();
    }, [refreshTrigger]); // Add refreshTrigger to dependencies to re-fetch data

    const doBackgroundRefresh = useCallback(async () => {
        try {
            const res = await api.post('/api/refresh');
            const newAccessToken = res.data.accessToken;
            const newAccessTokenExp = res.data.accessTokenExp;

            localStorage.setItem('accessToken', newAccessToken);
            if (newAccessTokenExp) {
                localStorage.setItem('accessTokenExp', newAccessTokenExp);
            }

            toast.info("🔄 Access token expired. New token generated instantly in background!", {
                autoClose: 3000,
            });

            // Re-render the dashboard to update the countdown timer
            setRefreshTrigger(prev => prev + 1);

        } catch (err) {
            console.error("Background refresh failed", err);
            toast.error("Session completely expired. Please log in again.");
            logout();
            navigate('/login');
        }
    }, [logout, navigate]);

    // Triggers instantly when the access token timer hits 0
    useEffect(() => {
        if (accExpired && !refExpired) {
            doBackgroundRefresh();
        }
    }, [accExpired, refExpired, doBackgroundRefresh]);

    // Triggers when the refresh token itself expires — full session is over
    // Guard: refreshTokenExp > 0 prevents firing when localStorage is empty (value = 0)
    useEffect(() => {
        if (refExpired && refreshTokenExp > 0) {
            toast.error("🔒 Your session has fully expired. Please sign in again.", {
                autoClose: 3000,
            });
            // Give the toast a moment to show before redirecting
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
        }
    }, [refExpired, refreshTokenExp, logout, navigate]);

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
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ background: 'transparent', border: '1px solid var(--primary-color)' }}
                    >
                        Profile Settings
                    </button>
                    <button className="danger" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
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
                            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.85rem', borderRadius: '999px', marginTop: '0.25rem' }}>
                                End User
                            </span>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Session Timers</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>Access Token:</span>
                                <span style={{
                                    fontFamily: 'monospace',
                                    color: accExpired ? 'var(--danger-bg)' : 'var(--success-text)',
                                    fontWeight: 'bold',
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    {accTime}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem' }}>Refresh Token:</span>
                                <span style={{
                                    fontFamily: 'monospace',
                                    color: refExpired ? 'var(--danger-bg)' : 'var(--success-text)',
                                    fontWeight: 'bold',
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    {refTime}
                                </span>
                            </div>
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

            {isSettingsOpen && (
                <ProfileSettingsModal onClose={() => setIsSettingsOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;

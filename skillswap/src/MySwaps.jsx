import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewModal from './ReviewModal'; 

const MySwaps = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [swaps, setSwaps] = useState([]);
    const [filter, setFilter] = useState('All'); 
    const [loading, setLoading] = useState(true);
    
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTargetSwap, setReviewTargetSwap] = useState(null);
    
    const [notificationCount, setNotificationCount] = useState(0); 

    useEffect(() => {
        const fetchSwapsAndInit = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            if (parsedUser.userId) {
                fetchNotifications(parsedUser.userId);
            }
            
            try {
                const receivedRes = await axios.get(`http://localhost:8080/api/swaps/received/${parsedUser.userId}`);
                const sentRes = await axios.get(`http://localhost:8080/api/swaps/sent/${parsedUser.userId}`);
                
                const allSwaps = [...receivedRes.data, ...sentRes.data].sort((a,b) => b.swapId - a.swapId);
                setSwaps(allSwaps);
            } catch (err) {
                console.error("Failed to fetch swaps", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSwapsAndInit();
    }, [navigate]);

    const handleLeaveReviewClick = (swap) => {
        setReviewTargetSwap(swap);
        setShowReviewModal(true);
    };

    const handleReviewSuccess = () => {
        setShowReviewModal(false);
    };

    const fetchNotifications = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/swaps/received/${userId}`);
            const pendingCount = response.data.filter(swap => swap.status === 'PENDING').length;
            setNotificationCount(pendingCount);
        } catch (error) {
            console.error("Failed to fetch notification count:", error);
            setNotificationCount(0);
        }
    };

    const handleAction = async (swapId, action) => {
        try {
            // FIX: Ensure authentication token is sent with PUT requests if necessary
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            await axios.put(`http://localhost:8080/api/swaps/${swapId}/${action}`, {}, { headers });
            
            setSwaps(prev => prev.map(s => 
                s.swapId === swapId ? { 
                    ...s, 
                    status: action === 'complete' ? 'COMPLETED' : (action === 'accept' ? 'ACCEPTED' : 'REJECTED') 
                } : s
            ));
            
            if (user && user.userId) {
                fetchNotifications(user.userId);
            }
            
        } catch (err) {
            alert("Action failed. Check backend console.");
        }
    };

    const filteredSwaps = swaps.filter(swap => {
        const status = swap.status;

        switch (filter) {
            case 'All':
                return true;
            case 'Pending':
                return status === 'PENDING';
            case 'Active':
                return status === 'ACCEPTED';
            case 'Completed':
                return status === 'COMPLETED';
            default:
                return true;
        }
    });

    const styles = `
        /* GLOBAL RESET & BASE STYLES */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; background-color: #FFF8E1; }
        .swaps-body { width: 100%; min-height: 100vh; background: #FFF8E1; overflow-x: hidden; }

        /* NAVBAR  */
        .navbar { background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #060606; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; }
        .nav-left { display: flex; align-items: center; gap: 48px; }
        .logo { font-size: 1.75rem; font-weight: 800; color: #060606; letter-spacing: -0.5px; cursor: pointer; }
        .nav-tabs { display: flex; gap: 8px; background: rgba(255,255,255,0.3); padding: 6px; border-radius: 30px; backdrop-filter: blur(10px); }
        
        .nav-tab { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 24px; text-decoration: none; color: #060606; font-weight: 600; transition: all 0.3s ease; border: none; background: transparent; cursor: pointer; font-size: 0.95rem; font-family: 'Inter', sans-serif; }
        .nav-tab:hover { background: rgba(122,0,0,0.1); transform: translateY(-2px); }
        .nav-tab.active { background: #060606; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        
        /* Notification Badge Style */
        .notification-badge {
            position: absolute; top: 5px; right: 5px; background: #dc3545; color: white;
            border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center;
            justify-content: center; font-size: 0.7rem; font-weight: 700; padding: 2px;
            line-height: 1; z-index: 10;
        }

        .nav-right { display: flex; align-items: center; gap: 16px; }
        .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, maroon 0%, #5a0000 100%); color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(122,0,0,0.3); cursor: pointer; }

        /* CONTENT */
        .container { max-width: 950px; margin: 40px auto; padding: 0 20px; }
        .page-header { margin-bottom: 30px; }
        .page-title { font-size: 1.8rem; font-weight: 800; color: #000; margin-bottom: 20px; }

        /* --- FILTER BAR (Refined Appearance) --- */
        .filter-bar { 
            display: flex; 
            gap: 10px; 
            background: #f0f0f0; 
            padding: 4px; 
            border-radius: 50px; 
            width: fit-content; 
            box-shadow: 0 1px 5px rgba(0,0,0,0.05); 
        }
        .filter-btn { 
            padding: 8px 24px; 
            border-radius: 20px; 
            border: none; 
            background: transparent; 
            font-weight: 600; 
            color: #666; 
            cursor: pointer; 
            transition: all 0.2s; 
            font-size: 0.9rem; 
            font-family: 'Inter', sans-serif; 
        }
        .filter-btn:hover:not(.active) { 
            background: #e5e5e5; 
        }
        .filter-btn.active { 
            background: #000; 
            color: #ffffff; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); 
            transform: translateY(-1px); 
        }
        /* -------------------------------------- */

        .swap-card { background: white; border-radius: 16px; padding: 25px; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 20px; display: flex; flex-direction: column; gap: 20px; transition: transform 0.2s; }
        .swap-card:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.06); }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; }
        .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-accepted { background: #cce5ff; color: #004085; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .swap-date { color: #888; font-size: 0.85rem; font-weight: 500; }

        .card-main { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
        .swap-party { display: flex; align-items: center; gap: 15px; width: 40%; }
        .party-avatar { width: 50px; height: 50px; border-radius: 50%; background: #eee; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #666; border: 1px solid #ddd; }
        .party-info h3 { font-size: 1rem; font-weight: 700; color: #000; margin: 0 0 4px 0; }
        .party-info p { font-size: 0.85rem; color: #666; margin: 0; }
        .swap-icon { font-size: 1.5rem; color: #007bff; display: flex; align-items: center; justify-content: center; width: 20%; }

        .card-actions { display: flex; gap: 15px; border-top: 1px solid #f0f0f0; padding-top: 20px;}
        .btn { flex: 1; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; text-align: center; border: none; font-family: 'Inter', sans-serif; }
        
        .btn-review { background: #FFC300; color: #000; border: 1px solid #e0a800; }
        .btn-review:hover { background: #e0a800; }
        .btn-accept { background: #28a745; color: white; }
        .btn-reject { background: #dc3545; color: white; }
        .btn-complete { background: #000; color: white; } 

        .no-swaps { text-align: center; padding: 50px; color: #888; font-style: italic; background: white; border-radius: 12px; border: 1px solid #e0e0e0; }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="swaps-body">
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            
                            {/* MESSAGES TAB */}
                            <button className="nav-tab" onClick={() => navigate('/messages')}>
                                Messages
                            </button>
                            
                            {/* MY SWAPS TAB (Notification badge moved here) */}
                            <button className="nav-tab active" onClick={() => navigate('/myswaps')}>
                                MySwaps
                                {notificationCount > 0 && (
                                    <span className="notification-badge">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="nav-right">
                        <div className="avatar" onClick={() => navigate('/profile')}>{user?.name?.charAt(0) || 'U'}</div>
                    </div>
                </nav>

                <div className="container">
                    <div className="page-header">
                        <h2 className="page-title">My Skill Swaps</h2>
                        <div className="filter-bar">
                            {['All', 'Pending', 'Active', 'Completed'].map(f => (
                                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                            ))}
                        </div>
                    </div>

                    {loading ? <div style={{textAlign:'center'}}>Loading...</div> : (
                        <div className="swap-list">
                            {filteredSwaps.length === 0 ? (
                                <div className="no-swaps">No swaps found.</div>
                            ) : (
                                filteredSwaps.map(swap => (
                                    <div className="swap-card" key={swap.swapId}>
                                        <div className="card-top">
                                            <span className={`status-badge status-${swap.status.toLowerCase()}`}>{swap.status}</span>
                                            <span className="swap-date">{swap.date}</span>
                                        </div>

                                        <div className="card-main">
                                            <div className="swap-party">
                                                <div className="party-avatar">{swap.requester.name.charAt(0)}</div>
                                                <div className="party-info"><h3>{swap.requester.name}</h3><p>Learner</p></div>
                                            </div>
                                            <div className="swap-icon">⇄</div>
                                            <div className="swap-party" style={{justifyContent: 'flex-end', textAlign: 'right'}}>
                                                <div className="party-info"><h3>{swap.targetOffer.user.name}</h3><p>Teacher</p></div>
                                                <div className="party-avatar" style={{background: '#FFC300', color: '#000'}}>{swap.targetOffer.user.name.charAt(0)}</div>
                                            </div>
                                        </div>

                                        <div className="card-actions">
                                            <button className="btn btn-message" onClick={() => navigate('/messages', { state: { partner: swap.requester.userId === user.userId ? swap.targetOffer.user : swap.requester } })}>Message</button>
                                            
                                            {/* PENDING ACTIONS  */}
                                            {swap.status === 'PENDING' && swap.targetOffer.user.userId === user?.userId && (
                                                <>
                                                    <button className="btn btn-accept" onClick={() => handleAction(swap.swapId, 'accept')}>Accept</button>
                                                    <button className="btn btn-reject" onClick={() => handleAction(swap.swapId, 'reject')}>Reject</button>
                                                </>
                                            )}
                                            
                                            {/* ACTIVE ACTION  */}
                                            {swap.status === 'ACCEPTED' && (
                                                <button className="btn btn-complete" onClick={() => handleAction(swap.swapId, 'complete')}>✔ Mark Complete</button>
                                            )}
                                            
                                            {/* COMPLETED ACTION */}
                                            {swap.status === 'COMPLETED' && (
                                                <button className="btn btn-review" onClick={() => handleLeaveReviewClick(swap)}>★ Leave Review</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* --- RENDER REVIEW MODAL --- */}
                {showReviewModal && reviewTargetSwap && (
                    <ReviewModal 
                        swap={reviewTargetSwap}
                        onClose={() => setShowReviewModal(false)}
                        onSuccess={handleReviewSuccess}
                    />
                )}
            </div>
        </>
    );
};

export default MySwaps;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from './Loading';

// ====================================================================
// Simplified ReviewModal Component (Included for single-file mandate)
// ====================================================================
const ReviewModal = ({ swap, onClose, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determine the recipient (the person who was the "teacher" in the swap)
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId;
    const isRequester = swap?.requester?.userId === currentUserId;
    const recipient = isRequester ? swap.targetOffer.user : swap.requester;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const reviewData = {
                swapId: swap.swapId,
                reviewedUserId: recipient.userId,
                reviewerId: currentUserId,
                rating,
                comment
            };

            const response = await axios.post('http://localhost:8080/api/reviews/submit', reviewData);

            alert(response.data || "Review submitted successfully!");
            onSuccess();
        } catch (err) {
            console.error("Failed to submit review:", err);
            const message = err.response?.data || "Failed to submit review. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };
    
    // Star rendering logic
    const renderStars = (currentRating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className="star"
                        style={{ color: star <= currentRating ? '#FFC300' : '#e0e0e0', cursor: 'pointer' }}
                        onClick={() => setRating(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Review Swap with {recipient?.name || 'Partner'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{textAlign: 'center'}}>
                        <label className="form-label" style={{marginBottom: '10px', display: 'block'}}>Rating</label>
                        {renderStars(rating)}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Comment</label>
                        <textarea 
                            className="form-textarea" 
                            rows="4" 
                            placeholder={`What did you think of the skill swap with ${recipient?.name}?`} 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            required 
                        />
                    </div>
                    {error && <div style={{color: '#dc3545', marginBottom: '15px'}}>{error}</div>}
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// ====================================================================
// DetailsModal Component
// ====================================================================
const DetailsModal = ({ swap, onClose }) => {
    if (!swap) return null;

    const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId;
    const isRequester = swap.requester.userId === currentUserId;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{marginBottom: '20px'}}>
                    <h2 className="modal-title" style={{fontSize: '1.6rem'}}>Swap #{swap.swapId} Summary</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="details-row">
                    <span className="details-label">Taught Skill</span>
                    <div className="details-value">{swap.targetOffer.skill.name} ({swap.targetOffer.skill.category})</div>
                </div>
                
                <div className="details-row">
                    <span className="details-label">Description</span>
                    <div className="details-value description-text">
                        "{swap.targetOffer.description}"
                    </div>
                </div>

                <div className="details-row-split">
                    <div>
                        <span className="details-label">Teacher</span>
                        <div className="details-value">{swap.targetOffer.user.name}</div>
                    </div>
                    <div>
                        <span className="details-label">Learner</span>
                        <div className="details-value">{swap.requester.name}</div>
                    </div>
                </div>
                
                <div className="details-row">
                    <span className="details-label">Date Requested</span>
                    <div className="details-value">{swap.date}</div>
                </div>

                <div className="details-row">
                    <span className="details-label">Current Status</span>
                    <div className={`details-value status-text status-${swap.status.toLowerCase()}`}>
                        {swap.status}
                    </div>
                </div>

                <button className="submit-btn" style={{marginTop: '30px', padding: '14px'}} onClick={onClose}>
                    Got It!
                </button>
            </div>
        </div>
    );
};


// ====================================================================
// MySwaps Component (Redesigned)
// ====================================================================
const MySwaps = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [swaps, setSwaps] = useState([]);
    const [filter, setFilter] = useState('All'); 
    const [loading, setLoading] = useState(true);
    
    // --- MODAL STATES ---
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTargetSwap, setReviewTargetSwap] = useState(null);
    const [detailsSwap, setDetailsSwap] = useState(null); 
    
    const [notificationCount, setNotificationCount] = useState(0); 

    const fetchNotifications = useCallback(async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/swaps/received/${userId}`);
            const pendingCount = response.data.filter(swap => swap.status === 'PENDING').length;
            setNotificationCount(pendingCount);
        } catch (error) {
            console.error("Failed to fetch notification count:", error);
            setNotificationCount(0);
        }
    }, []);

    const fetchSwaps = useCallback(async (parsedUser) => {
        try {
            const receivedRes = await axios.get(`http://localhost:8080/api/swaps/received/${parsedUser.userId}`);
            const sentRes = await axios.get(`http://localhost:8080/api/swaps/sent/${parsedUser.userId}`);
            
            const allSwaps = [...receivedRes.data, ...sentRes.data].sort((a,b) => new Date(b.date) - new Date(a.date));
            setSwaps(allSwaps);
        } catch (err) {
            console.error("Failed to fetch swaps", err);
        } finally {
            setLoading(false);
        }
    }, []);

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
                fetchSwaps(parsedUser);
            }
        };
        fetchSwapsAndInit();
    }, [navigate, fetchNotifications, fetchSwaps]);

    const handleLeaveReviewClick = (swap) => {
        setReviewTargetSwap(swap);
        setShowReviewModal(true);
    };

    const handleReviewSuccess = () => {
        setShowReviewModal(false);
        // Refresh swaps to potentially update the UI state if needed
        if (user?.userId) {
            fetchSwaps(user);
        }
    };

    const handleAction = async (swapId, action) => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            await axios.put(`http://localhost:8080/api/swaps/${swapId}/${action}`, {}, { headers });
            
            // Optimistically update the UI
            let newStatus = '';
            if (action === 'complete') newStatus = 'COMPLETED';
            else if (action === 'accept') newStatus = 'ACCEPTED';
            else if (action === 'reject') newStatus = 'REJECTED';

            setSwaps(prev => prev.map(s => 
                s.swapId === swapId ? { 
                    ...s, 
                    status: newStatus 
                } : s
            ));
            
            if (user && user.userId) {
                fetchNotifications(user.userId);
            }
            
        } catch (err) {
            console.error("Action failed.", err);
            // Replace alert with a styled modal/message box in a full app
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
    
    // --- Styles adapted from Profile.jsx ---
    const styles = `
        /* GLOBAL RESET & BASE STYLES */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .swaps-body { 
            width: 100%; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%); 
            overflow-x: hidden; 
            display: flex;
            flex-direction: column;
        }

        /* NAVBAR (Fixing Alignment) */
        .navbar { 
            background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); 
            padding: 18px 5vw; /* Reverted to 5vw for centered content feel, matching profile */
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 3px solid #060606; 
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            position: sticky;
            top: 0;
            z-index: 100;
            width: 100%; /* Ensure full width */
        }
        .nav-left { display: flex; align-items: center; gap: 60px; }
        .logo { font-size: 2rem; font-weight: 900; color: #060606; letter-spacing: -0.8px; cursor: pointer; transition: transform 0.2s; }
        .logo:hover { transform: scale(1.05); }
        .nav-tabs { display: flex; gap: 10px; background: rgba(255,255,255,0.35); padding: 8px; border-radius: 50px; backdrop-filter: blur(10px); }
        
        .nav-tab { 
            position: relative; 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 14px 28px; 
            border-radius: 30px; 
            text-decoration: none; 
            color: #060606; 
            font-weight: 600; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            border: none; 
            background: transparent; 
            cursor: pointer; 
            font-size: 0.95rem; 
            font-family: 'Inter', sans-serif;
        }
        .nav-tab:hover { background: rgba(6,6,6,0.08); transform: translateY(-2px); }
        .nav-tab.active { background: #060606; color: #FFC300; box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
        
        /* Notification Badge Style (from Profile.jsx) */
        .notification-badge {
            position: absolute; 
            top: 6px; 
            right: 8px; 
            background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); 
            color: white; 
            border-radius: 50%; 
            min-width: 22px; 
            height: 22px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 0.7rem; 
            font-weight: 800; 
            padding: 0 6px;
            box-shadow: 0 2px 8px rgba(255,0,0,0.4);
            line-height: 1;
        }

        .nav-right { display: flex; align-items: center; gap: 16px; }
        .avatar { 
            width: 48px; 
            height: 48px; 
            background: linear-gradient(135deg, #8B0000 0%, #5a0000 100%); 
            color: #FFC300; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 800; 
            font-size: 1.2rem; 
            border: 3px solid #fff; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
            cursor: pointer;
        }

        /* CONTENT */
        .container { 
            max-width: 1400px; 
            min-width: 1300px; 
            margin: 40px auto; 
            padding: 0 40px; 
            flex-grow: 1;
        } 
        .page-header { margin-bottom: 30px; }
        .page-title { font-size: 2.2rem; font-weight: 900; color: #000; margin-bottom: 20px; letter-spacing: -0.5px; text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);} 

        .filter-bar { 
            display: flex; 
            gap: 12px; 
            background: rgba(255,255,255,0.7); 
            padding: 8px; 
            border-radius: 50px; 
            width: fit-content; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
            border: 1px solid #e0e0e0;
        }
        .filter-btn { 
            padding: 10px 24px; 
            border-radius: 30px; 
            border: none; 
            background: transparent; 
            font-weight: 700; 
            color: #666; 
            cursor: pointer; 
            transition: all 0.3s; 
            font-size: 0.9rem; 
            font-family: 'Inter', sans-serif; 
        }
        .filter-btn:hover:not(.active) { background: #f0f0f0; }
        .filter-btn.active { 
            background: #000; 
            color: #FFC300; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.25); 
            transform: translateY(-2px); 
        }

        /* Single Column Layout */
        .swap-list {
            display: grid;
            grid-template-columns: 1fr;
            gap: 25px; 
        }

        /* Swap Card: Short and Wide */
        .swap-card { 
            background: linear-gradient(135deg, #fff 0%, #fafafa 100%); 
            border: 2px solid #e8e8e8; 
            border-radius: 24px; 
            padding: 25px 40px; /* Short vertical padding, long horizontal padding */
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .swap-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #FFC300 0%, #f5b423 100%);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .swap-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            border-color: #FFC300;
        }
        
        .swap-card:hover::before {
            transform: scaleX(1);
        }

        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; } 
        
        .status-badge { 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 0.75rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .status-pending { background: #ffeb3b; color: #333; }
        .status-accepted { background: #00bcd4; color: white; }
        .status-completed { background: #4caf50; color: white; }
        .status-rejected { background: #f44336; color: white; }
        
        .swap-date { color: #888; font-size: 0.9rem; font-weight: 500; } 

        .card-main { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0; 
            border-bottom: none; /* No dashed line */
            margin-bottom: 15px; 
            padding-bottom: 15px;
        }
        
        .swap-party { 
            display: flex; 
            align-items: center; 
            gap: 20px; 
            width: 42%; 
        } 
        
        .party-avatar { 
            width: 60px; /* Fixed size */
            height: 60px; /* Fixed size */
            border-radius: 50%; 
            overflow: hidden; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 900; 
            font-size: 1.3rem; 
            border: 2px solid #fff; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-shadow: 1px 1px 0 rgba(0,0,0,0.2); 
            flex-shrink: 0; 
        }
        .party-avatar-requester { background: #eee; color: #666; }
        .party-avatar-teacher { background: #060606; color: #FFC300; }

        .party-info h3 { font-size: 1.2rem; font-weight: 800; color: #000; margin: 0 0 4px 0; } 
        .party-info p { font-size: 0.9rem; color: #666; margin: 0; }
        
        .swap-icon { 
            font-size: 3.5rem; 
            color: #FFC300; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            width: 16%; 
            cursor: pointer; 
            transition: transform 0.2s ease, color 0.2s;
            position: relative;
        }
        .swap-icon:hover {
            transform: scale(1.1);
            color: #f5b423;
        }
        .swap-icon::after {
            content: 'VIEW DETAILS';
            position: absolute;
            bottom: -22px;
            font-size: 0.65rem;
            color: #FFC300;
            font-weight: 700;
            opacity: 0;
            transition: opacity 0.2s;
            white-space: nowrap;
        }
        .swap-icon:hover::after {
            opacity: 1;
        }

        /* Detail Section (Slimmed Down) */
        .card-details-section {
            padding: 0 0 25px 0; 
            margin-top: 0;
            display: flex; 
            gap: 40px;
        }
        .card-details-section > div { flex: 1; }

        .card-skill-info {
            font-size: 1.1rem;
            font-weight: 800;
            color: #060606;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-skill-category {
            font-weight: 600; 
            font-size: 0.85rem; 
            color: #888; 
            padding: 4px 10px;
            background: #f0f0f0;
            border-radius: 12px;
            flex-shrink: 0;
        }
        .card-description {
            font-size: 0.95rem;
            color: #555;
            line-height: 1.5;
            padding-left: 15px;
            border-left: 4px solid #FFC300;
            margin-top: 5px; 
            font-style: italic;
            max-width: 50%;
            flex-shrink: 0;
        }
        /* End NEW DETAIL SECTION STYLES */

        .card-actions { display: flex; gap: 25px; padding-top: 0;} 
        .btn { flex: 1; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s; font-size: 0.95rem; text-align: center; border: none; font-family: 'Inter', sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        
        .btn-message { background: #f0f0f0; color: #333; }
        .btn-message:hover { background: #e0e0e0; transform: translateY(-1px); filter: brightness(1.05); } 
        
        .btn-review { background: #FFC300; color: #000; border: none; font-weight: 800; }
        .btn-review:hover { background: #f5b423; transform: translateY(-2px); filter: brightness(1.1); } 
        
        .btn-accept { background: #4caf50; color: white; }
        .btn-accept:hover { background: #388e3c; transform: translateY(-2px); filter: brightness(1.1); } 
        
        .btn-reject { background: #f44336; color: white; }
        .btn-reject:hover { background: #d32f2f; transform: translateY(-2px); filter: brightness(1.1); } 
        
        .btn-complete { background: linear-gradient(135deg, #000 0%, #333 100%); color: #FFC300; font-weight: 800;} 
        .btn-complete:hover { background: #111; transform: translateY(-2px); filter: brightness(1.2); } 

        .no-swaps { 
            text-align: center; 
            padding: 80px 40px;
            color: #999;
            font-size: 1.1rem;
            background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
            border-radius: 20px;
            border: 2px dashed #e0e0e0;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        /* --- MODAL BASE STYLES (from Profile.jsx) --- */
        .modal-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0, 0, 0, 0.6); 
            backdrop-filter: blur(4px);
            z-index: 2000; 
            display: flex; 
            justify-content: center; 
            align-items: center;
        }
        .modal-content { 
            background-color: #fff; 
            padding: 40px; 
            border-radius: 32px; 
            width: 90%; 
            max-width: 600px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .details-modal-content {
            background-color: #fff; 
            padding: 40px; 
            border-radius: 32px; 
            width: 90%; 
            max-width: 550px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .modal-title { font-size: 1.8rem; font-weight: 900; color: #000; }
        .close-btn { 
            background: #f5f5f5; 
            border: none; 
            font-size: 1.8rem; 
            cursor: pointer; 
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: #333;
        }
        .close-btn:hover { background: #e0e0e0; }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-weight: 700; margin-bottom: 8px; font-size: 0.9rem; color: #333; }
        .form-textarea { 
            width: 100%; 
            padding: 14px 18px; 
            border: 2px solid #e0e0e0; 
            border-radius: 12px; 
            font-size: 1rem; 
            color: #000;
            background-color: #fff;
            transition: all 0.3s ease;
            font-family: inherit;
        }
        .form-textarea:focus {
            outline: none;
            border-color: #FFC300;
            box-shadow: 0 0 0 3px rgba(255,195,0,0.1);
        }
        .submit-btn { 
            width: 100%; 
            padding: 16px; 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; 
            border: none; 
            border-radius: 12px; 
            font-weight: 800; 
            cursor: pointer; 
            font-size: 1.05rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        .submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            color: #666;
            box-shadow: none;
        }

        /* Custom Details Modal */
        .details-row { margin-bottom: 20px; text-align: left; }
        .details-row-split { display: flex; gap: 20px; margin-bottom: 20px;}
        .details-row-split > div { flex: 1; }
        .details-label { font-size: 0.75rem; font-weight: 700; color: #888; text-transform: uppercase; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
        .details-value { font-size: 1.1rem; font-weight: 700; color: #000; line-height: 1.4; }
        .description-text { font-size: 0.95rem; font-weight: 500; color: #555; font-style: italic; border-left: 3px solid #FFC300; padding-left: 10px; }
        .status-text { text-transform: uppercase; font-weight: 900; }
        .status-text.status-pending { color: #ffeb3b; }
        .status-text.status-accepted { color: #00bcd4; }
        .status-text.status-completed { color: #4caf50; }
        .status-text.status-rejected { color: #f44336; }
        
        .star-rating { font-size: 2.2rem; letter-spacing: 5px; }
        
        /* Media Queries */
        @media (max-width: 768px) {
            .navbar { padding: 15px 4vw; }
            .nav-left { gap: 20px; }
            .logo { font-size: 1.5rem; }
            .nav-tabs { display: none; } 
            .container { padding: 0 15px; margin: 30px auto; }
            .page-title { font-size: 1.8rem; }
            .filter-bar { width: 100%; justify-content: space-around; padding: 6px; }
            .filter-btn { padding: 8px 15px; font-size: 0.8rem; }
            .card-main { flex-direction: column; align-items: flex-start; gap: 20px; }
            .swap-party { width: 100%; justify-content: space-between; }
            .swap-icon { display: none; }
            .card-actions { flex-direction: column; }
            .details-row-split { flex-direction: column; gap: 15px; }
        }
    `;

    if (loading) return <Loading text="Loading your swaps..." />;

    return (
        <>
            <style>{styles}</style>
            <div className="swaps-body">
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            <button className="nav-tab" onClick={() => navigate('/messages')}>Messages</button>
                            <button className="nav-tab active" onClick={() => navigate('/myswaps')}>
                                MySwaps
                                {notificationCount > 0 && (
                                    <span className="notification-badge">{notificationCount}</span>
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

                    <div className="swap-list">
                        {filteredSwaps.length === 0 ? (
                            <div className="no-swaps">
                                <div style={{fontSize: '3rem', marginBottom: '16px'}}>🤝</div>
                                <div>No {filter.toLowerCase()} swaps found.</div>
                            </div>
                        ) : (
                            filteredSwaps.map(swap => {
                                // Determine if the current user is the requester (learner) or the target user (teacher)
                                const isUserRequester = swap.requester.userId === user?.userId;
                                
                                // Assign the partner based on the user's role
                                const partner = isUserRequester ? swap.targetOffer.user : swap.requester;
                                
                                // Assign local role
                                const myRole = isUserRequester ? "Learner" : "Teacher";
                                const partnerRole = isUserRequester ? "Teacher" : "Learner";

                                return (
                                    <div className="swap-card" key={swap.swapId}>
                                        <div className="card-top">
                                            <span className={`status-badge status-${swap.status.toLowerCase()}`}>{swap.status}</span>
                                            <span className="swap-date">Requested: {swap.date}</span>
                                        </div>

                                        <div className="card-main">
                                            {/* My Side (User) */}
                                            <div className="swap-party">
                                                <div className={`party-avatar ${isUserRequester ? 'party-avatar-requester' : 'party-avatar-teacher'}`}>
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="party-info">
                                                    <h3>{user?.name || 'You'}</h3>
                                                    <p>{myRole}</p>
                                                </div>
                                            </div>
                                            
                                            {/* SWAP ICON / Details Trigger */}
                                            <div 
                                                className="swap-icon" 
                                                title="Click for Details"
                                                onClick={() => setDetailsSwap(swap)}
                                            >
                                                ⇄
                                            </div>
                                            
                                            {/* Partner Side */}
                                            <div className="swap-party" style={{justifyContent: 'flex-end', textAlign: 'right'}}>
                                                <div className="party-info">
                                                    <h3>{partner.name}</h3>
                                                    <p>{partnerRole}</p>
                                                </div>
                                                <div className={`party-avatar ${isUserRequester ? 'party-avatar-teacher' : 'party-avatar-requester'}`}>
                                                    {partner.name.charAt(0)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* === Horizontal Skill/Category/Description Section (Now shorter vertically) === */}
                                        <div className="card-details-section">
                                            <div style={{flex: '1'}}>
                                                <div className="card-skill-info">
                                                    Skill: {swap.targetOffer.skill.name}
                                                    <span className="card-skill-category">{swap.targetOffer.skill.category}</span>
                                                </div>
                                            </div>
                                            <div className="card-description">
                                                "{swap.targetOffer.description}"
                                            </div>
                                        </div>
                                        {/* ================================= */}

                                        <div className="card-actions">
                                            <button 
                                                className="btn btn-message" 
                                                onClick={() => navigate('/messages', { state: { partner: partner } })}
                                            >
                                                Message {partner.name}
                                            </button>
                                            
                                            {/* Accept/Reject actions visible only to the teacher (target user) */}
                                            {swap.status === 'PENDING' && !isUserRequester && (
                                                <>
                                                    <button className="btn btn-accept" onClick={() => handleAction(swap.swapId, 'accept')}>Accept</button>
                                                    <button className="btn btn-reject" onClick={() => handleAction(swap.swapId, 'reject')}>Reject</button>
                                                </>
                                            )}
                                            
                                            {/* Mark Complete action visible to either party if accepted */}
                                            {swap.status === 'ACCEPTED' && (
                                                <button className="btn btn-complete" onClick={() => handleAction(swap.swapId, 'complete')}>
                                                    ✔ Mark Complete
                                                </button>
                                            )}
                                            
                                            {/* Leave Review action visible to both parties once completed */}
                                            {swap.status === 'COMPLETED' && (
                                                <button className="btn btn-review" onClick={() => handleLeaveReviewClick(swap)}>
                                                    ★ Leave Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- RENDER DETAILS MODAL --- */}
                <DetailsModal 
                    swap={detailsSwap}
                    onClose={() => setDetailsSwap(null)}
                />

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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProposeSwapModal from './ProposeSwapModal'; 

const OfferDetailsModal = ({ offer, onClose }) => {
    const navigate = useNavigate();

    const loggedInUserId = localStorage.getItem('userId');
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0); 

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            fetchNotifications(parsedUser.userId);
        }
    }, []);

    const fetchNotifications = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/swaps/received/${userId}`);
            const pendingCount = response.data.filter(swap => swap.status === 'PENDING').length;
            setNotificationCount(pendingCount);
        } catch (error) {
            setNotificationCount(0);
        }
    };
    
    const handleProposeSwapClick = () => {
        const userId = loggedInUserId;
        if (!userId) {
            onClose(); 
            navigate('/login');
            return;
        }
        setShowProposeModal(true); 
    };

    const handleMessageUser = () => {
        const userId = loggedInUserId;
        if (!userId) {
            onClose();
            navigate('/login');
            return;
        }
        onClose();
        navigate('/messages', { state: { partner: offer.user } });
    };

    if (!offer) return null;
    
    // --- STYLES --- //
    const styles = `
        /* MODAL OVERLAY */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* MODAL CARD */
        .modal-card { 
            background: #ffffff; 
            border-radius: 24px; /* Rounder edges */
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            position: relative;
            animation: fadeIn 0.3s ease-out;
        }

        /* CARD HEADER */
        .card-header-bg { 
            background: linear-gradient(to right, #FFF8E1, #ffffff); 
            padding: 40px; 
            border-bottom: 1px solid #eee; 
            display: flex; 
            align-items: center; 
            gap: 24px; 
            position: sticky;
            top: 0;
            z-index: 10;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
        }

        /* CLOSE BUTTON */
        .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 1.8rem;
            color: #555;
            cursor: pointer;
            z-index: 20;
            transition: color 0.2s;
        }
        .close-btn:hover { color: #800000; }
        
        .big-avatar { 
            width: 80px; height: 80px; 
            background: #FFF8E1; 
            border: 2px solid #FFC300; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 2.2rem; font-weight: 800; color: #000; 
        }
        
        .header-info h1 { font-size: 1.8rem; margin-bottom: 5px; color: #000; font-weight: 800; }
        .header-info p { color: #555; font-size: 1rem; }
        .rating-badge { background: #000; color: #FFC300; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; margin-left: 10px; vertical-align: middle; }

        /* BODY & GRID */
        .card-body { padding: 40px; }
        .section-label { font-size: 0.85rem; font-weight: 700; color: #800000; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
        .skill-name { font-size: 2.5rem; margin-bottom: 15px; color: #000; font-weight: 800; line-height: 1.1; }
        .description-text { font-size: 1.1rem; line-height: 1.6; color: #333; margin-bottom: 35px; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 35px; }
        .info-box { background: #FAFAFA; padding: 20px; border-radius: 10px; border: 1px solid #eee; }
        .wants-box { grid-column: 1 / -1; background: #FFF8E1; border: 2px solid #FFC300; }
        
        .box-label { font-size: 0.8rem; color: #666; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; }
        .box-value { font-size: 1.2rem; color: #000; font-weight: 700; }
        .wants-value { color: #800000; }

        /* BUTTONS */
        .action-row { display: flex; gap: 16px; margin-top: 20px; }
        .primary-btn { flex: 2; background: #800000; color: white; padding: 18px; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(128,0,0,0.2); }
        .primary-btn:hover { background: #600000; transform: translateY(-2px); }
        .secondary-btn { flex: 1; background: white; color: #800000; padding: 18px; border: 2px solid #800000; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .secondary-btn:hover { background: #FFF8E1; }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
    `;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <style>{styles}</style>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                
                <div className="card-header-bg">
                    <div className="big-avatar">{offer.icon}</div>
                    <div className="header-info">
                        <h1>{offer.user?.name || 'User'} <span className="rating-badge">{offer.rating} ★</span></h1>
                        <p>{offer.user?.school || 'University Student'}</p>
                    </div>
                </div>

                <div className="card-body">
                    <div className="section-label">Skill Offered</div>
                    <h2 className="skill-name">{offer.skill?.name}</h2>
                    <p className="description-text">{offer.description}</p>

                    <div className="info-grid">
                        <div className="info-box wants-box">
                            <div className="box-label" style={{color: '#800000'}}>Wants in Return</div>
                            <div className="box-value wants-value">{offer.lookingFor || 'Any fair trade'}</div>
                        </div>
                        <div className="info-box">
                            <div className="box-label">Category</div>
                            <div className="box-value">{offer.skill?.category}</div>
                        </div>
                        <div className="info-box">
                            <div className="box-label">Availability</div>
                            <div className="box-value">{offer.availability}</div>
                        </div>
                    </div>

                    <div className="action-row">
                        {offer.user?.userId?.toString() === loggedInUserId ? (
                            <>
                                <button className="primary-btn" disabled style={{ background: '#ccc', cursor: 'not-allowed' }}>
                                    (Your Own Offer)
                                </button>
                                <button className="secondary-btn" disabled style={{ cursor: 'not-allowed' }}>
                                    Message User
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="primary-btn" onClick={handleProposeSwapClick}>
                                    Request Swap
                                </button>
                                <button className="secondary-btn" onClick={handleMessageUser}>
                                    Message User
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {showProposeModal && (
                <ProposeSwapModal 
                    offer={offer}
                    onClose={() => { setShowProposeModal(false); onClose(); }} 
                />
            )}
        </div>
    );
};

export default OfferDetailsModal;
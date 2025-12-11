import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProposeSwapModal = ({ offer, onClose }) => {
    const navigate = useNavigate();
    const [swapMessage, setSwapMessage] = useState('');

    const handleProposeSwap = async (e) => {
        e.preventDefault();
        const loggedInUserId = localStorage.getItem('userId');
        
        if (!loggedInUserId) {
            onClose();
            navigate('/login');
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/swaps/propose', {
                requesterId: loggedInUserId,
                offerId: offer.offerId,
                message: swapMessage
            });
            
            // Success: Close modal and redirect to MySwaps
            onClose(); 
            navigate('/myswaps');
            
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send request. Check console for details.");
        }
    };

    const styles = `
        .modal-overlay-propose {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.8); z-index: 1001;
            display: flex; justify-content: center; align-items: center;
        }
        .modal-content-propose {
            background-color: #fff; padding: 0; border-radius: 12px;
            width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
            animation: popIn 0.2s ease-out;
        }
        .modal-header-propose { padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
        .modal-title-propose { font-size: 1.4rem; font-weight: 700; color: #000; margin: 0; }
        .close-btn-propose { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #333; }
        
        .modal-body-propose { padding: 30px; }
        .form-label-propose { display: block; margin-bottom: 8px; font-weight: 600; color: #333; font-size: 0.9rem; }
        
        .form-textarea-propose { 
            width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; 
            font-family: 'Inter', sans-serif; font-size: 1rem; height: 100px; resize: none;
            color: #000000 !important;
            background-color: #FAFAFA;
        }
        
        .modal-footer-propose { display: flex; gap: 10px; margin-top: 20px; }
        
        .cancel-btn-propose { flex: 1; padding: 12px; background: #eee; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; color: #333; }
        
        .submit-swap-btn-propose { 
            flex: 2; padding: 12px; 
            background: #000; 
            border: none; 
            border-radius: 6px; font-weight: 700; 
            cursor: pointer; color: #fff; 
        }
        .submit-swap-btn-propose:hover { background: #333; }

        @keyframes popIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    `;

    return (
        <div className="modal-overlay-propose" onClick={onClose}>
            <style>{styles}</style>
            <div className="modal-content-propose" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-propose">
                    <h3 className="modal-title-propose">Propose a Skill Swap</h3>
                    <button className="close-btn-propose" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleProposeSwap}>
                    <div className="modal-body-propose">
                        <p style={{marginBottom: '15px', color: '#555', fontSize: '0.95rem'}}>
                            You are proposing a swap for **{offer.skill?.name || 'this skill'}** with **{offer.user?.name}**.
                        </p>
                        <div className="form-group">
                            <label className="form-label-propose">Add a message (Optional)</label>
                            <textarea 
                                className="form-textarea-propose" 
                                placeholder="Hi! I'd love to learn this. I can teach you..." 
                                value={swapMessage}
                                onChange={(e) => setSwapMessage(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer-propose">
                            <button type="button" className="cancel-btn-propose" onClick={onClose}>Cancel</button>
                            <button type="submit" className="submit-swap-btn-propose">Send Proposal</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProposeSwapModal;
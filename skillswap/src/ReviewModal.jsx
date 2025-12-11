import React, { useState } from 'react';
import axios from 'axios';

const Long = (value) => {
    try {
        return parseInt(value, 10);
    } catch (e) {
        return null;
    }
}

const ReviewModal = ({ swap, onClose, onSuccess }) => {
    const loggedInUserId = Long(localStorage.getItem('userId'));
    const isRequester = swap.requester.userId === loggedInUserId;

    const reviewedUser = isRequester ? swap.targetOffer.user : swap.requester;
    const reviewer = isRequester ? swap.requester : swap.targetOffer.user;

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) return alert("Rating must be between 1 and 5.");

        setSubmitting(true);
        try {
            await axios.post('http://localhost:8080/api/reviews/submit', {
                reviewedUserId: reviewedUser.userId,
                reviewerId: reviewer.userId,
                swapId: swap.swapId,
                rating: rating,
                comment: comment
            });
            
            onSuccess(); 
            alert(`Review submitted for ${reviewedUser.name}!`);

        } catch (error) {
            console.error("Review submission failed:", error.response?.data);
            alert("Failed to submit review. Check backend logs.");
        } finally {
            setSubmitting(false);
            onClose();
        }
    };

    const styles = `
        .review-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 2000; display: flex; justify-content: center; align-items: center; }
        .review-content { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: popIn 0.2s ease-out; }
        .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .review-title { font-size: 1.5rem; font-weight: 800; color: #000; }
        
        .rating-stars button { background: none; border: none; font-size: 2rem; cursor: pointer; color: #ccc; transition: color 0.2s; }
        .rating-stars button.filled { color: #FFC300; }
        
        .form-group { margin-bottom: 15px; }
        .form-label { display: block; font-weight: 600; margin-bottom: 5px; color: #333; }
        
        .form-textarea { background: white; width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; resize: none; height: 100px; font-family: inherit; color: #000; }
        .submit-btn { width: 100%; padding: 12px; background: #000; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 10px; }
        .submit-btn:disabled { background: #555; cursor: not-allowed; }

        @keyframes popIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    `;

    return (
        <div className="review-overlay" onClick={onClose}>
            <style>{styles}</style>
            <div className="review-content" onClick={(e) => e.stopPropagation()}>
                <div className="review-header">
                    <h2 className="review-title">Review {reviewedUser.name}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Rating:</label>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    type="button"
                                    className={star <= rating ? 'filled' : ''}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Comment:</label>
                        <textarea 
                            className="form-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={`What was it like swapping with ${reviewedUser.name}?`}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
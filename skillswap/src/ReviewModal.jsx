import React, { useState } from 'react';
import axios from 'axios';

const toLong = (value) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
};

const ReviewModal = ({ swap, onClose, onSuccess }) => {
    const loggedInUserId = toLong(localStorage.getItem('userId'));

    // 🔒 Validate swap structure early
    if (!swap || !swap.requester || !swap.targetOffer || !swap.targetOffer.user) {
        console.error("INVALID SWAP OBJECT:", swap);
        return (
            <div className="review-overlay">
                <div className="review-content">
                    <p>Invalid swap data. Cannot submit review.</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const isRequester = swap.requester.userId === loggedInUserId;

    const reviewedUser = isRequester
        ? swap.targetOffer.user
        : swap.requester;

    const reviewer = isRequester
        ? swap.requester
        : swap.targetOffer.user;

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("SWAP:", swap);
        console.log("REVIEWED:", reviewedUser);
        console.log("REVIEWER:", reviewer);

        // 🔒 Strict validation
        if (!swap.swapId) return alert("Swap ID missing.");
        if (!reviewedUser.userId) return alert("Reviewed user missing.");
        if (!reviewer.userId) return alert("Reviewer missing.");

        if (rating < 1 || rating > 5) {
            return alert("Rating must be between 1 and 5.");
        }

        if (!comment.trim()) {
            return alert("Comment cannot be empty.");
        }

        const payload = {
            reviewedUserId: reviewedUser.userId,
            reviewerId: reviewer.userId,
            swapId: swap.swapId,
            rating,
            comment
        };

        console.log("PAYLOAD:", payload);

        setSubmitting(true);

        try {
            const response = await axios.post(
                'http://localhost:8080/api/reviews/submit',
                payload
            );

            alert(response.data || "Review submitted!");

            onSuccess();
            onClose();

        } catch (error) {
            console.error("FULL ERROR:", error);

            const message =
                error.response?.data ||
                error.message ||
                "Failed to submit review.";

            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-overlay" onClick={onClose}>
            <div className="review-content" onClick={(e) => e.stopPropagation()}>
                <h2>Review {reviewedUser.name}</h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Rating:</label>
                        <div>
                            {[1,2,3,4,5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    style={{ color: star <= rating ? '#FFC300' : '#ccc' }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label>Comment:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>

                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default ReviewModal;
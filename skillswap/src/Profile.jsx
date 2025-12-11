import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [myOffers, setMyOffers] = useState([]);
    const [myRequests, setMyRequests] = useState([]); 
    const [myReviews, setMyReviews] = useState([]);
    
    const [activeTab, setActiveTab] = useState('offers');
    const [loading, setLoading] = useState(true);
    
    const [notificationCount, setNotificationCount] = useState(0); 
    
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [offerForm, setOfferForm] = useState({ skillName: '', category: 'Programming', description: '', availability: '', lookingFor: '' });
    const [requestForm, setRequestForm] = useState({ skillName: '', category: 'Programming', description: '' });

    // Helper to get Auth Headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // Date Formatter
    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-GB'); 
        return new Date(dateString).toLocaleDateString('en-GB'); 
    };

    useEffect(() => {
        const init = async () => {
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
                const headers = getAuthHeaders();
                const offersRes = await axios.get(`http://localhost:8080/api/offers/user/${parsedUser.userId}`, { headers });
                setMyOffers(offersRes.data);

                const reviewsRes = await axios.get(`http://localhost:8080/api/reviews/user/${parsedUser.userId}`, { headers });
                setMyReviews(reviewsRes.data);

                const requestsRes = await axios.get(`http://localhost:8080/api/requests/user/${parsedUser.userId}`, { headers });
                setMyRequests(requestsRes.data);

            } catch (err) {
                console.error("Error loading profile", err);
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 1000); 
            }
        };
        init();
    }, [navigate]);
    
    const fetchNotifications = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/swaps/received/${userId}`);
            const pendingCount = response.data.filter(swap => swap.status === 'PENDING').length;
            setNotificationCount(pendingCount);
        } catch (error) {
            setNotificationCount(0);
        }
    };

    const handleDeleteOffer = async (id) => {
        if(window.confirm("Are you sure you want to delete this offer? This cannot be undone.")) {
            try {
                await axios.delete(`http://localhost:8080/api/offers/${id}`, { 
                    headers: getAuthHeaders() 
                });
                setMyOffers(prev => prev.filter(o => o.offerId !== id));
            } catch (error) {
                console.error("Delete error:", error);
                if (error.response?.status === 401) {
                    alert("Skill might be in active.");
                } else {
                    alert("Deletion failed! Note: You cannot delete a skill that is part of an active Swap.");
                }
            }
        }
    };

    const handleDeleteRequest = async (id) => {
        if(window.confirm("Are you sure you want to remove this skill request?")) {
            try {
                await axios.delete(`http://localhost:8080/api/requests/${id}`, { 
                    headers: getAuthHeaders()
                });
                setMyRequests(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                console.error("Delete error:", error);
                alert(`Removal failed! Status: ${error.response?.status || 'Error'}`);
            }
        }
    };

    const handleLogout = () => { 
        localStorage.clear(); 
        navigate('/login'); 
    };

    const handleOfferChange = (e) => { setOfferForm({ ...offerForm, [e.target.name]: e.target.value }); };
    
    const submitOffer = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/offers/add', 
                { ...offerForm, userId: user.userId },
                { headers: getAuthHeaders() }
            );
            setShowOfferModal(false);
            setOfferForm({ skillName: '', category: 'Programming', description: '', availability: '', lookingFor: '' });
            setMyOffers(prev => [response.data, ...prev]);
        } catch(err) {
            console.error(err);
            alert("Failed to add offer. Please try again.");
        }
    };

    const handleRequestChange = (e) => { setRequestForm({ ...requestForm, [e.target.name]: e.target.value }); };
    
    const submitRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/requests/add', 
                { ...requestForm, userId: user.userId },
                { headers: getAuthHeaders() }
            );
            setShowRequestModal(false);
            setRequestForm({ skillName: '', category: 'Programming', description: '' });
            setMyRequests(prev => [response.data, ...prev]);
        } catch(err) { 
            console.error(err);
            alert("Failed to add request."); 
        }
    };

    const averageRating = myReviews.length > 0 
        ? (myReviews.reduce((acc, curr) => acc + curr.rating, 0) / myReviews.length).toFixed(1) 
        : "N/A";

    const styles = `
        /* GLOBAL RESET */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; background-color: #FFF8E1; }
        .profile-body { width: 100%; min-height: 100vh; background: #FFF8E1; }

        /* LOADING */
        .loading-container { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; width: 100vw; background-color: #FFF8E1; position: fixed; top: 0; left: 0; z-index: 2000; }
        .loading-spinner { width: 50px; height: 50px; border: 5px solid rgba(0, 0, 0, 0.1); border-top: 5px solid #FFC300; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
        .loading-text { font-size: 1.2rem; font-weight: 700; color: #060606; letter-spacing: 1px; text-transform: uppercase; animation: pulse 1.5s infinite ease-in-out; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

        /* NAVBAR */
        .navbar { background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #060606; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; }
        .nav-left { display: flex; align-items: center; gap: 48px; }
        .logo { font-size: 1.75rem; font-weight: 800; color: #060606; letter-spacing: -0.5px; cursor: pointer; }
        .nav-tabs { display: flex; gap: 8px; background: rgba(255,255,255,0.3); padding: 6px; border-radius: 30px; }
        .nav-tab { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 24px; text-decoration: none; color: #060606; font-weight: 600; transition: all 0.3s ease; border: none; background: transparent; cursor: pointer; font-size: 0.95rem; font-family: 'Inter', sans-serif; }
        .nav-tab:hover { background: rgba(122,0,0,0.1); transform: translateY(-2px); }
        .nav-tab.active { background: #060606; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .notification-badge { position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; padding: 2px; line-height: 1; z-index: 10; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, maroon 0%, #5a0000 100%); color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; border: 3px solid #fff; box-shadow: 0 0 0 2px #000; cursor: default; }

        .container { max-width: 950px; margin: 30px auto; padding: 0 20px; }

        /* HEADER */
        .profile-header { background: white; border-radius: 24px; padding: 30px; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #e0e0e0; }
        .header-content { display: flex; gap: 25px; align-items: center; }
        .avatar-large { width: 100px; height: 100px; background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; color: #FFC300; }
        .user-info h1 { font-size: 1.8rem; margin-bottom: 5px; color: #000; }
        .user-info p { color: #555; font-size: 1rem; margin-bottom: 10px; }
        .meta-info { font-size: 0.9rem; color: #888; display: flex; gap: 15px; }
        .stats-row { display: flex; gap: 15px; }
        .stat-box { border: 1px solid #eee; border-radius: 8px; padding: 10px 20px; text-align: center; min-width: 100px; }
        .stat-val { display: block; font-size: 1.2rem; font-weight: 700; color: #000; }
        .stat-lbl { font-size: 0.75rem; color: #666; text-transform: uppercase; }
        .logout-link { color: #d00; font-weight: 600; cursor: pointer; font-size: 0.9rem; margin-top: 10px; display: inline-block; }

        /* TABS */
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .tab-btn { padding: 8px 16px; border-radius: 20px; border: none; background: transparent; cursor: pointer; font-weight: 600; color: #666; font-size: 0.95rem; }
        .tab-btn.active { background-color: #000; color: #FFC300; }
        .tab-btn:hover:not(.active) { background-color: #e9e9e9; }

        /* CARDS */
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .section-title { font-size: 1.2rem; font-weight: 700; color: #000; }
        .add-btn { background-color: #000; color: white; border: none; padding: 10px 18px; border-radius: 30px; font-weight: 600; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
        
        .offer-card { background: white; border: 1px solid #e0e0e0; border-radius: 20px; padding: 20px; margin-bottom: 12px; transition: transform 0.2s; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .skill-name { font-size: 1.1rem; font-weight: 700; color: #000; }
        .delete-btn { background: #fff0f0; border: 1px solid #ffcccc; color: #d00; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        .badge-row { margin-bottom: 10px; display: flex; align-items: center; }
        .request-badge-black { background: #000; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-right: 8px; }
        .request-badge-gray { background: #f5f5f5; color: #333; border: 1px solid #ddd; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        
        /* STATUS PILLS */
        .status-pill { padding: 2px 8px; border-radius: 10px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; margin-left: 10px; border: 1px solid #ddd; }
        .pill-available { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .pill-active { background: #cce5ff; color: #004085; border-color: #b8daff; }
        .pill-completed { background: #e2e3e5; color: #383d41; border-color: #d6d8db; }

        /* Review Card */
        .review-card { background: white; border: 1px solid #e0e0e0; border-radius: 20px; padding: 20px; margin-bottom: 12px; }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .review-author { font-weight: 700; color: #000; font-size: 1rem; }
        .review-stars { color: #FFC300; letter-spacing: 2px; }
        .review-date { font-size: 0.8rem; color: #999; margin-top: 10px; display: block; }

        /* MODAL */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        .modal-content { background-color: #fff; padding: 30px; border-radius: 24px; width: 90%; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; color: black}
        .modal-title { font-size: 1.4rem; font-weight: 800; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 15px; color: black}
        .form-label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        
        .form-input, .form-textarea, .form-select { 
            width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; 
            color: #000000 !important;
            background-color: #fff;
        }
        .form-textarea { height: 80px; resize: none; }
        .submit-btn { width: 100%; padding: 12px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 10px; }
    `;

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div><div className="loading-text">Loading Profile...</div><style>{styles}</style></div>;

    return (
        <>
            <style>{styles}</style>
            <div className="profile-body">
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            <button className="nav-tab" onClick={() => navigate('/messages')}>Messages</button>
                            <button className="nav-tab" onClick={() => navigate('/myswaps')}>
                                MySwaps
                                {notificationCount > 0 && (
                                    <span className="notification-badge">{notificationCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="nav-right">
                        <div className="avatar" title="Your Profile">{user?.name?.charAt(0) || 'U'}</div>
                    </div>
                </nav>

                <div className="container">
                    <div className="profile-header">
                        <div className="header-content">
                            <div className="avatar-large">{user?.name?.charAt(0) || 'U'}</div>
                            <div className="user-info">
                                <h1>{user?.name || 'User Name'}</h1>
                                <p>Web developer passionate about teaching and learning.</p>
                                <div className="meta-info">
                                    <span>📍 {user?.school || 'University'}</span>
                                    <span>📅 Joined {formatDate(user?.dateJoined)}</span>
                                </div>
                                <span className="logout-link" onClick={handleLogout}>Log Out</span>
                            </div>
                        </div>
                        <div className="stats-row">
                            <div className="stat-box"><span className="stat-val">{myReviews.length}</span><span className="stat-lbl">Reviews</span></div>
                            <div className="stat-box"><span className="stat-val">{averageRating} ★</span><span className="stat-lbl">Avg Rating</span></div>
                        </div>
                    </div>

                    <div className="tabs">
                        <button className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>My Skill Offers</button>
                        <button className={`tab-btn ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>Skills I Want to Learn</button>
                        <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews ({myReviews.length})</button>
                    </div>

                    {activeTab === 'offers' && (
                        <div>
                            <div className="section-header">
                                <div className="section-title">Skills I Can Teach</div>
                                <button className="add-btn" onClick={() => setShowOfferModal(true)}>+ Add Skill Offer</button>
                            </div>
                            {myOffers.length === 0 ? <div style={{textAlign:'center', padding:'30px', background:'white', borderRadius:'10px', border:'1px solid #e0e0e0', color:'#888'}}>No skills posted yet.</div> : 
                                myOffers.map(offer => (
                                    <div className="offer-card" key={offer.offerId}>
                                        <div className="card-top">
                                            <div style={{display:'flex', alignItems:'center'}}>
                                                <div className="skill-name">{offer.skill?.name}</div>
                                                <span className={`status-pill pill-${offer.status ? offer.status.toLowerCase() : 'available'}`}>
                                                    {offer.status || 'AVAILABLE'}
                                                </span>
                                            </div>
                                            <button className="delete-btn" onClick={() => handleDeleteOffer(offer.offerId)}>🗑</button>
                                        </div>
                                        <div className="badge-row">
                                            <span className="request-badge-gray">{offer.skill?.category}</span>
                                        </div>
                                        <p style={{color:'#555', fontSize:'0.95rem'}}>{offer.description}</p>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {activeTab === 'learn' && (
                        <div>
                            <div className="section-header">
                                <div className="section-title">Skills I Want to Learn</div>
                                <button className="add-btn" onClick={() => setShowRequestModal(true)}>+ Add Skill Request</button>
                            </div>
                            {myRequests.length === 0 ? <div style={{textAlign:'center', padding:'30px', background:'white', borderRadius:'10px', border:'1px solid #e0e0e0', color:'#888'}}>No requests posted yet.</div> : 
                                myRequests.map(req => (
                                    <div className="offer-card" key={req.id}>
                                        <div className="card-top">
                                            <div className="skill-name">{req.skillName}</div>
                                            <button className="delete-btn" onClick={() => handleDeleteRequest(req.id)}>🗑</button>
                                        </div>
                                        <div className="badge-row">
                                            <span className="request-badge-black">Seeking</span>
                                            <span className="request-badge-gray">{req.category}</span>
                                        </div>
                                        <p style={{color:'#555', fontSize:'0.95rem'}}>{req.description}</p>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div>
                            <div className="section-header"><div className="section-title">Reviews from Others</div></div>
                            {myReviews.length === 0 ? <div style={{textAlign:'center', padding:'30px', background:'white', borderRadius:'10px', border:'1px solid #e0e0e0', color:'#888'}}>No reviews yet.</div> : 
                                myReviews.map(review => (
                                    <div className="review-card" key={review.id}>
                                        <div className="review-header">
                                            <div style={{fontWeight:'700', color: 'black'}}>{review.reviewer?.name || 'Anonymous'}</div>
                                            <div style={{color:'#FFC300'}}>{"★".repeat(review.rating)}</div>
                                        </div>
                                        <p style={{color:'#555'}}>"{review.comment}"</p>
                                        <div style={{fontSize:'0.8rem', color:'#999', marginTop:'5px'}}>{review.date}</div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                {showOfferModal && (
                    <div className="modal-overlay" onClick={() => setShowOfferModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header"><h2 className="modal-title">Add Skill Offer</h2><button className="close-btn" onClick={() => setShowOfferModal(false)}>×</button></div>
                            <form onSubmit={submitOffer}>
                                <div className="form-group"><label className="form-label">Skill Name</label><input className="form-input" name="skillName" placeholder="e.g. React" value={offerForm.skillName} onChange={handleOfferChange} required /></div>
                                <div className="form-group"><label className="form-label">Category</label><select className="form-select" name="category" value={offerForm.category} onChange={handleOfferChange}><option>Programming</option><option>Design</option><option>Music</option><option>Arts</option></select></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" name="description" placeholder="What can you teach?" value={offerForm.description} onChange={handleOfferChange} required /></div>
                                <div className="form-group"><label className="form-label">Availability</label><input className="form-input" name="availability" placeholder="e.g. Weekends" value={offerForm.availability} onChange={handleOfferChange} required /></div>
                                <div className="form-group"><label className="form-label">Wants in Return</label><input className="form-input" name="lookingFor" placeholder="e.g. Piano" value={offerForm.lookingFor} onChange={handleOfferChange} required /></div>
                                <button type="submit" className="submit-btn">Add Offer</button>
                            </form>
                        </div>
                    </div>
                )}

                {showRequestModal && (
                    <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header"><h2 className="modal-title">Add Skill Request</h2><button className="close-btn" onClick={() => setShowRequestModal(false)}>×</button></div>
                            <form onSubmit={submitRequest}>
                                <div className="form-group"><label className="form-label">Skill to Learn</label><input className="form-input" name="skillName" placeholder="e.g. Photography" value={requestForm.skillName} onChange={handleRequestChange} required /></div>
                                <div className="form-group"><label className="form-label">Category</label><select className="form-select" name="category" value={requestForm.category} onChange={handleRequestChange}><option>Programming</option><option>Design</option><option>Music</option><option>Arts</option><option>Fitness</option></select></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" name="description" placeholder="Why do you want to learn this?" value={requestForm.description} onChange={handleRequestChange} required /></div>
                                <button type="submit" className="submit-btn">Add Request</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Profile;
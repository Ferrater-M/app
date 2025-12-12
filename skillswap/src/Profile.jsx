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

    const getAuthHeaders = () => {
        const authHeader = localStorage.getItem('authHeader');
        return authHeader ? { 'Authorization': authHeader } : {};
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
                const offersRes = await axios.get(`http://localhost:8080/api/offers/user/${parsedUser.userId}`);
                setMyOffers(offersRes.data);

                const reviewsRes = await axios.get(`http://localhost:8080/api/reviews/user/${parsedUser.userId}`);
                setMyReviews(reviewsRes.data);

                const requestsRes = await axios.get(`http://localhost:8080/api/requests/user/${parsedUser.userId}`);
                setMyRequests(requestsRes.data);

            } catch (err) {
                console.error("Error loading profile", err);
            } finally {
                setLoading(false);
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
                    alert("Session expired. Please log in again.");
                    navigate('/login');
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        
        .profile-body { 
            width: 100%; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%);
            display: flex;
            flex-direction: column;
        }

        /* NAVBAR */
        .navbar { 
            background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); 
            padding: 18px 5vw; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 3px solid #060606; 
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            position: sticky;
            top: 0;
            z-index: 100;
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
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
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
            cursor: default;
        }

        /* MAIN CONTAINER - USES FULL WIDTH */
        .container { 
            flex: 1;
            width: 100%; 
            max-width: 1600px;
            margin: 0 auto;
            padding: 40px 5vw; 
            display: flex;
            flex-direction: column;
            gap: 30px;
        }

        /* HEADER WITH BACKGROUND IMAGE */
        .profile-header { 
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%),
                        url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.03)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); 
            border-radius: 32px; 
            padding: 50px; 
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 40px;
            align-items: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08); 
            border: 2px solid rgba(0,0,0,0.06);
            position: relative;
            overflow: hidden;
        }

        .profile-header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,195,0,0.1) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(30%, -30%);
        }

        .avatar-large { 
            width: 140px; 
            height: 140px; 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 3.5rem; 
            font-weight: 900; 
            color: #FFC300;
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
            border: 5px solid #fff;
            position: relative;
            z-index: 1;
        }
        
        .user-info { 
            position: relative;
            z-index: 1;
        }
        .user-info h1 { font-size: 2.5rem; margin-bottom: 8px; color: #000; font-weight: 900; letter-spacing: -0.5px; }
        .user-info p { color: #555; font-size: 1.1rem; margin-bottom: 16px; line-height: 1.5; }
        .meta-info { font-size: 1rem; color: #666; display: flex; gap: 24px; flex-wrap: wrap; }
        .meta-info span { display: flex; align-items: center; gap: 6px; }
        
        .stats-row { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            position: relative;
            z-index: 1;
        }
        .stat-box { 
            background: linear-gradient(135deg, #fff 0%, #f8f8f8 100%);
            border: 2px solid #e0e0e0; 
            border-radius: 20px; 
            padding: 24px; 
            text-align: center; 
            min-width: 140px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .stat-box:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            border-color: #FFC300;
        }
        .stat-val { display: block; font-size: 2rem; font-weight: 900; color: #000; margin-bottom: 4px; }
        .stat-lbl { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .logout-link { 
            color: #d00; 
            font-weight: 700; 
            cursor: pointer; 
            font-size: 0.95rem; 
            margin-top: 12px; 
            display: inline-block;
            transition: all 0.2s;
            text-decoration: underline;
        }
        .logout-link:hover { color: #a00; transform: translateX(4px); }

        /* CONTENT AREA - TWO COLUMN LAYOUT */
        .content-wrapper {
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 30px;
            align-items: start;
        }

        /* SIDEBAR TABS */
        .tabs-sidebar { 
            background: white;
            border-radius: 24px;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            border: 1px solid #e0e0e0;
            position: sticky;
            top: 100px;
        }
        
        .tabs-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
            padding: 0 12px;
        }
        
        .tab-btn { 
            width: 100%;
            padding: 16px 20px; 
            border-radius: 16px; 
            border: none; 
            background: transparent; 
            cursor: pointer; 
            font-weight: 600; 
            color: #666; 
            font-size: 0.95rem;
            text-align: left;
            transition: all 0.3s ease;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .tab-btn:hover:not(.active) { background-color: #f5f5f5; transform: translateX(4px); }
        .tab-btn.active { 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        /* MAIN CONTENT AREA */
        .content-main {
            background: white;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            border: 1px solid #e0e0e0;
            min-height: 500px;
        }

        .section-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .section-title { font-size: 1.8rem; font-weight: 900; color: #000; letter-spacing: -0.5px; }
        .add-btn { 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; 
            border: none; 
            padding: 14px 28px; 
            border-radius: 50px; 
            font-weight: 700; 
            cursor: pointer; 
            font-size: 0.95rem; 
            display: flex; 
            align-items: center; 
            gap: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .add-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        
        /* GRID LAYOUT FOR CARDS */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .offer-card { 
            background: linear-gradient(135deg, #fff 0%, #fafafa 100%); 
            border: 2px solid #e8e8e8; 
            border-radius: 24px; 
            padding: 28px; 
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .offer-card::before {
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
        
        .offer-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            border-color: #FFC300;
        }
        
        .offer-card:hover::before {
            transform: scaleX(1);
        }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .skill-name { font-size: 1.3rem; font-weight: 800; color: #000; }
        .delete-btn { 
            background: linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%); 
            border: 2px solid #ffcccc; 
            color: #d00; 
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        }
        .delete-btn:hover {
            background: #ff4444;
            color: white;
            transform: rotate(15deg) scale(1.1);
            border-color: #ff4444;
        }
        
        .badge-row { margin-bottom: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .request-badge-black { 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; 
            padding: 6px 14px; 
            border-radius: 20px; 
            font-size: 0.75rem; 
            font-weight: 800; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .request-badge-gray { 
            background: #f5f5f5; 
            color: #333; 
            border: 1px solid #ddd; 
            padding: 6px 14px; 
            border-radius: 20px; 
            font-size: 0.75rem; 
            font-weight: 700;
        }
        
        .offer-card p {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.6;
        }

        /* Review Card */
        .review-card { 
            background: linear-gradient(135deg, #fff 0%, #fafafa 100%); 
            border: 2px solid #e8e8e8; 
            border-radius: 24px; 
            padding: 28px;
            transition: all 0.3s ease;
        }
        .review-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            border-color: #FFC300;
        }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
        .review-author { font-weight: 800; color: #000; font-size: 1.1rem; }
        .review-stars { color: #FFC300; letter-spacing: 3px; font-size: 1.2rem; }
        .review-card p { color: #666; font-size: 0.95rem; line-height: 1.6; font-style: italic; }
        .review-date { font-size: 0.8rem; color: #999; margin-top: 12px; display: block; }

        .empty-state {
            text-align: center;
            padding: 80px 40px;
            color: #999;
            font-size: 1.1rem;
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            border-radius: 20px;
            border: 2px dashed #e0e0e0;
        }

        /* MODAL */
        .modal-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0, 0, 0, 0.6); 
            backdrop-filter: blur(4px);
            z-index: 1000; 
            display: flex; 
            justify-content: center; 
            align-items: center;
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content { 
            background-color: #fff; 
            padding: 40px; 
            border-radius: 32px; 
            width: 90%; 
            max-width: 550px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
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
        }
        .close-btn:hover {
            background: #e0e0e0;
            transform: rotate(90deg);
        }
        
        .form-group { margin-bottom: 24px; }
        .form-label { display: block; font-weight: 700; margin-bottom: 10px; font-size: 0.95rem; color: #333; }
        
        .form-input, .form-textarea, .form-select { 
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
        .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #FFC300;
            box-shadow: 0 0 0 3px rgba(255,195,0,0.1);
        }
        .form-textarea { height: 100px; resize: vertical; }
        .submit-btn { 
            width: 100%; 
            padding: 16px; 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; 
            border: none; 
            border-radius: 12px; 
            font-weight: 800; 
            cursor: pointer; 
            margin-top: 10px;
            font-size: 1.05rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }

        @media (max-width: 1200px) {
            .content-wrapper {
                grid-template-columns: 1fr;
            }
            .tabs-sidebar {
                position: static;
                display: flex;
                overflow-x: auto;
                padding: 16px;
            }
            .tabs-title { display: none; }
            .tab-btn {
                white-space: nowrap;
                margin-right: 8px;
                margin-bottom: 0;
            }
        }

        @media (max-width: 768px) {
            .cards-grid {
                grid-template-columns: 1fr;
            }
            .profile-header {
                grid-template-columns: 1fr;
                text-align: center;
                padding: 30px;
            }
            .avatar-large { margin: 0 auto; }
            .stats-row { 
                grid-column: 1;
                width: 100%;
            }
            .meta-info { justify-content: center; }
        }
    `;

    if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%)', fontSize: '1.2rem', fontWeight: '600'}}>Loading your profile...</div>;

    return (
        <>
            <style>{styles}</style>
            <div className="profile-body">
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab" onClick={() => navigate('/dashboard')}>
                                <span></span> Browse Skills
                            </button>
                            <button className="nav-tab" onClick={() => navigate('/messages')}>
                                <span></span> Messages
                            </button>
                            <button className="nav-tab" onClick={() => navigate('/myswaps')}>
                                <span></span> MySwaps
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
                        <div className="avatar-large">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="user-info">
                            <h1>{user?.name || 'User Name'}</h1>
                            <p>Web developer passionate about teaching and learning new skills</p>
                            <div className="meta-info">
                                <span> {user?.school || 'University'}</span>
                                
                            </div>
                            <span className="logout-link" onClick={handleLogout}>→ Log Out</span>
                        </div>
                        <div className="stats-row">
                            <div className="stat-box">
                                <span className="stat-val">{myReviews.length}</span>
                                <span className="stat-lbl">Reviews</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-val">{averageRating} ★</span>
                                <span className="stat-lbl">Avg Rating</span>
                            </div>
                        </div>
                    </div>

                    <div className="content-wrapper">
                        <div className="tabs-sidebar">
                            <div className="tabs-title">Navigation</div>
                            <button className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
                                My Skill Offers
                            </button>
                            <button className={`tab-btn ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
                                Want to Learn
                            </button>
                            <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                                Reviews ({myReviews.length})
                            </button>
                        </div>

                        <div className="content-main">
                            {activeTab === 'offers' && (
                                <div>
                                    <div className="section-header">
                                        <div className="section-title">Skills I Can Teach</div>
                                        <button className="add-btn" onClick={() => setShowOfferModal(true)}>
                                            + Add Skill Offer
                                        </button>
                                    </div>
                                    {myOffers.length === 0 ? (
                                        <div className="empty-state">
                                            <div style={{fontSize: '3rem', marginBottom: '16px'}}>📚</div>
                                            <div>No skills posted yet. Share your expertise!</div>
                                        </div>
                                    ) : (
                                        <div className="cards-grid">
                                            {myOffers.map(offer => (
                                                <div className="offer-card" key={offer.offerId}>
                                                    <div className="card-top">
                                                        <div className="skill-name">{offer.skill?.name}</div>
                                                        <button className="delete-btn" onClick={() => handleDeleteOffer(offer.offerId)}>🗑</button>
                                                    </div>
                                                    <div className="badge-row">
                                                        <span className="request-badge-black">expert</span>
                                                        <span className="request-badge-gray">{offer.skill?.category}</span>
                                                    </div>
                                                    <p>{offer.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'learn' && (
                                <div>
                                    <div className="section-header">
                                        <div className="section-title">Skills I Want to Learn</div>
                                        <button className="add-btn" onClick={() => setShowRequestModal(true)}>
                                            + Add Skill Request
                                        </button>
                                    </div>
                                    {myRequests.length === 0 ? (
                                        <div className="empty-state">
                                            <div style={{fontSize: '3rem', marginBottom: '16px'}}>🎓</div>
                                            <div>No requests posted yet. Start learning something new!</div>
                                        </div>
                                    ) : (
                                        <div className="cards-grid">
                                            {myRequests.map(req => (
                                                <div className="offer-card" key={req.id}>
                                                    <div className="card-top">
                                                        <div className="skill-name">{req.skillName}</div>
                                                        <button className="delete-btn" onClick={() => handleDeleteRequest(req.id)}>🗑</button>
                                                    </div>
                                                    <div className="badge-row">
                                                        <span className="request-badge-black">Seeking</span>
                                                        <span className="request-badge-gray">{req.category}</span>
                                                    </div>
                                                    <p>{req.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    <div className="section-header">
                                        <div className="section-title">Reviews from Others</div>
                                    </div>
                                    {myReviews.length === 0 ? (
                                        <div className="empty-state">
                                            <div style={{fontSize: '3rem', marginBottom: '16px'}}>⭐</div>
                                            <div>No reviews yet. Complete some skill swaps to get feedback!</div>
                                        </div>
                                    ) : (
                                        <div className="cards-grid">
                                            {myReviews.map(review => (
                                                <div className="review-card" key={review.id}>
                                                    <div className="review-header">
                                                        <div className="review-author">{review.reviewer?.name || 'Anonymous'}</div>
                                                        <div className="review-stars">{"★".repeat(review.rating)}</div>
                                                    </div>
                                                    <p>"{review.comment}"</p>
                                                    <span className="review-date">{review.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showOfferModal && (
                    <div className="modal-overlay" onClick={() => setShowOfferModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Add Skill Offer</h2>
                                <button className="close-btn" onClick={() => setShowOfferModal(false)}>×</button>
                            </div>
                            <form onSubmit={submitOffer}>
                                <div className="form-group">
                                    <label className="form-label">Skill Name</label>
                                    <input className="form-input" name="skillName" placeholder="e.g. React Development" value={offerForm.skillName} onChange={handleOfferChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" name="category" value={offerForm.category} onChange={handleOfferChange}>
                                        <option>Programming</option>
                                        <option>Design</option>
                                        <option>Music</option>
                                        <option>Arts</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" name="description" placeholder="What can you teach about this skill?" value={offerForm.description} onChange={handleOfferChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Availability</label>
                                    <input className="form-input" name="availability" placeholder="e.g. Weekends, Evenings" value={offerForm.availability} onChange={handleOfferChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Looking to Learn</label>
                                    <input className="form-input" name="lookingFor" placeholder="e.g. Piano, Photography" value={offerForm.lookingFor} onChange={handleOfferChange} required />
                                </div>
                                <button type="submit" className="submit-btn">Add Offer</button>
                            </form>
                        </div>
                    </div>
                )}

                {showRequestModal && (
                    <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Add Skill Request</h2>
                                <button className="close-btn" onClick={() => setShowRequestModal(false)}>×</button>
                            </div>
                            <form onSubmit={submitRequest}>
                                <div className="form-group">
                                    <label className="form-label">Skill to Learn</label>
                                    <input className="form-input" name="skillName" placeholder="e.g. Photography" value={requestForm.skillName} onChange={handleRequestChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" name="category" value={requestForm.category} onChange={handleRequestChange}>
                                        <option>Programming</option>
                                        <option>Design</option>
                                        <option>Music</option>
                                        <option>Arts</option>
                                        <option>Fitness</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" name="description" placeholder="Why do you want to learn this skill?" value={requestForm.description} onChange={handleRequestChange} required />
                                </div>
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
                            
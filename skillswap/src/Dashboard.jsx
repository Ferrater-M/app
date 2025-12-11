import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OfferDetails from './OfferDetails'; 

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [skillOffers, setSkillOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0); 

    // MODAL STATE
    const [selectedOffer, setSelectedOffer] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchSkillOffers();
        
        if (parsedUser.userId) {
            fetchNotifications(parsedUser.userId);
        }
    }, [navigate]);

    // --- NOTIFICATION LOGIC ---
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

    const fetchSkillOffers = async () => {
        try {
            // API call returns SkillOfferDto with real averageRating and filters completed offers
            const response = await axios.get('http://localhost:8080/api/offers');
            
            const enrichedOffers = response.data.map((offer) => ({
                ...offer,
                icon: offer.user?.name ? offer.user.name.charAt(0).toUpperCase() : 'U',
                // Uses the real averageRating field provided by the backend DTO
                rating: offer.averageRating ? parseFloat(offer.averageRating).toFixed(1) : '0.0'
            }));
            setSkillOffers(enrichedOffers);
        } catch (err) {
            console.error(err);
            setSkillOffers([]); 
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(skillOffers.map(offer => offer.skill?.category).filter(Boolean))];
    const filteredSkills = skillOffers.filter(skill => {
        const searchTerm = searchQuery.toLowerCase().trim();
        const matchesSearch = (
            (skill.description && skill.description.toLowerCase().includes(searchTerm)) ||
            (skill.skill?.name && skill.skill.name.toLowerCase().includes(searchTerm)) ||
            (skill.lookingFor && skill.lookingFor.toLowerCase().includes(searchTerm))
        );
        const matchesCategory = selectedCategory === '' || (skill.skill?.category === selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const handleViewDetails = (offer) => {
        setSelectedOffer(offer);
    };

    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; background-color: #fff7e1; }
        .dashboard-body { width: 100vw; min-height: 100vh; background: #fff7e1; overflow-x: hidden; }

        /* Navbar */
        .navbar { background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #060606; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; }
        .nav-left { display: flex; align-items: center; gap: 48px; }
        .logo { font-size: 1.75rem; font-weight: 800; color: #060606; letter-spacing: -0.5px; cursor: pointer; }
        
        .nav-tabs { display: flex; gap: 8px; background: rgba(255,255,255,0.3); padding: 6px; border-radius: 30px; backdrop-filter: blur(10px); }
        .nav-tab { 
            position: relative; 
            display: flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 24px; 
            text-decoration: none; color: #060606; font-weight: 600; transition: all 0.3s ease; 
            border: none; background: transparent; cursor: pointer; font-size: 0.95rem; font-family: 'Inter', sans-serif; 
        }
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

        /* Main Content */
        .main-content { padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .page-header { margin-bottom: 24px; text-align: center; } 
        .page-title { font-size: 2rem; font-weight: 800; color: #060606; margin-bottom: 10px; }
        .page-subtitle { color: #666666; font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
        
        /* SEARCH (ROUNDER PILL SHAPE) */
        .search-container { 
            display: flex; gap: 15px; margin: 40px 0; width: 100%; 
            background: rgba(255,255,255,0.5); padding: 10px; border-radius: 60px; 
        }
        
        .search-wrapper { position: relative; flex-grow: 1; }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #999; }
        
        .search-bar { 
            width: 100%; padding: 16px 20px; padding-left: 50px; 
            border: 1px solid #ddd; border-radius: 50px; 
            font-size: 1rem; background: #ffffff; color: #000000 !important; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .search-bar:focus { outline: 2px solid #f5b423; border-color: #f5b423; }

        .category-select {
            width: 200px; padding: 0 25px; 
            border-radius: 50px; 
            border: 1px solid #ddd; background-color: #ffffff; 
            font-size: 1rem; cursor: pointer; color: #060606;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        /* GRID */
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 30px; width: 100%; }
        
        /* CARD (ROUNDER EDGES) */
        .skill-card { 
            background: #ffffff; 
            border-radius: 24px; 
            padding: 28px; 
            border: 1px solid #f0f0f0; 
            transition: all 0.3s ease; display: flex; flex-direction: column; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
        }
        .skill-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(245, 180, 35, 0.15); border-color: #f5b423; }
        
        .card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .user-click-area { display: flex; align-items: center; gap: 15px; } 

        .user-avatar { width: 52px; height: 52px; background: #fff7e1; border: 2px solid #f5b423; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.3rem; color: #060606; }
        .user-info h3 { font-size: 1.1rem; font-weight: 700; color: #060606; }
        .user-info p { font-size: 0.9rem; color: #666666; }
        
        .skill-title { font-size: 1.25rem; font-weight: 800; color: #060606; margin-bottom: 10px; }
        .skill-description { font-size: 0.95rem; color: #555; line-height: 1.6; margin-bottom: 20px; flex-grow: 1; }
        
        .wants-section { 
            background: #fff9f9; 
            padding: 10px 15px; 
            border-radius: 12px; 
            margin-bottom: 20px; 
            border: 1px dashed maroon; 
        }
        .wants-label { font-size: 0.75rem; font-weight: 800; color: maroon; text-transform: uppercase; letter-spacing: 0.5px; }
        .wants-text { font-size: 0.95rem; font-weight: 600; color: #333; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #f5f5f5; }
        .swap-info { font-size: 0.85rem; color: #888; font-weight: 500; }
        
        .view-btn { 
            background: #060606; 
            color: #ffffff; border: none; 
            padding: 10px 24px; 
            border-radius: 30px; 
            font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; 
        }
        .view-btn:hover { background: #333; transform: scale(1.05); }

        .no-results { text-align: center; padding: 3rem; color: #666; grid-column: 1 / -1; }
        
        @media (max-width: 768px) {
            .search-container { flex-direction: column; background: transparent; padding: 0; }
            .category-select { width: 100%; height: 50px; }
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="dashboard-body">
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab active" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            
                            {/* MESSAGES TAB (No badge) */}
                            <button className="nav-tab" onClick={() => navigate('/messages')}>
                                Messages
                            </button>
                            
                            {/* MY SWAPS TAB (Notification badge moved here) */}
                            <button className="nav-tab" onClick={() => navigate('/myswaps')}>
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
                        <div className="avatar" onClick={() => navigate('/profile')}>{user?.name?.charAt(0) || 'M'}</div>
                    </div>
                </nav>

                <main className="main-content">
                    <div className="page-header">
                        <h1 className="page-title">Exchange Skills, Grow Together</h1>
                        <p className="page-subtitle">Connect with people who want to learn what you know, and teach what you want to learn.</p>
                    </div>

                    <div className="search-container">
                        <div className="search-wrapper">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                className="search-bar"
                                placeholder="Search skills or people..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select 
                            className="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat, index) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="skills-grid">
                        {loading ? (
                            <div className="no-results"><p>Loading skills...</p></div>
                        ) : filteredSkills.length === 0 ? (
                            <div className="no-results">
                                <p>No skills found.</p>
                            </div>
                        ) : (
                            filteredSkills.map((skill, index) => (
                                <div className="skill-card" key={index}>
                                    <div className="card-header">
                                        {/* No Profile Visit logic */}
                                        <div 
                                            className="user-click-area"
                                        >
                                            <div className="user-avatar">{skill.icon}</div>
                                            <div className="user-info">
                                                <h3>{skill.user?.name || 'User'}</h3>
                                                <p>{skill.rating} ★</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="skill-title">{skill.skill?.name || 'Skill'}</div>
                                    <p className="skill-description">{skill.description}</p>
                                    
                                    <div className="wants-section">
                                        <div className="wants-label">Wants in Return</div>
                                        <div className="wants-text">{skill.lookingFor || 'Any fair swap'}</div>
                                    </div>

                                    <div className="card-footer">
                                        <div className="swap-info">Available: {skill.availability}</div>
                                        <button className="view-btn" onClick={() => handleViewDetails(skill)}>View Details</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
                
                {/* --- OFFER DETAILS MODAL --- */}
                {selectedOffer && (
                    <OfferDetails 
                        offer={selectedOffer} 
                        onClose={() => setSelectedOffer(null)} 
                    />
                )}
                
            </div>
        </>
    );
};

export default Dashboard;
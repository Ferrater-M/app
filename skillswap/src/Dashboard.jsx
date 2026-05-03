import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OfferDetails from './OfferDetails';
import Loading from './Loading'; 

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
            const response = await axios.get('http://localhost:8080/api/offers');
            
            const enrichedOffers = response.data.map((offer) => ({
                ...offer,
                icon: offer.user?.name ? offer.user.name.charAt(0).toUpperCase() : 'U',
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
        .dashboard-body { width: 100vw; min-height: 100vh; background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%); overflow-x: hidden; }

        /* --- NAVBAR (Copied from Messages) --- */
        .navbar { 
            background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); 
            padding: 18px 5vw; /* Consistent with other components */
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 3px solid #060606; 
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            position: sticky;
            top: 0;
            z-index: 1000;
            width: 100%;
        }
        .nav-left { display: flex; align-items: center; gap: 60px; }
        .logo { font-size: 2rem; font-weight: 900; color: #060606; letter-spacing: -0.8px; cursor: pointer; transition: transform 0.2s; }
        .logo:hover { transform: scale(1.05); }
        
        .nav-tabs { display: flex; gap: 10px; background: rgba(255,255,255,0.35); padding: 8px; border-radius: 50px; backdrop-filter: blur(10px); }
        .nav-tab { 
            position: relative; 
            padding: 14px 28px; 
            border-radius: 30px; 
            color: #060606; 
            font-weight: 600; 
            transition: all 0.3s ease; 
            border: none; 
            background: transparent; 
            cursor: pointer; 
            font-size: 0.95rem; 
        }
        .nav-tab:hover { background: rgba(6,6,6,0.08); transform: translateY(-2px); }
        .nav-tab.active { background: #060606; color: #FFC300; box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
        
        .notification-badge {
            position: absolute; top: 6px; right: 8px; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); 
            color: white; border-radius: 50%; min-width: 22px; height: 22px; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 0.7rem; font-weight: 800; line-height: 1;
        }

        .nav-right { display: flex; align-items: center; gap: 16px; }
        .avatar { 
            width: 48px; height: 48px; 
            background: linear-gradient(135deg, #8B0000 0%, #5a0000 100%); 
            color: #FFC300; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-weight: 800; font-size: 1.2rem; 
            border: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
            cursor: pointer;
        }
        
        /* Main Content */
        .main-content { padding: 40px 5vw; max-width: 1400px; margin: 0 auto; width: 100%; }
        .page-header { margin-bottom: 40px; text-align: center; padding-top: 20px; } 
        .page-title { 
            font-size: 2.8rem; 
            font-weight: 900; 
            color: #060606; 
            margin-bottom: 15px; 
            letter-spacing: -1px;
            text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
        }
        .page-subtitle { color: #444; font-size: 1.2rem; max-width: 700px; margin: 0 auto; font-weight: 500;}
        
        /* SEARCH (IMPROVED DESIGN) */
        .search-container { 
            display: flex; gap: 20px; margin: 50px 0; width: 100%; 
            background: #ffffff; 
            padding: 12px; 
            border-radius: 16px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 2px solid #f0f0f0;
        }
        
        .search-wrapper { position: relative; flex-grow: 1; }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #666; width: 20px; height: 20px; }
        
        .search-bar { 
            width: 100%; padding: 18px 20px; padding-left: 55px; 
            border: none; border-radius: 12px; 
            font-size: 1.1rem; background: #f8f8f8; color: #000000 !important; 
            transition: all 0.3s ease;
        }
        .search-bar:focus { outline: none; background: #fff; box-shadow: 0 0 0 3px #f5b423; }

        .category-select {
            min-width: 250px; padding: 10px 25px; 
            border-radius: 12px; 
            border: 2px solid #ddd; background-color: #ffffff; 
            font-size: 1.1rem; cursor: pointer; color: #060606;
            appearance: none; /* Hide default arrow */
            background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%20287.5c-4.1%204.1-10.8%204.1-14.9%200L146.2%20146.7%2020.3%20287.5c-4.1%204.1-10.8%204.1-14.9%200-4.1-4.1-4.1-10.8%200-14.9L138.7%20139l-133.3-132.8c-4.1-4.1-4.1-10.8%200-14.9%204.1-4.1%2010.8-4.1%2014.9%200L146.2%20124.5l125.7-125.2c4.1-4.1%2010.8-4.1%2014.9%200%204.1%204.1%204.1%2010.8%200%2014.9L161.1%20139l125.7%20125.2c4.1%204.1%204.1%2010.8%200%2014.9z%22%2F%3E%3C%2Fsvg%3E') !important;
            background-position: calc(100% - 15px) center !important;
            background-repeat: no-repeat !important;
            background-size: 10px !important;
            height: 56px; /* Match search bar height */
        }
        .category-select:focus { outline: 2px solid #f5b423; border-color: #f5b423; }

        /* GRID */
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
            gap: 35px; 
            width: 100%; 
            padding-bottom: 50px;
        }
        
        /* CARD (IMPROVED DESIGN) */
        .skill-card { 
            background: #ffffff; 
            border-radius: 20px; 
            padding: 30px; 
            border: 1px solid #e0e0e0; 
            transition: all 0.3s ease; display: flex; flex-direction: column; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
        }
        .skill-card:hover { 
            transform: translateY(-8px); 
            box-shadow: 0 20px 40px rgba(245, 180, 35, 0.2); 
            border-color: #f7d33f; 
        }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .user-click-area { display: flex; align-items: center; gap: 15px; cursor: pointer; } 

        .user-avatar { 
            width: 48px; height: 48px; 
            background: linear-gradient(135deg, #060606 0%, #333 100%); 
            border: 3px solid #f5b423; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-weight: 700; font-size: 1.1rem; color: #fff; 
        }
        .user-info h3 { font-size: 1.1rem; font-weight: 800; color: #060606; margin-bottom: 2px; }
        .user-info p { font-size: 0.9rem; color: #f5b423; font-weight: 600; } /* Highlight Rating */
        
        .skill-title { font-size: 1.5rem; font-weight: 900; color: #060606; margin-bottom: 10px; }
        .skill-description { font-size: 1rem; color: #555; line-height: 1.7; margin-bottom: 20px; flex-grow: 1; }
        
        .wants-section { 
            background: #fff9f9; 
            padding: 12px 18px; 
            border-radius: 12px; 
            margin-bottom: 20px; 
            border: 1px solid #cc0000; 
        }
        .wants-label { font-size: 0.75rem; font-weight: 800; color: #cc0000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .wants-text { font-size: 1rem; font-weight: 600; color: #333; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid #f0f0f0; }
        .swap-info { font-size: 0.85rem; color: #888; font-weight: 500; }
        
        .view-btn { 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #FFC300; border: none; 
            padding: 12px 28px; 
            border-radius: 30px; 
            font-size: 1rem; font-weight: 700; cursor: pointer; 
            transition: all 0.3s ease; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .view-btn:hover { background: #333; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.3); }

        .no-results { text-align: center; padding: 5rem 1rem; color: #666; grid-column: 1 / -1; font-size: 1.2rem; }
        
        @media (max-width: 900px) {
            .navbar { padding: 18px 20px; }
            .nav-tabs { display: none; }
            .main-content { padding: 20px; }
            .page-title { font-size: 2rem; }
            .page-subtitle { font-size: 1rem; }
            .search-container { flex-direction: column; padding: 10px; }
            .category-select { min-width: 100%; margin-top: 10px; }
            .skills-grid { grid-template-columns: 1fr; gap: 25px; }
        }
    `;

    if (loading) {
        return <Loading text="Loading skills..." />;
    }

    return (
        <>
            <style>{styles}</style>
            <div className="dashboard-body">
                {/* --- NAVBAR (Modern Shared Design) --- */}
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab active" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            
                            <button className="nav-tab" onClick={() => navigate('/messages')}>
                                Messages
                            </button>
                            
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
                        <div className="avatar" onClick={() => navigate('/profile')}>{user?.name?.charAt(0) || 'U'}</div>
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
                        {filteredSkills.length === 0 ? (
                            <div className="no-results">
                                <p>No skills found matching your criteria.</p>
                            </div>
                        ) : (
                            filteredSkills.map((skill, index) => (
                                <div className="skill-card" key={index}>
                                    <div className="card-header">
                                        <div 
                                            className="user-click-area"
                                            // Ideally, this should navigate to a profile page
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
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Loading from './Loading';

const Messages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- STATE SETUP (Original File) ---
    const [user, setUser] = useState(null);
    const [partners, setPartners] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0); 
    const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 900); 

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- FUNCTION DEFINITIONS (Original File) ---
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

    // Note: fetchConversation doesn't need to be updated, as the polling hook
    // will handle the repeated API calls.
    const fetchConversation = async (myId, partnerId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/messages/conversation/${myId}/${partnerId}`);
            setMessages(res.data);
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error("Failed to load conversation", err);
            setMessages([]);
        }
    };

    // --- EFFECT 1: INITIAL LOAD (Original Logic) ---
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
                const res = await axios.get(`http://localhost:8080/api/messages/partners/${parsedUser.userId}`);
                let initialPartners = res.data;
                const targetPartner = location.state?.partner;
                
                if (targetPartner) {
                    const exists = initialPartners.find(p => p.userId === targetPartner.userId);
                    if (!exists) {
                        initialPartners = [targetPartner, ...initialPartners];
                    }
                    setActivePartner(targetPartner);
                    fetchConversation(parsedUser.userId, targetPartner.userId);
                    setIsSidebarVisible(window.innerWidth >= 900);
                } else if (initialPartners.length > 0) {
                    setActivePartner(initialPartners[0]);
                    fetchConversation(parsedUser.userId, initialPartners[0].userId);
                }
                setPartners(initialPartners);

            } catch (err) {
                console.error("Error loading messages or partners", err);
            } finally {
                setLoading(false);
            }
        };
        init();

        // Handle window resize logic
        const handleResize = () => {
            if (window.innerWidth >= 900) {
                setIsSidebarVisible(true);
            } else if (activePartner) {
                setIsSidebarVisible(false);
            } else {
                setIsSidebarVisible(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate, location.state]); 

    // ------------------------------------------------------------------
    // ⭐ NEW EFFECT FOR REAL-TIME POLLING ⭐
    // This periodically checks the API for new messages from the active partner.
    // ------------------------------------------------------------------
    useEffect(() => {
        // Only proceed if both the user and an active conversation partner are set.
        if (!user || !activePartner) {
            return;
        }

        const pollForMessages = () => {
            axios.get(`http://localhost:8080/api/messages/conversation/${user.userId}/${activePartner.userId}`)
                .then(res => {
                    // Use a functional update to check if the data has actually changed
                    setMessages(prevMessages => {
                        const newMessages = res.data;
                        
                        // Check if the conversation length has changed (new messages received)
                        if (newMessages.length > prevMessages.length) {
                            return newMessages;
                        }

                        // Optional: Check if the last message content/timestamp has changed
                        // This handles cases where the length might be the same but content was modified (less common)
                        if (newMessages.length > 0 && 
                            prevMessages.length > 0 &&
                            newMessages[newMessages.length - 1].content !== prevMessages[prevMessages.length - 1].content) {
                            return newMessages;
                        }

                        // If nothing has changed, return the previous state to prevent unnecessary re-renders
                        return prevMessages;
                    });
                })
                .catch(err => {
                    console.error("Failed to poll for new messages:", err);
                    // Optionally handle showing a connection error to the user
                });
        };

        // Start polling every 3 seconds (3000ms)
        const intervalId = setInterval(pollForMessages, 3000); 

        // Cleanup: Stop polling when the component unmounts or activePartner/user changes
        return () => {
            clearInterval(intervalId);
        };

    // Trigger this effect whenever the logged-in user or the active conversation partner changes
    }, [user, activePartner]);


    // --- EFFECT 2: SCROLL ON MESSAGE UPDATE ---
    // This runs when messages state is updated by fetchConversation or the polling hook.
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // ------------------------------------------------------------------

    const handlePartnerClick = (partner) => {
        setActivePartner(partner);
        // Initial fetch upon click (the polling hook will take over after this)
        fetchConversation(user.userId, partner.userId); 
        if (window.innerWidth < 900) {
            setIsSidebarVisible(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activePartner || !user) return;

        const originalMessage = newMessage.trim();
        const tempMessageId = Date.now();
        const timestamp = new Date().toISOString();

        // Optimistic UI update
        const tempMessage = {
            sender: { userId: user.userId },
            content: originalMessage,
            timestamp: timestamp,
            id: tempMessageId 
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        
        // Ensure immediate scroll for the sent message
        setTimeout(scrollToBottom, 100); 

        try {
            const payload = {
                senderId: user.userId,
                receiverId: activePartner.userId,
                content: originalMessage
            };

            // Send to server (server saves it and ideally triggers an update for the receiver)
            await axios.post('http://localhost:8080/api/messages/send', payload);
            
            // NOTE: We don't need to refetch here. The polling loop will pick up the saved 
            // message and replace the temporary one, ensuring data consistency (unless the server returns the message with the final ID/timestamp right away, which is often a better pattern).
            // For now, we rely on the polling loop to synchronize.

        } catch (err) {
            console.error("Failed to send message", err);
            alert("Failed to send message");
            // Rollback optimistic update if failure occurred
            setMessages(prev => prev.filter(msg => msg.id !== tempMessageId)); 
        }
    };

    // --- STYLES (Unchanged) ---
    const styles = `
        /* GLOBAL RESET & BASE STYLES */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .messages-body { 
            width: 100%; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%); 
            display: flex; 
            flex-direction: column; 
            overflow-x: hidden; 
        }

        /* --- NAVBAR (Profile/MySwaps Style) --- */
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

        /* --- CONTAINER FOR ALIGNMENT --- */
        .content-align-wrapper {
            max-width: 1400px;
            min-width: 1300px;
            margin: 40px auto 0;
            padding: 0 40px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        /* HEADER STYLES */
        .page-title { 
            font-size: 2.2rem; 
            font-weight: 900; 
            color: #000; 
            letter-spacing: -0.5px; 
            text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
            margin-bottom: 5px; 
        }
        
        .page-subheader {
            font-size: 1.1rem;
            font-weight: 500;
            color: #555;
        }

        /* --- MAIN CHAT LAYOUT --- */
        .layout-container {
            flex: 1;
            display: flex;
            justify-content: center;
            padding-bottom: 40px; 
            width: 100%;
        }

        .messenger-card { 
            display: flex; 
            width: 100%; 
            height: 75vh; 
            min-height: 600px; 
            background: white; 
            border-radius: 32px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.08); 
            overflow: hidden; 
            border: 2px solid #e0e0e0;
        }
        
        /* SIDEBAR (Contact List) */
        .sidebar { 
            width: 320px; 
            min-width: 320px; 
            background: #fff; 
            border-right: 1px solid #f0f0f0; 
            display: flex; 
            flex-direction: column; 
            z-index: 2;
            transition: transform 0.3s ease;
        }
        .sidebar-header { 
            padding: 25px 30px; 
            font-weight: 900; 
            font-size: 1.4rem; 
            color: #000; 
            letter-spacing: -0.5px;
            border-bottom: 1px solid #f8f8f8;
            flex-shrink: 0;
        }
        
        .partner-list { 
            overflow-y: auto; 
            flex: 1; 
            padding: 15px 0; 
        }
        
        .partner-item { 
            display: flex; align-items: center; gap: 15px; 
            padding: 16px 30px; cursor: pointer; 
            transition: all 0.2s ease; 
            border-left: 5px solid transparent;
        }
        .partner-item:hover { background: #fafafa; }
        
        /* ACTIVE STATE */
        .partner-item.active { 
            background: #FFF9C4; 
            border-left: 5px solid #FFC300;
        }
        
        .partner-avatar { 
            width: 48px; height: 48px; border-radius: 50%; 
            background: #f0f0f0; display: flex; align-items: center; justify-content: center; 
            font-weight: 800; color: #555; font-size: 1.1rem; 
            border: 2px solid #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            flex-shrink: 0;
        }
        .partner-item.active .partner-avatar { 
            background: #000; 
            color: #FFC300; 
            border-color: #FFC300; 
        }

        .partner-info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        .partner-name { font-weight: 700; color: #333; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .partner-item.active .partner-name { color: #000; }

        /* CHAT AREA */
        .chat-area { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            background: #FAFAFA;
            position: relative;
        }

        .chat-header { 
            padding: 15px 30px; 
            border-bottom: 1px solid #f0f0f0; 
            display: flex; align-items: center; gap: 16px; 
            background: #fff;
            flex-shrink: 0;
            z-index: 10;
        }
        .chat-header-info h3 { font-size: 1.2rem; font-weight: 800; margin: 0; color: #000; }
        .chat-header-info span { font-size: 0.85rem; color: #28a745; font-weight: 600; display: flex; align-items: center; gap: 4px;}
        .chat-header-info span::before { content: ''; display: block; width: 8px; height: 8px; background: #28a745; border-radius: 50%; }

        /* MESSAGES LIST */
        .messages-list { 
            flex: 1; 
            overflow-y: auto; 
            padding: 30px; 
            display: flex; 
            flex-direction: column; 
            gap: 20px; 
            background-image: radial-gradient(#e5e5e5 1px, transparent 1px);
            background-size: 30px 30px; 
        }
        
        .message-bubble { 
            max-width: 50%; 
            padding: 14px 22px; 
            font-size: 1rem; 
            line-height: 1.5; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
            word-wrap: break-word;
        }
        
        .msg-sent { 
            align-self: flex-end; 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: #fff; 
            border-radius: 20px 20px 2px 20px;
            margin-left: 20%; 
        }
        
        .msg-received { 
            align-self: flex-start; 
            background: #FFC300; 
            color: #000; 
            border-radius: 20px 20px 20px 2px;
            margin-right: 20%; 
        }
        
        .msg-time { 
            font-size: 0.75rem; 
            margin-top: 8px; 
            opacity: 0.8; 
            text-align: right; 
            font-weight: 500; 
        }
        .msg-sent .msg-time { color: rgba(255, 195, 0, 0.9); }

        /* INPUT AREA */
        .input-wrapper {
            padding: 20px 30px;
            background: #fff;
            border-top: 1px solid #f0f0f0;
            flex-shrink: 0;
        }

        .input-area { 
            display: flex; 
            gap: 15px; 
            align-items: center; 
            background: #f5f5f5;
            padding: 10px;
            border-radius: 50px;
            border: 2px solid #eee;
            transition: all 0.3s ease;
        }
        .input-area:focus-within {
            background: #fff;
            border-color: #FFC300;
            box-shadow: 0 8px 30px rgba(255, 195, 0, 0.15);
        }
        
        .msg-input { 
            flex: 1; 
            padding: 12px 20px; 
            border: none; 
            background: transparent;
            font-size: 1rem; 
            outline: none; 
            color: #000;
        }
        
        .send-btn { 
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            border: none; 
            width: 48px; 
            height: 48px; 
            border-radius: 50%; 
            cursor: pointer; 
            color: #FFC300; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 1.2rem; 
            transition: transform 0.2s; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
            flex-shrink: 0;
        }
        .send-btn:hover { transform: scale(1.05) rotate(-10deg); }

        /* Empty State */
        .empty-state { 
            flex: 1; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            color: #999; 
            text-align: center;
            background: #fafafa; 
        }
        .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            color: #FFC300;
        }

        /* MOBILE OVERLAY TOGGLES */
        @media (max-width: 900px) {
            .content-align-wrapper { 
                max-width: 100%;
                min-width: unset;
                margin: 0; 
                padding: 0;
            }
            .layout-container { padding: 0; height: calc(100vh - 84px); }
            .messenger-card { max-width: 100%; min-width: unset; border-radius: 0; border: none; height: 100%; margin: 0; }
            .navbar { padding: 18px 20px; }
            .nav-tabs { display: none; }
            
            /* Sidebar takes full width and overlays chat */
            .sidebar { 
                position: absolute; 
                top: 0; 
                left: 0;
                width: 100%; 
                height: 100%; 
                z-index: 20; 
                transform: translateX(0);
            }
            .sidebar.hidden {
                transform: translateX(-100%);
            }

            /* Chat area always takes 100% width, toggles visibility of back button */
            .chat-area { width: 100%; z-index: 10; }
            .messages-list { background-size: 20px 20px; }
            .message-bubble { max-width: 75%; margin-left: 0; margin-right: 0; }
            .msg-sent { align-self: flex-end; margin-left: 20%; }
            .msg-received { align-self: flex-start; margin-right: 20%; }
        }
    `;

    if (loading) return <Loading text="Loading messages..." />;

    return (
        <>
            <style>{styles}</style>
            <div className="messages-body">
                {/* Navbar */}
                <nav className="navbar">
                    <div className="nav-left">
                        <div className="logo" onClick={() => navigate('/dashboard')}>SkillSwap</div>
                        <div className="nav-tabs">
                            <button className="nav-tab" onClick={() => navigate('/dashboard')}>Browse Skills</button>
                            <button className="nav-tab active" onClick={() => navigate('/messages')}>Messages</button>
                            <button className="nav-tab" onClick={() => navigate('/myswaps')}>
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

                {/* --- HEADER + CHAT ALIGNMENT WRAPPER --- */}
                <div className="content-align-wrapper">
                    {/* Page Header */}
                    {window.innerWidth >= 900 && (
                        <div>
                            <h1 className="page-title">Messages</h1>
                            <p className="page-subheader">Connect and chat to coordinate your skill swaps.</p>
                        </div>
                    )}

                    <div className="layout-container">
                        <div className="messenger-card">
                            
                            {/* SIDEBAR (Contact List) */}
                            <div className={`sidebar ${window.innerWidth < 900 && !isSidebarVisible ? 'hidden' : ''}`}>
                                <div className="sidebar-header">
                                    Recent Chats
                                </div>
                                <div className="partner-list">
                                    {partners.length === 0 ? (
                                        <div style={{padding:'40px 20px', color:'#999', fontSize:'0.9rem', textAlign: 'center', lineHeight:'1.6'}}>
                                            No conversations yet.<br/>
                                            <span style={{color: '#FFC300', cursor:'pointer', fontWeight:'bold'}} onClick={()=>navigate('/dashboard')}>Find a skill swap!</span>
                                        </div>
                                    ) : (
                                        partners.map(p => (
                                            <div 
                                                key={p.userId} 
                                                className={`partner-item ${activePartner?.userId === p.userId ? 'active' : ''}`}
                                                onClick={() => handlePartnerClick(p)}
                                            >
                                                <div className="partner-avatar" style={{background: activePartner?.userId === p.userId ? '#000' : '#f0f0f0', color: activePartner?.userId === p.userId ? '#FFC300' : '#555'}}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div className="partner-info">
                                                    <div className="partner-name">{p.name}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* CHAT AREA */}
                            <div className="chat-area">
                                {activePartner ? (
                                    <>
                                        <div className="chat-header">
                                            {/* Mobile Back Button */}
                                            {window.innerWidth < 900 && !isSidebarVisible && (
                                                <button 
                                                    className="back-button" 
                                                    onClick={() => setIsSidebarVisible(true)} 
                                                    style={{display: 'block', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#000', marginRight: '10px', padding: '5px'}}>
                                                    &larr;
                                                </button>
                                            )}
                                            <div className="partner-avatar" style={{background: '#000', color: '#FFC300'}}>
                                                {activePartner.name.charAt(0)}
                                            </div>
                                            <div className="chat-header-info">
                                                <h3>{activePartner.name}</h3>
                                                {/* Simulated Online Status */}
                                                <span>Online</span>
                                            </div>
                                        </div>

                                        <div className="messages-list">
                                            {messages.length === 0 && (
                                                <div style={{textAlign:'center', marginTop:'80px', color:'#aaa'}}>
                                                    <div style={{fontSize: '3rem', marginBottom: '10px'}}>👋</div>
                                                    Start the conversation with {activePartner.name}
                                                </div>
                                            )}
                                            {messages.map((msg, index) => (
                                                <div 
                                                    key={msg.id || index} 
                                                    className={`message-bubble ${msg.sender?.userId === user.userId ? 'msg-sent' : 'msg-received'}`}
                                                >
                                                    {msg.content}
                                                    <div className="msg-time">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <div className="input-wrapper">
                                            <form className="input-area" onSubmit={handleSendMessage}>
                                                <input 
                                                    className="msg-input" 
                                                    placeholder="Type your message..." 
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                />
                                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>➤</button>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">💬</div>
                                        <h3 style={{color:'#333', marginBottom:'10px'}}>Welcome to Messages</h3>
                                        <p>Select a conversation from the left to start chatting.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Messages;
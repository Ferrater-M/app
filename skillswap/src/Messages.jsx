import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Messages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [user, setUser] = useState(null);
    const [partners, setPartners] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    
    // NOTIFICATION STATE (Fetching count, but not displaying badge on this tab)
    const [notificationCount, setNotificationCount] = useState(0); 

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                const res = await axios.get(`http://localhost:8080/api/messages/partners/${parsedUser.userId}`);
                setPartners(res.data);

                const targetPartner = location.state?.partner;
                
                if (targetPartner) {
                    const exists = res.data.find(p => p.userId === targetPartner.userId);
                    if (!exists) {
                        setPartners(prev => [targetPartner, ...prev]);
                    }
                    setActivePartner(targetPartner);
                    fetchConversation(parsedUser.userId, targetPartner.userId);
                } else if (res.data.length > 0) {
                    setActivePartner(res.data[0]);
                    fetchConversation(parsedUser.userId, res.data[0].userId);
                }
            } catch (err) {
                console.error("Error loading messages", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate, location.state]);

    // --- NOTIFICATION LOGIC --- //
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

    const fetchConversation = async (myId, partnerId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/messages/conversation/${myId}/${partnerId}`);
            setMessages(res.data);
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error("Failed to load conversation", err);
        }
    };

    const handlePartnerClick = (partner) => {
        setActivePartner(partner);
        fetchConversation(user.userId, partner.userId);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activePartner) return;

        try {
            const payload = {
                senderId: user.userId,
                receiverId: activePartner.userId,
                content: newMessage
            };

            const res = await axios.post('http://localhost:8080/api/messages/send', payload);
            setMessages([...messages, res.data]);
            setNewMessage('');
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            alert("Failed to send message");
        }
    };

    const styles = `
        /* GLOBAL RESET */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; font-family: 'Inter', sans-serif; background-color: #FFF8E1; }
        
        .messages-body { 
            width: 100%; 
            height: 100vh; 
            background: #FFF8E1; 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }

        /* --- NAVBAR --- */
        .navbar { 
            background: linear-gradient(135deg, #f7d33f 0%, #f5b423 100%); 
            padding: 16px 40px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 3px solid #060606; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
            width: 100%;
            flex-shrink: 0; 
        }
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
        .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, maroon 0%, #5a0000 100%); color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(122,0,0,0.3); cursor: pointer; transition: all 0.3s ease; }
        .avatar:hover { transform: scale(1.1); }

        /* LAYOUT */
        .main-container { 
            display: flex; 
            height: calc(100vh - 120px); 
            width: 100%; 
            max-width: 1100px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 24px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.05); 
            overflow: hidden; 
            border: 1px solid #f0f0f0;
        }
        
        /* SIDEBAR */
        .sidebar { width: 320px; background: #fff; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
        .sidebar-header { padding: 25px; border-bottom: 1px solid #f0f0f0; font-weight: 800; font-size: 1.3rem; color: #000; }
        .partner-list { overflow-y: auto; flex: 1; padding: 10px; }
        
        .partner-item { 
            display: flex; align-items: center; gap: 15px; 
            padding: 15px 20px; cursor: pointer; 
            transition: all 0.2s; 
            border-radius: 16px; 
            margin-bottom: 5px;
        }
        .partner-item:hover { background: #f9f9f9; }
        .partner-item.active { background: #FFF8E1; border: 1px solid #FFC300; }
        
        .partner-avatar { width: 45px; height: 45px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #555; font-size: 1.1rem; }
        .partner-name { font-weight: 700; color: #333; font-size: 1rem; }

        /* CHAT AREA */
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; }
        .chat-header { padding: 20px 30px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 15px; background: #fff; }
        .chat-header h3 { font-size: 1.2rem; font-weight: 800; margin: 0; }
        
        /* MESSAGES LIST */
        .messages-list { flex: 1; overflow-y: auto; padding: 30px; display: flex; flex-direction: column; gap: 15px; background: #fafafa; }
        
        .message-bubble { max-width: 65%; padding: 14px 20px; border-radius: 20px; font-size: 1rem; line-height: 1.5; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
        
        .msg-sent { align-self: flex-end; background: #000; color: #fff; border-bottom-right-radius: 4px; }
        
        .msg-received { align-self: flex-start; background: #fff; border: 1px solid #ddd; color: #333; border-bottom-left-radius: 4px; }
        
        .msg-time { font-size: 0.75rem; margin-top: 6px; opacity: 0.6; text-align: right; font-weight: 500; }

        /* INPUT AREA */
        .input-area { padding: 25px; background: #fff; border-top: 1px solid #f0f0f0; display: flex; gap: 15px; align-items: center; }
        
        .msg-input { color: black; flex: 1; padding: 15px 25px; border: 1px solid #ddd; border-radius: 50px; font-family: 'Inter', sans-serif; font-size: 1rem; outline: none; transition: all 0.2s; background: #f9f9f9; }
        .msg-input:focus { border-color: #FFC300; background: #fff; box-shadow: 0 0 0 3px rgba(255, 195, 0, 0.1); }
        
        .send-btn { background: #000; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; color: #FFC300; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .send-btn:hover { transform: scale(1.1); background: #333; }

        .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic; background: #fafafa; }
        
        @media (max-width: 768px) {
            .navbar { padding: 15px 20px; }
            .nav-tabs { display: none; }
            .main-container { margin: 0; height: calc(100vh - 80px); border-radius: 0; }
        }
    `;

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
                            
                            <button className="nav-tab active" onClick={() => navigate('/messages')}>
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

                <div className="main-container">
                    {/* SIDEBAR */}
                    <div className="sidebar">
                        <div className="sidebar-header">Recent Chats</div>
                        <div className="partner-list">
                            {partners.length === 0 ? (
                                <div style={{padding:'20px', color:'#999', fontSize:'0.9rem', textAlign: 'center'}}>
                                    No chats yet.<br/>Visit a profile to start!
                                </div>
                            ) : (
                                partners.map(p => (
                                    <div 
                                        key={p.userId} 
                                        className={`partner-item ${activePartner?.userId === p.userId ? 'active' : ''}`}
                                        onClick={() => handlePartnerClick(p)}
                                    >
                                        <div className="partner-avatar" style={{background: activePartner?.userId === p.userId ? '#FFC300' : '#eee', color: activePartner?.userId === p.userId ? '#000' : '#555'}}>
                                            {p.name.charAt(0)}
                                        </div>
                                        <div className="partner-name">{p.name}</div>
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
                                    <div className="partner-avatar" style={{background: '#FFC300', color: '#000'}}>
                                        {activePartner.name.charAt(0)}
                                    </div>
                                    <h3>{activePartner.name}</h3>
                                </div>

                                <div className="messages-list">
                                    {messages.length === 0 && (
                                        <div style={{textAlign:'center', marginTop:'50px', color:'#aaa'}}>
                                            Say hi to {activePartner.name}! 👋
                                        </div>
                                    )}
                                    {messages.map((msg, index) => (
                                        <div 
                                            key={index} 
                                            className={`message-bubble ${msg.sender.userId === user.userId ? 'msg-sent' : 'msg-received'}`}
                                        >
                                            {msg.content}
                                            <div className="msg-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className="input-area" onSubmit={handleSendMessage}>
                                    <input 
                                        className="msg-input" 
                                        placeholder="Type a message..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" className="send-btn">➤</button>
                                </form>
                            </>
                        ) : (
                            <div className="empty-state">
                                Select a conversation to start chatting
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Messages;
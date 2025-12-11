import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const styles = `
    /* Global Reset & Base */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; color: #1A1A2E; }

    /* Layout */
    .login-container { width: 100vw; height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    
    /* Left Section */
    .left-section { background: linear-gradient(to bottom right, #ffc300, #ffb000); display: flex; align-items: center; justify-content: center; padding: 2rem; width: 100%; }
    .logo { font-size: 3.5rem; font-weight: 800; color: #1A1A2E; letter-spacing: 1px; text-shadow: 2px 2px 5px rgba(0,0,0,0.1); }
    
    /* Right Section */
    .right-section { background: #FFF8E1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; height: 100%; width: 100%; text-align: center; }

    /* Form Header Text */
    .welcome-text { font-size: 1.8rem; font-weight: 600; color: #1A1A2E; margin-bottom: 0.5rem; text-align: center; }
    .login-text { font-size: 2.5rem; font-weight: 800; margin-bottom: 2.5rem; color: #1A1A2E; text-align: center; }

    /* Form Groups & Inputs */
    .form-group { display: flex; flex-direction: column; width: 100%; max-width: 380px; margin-bottom: 1.5rem; text-align: left; }
    .input-label { font-size: 0.9rem; font-weight: 700; color: #1A1A2E; margin-bottom: 0.3rem; }
    .text-input { 
        height: 45px; 
        border-radius: 8px; 
        border: 1px solid #c9c9c9; 
        padding-left: 15px; 
        padding-right: 50px; 
        background-color: #ffffff; 
        color: #000000 !important; /* Forces text to be visible */
        font-size: 1rem; 
        transition: all 0.3s ease; 
        font-family: 'Inter', sans-serif; 
    }
    .text-input:focus { outline: none; border-color: #FFC300; box-shadow: 0 0 0 3px rgba(255, 195, 0, 0.4); }

    /* Password Row */
    .password-row { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 380px; margin-top: 0.5rem; }
    .remember-password { display: flex; align-items: center; user-select: none;}
    .remember-checkbox { background-color: white; width: 16px; height: 16px; margin-right: 0.5rem; accent-color: #A30000; cursor: pointer;}
    .remember-label { font-size: 0.9rem; color: #444; cursor: pointer;}
    .forgot-password-btn { font-size: 0.9rem; color: #A30000; cursor: pointer; transition: color 0.3s ease; padding: 0.2rem 0.5rem; background: transparent; border: none; font-family: 'Inter', sans-serif; text-decoration: none; font-weight: 600; }
    .forgot-password-btn:hover { color: #FFC300; }

    /* Action Buttons */
    .login-btn { width: 100%; max-width: 380px; height: 50px; border-radius: 8px; margin-top: 3rem; font-size: 1.1rem; font-weight: 700; background-color: #A30000; border: none; color: white; cursor: pointer; transition: background-color 0.3s ease, transform 0.1s ease; box-shadow: 0 4px 8px rgba(163, 0, 0, 0.3); }
    .login-btn:hover { background-color: #7A0000; box-shadow: 0 6px 12px rgba(163, 0, 0, 0.4); }
    .login-btn:active { transform: translateY(1px); }
    
    .separator { padding: 1.5rem 0; font-size: 0.9rem; font-weight: 500; color: #777; }

    .create-account-btn { font-size: 1rem; color: #1A1A2E; cursor: pointer; transition: color 0.3s ease; background: transparent; border: none; font-family: 'Inter', sans-serif; font-weight: 600; text-decoration: none; }
    .create-account-btn span { color: #A30000; transition: color 0.3s ease; text-decoration: underline; }
    .create-account-btn:hover span { color: #FFC300; }

    @media (max-width: 768px) {
        .login-container { grid-template-columns: 1fr; }
        .left-section { display: none; }
        .right-section { padding: 3rem 1.5rem; justify-content: flex-start; }
    }
`;

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(prev => ({ ...prev, [name]: '' }));
    };

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberEmail');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password.trim()) newErrors.password = 'Password is required';
        setError(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError({});

        try {
            const authHeader = 'Basic ' + btoa(formData.email + ':' + formData.password);
            
            const response = await axios.get('http://localhost:8080/api/users', {
                headers: { 'Authorization': authHeader }
            });

            if (response.status === 200) {
                const users = response.data;
                const currentUser = users.find(u => u.email === formData.email);

                if (currentUser) {
                    localStorage.setItem('authHeader', authHeader);
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    localStorage.setItem('userId', currentUser.userId);

                    if (rememberMe) {
                        localStorage.setItem('rememberEmail', formData.email);
                    } else {
                        localStorage.removeItem('rememberEmail');
                    }

                    navigate('/dashboard');
                } else {
                    setError({ server: 'Login successful, but user profile not found.' });
                }
            }
        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.response?.status === 401 
                ? 'Invalid email or password.' 
                : 'Server connection failed. Is the backend running?';
            setError({ server: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{styles}</style>
            <div className="login-container">
                <div className="left-section">
                    <h1 className="logo"><span style={{color: '#A30000'}}>Skill</span>swap</h1>
                </div>
                <div className="right-section">
                    <h1 className="welcome-text">Welcome Back!</h1>
                    <h1 className="login-text">LOGIN</h1>

                    {/* Email Input */}
                    <div className="form-group">
                        <label htmlFor="email" className="input-label">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="e.g., marilou@example.com"
                            className="text-input"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                        {error.email && <span style={{ color: '#A30000', fontSize: '0.85rem' }}>{error.email}</span>}
                    </div>

                    {/* Password Input */}
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label htmlFor="password" className="input-label">Password</label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="text-input"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '15px', top: '38px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.85rem', color: '#A30000', fontWeight: '600'
                            }}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                        {error.password && <span style={{ color: '#422b2bff', fontSize: '0.85rem' }}>{error.password}</span>}
                    </div>

                    {error.server && <div style={{ color: '#A30000', marginBottom: '1rem', fontWeight: 'bold' }}>{error.server}</div>}

                    {/* Remember / Forgot */}
                    <div className="password-row">
                        <div className="remember-password">
                            <input
                                type="checkbox"
                                id="remember"
                                className="remember-checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember" className="remember-label">Remember Me</label>
                        </div>
                        <button className="forgot-password-btn" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
                    </div>

                    <button className="login-btn" onClick={handleLogin} disabled={loading}>
                        {loading ? 'Login' : 'Login'}
                    </button>

                    <p className="separator">— OR —</p>
                    <button className="create-account-btn" onClick={() => navigate('/sign_in')}>
                        Don't have an account? <span>Create one now</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Login;
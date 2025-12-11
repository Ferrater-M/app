import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; font-family: 'Inter', sans-serif; overflow: hidden; color: #1A1A2E; }
    .login-container { width: 100vw; height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .left-section { background: linear-gradient(to bottom right, #ffc300, #ffb000); display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .logo { font-size: 3.5rem; font-weight: 800; color: #1A1A2E; letter-spacing: 1px; }
    .right-section { background: #FFF8E1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; height: 100%; text-align: center; }
    .login-text { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: #1A1A2E; }
    .form-group { display: flex; flex-direction: column; width: 100%; max-width: 380px; margin-bottom: 1rem; text-align: left; }
    .input-label { font-size: 0.9rem; font-weight: 700; color: #1A1A2E; margin-bottom: 0.3rem; }
    
    /* Container for password input and toggle button */
    .password-input-container { position: relative; width: 100%; }
    
    .text-input { height: 45px; border-radius: 8px; border: 1px solid #c9c9c9; padding-left: 15px; padding-right: 40px; background-color: #ffffff; color: #000000 !important; font-family: 'Inter', sans-serif; font-size: 1rem; width: 100%; }
    
    /* Toggle button styles */
    .password-toggle {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #777;
        font-size: 1rem;
        padding: 0 5px;
    }
    
    .login-btn { width: 100%; max-width: 380px; height: 50px; border-radius: 8px; margin-top: 2rem; font-size: 1.1rem; font-weight: 700; background-color: #A30000; border: none; color: white; cursor: pointer; }
    .login-btn:hover { background-color: #7A0000; }
    .separator { padding: 1.5rem 0; font-size: 0.9rem; color: #777; }
    .create-account-btn { font-size: 1rem; background: transparent; border: none; cursor: pointer; color: #1A1A2E; font-weight: 600; }
    .create-account-btn span { color: #A30000; text-decoration: underline; }
    .error-message { color: red; margin-bottom: 10px; font-size: 0.9rem; font-weight: 600; }
    @media (max-width: 768px) { .login-container { grid-template-columns: 1fr; } .left-section { display: none; } }
`;

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', school: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must include at least one uppercase letter.';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must include at least one lowercase letter.';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must include at least one number.';
        }
        return null;
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.school) {
            setError('All fields are required for registration.');
            return;
        }
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        
        try {
            await axios.post('http://localhost:8080/api/users/register', formData);
            alert("Registration successful! Please Login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
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
                    <h1 className="login-text">CREATE ACCOUNT</h1>
                    
                    <div className="form-group">
                        <label className="input-label">Full Name</label>
                        <input name="name" className="text-input" placeholder="e.g. first and last name" onChange={handleChange} value={formData.name} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Email</label>
                        <input name="email" className="text-input" placeholder="e.g. person@example.com" onChange={handleChange} value={formData.email} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Password</label>
                        <div className="password-input-container">
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                className="text-input" 
                                placeholder="••••••••" 
                                onChange={handleChange} 
                                value={formData.password} 
                            />
                            <button 
                                type="button" 
                                className="password-toggle" 
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">School</label>
                        <input name="school" className="text-input" placeholder="e.g. school" onChange={handleChange} value={formData.school} />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button className="login-btn" onClick={handleRegister}>Register</button>
                    
                    <p className="separator">— OR —</p>
                    <button className="create-account-btn" onClick={() => navigate('/login')}>
                        Already have an account? <span>Login</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Register;
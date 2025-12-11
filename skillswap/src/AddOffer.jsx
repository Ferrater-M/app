import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddOffer = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        skillName: '',
        category: 'Programming', // Default
        description: '',
        availability: '',
        lookingFor: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId'); // Get logged-in ID

        if (!userId) {
            alert("You must be logged in!");
            navigate('/login');
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/offers/add', {
                ...formData,
                userId: userId
            });
            alert("Skill Offer Added!");
            navigate('/dashboard'); // Go back to dashboard to see it
        } catch (err) {
            console.error(err);
            alert("Failed to add offer. Check backend console.");
        }
    };

    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .add-body { width: 100vw; min-height: 100vh; background: #fff7e1; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; }
        
        .form-card { background: white; padding: 40px; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ddd; }
        .title { font-size: 1.8rem; font-weight: 800; text-align: center; margin-bottom: 20px; color: #060606; }
        
        .input-group { margin-bottom: 15px; }
        .label { font-size: 0.9rem; font-weight: 700; margin-bottom: 5px; display: block; color: #333; }
        .input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; color: #000; background: #fff; }
        .textarea { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; height: 80px; resize: none; color: #000; background: #fff; }
        .select { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; color: #000; background: #fff; }

        .btn-submit { width: 100%; padding: 15px; background: maroon; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; margin-top: 10px; }
        .btn-submit:hover { background: #5a0000; }
        .btn-cancel { width: 100%; padding: 15px; background: transparent; color: #666; border: none; cursor: pointer; margin-top: 5px; font-weight: 600; }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="add-body">
                <div className="form-card">
                    <h1 className="title">Post a New Skill</h1>
                    
                    <div className="input-group">
                        <label className="label">Skill Name</label>
                        <input className="input" name="skillName" placeholder="e.g. Advanced Python" onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label className="label">Category</label>
                        <select className="select" name="category" onChange={handleChange}>
                            <option value="Programming">Programming</option>
                            <option value="Design">Design</option>
                            <option value="Music">Music</option>
                            <option value="Language">Language</option>
                            <option value="Arts">Arts</option>
                            <option value="Fitness">Fitness</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="label">Description</label>
                        <textarea className="textarea" name="description" placeholder="Describe what you can teach..." onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label className="label">Availability</label>
                        <input className="input" name="availability" placeholder="e.g. Weekends only" onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label className="label">Wants in Return</label>
                        <input className="input" name="lookingFor" placeholder="e.g. Guitar lessons" onChange={handleChange} />
                    </div>

                    <button className="btn-submit" onClick={handleSubmit}>Post Skill</button>
                    <button className="btn-cancel" onClick={() => navigate('/dashboard')}>Cancel</button>
                </div>
            </div>
        </>
    );
};

export default AddOffer;
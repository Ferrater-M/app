import React from 'react';

const Loading = ({ text = "Loading..." }) => {
    const styles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%);
            z-index: 9999;
        }

        .spinner {
            width: 60px;
            height: 60px;
            border: 6px solid #f0f0f0;
            border-top-color: #FFC300;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 1.5rem;
            font-weight: 700;
            color: #060606;
            letter-spacing: 0.5px;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-text">{text}</div>
            </div>
        </>
    );
};

export default Loading;

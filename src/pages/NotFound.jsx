import React from "react";
import "./NotFound.css";

function NotFound() {
    return (
        <>
            <div className="notfound-container">
                <h1 className="notfound-title">404</h1>
                <p className="notfound-message">Page Not Found</p>
                <a href="/app2" className="notfound-link">Go Home</a>
            </div>
        </>
    );
}

export default NotFound;

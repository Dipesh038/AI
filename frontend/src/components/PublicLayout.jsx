import React from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';


const PublicLayout = () => {
    return (
        <div className="flex relative min-h-screen">
            {/* Ambient Background Glow */}
            <div className="ambient-glow" />

            <UserSidebar />
            <div className="flex-1 min-h-screen relative z-10 transition-all duration-300">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default PublicLayout;

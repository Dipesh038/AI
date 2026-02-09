import React from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';


const PublicLayout = () => {
    return (
        <div className="flex">
            <UserSidebar />
            <div className="flex-1 min-h-screen bg-gray-50">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default PublicLayout;

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout = () => {
    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden font-sans antialiased text-slate-800">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Right Pane */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                {/* Global Header */}
                <TopBar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

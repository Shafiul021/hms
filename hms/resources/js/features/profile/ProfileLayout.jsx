import React, { useState } from 'react';
import { EditProfile } from './EditProfile';
import { ChangePassword } from './ChangePassword';
import { useAuthStore } from '../../store/authStore';
import { User, KeyRound, UserSquare2 } from 'lucide-react';

export const ProfileLayout = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile'); // profile | password

    const roleName = user?.roles?.[0]?.name || user?.role || 'Guest';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header / Avatar Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <UserSquare2 className="w-10 h-10" />
                </div>
                <div className="text-center sm:text-left space-y-1">
                    <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
                        Role: {roleName}
                    </span>
                </div>
            </div>

            {/* Layout tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col md:flex-row">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === 'profile'
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Edit Profile Details
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === 'password'
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <KeyRound className="w-4 h-4" />
                        Change Password
                    </button>
                </div>

                {/* Tab content panel */}
                <div className="flex-1 p-6">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-800">
                            {activeTab === 'profile' ? 'Profile Information' : 'Update Security Password'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {activeTab === 'profile'
                                ? 'Update your basic profile name and contact email.'
                                : 'Ensure your account stays secure by updating your secret key.'}
                        </p>
                    </div>

                    {activeTab === 'profile' ? <EditProfile /> : <ChangePassword />}
                </div>
            </div>
        </div>
    );
};
export default ProfileLayout;

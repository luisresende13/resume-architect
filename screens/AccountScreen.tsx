
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { notifySuccess, notifyError } from '../services/notificationService';

const inputClass = "w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";
const buttonClass = "px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed";
const dangerButtonClass = "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 transition";

const Section: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-1 mb-4">{description}</p>
        {children}
    </div>
);

export const AccountScreen: React.FC = () => {
    const auth = useContext(AuthContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            notifyError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            notifyError("Password must be at least 8 characters long.");
            return;
        }
        const success = await auth.updatePassword(newPassword);
        if (success) {
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
            auth.deleteAccount();
        }
    };

    if (!auth.user) {
        return null; // Or a loading/error state
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-white">Account Settings</h2>
            
            <Section title="Profile Information" description="Your email address used for logging in.">
                <div className="flex items-center">
                    <input type="email" value={auth.user.email} disabled className={`${inputClass} bg-slate-800 cursor-not-allowed`} />
                </div>
            </Section>

            <Section title="Change Password" description="Update your password for better security.">
                <div className="space-y-3 max-w-sm">
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                     <div className="pt-2">
                         <button onClick={handleChangePassword} className={buttonClass}>Update Password</button>
                    </div>
                </div>
            </Section>

            <Section title="Delete Account" description="Permanently delete your account and all of your data. This action is irreversible.">
                <button onClick={handleDeleteAccount} className={dangerButtonClass}>Delete My Account</button>
            </Section>
        </div>
    );
};

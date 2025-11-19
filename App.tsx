
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthComponent } from './components/Auth';
import { BrandDashboard } from './components/BrandDashboard';
import { TailorDashboard } from './components/TailorDashboard';
import { authenticateUser, getUserProfile } from './services/firebase';
import { UserProfile } from './types';
import { Scissors, LogOut, Loader2 } from 'lucide-react';

const App = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initial auth check
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we have a session. 
        // In this simple MVP with anonymous auth simulated as email, 
        // we might not strictly persist 'logged in' state perfectly across refreshes 
        // unless we stored the UID in localStorage or relied on Firebase persistence.
        // We'll rely on Firebase default persistence.
        const user = await authenticateUser();
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (e) {
        console.error("Init error", e);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    setUserProfile(null);
    // In real app: signOut(auth)
    window.location.reload();
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-brand-purple">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-slate-400 animate-pulse">Initializing Stitch-Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-brand-purple selection:text-white">
      {!userProfile ? (
        <AuthComponent onAuthSuccess={setUserProfile} />
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-lg border-b border-slate-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                {/* RuthKelly Logo Recreation */}
                <div className="w-10 h-10 bg-[#1e1b4b] rounded-full flex items-center justify-center border border-slate-700 shadow-lg shadow-brand-purple/10 shrink-0">
                   <span className="font-bold text-white text-sm tracking-tighter leading-none">RK</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight leading-none">Stitch<span className="text-brand-purple">-Cloud</span></span>
                  <span className="text-[10px] text-brand-gold uppercase tracking-[0.2em] font-semibold leading-tight mt-0.5 opacity-90">by RuthKelly</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right mr-2">
                  <div className="text-sm font-semibold text-white">{userProfile.displayName}</div>
                  <div className="text-xs text-brand-gold uppercase tracking-wide font-bold">{userProfile.role}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
            {userProfile.role === 'Brand' ? (
              <BrandDashboard user={userProfile} />
            ) : (
              <TailorDashboard 
                user={userProfile} 
                onUpdateProfile={setUserProfile} 
              />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 py-8 mt-12 bg-[#0f172a]">
            <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
              <p>&copy; {new Date().getFullYear()} Stitch-Cloud Platform. All rights reserved.</p>
              <p className="text-xs mt-1 text-slate-600">Powered by RuthKelly Clothing</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;

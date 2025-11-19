
import React, { useState, useEffect } from 'react';
import { UserProfile, Job } from '../types';
import { subscribeToJobs, acceptJob, createUserProfile } from '../services/firebase';
import { Button, Input, Card, Badge } from './UI';
import { Briefcase, User, Star, Clock, Scissors, DollarSign, CheckCircle2, History, ThumbsUp, BadgeCheck, Sparkles, Camera, Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"
];

const MOCK_PORTFOLIO = [
  "https://images.unsplash.com/photo-1593030761757-71bd90dbe78db?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598554747436-c9293d6a70b4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80"
];

export const TailorDashboard = ({ user, onUpdateProfile }: { user: UserProfile; onUpdateProfile: (p: UserProfile) => void }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'history' | 'profile'>('jobs');
  
  // Profile Edit State
  const [specialties, setSpecialties] = useState(user.specialties?.join(', ') || '');
  const [exp, setExp] = useState(user.experienceYears?.toString() || '0');
  const [isSaving, setIsSaving] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToJobs((data) => setJobs(data));
    return () => unsubscribe();
  }, []);

  const handleAcceptJob = async (jobId: string) => {
    setProcessingJobId(jobId);
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      await acceptJob(jobId, user.uid);
      // Success feedback could go here, but the UI update is usually enough
    } catch (e) {
      console.error(e);
      alert("Failed to accept job.");
    } finally {
      setProcessingJobId(null);
    }
  };

  // --- Profile Updates ---

  const handleProfileImageUpdate = async () => {
    // Pick a random new avatar to simulate upload
    const newImage = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
    const updatedUser = { ...user, profileImage: newImage };
    
    try {
      await createUserProfile(user.uid, updatedUser);
      onUpdateProfile(updatedUser);
    } catch (e) {
      console.error("Image update failed", e);
    }
  };

  const handlePortfolioUpload = async () => {
    // Pick a random portfolio image
    const newImage = MOCK_PORTFOLIO[Math.floor(Math.random() * MOCK_PORTFOLIO.length)];
    const currentImages = user.portfolioImages || [];
    const updatedImages = [...currentImages, newImage];
    
    const updatedUser = { ...user, portfolioImages: updatedImages };
    
    try {
      await createUserProfile(user.uid, updatedUser);
      onUpdateProfile(updatedUser);
    } catch (e) {
      console.error("Portfolio update failed", e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedSpecs = specialties.split(',').map(s => s.trim()).filter(s => s);
      const updatedData = {
        specialties: updatedSpecs,
        experienceYears: parseInt(exp)
      };
      await createUserProfile(user.uid, updatedData);
      onUpdateProfile({ ...user, ...updatedData });
    } catch (e) {
      console.error(e);
      alert("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Derived Data
  const recommendedJobs = jobs.filter(j => j.status === 'Pending Match');
  const myActiveJobs = jobs.filter(j => j.tailorId === user.uid && j.status === 'In Production');
  const myHistory = jobs.filter(j => j.tailorId === user.uid && j.status === 'Completed');

  const AnalyticsHeader = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-4">
      <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-gold/20 rounded-lg text-brand-gold">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-400">Total Earnings</div>
            <div className="text-2xl font-bold text-white">${(user.totalEarnings || 1500).toLocaleString()}</div>
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-400">Jobs Completed</div>
            <div className="text-2xl font-bold text-white">{user.jobsCompleted || myHistory.length}</div>
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-purple/20 rounded-lg text-brand-purple">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Global Rating</div>
            <div className="text-2xl font-bold text-white">{user.rating || 5.0}</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
         <div className="flex items-center gap-3">
           {user.profileImage ? (
             <img src={user.profileImage} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-brand-gold" />
           ) : (
             <div className="w-12 h-12 rounded-full bg-brand-purple flex items-center justify-center text-white font-bold text-xl">
               {user.displayName.charAt(0)}
             </div>
           )}
           <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               {user.displayName}
               {user.kycStatus === 'Verified' && <BadgeCheck size={18} className="text-brand-gold" />}
             </h2>
             <p className="text-sm text-slate-400">Master Tailor • {user.experienceYears} Years Exp.</p>
           </div>
         </div>

         <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
            {['jobs', 'history', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
         </div>
      </div>

      {activeTab === 'jobs' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
          <AnalyticsHeader />
          
          {/* Active Work */}
          {myActiveJobs.length > 0 && (
            <div className="mb-8">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <Scissors size={20} className="text-brand-gold" /> Active Production
               </h3>
               <div className="grid grid-cols-1 gap-4">
                 {myActiveJobs.map(job => (
                   <Card key={job.id} className="border-l-4 border-l-brand-purple bg-brand-purple/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">{job.garmentType}</h4>
                          <p className="text-sm text-slate-400">Order #{job.id.slice(-6)} • {job.brandName}</p>
                        </div>
                        <Badge status="In Production" />
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1"><Clock size={14} /> Due: {job.deadline}</div>
                        <div className="flex items-center gap-1"><DollarSign size={14} /> Budget: ${job.budget?.toLocaleString()}</div>
                      </div>
                   </Card>
                 ))}
               </div>
            </div>
          )}

          {/* Recommended Matches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-brand-purple" /> Recommended for You
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Based on your skills</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendedJobs.map(job => (
                <Card key={job.id} className="flex flex-col justify-between h-full group hover:border-brand-purple/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-brand-purple transition-colors">{job.garmentType}</h3>
                        <p className="text-sm text-slate-400">{job.brandName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-lg">${job.budget?.toLocaleString()}</div>
                        <div className="text--[10px] text-slate-500 uppercase">Est. Budget</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-300 mb-6 bg-slate-900/30 p-3 rounded-lg">
                      <div><span className="text-slate-500 block text-xs">Qty</span> {job.quantity} units</div>
                      <div><span className="text-slate-500 block text-xs">Fabric</span> {job.fabricType}</div>
                      <div className="col-span-2 border-t border-slate-700/50 pt-2 mt-1">
                        <span className="text-slate-500 block text-xs mb-1">Deadline</span> 
                        <div className="flex items-center gap-1 text-white"><Clock size={14} /> {job.deadline}</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleAcceptJob(job.id)} 
                    className="w-full"
                    disabled={processingJobId === job.id}
                  >
                    {processingJobId === job.id ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Accepting...</span>
                    ) : (
                      "Review & Accept"
                    )}
                  </Button>
                </Card>
              ))}
              {recommendedJobs.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No new matches found right now.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <History size={20} /> Order History
          </h3>
          <div className="space-y-4">
            {myHistory.length === 0 ? (
               <p className="text-slate-500 italic">No completed jobs yet.</p>
            ) : (
              myHistory.map(job => (
                <Card key={job.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{job.garmentType}</h4>
                      <p className="text-sm text-slate-400">Completed for {job.brandName}</p>
                    </div>
                    <div className="text-right">
                       <div className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                         <ThumbsUp size={14} /> Rated 5.0
                       </div>
                       <div className="text-sm text-slate-500">Earned ${job.budget?.toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="mb-6">
            <div className="flex items-center gap-6 mb-6 relative">
              <div className="relative group cursor-pointer" onClick={handleProfileImageUpdate}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-brand-gold" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-purple text-white flex items-center justify-center font-bold text-4xl border-2 border-brand-gold">
                    {user.displayName.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={24} className="text-white" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                <div className="flex items-center gap-2 mt-2">
                   <span className={`text-xs px-2 py-0.5 rounded border ${user.kycStatus === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                     {user.kycStatus || 'Unverified'}
                   </span>
                   <span className="text-slate-400 text-sm">UID: {user.uid.slice(0,6)}...</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input 
                  label="Display Name"
                  value={user.displayName}
                  disabled
                  className="opacity-50 cursor-not-allowed"
                />
                <Input 
                  label="Years of Experience"
                  type="number"
                  value={exp}
                  onChange={e => setExp(e.target.value)}
                />
              </div>
              <Input 
                label="Specialties (comma separated)"
                placeholder="e.g. Wedding Dresses, Leather, Embroidery"
                value={specialties}
                onChange={e => setSpecialties(e.target.value)}
              />
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Rate Card</label>
                <div className="bg-slate-900/50 p-4 rounded-lg space-y-2 border border-slate-700">
                   {user.rateCard?.map((rate, i) => (
                     <div key={i} className="flex justify-between text-sm items-center">
                       <span className="text-slate-300 font-medium">{rate.type}</span>
                       <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-500">starts at</span>
                         <span className="text-brand-gold font-mono">${rate.baseRate}</span>
                       </div>
                     </div>
                   )) || <p className="text-xs text-slate-500">No rates set</p>}
                </div>
              </div>

              <Button type="submit" disabled={isSaving} variant="secondary" className="w-full">
                {isSaving ? 'Saving...' : 'Update Details'}
              </Button>
            </form>
          </Card>

          {/* Portfolio Section */}
          <Card>
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <ImageIcon size={20} /> Visual Portfolio
               </h3>
               <Button variant="outline" onClick={handlePortfolioUpload} className="text-xs py-1.5">
                 <Plus size={14} /> Upload New Work
               </Button>
             </div>

             {(!user.portfolioImages || user.portfolioImages.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 cursor-pointer hover:border-brand-purple/30 transition-colors" onClick={handlePortfolioUpload}>
                   <Camera size={32} className="mx-auto text-slate-600 mb-2" />
                   <p className="text-slate-500 text-sm">No items in portfolio yet.</p>
                   <p className="text-slate-600 text-xs mt-1">Click to upload simulation</p>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {user.portfolioImages.map((img, idx) => (
                     <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                        <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-xs font-medium px-2 py-1 rounded border border-white/30 backdrop-blur-sm">View</span>
                        </div>
                     </div>
                   ))}
                   <button onClick={handlePortfolioUpload} className="aspect-square rounded-lg border-2 border-dashed border-slate-700 hover:border-brand-purple hover:bg-brand-purple/5 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-purple">
                      <Plus size={24} />
                      <span className="text-xs font-medium">Add More</span>
                   </button>
                </div>
             )}
          </Card>
        </div>
      )}
    </div>
  );
};

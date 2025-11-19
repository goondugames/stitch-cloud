
import React, { useState } from 'react';
import { authenticateUser, createUserProfile } from '../services/firebase';
import { UserProfile, UserRole, RateCardItem } from '../types';
import { Button, Input, Card } from './UI';
import { 
  Sparkles, Scissors, CheckCircle2, ShieldCheck, MessageSquare, 
  Camera, UploadCloud, CreditCard, BadgeCheck, User
} from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthComponent: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'role' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Tailor Wizard State
  const [tailorStep, setTailorStep] = useState(1); // 1: Info, 2: Rates, 3: Portfolio, 4: KYC
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [rates, setRates] = useState<RateCardItem[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<string[]>([]);
  const [kycStatus, setKycStatus] = useState<'Pending' | 'Verified'>('Pending');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const code = "123456";
    console.log(`%c[Stitch-Cloud] OTP: ${code}`, "color: #fbbf24; font-weight: bold;");
    setOtpNotification(`Simulated Code: ${code}`);
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput !== '123456') {
      alert('Invalid OTP. Try 123456');
      return;
    }
    setLoading(true);
    try {
      const user = await authenticateUser();
      setUserId(user.uid);
      setStep('role');
    } catch (error) {
      console.error(error);
      setUserId('mock-user-fallback');
      setStep('role');
    } finally {
      setLoading(false);
    }
  };

  // --- Tailor Wizard Handlers ---

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(prev => prev.filter(s => s !== spec));
      setRates(prev => prev.filter(r => r.type !== spec));
    } else {
      setSelectedSpecialties(prev => [...prev, spec]);
      setRates(prev => [...prev, { type: spec, baseRate: 0 }]);
    }
  };

  const updateRate = (type: string, amount: number) => {
    setRates(prev => prev.map(r => r.type === type ? { ...r, baseRate: amount } : r));
  };

  const handleUploadSim = (type: 'portfolio' | 'kyc') => {
    if (type === 'portfolio') {
      setPortfolioFiles(prev => [...prev, `img_${Date.now()}.jpg`]);
    } else {
      setLoading(true);
      setTimeout(() => {
        setKycStatus('Verified');
        setLoading(false);
      }, 2000);
    }
  };

  const handleFinalSubmit = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const profile: UserProfile = {
        uid: userId,
        email,
        role: role!,
        displayName: name,
        ...(role === 'Tailor' ? { 
          specialties: selectedSpecialties, 
          experienceYears: parseInt(experience) || 1, 
          rating: 5.0, // Default starting rating
          rateCard: rates,
          portfolioImages: portfolioFiles,
          kycStatus: kycStatus,
          totalEarnings: 0,
          jobsCompleted: 0
        } : { brandName: name }),
      };

      await createUserProfile(userId, profile);
      onAuthSuccess(profile);
    } catch (error) {
      console.error(error);
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // --- Renderers ---

  if (step === 'email' || step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-brand-darker/90 backdrop-blur-sm"></div>
        <Card className="w-full max-w-md relative z-10 border-brand-purple/30 shadow-2xl shadow-brand-purple/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-purple ring-1 ring-brand-purple/50">
              <Scissors size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Stitch<span className="text-brand-purple">-Cloud</span></h1>
            <p className="text-slate-400 mt-2">Secure platform for premium textile production.</p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="you@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" variant="primary">
                Send Access Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
               {otpNotification && (
                <div className="bg-brand-gold/10 border border-brand-gold/30 text-brand-gold p-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <MessageSquare size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">New Message</p>
                    <p className="text-sm opacity-90">{otpNotification}</p>
                  </div>
                </div>
              )}
              <div className="text-center mb-4">
                <span className="text-sm text-slate-400">Code sent to {email}</span>
              </div>
              <Input 
                label="One-Time Password" 
                type="text" 
                placeholder="123456" 
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <Button type="submit" className="w-full" variant="primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              
              <div className="flex justify-between items-center pt-2">
                 <button type="button" onClick={() => setStep('email')} className="text-sm text-slate-500 hover:text-slate-300">Back</button>
                <button type="button" onClick={() => setOtpInput("123456")} className="text-xs text-brand-purple hover:underline">Auto-fill (Demo)</button>
              </div>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // --- Tailor Wizard Flow ---
  if (step === 'details' && role === 'Tailor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-darker via-[#0f0518] to-brand-darker"></div>
        <Card className="w-full max-w-2xl relative z-10 min-h-[500px] flex flex-col">
          {/* Wizard Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
             <h2 className="text-xl font-bold text-white">Tailor Onboarding</h2>
             <div className="flex gap-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i <= tailorStep ? 'bg-brand-purple' : 'bg-slate-700'}`} />
               ))}
             </div>
          </div>

          <div className="flex-1">
             {tailorStep === 1 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                 <Input label="Full Name / Business Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mario Rossi" />
                 <Input label="Years of Experience" type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 10" />
               </div>
             )}

             {tailorStep === 2 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-medium text-white mb-2">Skills & Rates</h3>
                 <p className="text-sm text-slate-400 mb-4">Select what you sew and your base rate per piece.</p>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                   {['Suits', 'Dresses', 'Denim', 'Leather', 'Embroidery', 'Alterations'].map(skill => (
                     <button 
                       key={skill}
                       onClick={() => toggleSpecialty(skill)}
                       className={`p-2 rounded border text-sm transition-all ${selectedSpecialties.includes(skill) ? 'bg-brand-purple/20 border-brand-purple text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                     >
                       {skill}
                     </button>
                   ))}
                 </div>

                 {rates.map(rate => (
                    <div key={rate.type} className="flex items-center gap-4 animate-in fade-in">
                      <span className="w-32 text-sm text-white">{rate.type}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                        <input 
                          type="number" 
                          className="w-full bg-slate-900 border border-slate-700 rounded px-8 py-2 text-white"
                          placeholder="Base rate"
                          value={rate.baseRate || ''}
                          onChange={(e) => updateRate(rate.type, parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                 ))}
               </div>
             )}

             {tailorStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-medium text-white">Portfolio & Profile</h3>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                     <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-600">
                        <User size={32} />
                     </div>
                     <div>
                       <div className="text-white font-medium">Profile Picture</div>
                       <button className="text-xs text-brand-purple hover:underline">Upload Image</button>
                     </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-900/20 hover:border-brand-purple/50 transition-colors cursor-pointer" onClick={() => handleUploadSim('portfolio')}>
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Camera size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Upload Past Work</p>
                    <p className="text-xs text-slate-500 mt-1">Click to simulate upload</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {portfolioFiles.map((f, i) => (
                        <div key={i} className="bg-brand-gold/10 text-brand-gold text-xs px-2 py-1 rounded border border-brand-gold/20">{f}</div>
                      ))}
                    </div>
                  </div>
                </div>
             )}

             {tailorStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                  <h3 className="text-lg font-medium text-white">Identity Verification (KYC)</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    To ensure trust on Stitch-Cloud, we require all tailors to verify their identity.
                  </p>

                  <div className="max-w-xs mx-auto py-8">
                     {kycStatus === 'Verified' ? (
                       <div className="flex flex-col items-center gap-3 text-green-400 animate-in zoom-in">
                          <BadgeCheck size={64} />
                          <span className="font-bold text-lg">Identity Verified</span>
                       </div>
                     ) : (
                        <Button 
                          variant="outline" 
                          className="w-full h-32 flex flex-col gap-2"
                          onClick={() => handleUploadSim('kyc')}
                          disabled={loading}
                        >
                           {loading ? (
                             <div className="animate-spin"><CreditCard size={32} /></div>
                           ) : (
                             <>
                               <CreditCard size={32} />
                               <span>Upload ID / Passport</span>
                             </>
                           )}
                        </Button>
                     )}
                  </div>
                </div>
             )}
          </div>

          <div className="flex justify-between mt-8 pt-4 border-t border-slate-800">
             {tailorStep > 1 ? (
               <Button variant="outline" onClick={() => setTailorStep(p => p - 1)}>Back</Button>
             ) : (
               <div />
             )}
             
             {tailorStep < 4 ? (
               <Button onClick={() => setTailorStep(p => p + 1)}>Next Step</Button>
             ) : (
               <Button onClick={handleFinalSubmit} disabled={kycStatus !== 'Verified' || loading}>
                 {loading ? 'Creating Profile...' : 'Complete Setup'}
               </Button>
             )}
          </div>
        </Card>
      </div>
    );
  }

  // Standard Brand Flow / Initial Role Select
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-darker via-[#0f0518] to-brand-darker"></div>
      
      <Card className="w-full max-w-xl relative z-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
          <p className="text-slate-400">Tell us how you will use Stitch-Cloud.</p>
        </div>

        {step === 'role' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => { setRole('Brand'); setStep('details'); }}
              className="group p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-brand-purple/10 hover:border-brand-purple transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-brand-purple text-white">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">I am a Brand</h3>
              <p className="text-sm text-slate-400">I want to post jobs and find tailors for production.</p>
            </button>

            <button 
              onClick={() => { setRole('Tailor'); setStep('details'); }}
              className="group p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-brand-gold/10 hover:border-brand-gold transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-brand-gold text-brand-darker">
                <Scissors size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">I am a Tailor</h3>
              <p className="text-sm text-slate-400">I want to find jobs and showcase my skills.</p>
            </button>
          </div>
        ) : (
          // Brand Simple Form (Tailor handled above)
          <form onSubmit={handleFinalSubmit} className="space-y-6">
             <Input 
                label="Brand Name" 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Gucci"
              />
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-brand-gold shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Role: Brand</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      You will have access to post jobs and track orders.
                    </p>
                  </div>
                  <button type="button" onClick={() => setStep('role')} className="text-xs text-brand-purple hover:underline ml-auto">Change</button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Enter Stitch-Cloud'}
              </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

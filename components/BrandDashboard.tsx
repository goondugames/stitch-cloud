import React, { useState, useEffect } from 'react';
import { UserProfile, Job, TailorRecommendation } from '../types';
import { createJob, subscribeToJobs, getRecommendedTailors, processEscrowPayment } from '../services/firebase';
import { Button, Input, Select, Card, Badge } from './UI';
import { 
  Plus, Package, Clock, AlertCircle, UploadCloud, FileText, 
  CheckCircle2, CreditCard, TrendingUp, Activity, DollarSign, 
  ShieldCheck, User
} from 'lucide-react';

type DashboardView = 'dashboard' | 'create' | 'recommendations' | 'payment';

export const BrandDashboard = ({ user }: { user: UserProfile }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<DashboardView>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [garmentType, setGarmentType] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [deadline, setDeadline] = useState('');
  const [sizing, setSizing] = useState({ s: 0, m: 0, l: 0, xl: 0 });
  const [designFiles, setDesignFiles] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  
  // Flow State
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<TailorRecommendation[]>([]);
  const [selectedTailor, setSelectedTailor] = useState<TailorRecommendation | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToJobs((data) => setJobs(data), user.uid);
    return () => unsubscribe();
  }, [user.uid]);

  // 1. Submit Initial Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalQty = sizing.s + sizing.m + sizing.l + sizing.xl;
    if (totalQty === 0) {
      alert("Please add at least 1 item in sizing.");
      return;
    }
    
    setLoading(true);
    try {
      const newJobId = await createJob({
        brandName: user.displayName,
        brandId: user.uid,
        garmentType,
        quantity: totalQty,
        sizing,
        fabricType,
        deadline,
        designFiles,
        budget: parseInt(budget) || 0,
      });
      setCurrentJobId(newJobId);
      
      // Fetch Recommendations
      const recs = await getRecommendedTailors(garmentType);
      setRecommendations(recs);
      setView('recommendations');
    } catch (err) {
      console.error(err);
      alert("Error submitting order");
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Payment
  const handlePayment = async () => {
    if (!currentJobId || !selectedTailor) return;
    setLoading(true);
    try {
      await processEscrowPayment(currentJobId, selectedTailor.uid, selectedTailor.displayName);
      setView('dashboard');
      // Reset form
      setGarmentType('');
      setSizing({ s: 0, m: 0, l: 0, xl: 0 });
      setFabricType('');
      setDeadline('');
      setDesignFiles([]);
      setBudget('');
      setSelectedTailor(null);
    } catch (e) {
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    const fakeFiles = [`Design_Spec_${Date.now()}.pdf`, `Pattern_v${Math.floor(Math.random() * 5)}.ai`];
    setDesignFiles(prev => [...prev, ...fakeFiles]);
  };

  // --- Sub-Components ---

  const AnalyticsSection = () => {
    const activeOrders = jobs.filter(j => j.status !== 'Completed').length;
    const totalSpent = jobs.reduce((acc, job) => acc + (job.budget || 0), 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-4">
        <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-purple/20 rounded-lg text-brand-purple">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-sm text-slate-400">Active Lines</div>
              <div className="text-2xl font-bold text-white">{activeOrders}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-500">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-sm text-slate-400">Total Invested</div>
              <div className="text-2xl font-bold text-white">${totalSpent.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-brand-paper to-brand-darker border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-sm text-slate-400">Avg. Production</div>
              <div className="text-2xl font-bold text-white">14 Days</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setView('dashboard')} className="mb-4 text-xs">← Back to Dashboard</Button>
          <h2 className="text-2xl font-bold text-white">New Production Line</h2>
          <p className="text-slate-400">Upload specs and define requirements.</p>
        </div>
        
        <Card className="border-brand-purple/50">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            
            {/* File Upload Simulation */}
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-brand-purple/50 transition-colors cursor-pointer bg-slate-900/50" onClick={handleFileUpload}>
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-medium text-slate-300">Click to upload Design Specs (PDF, AI, DXF)</p>
              <p className="text-xs text-slate-500 mt-1">Simulated upload</p>
              
              {designFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {designFiles.map((f, i) => (
                    <div key={i} className="bg-brand-purple/20 text-brand-purple text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <FileText size={12} /> {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Garment Type" 
                placeholder="e.g. Silk Blouse" 
                value={garmentType} 
                onChange={e => setGarmentType(e.target.value)} 
                required 
              />
               <Input 
                label="Material / Fabric" 
                placeholder="e.g. 100% Organic Cotton" 
                value={fabricType} 
                onChange={e => setFabricType(e.target.value)} 
                required 
              />
            </div>

            {/* Sizing Grid */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Sizing Breakdown (Qty)</label>
              <div className="grid grid-cols-4 gap-4">
                {['s', 'm', 'l', 'xl'].map(size => (
                  <div key={size}>
                    <div className="text-center text-xs text-slate-500 mb-1 uppercase">{size}</div>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full bg-brand-paper border border-slate-700 rounded-lg px-2 py-2 text-center text-slate-100 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                      value={sizing[size as keyof typeof sizing]}
                      onChange={e => setSizing({...sizing, [size]: parseInt(e.target.value) || 0})}
                    />
                  </div>
                ))}
              </div>
              <div className="text-right text-xs text-slate-400 mt-2">
                Total Units: {sizing.s + sizing.m + sizing.l + sizing.xl}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Target Budget (USD)" 
                type="number"
                placeholder="5000"
                value={budget} 
                onChange={e => setBudget(e.target.value)} 
                required 
              />
              <Input 
                label="Deadline" 
                type="date" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)} 
                required 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Find Tailors & Matches'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (view === 'recommendations') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">AI Tailor Matching</h2>
          <p className="text-slate-400">We found {recommendations.length} experts matching your "{garmentType}" request.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <Card key={rec.uid} className={`relative group border-2 transition-all cursor-pointer ${selectedTailor?.uid === rec.uid ? 'border-brand-purple bg-brand-purple/5 transform scale-105' : 'border-slate-800 hover:border-slate-600'}`} onClick={() => setSelectedTailor(rec)}>
              {rec.matchScore > 95 && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-brand-darker text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                   BEST MATCH
                 </div>
              )}
              <div className="text-center mb-4 mt-2">
                <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2">
                  {rec.displayName.charAt(0)}
                </div>
                <h3 className="font-bold text-white">{rec.displayName}</h3>
                <div className="flex justify-center gap-1 text-brand-gold text-sm">
                  {"★".repeat(Math.floor(rec.rating))}
                </div>
              </div>
              
              <div className="space-y-2 text-sm border-t border-slate-700/50 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Match Score</span>
                  <span className={`font-bold ${rec.matchScore > 90 ? 'text-green-400' : 'text-brand-gold'}`}>{rec.matchScore}%</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-slate-500">Est. Quote</span>
                  <span className="text-white font-medium">${rec.estimatedQuote.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-slate-500">Turnaround</span>
                  <span className="text-white font-medium">~14 Days</span>
                </div>
              </div>

              {selectedTailor?.uid === rec.uid && (
                <div className="absolute top-2 right-2 text-brand-purple">
                  <CheckCircle2 size={24} fill="currentColor" className="text-brand-darker" />
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-8">
          <Button 
            disabled={!selectedTailor} 
            onClick={() => setView('payment')}
            className="w-full md:w-1/2 text-lg h-14"
          >
            Select Tailor & Proceed to Escrow
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'payment') {
    return (
      <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8">
        <Card className="border-brand-gold/30 shadow-brand-gold/10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Secure Escrow</h2>
            <p className="text-slate-400 text-sm">Funds are held until you approve the final sample.</p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-800">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-slate-400">Production Order</span>
              <span className="text-white">{garmentType} ({sizing.s+sizing.m+sizing.l+sizing.xl} units)</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-slate-400">Tailor</span>
              <span className="text-white">{selectedTailor?.displayName}</span>
            </div>
             <div className="flex justify-between pt-2 border-t border-slate-700 mt-2 text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="text-brand-gold">${selectedTailor?.estimatedQuote.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:border-brand-purple transition-colors bg-brand-darker">
               <CreditCard className="text-slate-400" />
               <div>
                 <div className="text-sm font-medium text-white">Visa ending in 4242</div>
                 <div className="text-xs text-slate-500">Expires 12/25</div>
               </div>
            </div>
            <Button onClick={handlePayment} disabled={loading} className="w-full" variant="primary">
              {loading ? <span className="animate-pulse">Processing...</span> : `Pay $${selectedTailor?.estimatedQuote.toLocaleString()}`}
            </Button>
            <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> 100% Secure Payment Processing
            </p>
          </div>
        </Card>
        <div className="text-center mt-4">
           <button onClick={() => setView('recommendations')} className="text-sm text-slate-500 hover:text-white">Cancel</button>
        </div>
      </div>
    );
  }

  // Default: Dashboard View
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Brand Dashboard</h2>
          <p className="text-slate-400">Manage production lines and financials.</p>
        </div>
        <Button onClick={() => setView('create')}>
          <Plus size={18} /> Start New Production
        </Button>
      </div>

      <AnalyticsSection />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Package size={20} className="text-brand-gold" /> 
          Production Status
        </h3>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
            <p className="text-slate-500">No active production lines.</p>
            <Button variant="outline" className="mt-4" onClick={() => setView('create')}>Create First Order</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map(job => (
              <Card key={job.id} className="hover:border-brand-purple/50 transition-colors group">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg text-white group-hover:text-brand-purple transition-colors">{job.garmentType}</h4>
                      <Badge status={job.status} />
                      {job.escrowStatus === 'Held' && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                           <ShieldCheck size={10} /> Escrow Funded
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400 mt-2">
                      <span><span className="text-slate-500 block text-xs">Quantity</span> {job.quantity} Units</span>
                      <span><span className="text-slate-500 block text-xs">Fabric</span> {job.fabricType}</span>
                      <span><span className="text-slate-500 block text-xs">Tailor</span> {job.tailorName || "Matching..."}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> Due: {job.deadline}</span>
                    </div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                     <div className="text-xl font-bold text-white">${job.budget?.toLocaleString()}</div>
                     <div className="text-xs text-slate-500">Total Budget</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) => {
  const base = "px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-brand-purple to-purple-600 text-white hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-600",
    secondary: "bg-brand-gold text-brand-darker hover:bg-amber-300 hover:shadow-amber-400/25",
    outline: "border border-slate-600 text-slate-300 hover:border-brand-purple hover:text-brand-purple bg-transparent shadow-none"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ className = '', label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full bg-brand-paper border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all ${className}`}
      {...props}
    />
  </div>
);

export const Select = ({ className = '', label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <select 
      className={`w-full bg-brand-paper border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-brand-paper/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ status }: { status: string }) => {
  let styles = "bg-slate-700 text-slate-300";
  if (status === 'Pending Match') styles = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
  if (status === 'In Production') styles = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
  if (status === 'Completed') styles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${styles}`}>
      {status}
    </span>
  );
};

export type UserRole = 'Brand' | 'Tailor';

export type JobStatus = 'Pending Match' | 'In Production' | 'Completed';

export type EscrowStatus = 'Unpaid' | 'Held' | 'Released';

export interface Sizing {
  s: number;
  m: number;
  l: number;
  xl: number;
}

export interface Job {
  id: string;
  garmentType: string;
  quantity: number; // Total quantity
  sizing: Sizing;
  fabricType: string;
  deadline: string;
  brandName: string;
  brandId: string;
  status: JobStatus;
  createdAt: number;
  
  // New Fields
  designFiles?: string[];
  budget?: number;
  escrowStatus: EscrowStatus;
  
  // Matched Tailor Info
  tailorId?: string;
  tailorName?: string;
}

export interface RateCardItem {
  type: string;
  baseRate: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  profileImage?: string;
  
  // Tailor specific
  specialties?: string[];
  rateCard?: RateCardItem[]; // e.g. [{type: 'Suits', baseRate: 500}]
  experienceYears?: number;
  rating?: number;
  portfolioImages?: string[];
  kycStatus?: 'Pending' | 'Verified' | 'Rejected';
  totalEarnings?: number;
  jobsCompleted?: number;

  // Brand specific
  brandName?: string;
}

export interface TailorRecommendation {
  uid: string;
  displayName: string;
  rating: number;
  matchScore: number;
  estimatedQuote: number;
  specialties: string[];
}

declare global {
  interface Window {
    __app_id?: string;
    __firebase_config?: any;
    __initial_auth_token?: string;
  }
}

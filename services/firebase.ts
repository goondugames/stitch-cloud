
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  User, 
  Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  updateDoc,
  Firestore
} from 'firebase/firestore';
import { Job, UserProfile, TailorRecommendation } from '../types';

// --- Configuration ---
const DEFAULT_APP_ID = 'stitch-cloud-default';
const APP_ID = window.__app_id || DEFAULT_APP_ID;

let app: FirebaseApp;
let auth: Auth | undefined;
let db: Firestore;
let useMock = false;

const initFirebase = () => {
  if (!getApps().length) {
    try {
      // Fallback config if global is missing
      const config = window.__firebase_config || {
        apiKey: "AIzaSyDummyKey",
        authDomain: "dummy.firebaseapp.com",
        projectId: "dummy-project",
        storageBucket: "dummy.appspot.com",
        messagingSenderId: "00000000000",
        appId: "1:00000000000:web:00000000000000"
      };
      
      // Check for dummy or missing key and switch to mock immediately
      if (!config.apiKey || config.apiKey === "AIzaSyDummyKey") {
        console.log("[Stitch-Cloud] No valid API key found. Initializing in Demo Mode.");
        useMock = true;
      }

      app = initializeApp(config);
    } catch (e) {
      console.warn("Firebase initialization warning (switching to demo mode):", e);
      useMock = true;
    }
  } else {
    app = getApps()[0];
  }
  
  if (!useMock) {
    try {
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (e) {
      console.warn("Error initializing Auth/DB (switching to demo mode):", e);
      useMock = true;
    }
  }
};

initFirebase();

export { auth, db };

// --- Mock State ---
const mockUser = {
  uid: 'mock-user-dev',
  email: 'dev@stitch.cloud',
  displayName: 'Dev User',
  emailVerified: true,
  isAnonymous: false
} as User;

// Pre-populate some jobs so the Tailor dashboard isn't empty
const initialMockJobs: Job[] = [
  {
    id: 'job-preload-1',
    garmentType: 'Wedding Dress',
    quantity: 1,
    sizing: { s: 1, m: 0, l: 0, xl: 0 },
    fabricType: 'Silk Satin',
    deadline: '2024-12-01',
    brandName: 'Bridal Elegance',
    brandId: 'brand-1',
    status: 'Pending Match',
    createdAt: Date.now() - 100000,
    escrowStatus: 'Unpaid',
    budget: 2500
  },
  {
    id: 'job-preload-2',
    garmentType: 'Denim Jackets',
    quantity: 50,
    sizing: { s: 10, m: 20, l: 15, xl: 5 },
    fabricType: 'Heavy Denim',
    deadline: '2024-11-15',
    brandName: 'Urban Outfitters Co.',
    brandId: 'brand-2',
    status: 'Pending Match',
    createdAt: Date.now() - 200000,
    escrowStatus: 'Unpaid',
    budget: 4000
  },
  {
    id: 'job-preload-3',
    garmentType: 'Linen Suits',
    quantity: 5,
    sizing: { s: 0, m: 2, l: 2, xl: 1 },
    fabricType: 'Italian Linen',
    deadline: '2024-10-30',
    brandName: 'Gentlemans Club',
    brandId: 'brand-3',
    status: 'Completed',
    createdAt: Date.now() - 5000000,
    escrowStatus: 'Released',
    tailorId: 'mock-user-dev', // Assigned to current mock user to show history
    tailorName: 'Me',
    budget: 1500
  }
];

const mockDb: { jobs: Job[], profiles: Record<string, UserProfile> } = {
  jobs: [...initialMockJobs],
  profiles: {}
};

// --- Auth Helpers ---

export const authenticateUser = async (): Promise<User> => {
  if (useMock) return mockUser;

  if (!auth) {
    console.warn("Auth not initialized. Switching to Demo Mode.");
    useMock = true;
    return mockUser;
  }

  const token = window.__initial_auth_token;
  try {
    if (token) {
      const cred = await signInWithCustomToken(auth, token);
      return cred.user;
    } else {
      const cred = await signInAnonymously(auth);
      return cred.user;
    }
  } catch (error: any) {
    console.warn("[Stitch-Cloud] Auth failed. Switching to Demo Mode. Error:", error.message);
    useMock = true;
    return mockUser;
  }
};

// --- Firestore Helpers ---

const getPublicJobsRef = () => collection(db, 'artifacts', APP_ID, 'public', 'data', 'jobs');
const getUserProfileRef = (uid: string) => doc(db, 'artifacts', APP_ID, 'users', uid, 'profile', 'data');

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (useMock) return mockDb.profiles[uid] || null;

  try {
    const snap = await getDoc(getUserProfileRef(uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (e) {
    console.warn("Profile read error (mocking):", e);
    useMock = true;
    return mockDb.profiles[uid] || null;
  }
  return null;
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  if (useMock) {
    mockDb.profiles[uid] = { ...mockDb.profiles[uid], uid, ...data } as UserProfile;
    return;
  }
  try {
    await setDoc(getUserProfileRef(uid), { uid, ...data }, { merge: true });
  } catch (e) {
    console.warn("Profile save error (mocking):", e);
    useMock = true;
    mockDb.profiles[uid] = { ...data, uid } as UserProfile;
  }
};

export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'escrowStatus'>): Promise<string> => {
  const newJobData: Omit<Job, 'id'> = {
    ...jobData,
    status: 'Pending Match',
    escrowStatus: 'Unpaid',
    createdAt: Date.now(),
  };

  const docId = `job-${Date.now()}`;

  if (useMock) {
    const mockJob = { ...newJobData, id: docId };
    mockDb.jobs.push(mockJob);
    return docId;
  }

  try {
    const docRef = await addDoc(getPublicJobsRef(), newJobData);
    return docRef.id;
  } catch (e) {
    console.warn("Create Job error (mocking):", e);
    useMock = true;
    const mockJob = { ...newJobData, id: docId };
    mockDb.jobs.push(mockJob);
    return docId;
  }
};

export const acceptJob = async (jobId: string, tailorId: string) => {
  if (useMock) {
    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'In Production';
      job.tailorId = tailorId;
    }
    return;
  }

  try {
    const jobRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'jobs', jobId);
    await updateDoc(jobRef, {
      status: 'In Production',
      tailorId: tailorId
    });
  } catch (e) {
    console.warn("Update Job error (mocking):", e);
    useMock = true;
    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'In Production';
      job.tailorId = tailorId;
    }
  }
};

export const subscribeToJobs = (callback: (jobs: Job[]) => void, brandId?: string) => {
  if (useMock) {
    const check = () => {
      let jobs = [...mockDb.jobs];
      if (brandId) jobs = jobs.filter(j => j.brandId === brandId);
      jobs.sort((a, b) => b.createdAt - a.createdAt);
      callback(jobs);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }

  let q;
  try {
    if (brandId) {
      q = query(getPublicJobsRef(), where('brandId', '==', brandId), orderBy('createdAt', 'desc'));
    } else {
      q = query(getPublicJobsRef(), orderBy('createdAt', 'desc'));
    }
    
    return onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
      callback(jobs);
    }, (err) => {
      console.warn("Snapshot failed (using mock):", err);
      useMock = true;
      callback([]);
    });
  } catch (e) {
    console.warn("Query error (using mock):", e);
    useMock = true;
    return () => {};
  }
};

// --- New Advanced Features (Mock Only for MVP) ---

export const getRecommendedTailors = async (garmentType: string): Promise<TailorRecommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return [
    {
      uid: 'tailor-1',
      displayName: 'Elena "The Needle" Rossi',
      rating: 4.9,
      matchScore: 98,
      estimatedQuote: 1200,
      specialties: ['Haute Couture', 'Silk', 'Evening Wear']
    },
    {
      uid: 'tailor-2',
      displayName: 'Urban Stitch Co.',
      rating: 4.7,
      matchScore: 92,
      estimatedQuote: 950,
      specialties: ['Denim', 'Streetwear', 'Heavy Canvas']
    },
    {
      uid: 'tailor-3',
      displayName: 'Master Tailor Kim',
      rating: 5.0,
      matchScore: 89,
      estimatedQuote: 1450,
      specialties: ['Suits', 'Wool', 'Tailoring']
    }
  ];
};

export const processEscrowPayment = async (jobId: string, tailorId: string, tailorName: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Payment processing simulation
  
  if (useMock) {
    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'In Production';
      job.escrowStatus = 'Held';
      job.tailorId = tailorId;
      job.tailorName = tailorName;
    }
    return;
  }

  try {
    const jobRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'jobs', jobId);
    await updateDoc(jobRef, {
      status: 'In Production',
      escrowStatus: 'Held',
      tailorId: tailorId,
      tailorName: tailorName
    });
  } catch (e) {
    console.warn("Escrow update failed (mocking):", e);
    useMock = true;
    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'In Production';
      job.escrowStatus = 'Held';
      job.tailorId = tailorId;
      job.tailorName = tailorName;
    }
  }
};

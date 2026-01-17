export interface Challenge {
  id: number;
  titre: string;
  description: string;
  niveau: string;
  duree: number;
  // Additional fields for UI
  participants?: number;
  successRate?: number;
  avgTimeSaved?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  progress?: number; // 0-100
  fullDescription?: string;
  benefits?: string[];
  steps?: { number: number; title: string; description: string }[];
  image?: string;
  featured?: boolean;
}


export interface AssessmentData {
  trainingType: 'trail' | 'road';
  targetRaceName: string;
  targetRaceDate: string;
  planStartDate: string;
  allowMultipleSessionsPerDay: boolean;
  distanceKm: number;
  totalElevationGain: number;
  technicalScale: number; // 1-5
  age: number;
  weightKg: number;
  restingHeartRate: number;
  runningExperienceYears: number;
  longestDistanceKm: number;
  monthlyMileageKm: number;
  daysPerWeek: number;
  offDays: string[];
  longRunDays: string[];
  injuryHistory: string;
  facilityAccess: 'gym' | 'bodyweight';
  fitnessImage?: string; // Base64 string
}

export interface TrainingSession {
  date: string;
  day: string;
  type: 'run' | 'mobility' | 'strength' | 'rest';
  durationMileage: string;
  elevationGain: string;
  description: string;
  focus: string;
  nutritionHydration: string;
}

export interface WeeklySummary {
  weekNumber: number;
  totalDistance: string;
  totalElevation: string;
}

export interface ActualPerformance {
  isCompleted: boolean;
  actualMileage: number;
  actualElevation: number;
  actualDuration: number; // in minutes
}

export interface TrainingPhase {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface TrainingPlanResponse {
  strategySummary: string;
  periodization: TrainingPhase[];
  plan: TrainingSession[];
  weeklySummaries: WeeklySummary[];
  actuals?: Record<string, ActualPerformance>; // Key is date
}

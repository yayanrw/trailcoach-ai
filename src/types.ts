export interface AssessmentData {
  trainingType: 'trail' | 'road';
  targetRaceName: string;
  targetRaceDate: string;
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
  injuryHistory: string;
  facilityAccess: 'gym' | 'bodyweight';
  fitnessImage?: string; // Base64 string
}

export interface TrainingSession {
  date: string;
  day: string;
  type: 'Easy Run' | 'Intervals' | 'Hill Reps' | 'Long Run' | 'Strength' | 'Mobility' | 'Rest';
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

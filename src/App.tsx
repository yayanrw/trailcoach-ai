import React, { useState, useEffect } from 'react';
import { AssessmentForm } from './components/AssessmentForm';
import { TrainingPlanDisplay } from './components/TrainingPlanDisplay';
import { AssessmentData, TrainingPlanResponse, ActualPerformance } from './types';
import { generateTrainingPlan } from './services/geminiService';
import { Activity, ChevronLeft, Mountain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'trailcoach_training_plan';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTrainingPlan(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved plan', e);
      }
    }
  }, []);

  const handleAssessmentSubmit = async (data: AssessmentData) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateTrainingPlan(data);
      // Initialize actuals map
      const planWithActuals: TrainingPlanResponse = {
        ...plan,
        actuals: {}
      };
      setTrainingPlan(planWithActuals);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planWithActuals));
    } catch (err) {
      console.error(err);
      setError('Gagal menghasilkan rencana latihan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateActualPerformance = (date: string, performance: ActualPerformance) => {
    if (!trainingPlan) return;
    
    const updatedPlan = {
      ...trainingPlan,
      actuals: {
        ...(trainingPlan.actuals || {}),
        [date]: performance
      }
    };
    
    setTrainingPlan(updatedPlan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
  };

  const resetPlan = () => {
    setTrainingPlan(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              TrailCoach <span className="text-emerald-600">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {trainingPlan && (
              <button 
                onClick={resetPlan}
                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-1 border border-red-100 rounded-lg hover:bg-red-50 transition-all"
              >
                Reset Plan
              </button>
            )}
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
              <span className="hover:text-emerald-600 transition-colors cursor-pointer">Scientific Framework</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {!trainingPlan ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest"
                >
                  <Zap className="w-3 h-3" />
                  Adaptive Training Plan
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Rancang Rencana Lari Trail <span className="text-emerald-600 italic">Scientific</span> Anda.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Berdasarkan riset sports science terbaru untuk ultra-endurance. 
                  Dapatkan jadwal yang dipersonalisasi sesuai profil fisiologis dan target race Anda.
                </p>
              </div>

              {error && (
                <div className="max-w-4xl mx-auto p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <AssessmentForm onSubmit={handleAssessmentSubmit} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button
                onClick={resetPlan}
                className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali ke Assessment
              </button>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Training Plan Anda Siap.</h2>
                <p className="text-slate-500">Rencana ini telah dioptimalkan untuk performa maksimal dan pencegahan cedera.</p>
              </div>

              <TrainingPlanDisplay 
                data={trainingPlan} 
                onUpdateActual={updateActualPerformance}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900">TrailCoach AI</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 TrailCoach AI. Built for Ultra-Endurance Athletes.
          </p>
          <div className="flex justify-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Periodization</span>
            <span>ACWR Ratio</span>
            <span>Supercompensation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

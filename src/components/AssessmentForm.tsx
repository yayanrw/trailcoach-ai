import React, { useState } from 'react';
import { AssessmentData } from '../types';
import { Activity, Calendar, Heart, Map, Ruler, Timer, Trophy, User, Upload, X, Image as ImageIcon } from 'lucide-react';

interface AssessmentFormProps {
  onSubmit: (data: AssessmentData) => void;
  isLoading: boolean;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AssessmentData>({
    targetRaceName: '',
    targetRaceDate: '',
    distanceKm: 21,
    totalElevationGain: 1000,
    technicalScale: 3,
    age: 30,
    weightKg: 70,
    restingHeartRate: 60,
    runningExperienceYears: 2,
    longestDistanceKm: 15,
    monthlyMileageKm: 100,
    daysPerWeek: 4,
    offDays: ['Monday'],
    injuryHistory: 'None',
    facilityAccess: 'bodyweight',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number' || name === 'technicalScale') {
      // Allow empty string for better UX when deleting
      const finalValue = value === '' ? '' : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: finalValue,
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, fitnessImage: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => {
      const { fitnessImage, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-600" />
          Target Race
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Nama Event</label>
            <input
              required
              name="targetRaceName"
              value={formData.targetRaceName}
              onChange={handleChange}
              placeholder="Contoh: Rinjani 100"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Tanggal Event</label>
            <input
              required
              type="date"
              name="targetRaceDate"
              value={formData.targetRaceDate}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Map className="w-6 h-6 text-emerald-600" />
          Spesifikasi Rute
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Jarak (km)</label>
            <input
              type="number"
              name="distanceKm"
              value={formData.distanceKm || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Total Elevation Gain (m)</label>
            <input
              type="number"
              name="totalElevationGain"
              value={formData.totalElevationGain || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Skala Teknis (1-5)</label>
            <select
              name="technicalScale"
              value={formData.technicalScale}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            >
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          Profil Fisiologis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Umur</label>
            <input
              type="number"
              name="age"
              value={formData.age || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Berat Badan (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={formData.weightKg || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Resting Heart Rate (bpm)</label>
            <input
              type="number"
              name="restingHeartRate"
              value={formData.restingHeartRate || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-600" />
          Riwayat Lari
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Pengalaman (Tahun)</label>
            <input
              type="number"
              name="runningExperienceYears"
              value={formData.runningExperienceYears || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Jarak Terjauh (km)</label>
            <input
              type="number"
              name="longestDistanceKm"
              value={formData.longestDistanceKm || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Mileage Bulanan (km)</label>
            <input
              type="number"
              name="monthlyMileageKm"
              value={formData.monthlyMileageKm || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Timer className="w-6 h-6 text-emerald-600" />
          Ketersediaan Waktu & Fasilitas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Hari Lari per Minggu</label>
            <input
              type="number"
              name="daysPerWeek"
              value={formData.daysPerWeek || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Akses Fasilitas</label>
            <select
              name="facilityAccess"
              value={formData.facilityAccess}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            >
              <option value="bodyweight">Bodyweight Only</option>
              <option value="gym">Gym Access</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600">Riwayat Cedera (6 Bulan Terakhir)</label>
          <textarea
            name="injuryHistory"
            value={formData.injuryHistory}
            onChange={handleChange}
            placeholder="Sebutkan jika ada cedera..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-24"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-emerald-600" />
          Data Tambahan (Opsional)
        </h2>
        <p className="text-sm text-slate-500">
          Upload screenshot fitness level dari aplikasi lain (seperti Intervals.icu, TrainingPeaks, atau Strava) untuk analisis yang lebih akurat.
        </p>
        <div className="relative">
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-emerald-300 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-500 font-semibold">Klik untuk upload screenshot</p>
                <p className="text-xs text-slate-400">PNG, JPG atau JPEG (Maks. 5MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200">
              <img src={imagePreview} alt="Fitness Level Preview" className="w-full h-full object-contain bg-slate-100" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menganalisis Data...
          </>
        ) : (
          <>
            <Activity className="w-5 h-5" />
            Generate Training Plan
          </>
        )}
      </button>
    </form>
  );
};

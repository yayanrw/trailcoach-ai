import React, { useState, useMemo } from 'react';
import { TrainingPlanResponse, ActualPerformance } from '../types';
import { Download, Info, Table as TableIcon, TrendingUp, CheckCircle2, Circle, BarChart3, ChevronLeft, ChevronRight, Layers, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TrainingPlanDisplayProps {
  data: TrainingPlanResponse;
  onUpdateActual: (date: string, performance: ActualPerformance) => void;
}

export const TrainingPlanDisplay: React.FC<TrainingPlanDisplayProps> = ({ data, onUpdateActual }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [nonRunChartView, setNonRunChartView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const itemsPerPage = 10;

  const getWeekNumber = (dateStr: string) => {
    const firstDate = new Date(data.plan[0].date);
    const currentDate = new Date(dateStr);
    
    // Get day of week (1 for Monday, ..., 7 for Sunday)
    const getDayOfWeek = (d: Date) => d.getDay() === 0 ? 7 : d.getDay();
    
    const d1 = getDayOfWeek(firstDate);
    const diffDays = Math.floor((currentDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.floor((diffDays + d1 - 1) / 7) + 1;
  };

  const exportToCSV = () => {
    const headers = ['Week', 'Tanggal', 'Hari', 'Jenis Latihan', 'Durasi/Jarak', 'Elevasi', 'Deskripsi', 'Fokus Utama', 'Realisasi', 'Actual Mileage', 'Actual Elevation'];
    const rows = data.plan.map(session => {
      const actual = data.actuals?.[session.date];
      return [
        getWeekNumber(session.date),
        session.date,
        session.day,
        session.type,
        session.durationMileage,
        session.elevationGain,
        session.description.replace(/,/g, ';'),
        session.focus.replace(/,/g, ';'),
        actual?.isCompleted ? 'Ya' : 'Tidak',
        actual?.actualMileage || 0,
        actual?.actualElevation || 0
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trail_training_plan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare aggregated data for Chart
  const aggregatedChartData = useMemo(() => {
    const isRunSession = (type: string) => type === 'run';

    // 1. Aggregate by date first
    const dailyData: Record<string, { planned: number; actual: number }> = {};
    data.plan.forEach(session => {
      const isRun = isRunSession(session.type);
      const actual = data.actuals?.[session.date];
      const plannedMileage = isRun 
        ? (parseFloat(session.durationMileage.replace(/[^\d.]/g, '')) || 0)
        : 0;
      
      if (!dailyData[session.date]) {
        dailyData[session.date] = { 
          planned: 0, 
          actual: actual?.actualMileage || 0 
        };
      }
      dailyData[session.date].planned += plannedMileage;
    });

    if (chartView === 'daily') {
      return Object.entries(dailyData).map(([date, vals]) => ({
        label: date.split('-').slice(1).join('/'),
        plannedMileage: Number(vals.planned.toFixed(1)),
        actualMileage: Number(vals.actual.toFixed(1)),
      }));
    }

    if (chartView === 'weekly') {
      const weeks: Record<number, { planned: number; actual: number }> = {};
      Object.entries(dailyData).forEach(([date, vals]) => {
        const weekNum = getWeekNumber(date);
        if (!weeks[weekNum]) weeks[weekNum] = { planned: 0, actual: 0 };
        weeks[weekNum].planned += vals.planned;
        weeks[weekNum].actual += vals.actual;
      });
      return Object.entries(weeks).map(([week, vals]) => ({
        label: `W${week}`,
        plannedMileage: Number(vals.planned.toFixed(1)),
        actualMileage: Number(vals.actual.toFixed(1)),
      }));
    }

    if (chartView === 'monthly') {
      const months: Record<string, { planned: number; actual: number }> = {};
      Object.entries(dailyData).forEach(([date, vals]) => {
        const dateObj = new Date(date);
        const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!months[monthLabel]) months[monthLabel] = { planned: 0, actual: 0 };
        months[monthLabel].planned += vals.planned;
        months[monthLabel].actual += vals.actual;
      });
      return Object.entries(months).map(([month, vals]) => ({
        label: month,
        plannedMileage: Number(vals.planned.toFixed(1)),
        actualMileage: Number(vals.actual.toFixed(1)),
      }));
    }
    return [];
  }, [data, chartView]);

  // Prepare aggregated data for Non-Run Chart (Duration based)
  const nonRunChartData = useMemo(() => {
    const isNonRunSession = (type: string) => ['strength', 'mobility'].includes(type);

    const getPlannedMinutes = (durationStr: string) => {
      let plannedMinutes = 0;
      const lowerStr = durationStr.toLowerCase();
      if (lowerStr.includes('min') || lowerStr.includes('menit')) {
        plannedMinutes = parseFloat(lowerStr.replace(/[^\d.]/g, '')) || 0;
      } else if (lowerStr.includes('hour') || lowerStr.includes('jam')) {
        plannedMinutes = (parseFloat(lowerStr.replace(/[^\d.]/g, '')) || 0) * 60;
      } else {
        plannedMinutes = parseFloat(lowerStr.replace(/[^\d.]/g, '')) || 0;
      }
      return plannedMinutes;
    };

    // 1. Aggregate by date first
    const dailyData: Record<string, { planned: number; actual: number }> = {};
    data.plan.forEach(session => {
      const isNonRun = isNonRunSession(session.type);
      const actual = data.actuals?.[session.date];
      const plannedDuration = isNonRun ? getPlannedMinutes(session.durationMileage) : 0;
      
      if (!dailyData[session.date]) {
        dailyData[session.date] = { 
          planned: 0, 
          actual: actual?.actualDuration || 0 
        };
      }
      dailyData[session.date].planned += plannedDuration;
    });

    if (nonRunChartView === 'daily') {
      return Object.entries(dailyData).map(([date, vals]) => ({
        label: date.split('-').slice(1).join('/'),
        plannedDuration: Number(vals.planned.toFixed(0)),
        actualDuration: Number(vals.actual.toFixed(0)),
      }));
    }

    if (nonRunChartView === 'weekly') {
      const weeks: Record<number, { planned: number; actual: number }> = {};
      Object.entries(dailyData).forEach(([date, vals]) => {
        const weekNum = getWeekNumber(date);
        if (!weeks[weekNum]) weeks[weekNum] = { planned: 0, actual: 0 };
        weeks[weekNum].planned += vals.planned;
        weeks[weekNum].actual += vals.actual;
      });
      return Object.entries(weeks).map(([week, vals]) => ({
        label: `W${week}`,
        plannedDuration: Number(vals.planned.toFixed(0)),
        actualDuration: Number(vals.actual.toFixed(0)),
      }));
    }

    if (nonRunChartView === 'monthly') {
      const months: Record<string, { planned: number; actual: number }> = {};
      Object.entries(dailyData).forEach(([date, vals]) => {
        const dateObj = new Date(date);
        const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!months[monthLabel]) months[monthLabel] = { planned: 0, actual: 0 };
        months[monthLabel].planned += vals.planned;
        months[monthLabel].actual += vals.actual;
      });
      return Object.entries(months).map(([month, vals]) => ({
        label: month,
        plannedDuration: Number(vals.planned.toFixed(0)),
        actualDuration: Number(vals.actual.toFixed(0)),
      }));
    }
    return [];
  }, [data, nonRunChartView]);

  const handleActualChange = (date: string, field: keyof ActualPerformance, value: any) => {
    const current = data.actuals?.[date] || { isCompleted: false, actualMileage: 0, actualElevation: 0, actualDuration: 0 };
    onUpdateActual(date, {
      ...current,
      [field]: value
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(data.plan.length / itemsPerPage);
  const paginatedPlan = data.plan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Strategy Summary */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-700" />
          <h2 className="text-2xl font-bold text-emerald-900">Ringkasan Strategi</h2>
        </div>
        <p className="text-emerald-800 leading-relaxed text-lg">
          {data.strategySummary}
        </p>
      </motion.section>

      {/* Periodization Preview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-900">Fase Periodisasi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {data.periodization.map((phase, idx) => {
            const today = new Date();
            const start = new Date(phase.startDate);
            const end = new Date(phase.endDate);
            const isActive = today >= start && today <= end;

            return (
              <div 
                key={idx} 
                className={`relative p-4 rounded-2xl border transition-all ${
                  isActive 
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' 
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Fase Saat Ini
                  </div>
                )}
                <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {phase.name}
                </h3>
                <div className="text-[10px] text-slate-400 font-mono mb-2">
                  {new Date(phase.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(phase.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {phase.description}
                </p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Chart Section - Running */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">Plan vs Actual Mileage (km)</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  chartView === view 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aggregatedChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="plannedMileage" name="Planned (km)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actualMileage" name="Actual (km)" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Chart Section - Non-Run (Strength/Mobility) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Plan vs Actual Mobility/Strength Exercise (menit)</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setNonRunChartView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  nonRunChartView === view 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nonRunChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="plannedDuration" name="Planned (min)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actualDuration" name="Actual (min)" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Table Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TableIcon className="w-6 h-6 text-slate-700" />
            <h2 className="text-2xl font-bold text-slate-900">Jadwal Latihan</h2>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-slate-200"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Week</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Latihan</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Volume/Elevasi (Meter)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Actual Performance</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Nutrisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPlan.map((session, idx) => {
                const actual = data.actuals?.[session.date] || { isCompleted: false, actualMileage: 0, actualElevation: 0 };
                const weekNum = getWeekNumber(session.date);
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-emerald-600">W{weekNum}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{session.date}</div>
                      <div className="text-xs text-slate-500 uppercase">{session.day}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        session.type === 'rest' ? 'bg-slate-100 text-slate-800' :
                        session.type === 'run' ? 'bg-emerald-100 text-emerald-800' :
                        session.type === 'strength' ? 'bg-blue-100 text-blue-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {session.type}
                      </span>
                      <div className="mt-1 text-sm font-semibold text-slate-700">{session.focus}</div>
                      <p className="text-xs text-slate-500 mt-1 max-w-[200px]">{session.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-mono">{session.durationMileage}</div>
                      <div className="text-xs text-slate-500 font-mono">+{session.elevationGain} Meter</div>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleActualChange(session.date, 'isCompleted', !actual.isCompleted)}
                          className={`flex items-center gap-2 text-xs font-bold transition-colors ${actual.isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}
                        >
                          {actual.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          {actual.isCompleted ? 'TEREALISASI' : 'BELUM SELESAI'}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          {session.type === 'run' ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Actual Km</label>
                                <input 
                                  type="number"
                                  value={actual.actualMileage === 0 && actual.actualMileage !== undefined ? '' : actual.actualMileage}
                                  onChange={(e) => handleActualChange(session.date, 'actualMileage', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  placeholder="0"
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Actual EG (Meter)</label>
                                <input 
                                  type="number"
                                  value={actual.actualElevation === 0 && actual.actualElevation !== undefined ? '' : actual.actualElevation}
                                  onChange={(e) => handleActualChange(session.date, 'actualElevation', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  placeholder="0"
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                            </>
                          ) : session.type === 'rest' ? null : (
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Actual Time (menit)</label>
                              <input 
                                type="number"
                                value={actual.actualDuration === 0 && actual.actualDuration !== undefined ? '' : actual.actualDuration}
                                onChange={(e) => handleActualChange(session.date, 'actualDuration', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                placeholder="0"
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 text-xs text-slate-500 italic">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {session.nutritionHydration}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500">
            Menampilkan <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, data.plan.length)}</span> dari <span className="font-bold text-slate-900">{data.plan.length}</span> hari
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Weekly Summary */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {data.weeklySummaries.map((summary) => (
          <div key={summary.weekNumber} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Minggu {summary.weekNumber}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-slate-500 text-sm">Total Jarak</span>
                <span className="text-xl font-bold text-slate-900 font-mono">{summary.totalDistance}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-500 text-sm">Total Elevasi (Meter)</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">+{summary.totalElevation}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.section>
    </div>
  );
};

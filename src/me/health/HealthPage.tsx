import React, { useState, useEffect } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function HealthPage() {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { openQuickAction, refreshKey, onRefresh } = useOutletContext<OutletContextType>();

  const [activeTab, setActiveTab] = useState<'weight' | 'gym' | 'progress'>(
    (urlTab === 'gym' || urlTab === 'progress' || urlTab === 'weight') ? urlTab : 'weight'
  );

  useEffect(() => {
    if (urlTab === 'gym' || urlTab === 'progress' || urlTab === 'weight') {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (t: 'weight' | 'gym' | 'progress') => {
    setActiveTab(t);
    navigate(`/me/health/${t}`, { replace: true });
  };

  const [weights, setWeights] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Weight Log Modal
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [inputWeightDate, setInputWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputWeightNotes, setInputWeightNotes] = useState('');

  // Workout Modal
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState('Full Body');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exerciseItems, setExerciseItems] = useState([
    { name: 'Barbell Bench Press', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 75 }] }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wRes, woRes] = await Promise.all([
        meApi.getWeightLogs(),
        meApi.getWorkouts()
      ]);
      setWeights((wRes || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setWorkouts((woRes || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err: any) {
      toast.error('Failed to load health telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Calculations
  const currentWeight = weights[0]?.weight;
  const startingWeight = weights[weights.length - 1]?.weight;
  const totalChange = (currentWeight && startingWeight) ? parseFloat((currentWeight - startingWeight).toFixed(1)) : 0;

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWeight) return;
    try {
      await meApi.createWeightLog({
        weight: parseFloat(inputWeight),
        date: inputWeightDate,
        notes: inputWeightNotes
      });
      toast.success('Weight recorded');
      setWeightModalOpen(false);
      setInputWeight('');
      setInputWeightNotes('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to log weight');
    }
  };

  const handleDeleteWeight = async (id: string) => {
    try {
      await meApi.deleteWeightLog(id);
      toast.success('Weight entry deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete weight log');
    }
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meApi.createWorkout({
        workoutType,
        duration: parseInt(workoutDuration) || 45,
        date: workoutDate,
        exercises: exerciseItems,
        notes: workoutNotes
      });
      toast.success('Workout logged');
      setWorkoutModalOpen(false);
      setWorkoutNotes('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to log workout');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await meApi.deleteWorkout(id);
      toast.success('Workout deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete workout');
    }
  };

  const personalRecords: Record<string, { weight: number, reps: number, date: string }> = {};
  workouts.forEach(w => {
    if (w.exercises) {
      w.exercises.forEach((ex: any) => {
        if (ex.name && ex.sets) {
          ex.sets.forEach((set: any) => {
            const curMax = personalRecords[ex.name]?.weight || 0;
            if (set.weight > curMax) {
              personalRecords[ex.name] = {
                weight: set.weight,
                reps: set.reps,
                date: w.date
              };
            }
          });
        }
      });
    }
  });

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest text-on-surface min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        
        {/* Header / Command Greeting */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-code text-label-sm text-text-muted tracking-wider uppercase">Personal OS // Health</span>
              <span className="w-1 h-1 rounded-full bg-surface-variant"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-text-secondary font-code text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Physical Performance</span>
              </div>
            </div>
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Health & Physical Performance
            </h1>
            <p className="font-body-md text-text-secondary max-w-xl">
              Weight trendline, training log, personal records, and strength volume.
            </p>
          </div>

          {/* Quick Action Pill Dock */}
          <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-full bg-surface-card shadow-sm self-start lg:self-auto border border-hairline-border">
            {(['weight', 'gym', 'progress'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer capitalize ${
                  activeTab === tab 
                    ? 'bg-surface-container text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
                }`}
              >
                {tab === 'gym' ? 'Workouts' : tab === 'progress' ? 'Personal Records' : 'Weight Trend'}
              </button>
            ))}
            <button
              onClick={() => openQuickAction(activeTab === 'weight' ? 'weight' : 'workout')}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md shadow-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>{activeTab === 'weight' ? 'Log Weight' : 'Log Workout'}</span>
            </button>
          </div>
        </header>

        {/* 4 Metric KPI Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Health Telemetry</span>
            <span className="font-code text-body-sm text-text-muted">Active Cycle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Current Weight</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">monitor_weight</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {currentWeight ? `${currentWeight} kg` : '—'}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">Morning fasted weigh-in</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Starting Weight</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">flag</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {startingWeight ? `${startingWeight} kg` : '—'}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">Baseline benchmark</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Total Shift</span>
                <span className="material-symbols-outlined text-[18px] text-secondary">trending_up</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-secondary tracking-tight tabular-nums">
                  {totalChange > 0 ? `+${totalChange}` : totalChange} kg
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">Net weight trajectory</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Workouts Logged</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">fitness_center</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {workouts.length}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">Total sessions tracked</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, workouts.length * 10)}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'weight' && (
          <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Weigh-in History</h2>
                <p className="font-body-sm text-body-sm text-text-muted mt-0.5">Morning fasted weigh-in logs.</p>
              </div>
              <button
                onClick={() => setWeightModalOpen(true)}
                className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Record Weight</span>
              </button>
            </div>

            {weights.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                  <thead>
                    <tr className="text-text-muted font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low">
                      <th className="py-2.5 px-4 rounded-l-lg">Date</th>
                      <th className="py-2.5 px-4">Weight</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 px-4 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-border">
                    {weights.map(w => (
                      <tr key={w.id} className="hover:bg-surface-card-hover transition-colors group">
                        <td className="py-3 px-4 font-code text-label-sm text-text-muted whitespace-nowrap tabular-nums">
                          {w.date}
                        </td>
                        <td className="py-3 px-4 font-headline-sm text-text-primary whitespace-nowrap tabular-nums font-semibold">
                          {w.weight} kg
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {w.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteWeight(w.id)}
                            className="p-1 rounded text-text-muted hover:text-error hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-text-muted font-body-sm">
                No weigh-in data logged yet. Click "Record Weight" to start tracking.
              </div>
            )}
          </section>
        )}

        {activeTab === 'gym' && (
          <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Training Sessions & Workouts</h2>
                <p className="font-body-sm text-body-sm text-text-muted mt-0.5">Resistance sets, reps, and volume progression.</p>
              </div>
              <button
                onClick={() => setWorkoutModalOpen(true)}
                className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Log Workout</span>
              </button>
            </div>

            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.map(workout => (
                  <div key={workout.id} className="bg-surface-container-low rounded-xl p-4 border border-hairline-border space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-hairline-border">
                      <div className="flex items-center gap-2.5">
                        <span className="font-headline-sm text-headline-sm text-text-primary">
                          {workout.workoutType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container font-code text-label-sm text-text-secondary">
                          {workout.duration} mins
                        </span>
                        <span className="font-code text-label-sm text-text-muted tabular-nums">
                          {workout.date}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="p-1 text-text-muted hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>

                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {workout.exercises.map((ex: any, idx: number) => (
                          <div key={idx} className="bg-surface-card p-3 rounded-lg border border-hairline-border space-y-1.5">
                            <span className="font-label-md text-label-md font-semibold text-text-primary block truncate">
                              {ex.name}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ex.sets?.map((s: any, sIdx: number) => (
                                <span key={sIdx} className="font-code text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-text-secondary tabular-nums">
                                  {s.weight}kg × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {workout.notes && (
                      <p className="font-body-sm text-body-sm text-text-secondary italic">
                        "{workout.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-text-muted font-body-sm">
                No workouts logged yet.
              </div>
            )}
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-hairline-border">
              <span className="material-symbols-outlined text-[18px] text-secondary">military_tech</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Personal Records (PRs)</h2>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted">
              Heaviest sets tracked across all logged compound and isolation exercises.
            </p>

            {Object.keys(personalRecords).length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {Object.entries(personalRecords).map(([name, data]) => (
                  <div key={name} className="bg-surface-container-low p-4 rounded-xl border border-hairline-border space-y-1">
                    <span className="font-label-md text-label-md font-semibold text-text-primary block truncate">
                      {name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-lg text-headline-lg text-secondary tabular-nums">
                        {data.weight} kg
                      </span>
                      <span className="font-code text-label-sm text-text-muted tabular-nums">
                        × {data.reps} reps
                      </span>
                    </div>
                    <span className="font-code text-[11px] text-text-muted block">
                      Achieved on {data.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-text-muted font-body-sm">
                Log workouts with exercises and weights to automatically extract personal records.
              </div>
            )}
          </section>
        )}

      </div>

      {/* Weight Modal */}
      {weightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-surface-card border border-hairline-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Record Morning Weight</h3>
              <button onClick={() => setWeightModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveWeight} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 73.5"
                  value={inputWeight}
                  onChange={e => setInputWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary font-headline-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  value={inputWeightDate}
                  onChange={e => setInputWeightDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Fasted morning, post-run"
                  value={inputWeightNotes}
                  onChange={e => setInputWeightNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWeightModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workout Modal */}
      {workoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-surface-card border border-hairline-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Log Training Workout</h3>
              <button onClick={() => setWorkoutModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveWorkout} className="space-y-4 font-body-sm text-body-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={e => setWorkoutType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                  >
                    {['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Cardio', 'Full Body', 'Other'].map(w => (
                      <option key={w} value={w} className="bg-surface-card">{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={workoutDuration}
                    onChange={e => setWorkoutDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={e => setWorkoutDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Exercise Highlights</label>
                {exerciseItems.map((ex, idx) => (
                  <div key={idx} className="bg-surface-container-low p-3 rounded-lg border border-hairline-border mb-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Barbell Squat)"
                      value={ex.name}
                      onChange={e => {
                        const copy = [...exerciseItems];
                        copy[idx].name = e.target.value;
                        setExerciseItems(copy);
                      }}
                      className="w-full px-2.5 py-1 bg-surface-container border border-hairline-border rounded text-on-surface font-semibold text-sm outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-sm text-[11px] text-text-muted">Sets:</span>
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1 font-code text-xs">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={e => {
                              const copy = [...exerciseItems];
                              copy[idx].sets[sIdx].weight = parseFloat(e.target.value) || 0;
                              setExerciseItems(copy);
                            }}
                            className="w-14 px-1 py-0.5 bg-surface-container border border-hairline-border rounded text-center text-on-surface"
                            placeholder="kg"
                          />
                          <span className="text-text-muted">kg ×</span>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={e => {
                              const copy = [...exerciseItems];
                              copy[idx].sets[sIdx].reps = parseInt(e.target.value) || 0;
                              setExerciseItems(copy);
                            }}
                            className="w-12 px-1 py-0.5 bg-surface-container border border-hairline-border rounded text-center text-on-surface"
                            placeholder="reps"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExerciseItems([...exerciseItems, { name: '', sets: [{ reps: 10, weight: 50 }] }])}
                  className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add another exercise</span>
                </button>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Felt strong, new rep PR on second set"
                  value={workoutNotes}
                  onChange={e => setWorkoutNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkoutModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Log Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

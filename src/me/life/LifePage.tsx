import { useState, useEffect, useMemo, useRef } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function LifePage() {
  const { refreshKey, onRefresh } = useOutletContext<OutletContextType>();

  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Task filter tab
  const [taskTab, setTaskTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [rapidTaskInput, setRapidTaskInput] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Journal compose state
  const [journalText, setJournalText] = useState('');
  const [journalMood, setJournalMood] = useState('Productive');
  const [journalTag, setJournalTag] = useState('Reflections');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const journalInputRef = useRef<HTMLTextAreaElement>(null);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tPriority, setTPriority] = useState('Medium');
  const [tDueDate, setTDueDate] = useState('Today');
  const [tCategory, setTCategory] = useState('Personal');

  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [hName, setHName] = useState('');
  const [hCategory, setHCategory] = useState('Study');
  const [hTargetDays, setHTargetDays] = useState(7);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, hRes, jRes] = await Promise.all([
        meApi.getTasks(),
        meApi.getHabits(),
        meApi.getJournalEntries()
      ]);
      setTasks(tRes || []);
      setHabits(hRes || []);
      setJournalEntries((jRes || []).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()));
    } catch (err: any) {
      toast.error('Failed to load life telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Tasks Handling
  const handleToggleTask = async (task: any) => {
    const taskId = task._id || task.id;
    const isCompleted = task.completed || task.status === 'Completed';
    try {
      await meApi.updateTask(taskId, {
        completed: !isCompleted,
        status: isCompleted ? 'Todo' : 'Completed'
      });
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await meApi.deleteTask(id);
      toast.success('Task removed');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateRapidTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && rapidTaskInput.trim()) {
      e.preventDefault();
      try {
        await meApi.createTask({
          title: rapidTaskInput.trim(),
          priority: 'Medium',
          dueDate: new Date().toISOString().split('T')[0],
          category: 'Personal'
        });
        toast.success('Task added');
        setRapidTaskInput('');
        loadData();
        onRefresh();
      } catch (err: any) {
        toast.error('Failed to create task');
      }
    }
  };

  const handleSaveTaskModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    try {
      await meApi.createTask({
        title: tTitle.trim(),
        priority: tPriority,
        dueDate: tDueDate || 'Today',
        category: tCategory || 'Personal'
      });
      toast.success('Task created');
      setTaskModalOpen(false);
      setTTitle('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create task');
    }
  };

  // Habits Handling
  const handleToggleHabitDay = async (habit: any) => {
    const today = new Date().toISOString().split('T')[0];
    const compDates = new Set((habit.completions || []).filter((c: any) => c.completed).map((c: any) => c.date));
    const wasCompletedToday = compDates.has(today);

    try {
      await meApi.logHabit(habit._id || habit.id, {
        date: today,
        completed: !wasCompletedToday
      });
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to log habit');
    }
  };

  const handleDeleteHabit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await meApi.deleteHabit(id);
      toast.success('Habit removed');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete habit');
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hName.trim()) return;
    try {
      await meApi.createHabit({
        name: hName.trim(),
        category: hCategory,
        frequency: 'Daily',
        targetDaysPerWeek: hTargetDays
      });
      toast.success('Habit created');
      setHabitModalOpen(false);
      setHName('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create habit');
    }
  };

  // Journal Handling
  const handleRecordJournal = async () => {
    if (!journalText.trim()) return;
    try {
      await meApi.createJournalEntry({
        title: journalText.split('\n')[0].slice(0, 50) || 'Spontaneous Reflection',
        content: journalText,
        mood: journalMood,
        tags: [journalTag],
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Reflection recorded');
      setJournalText('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to record reflection');
    }
  };

  const handleDeleteJournal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await meApi.deleteJournalEntry(id);
      toast.success('Reflection deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete journal entry');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const past7Days = useMemo(() => {
    const list = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      list.push({
        dateStr: str,
        dayLetter: days[d.getDay()][0],
        isToday: str === todayStr
      });
    }
    return list;
  }, [todayStr]);

  const pendingTasksCount = tasks.filter(t => !t.completed && t.status !== 'Completed').length;
  const filteredTasks = tasks.filter(t => {
    const isDone = t.completed || t.status === 'Completed';
    if (taskTab === 'completed') return isDone;
    if (isDone) return false;
    if (taskTab === 'today') return t.dueDate === todayStr || t.dueDate === 'Today' || !t.dueDate;
    if (taskTab === 'upcoming') return t.dueDate && t.dueDate > todayStr;
    if (taskTab === 'overdue') return t.dueDate && t.dueDate < todayStr && t.dueDate !== 'Today';
    return true;
  });

  const totalHabitSlots = habits.length * 7;
  const totalCompletionsIn7 = habits.reduce((acc, h) => {
    const compDates = new Set((h.completions || []).filter((c: any) => c.completed).map((c: any) => c.date));
    const hits = past7Days.filter(d => compDates.has(d.dateStr)).length;
    return acc + hits;
  }, 0);
  const overallConsistencyPct = totalHabitSlots > 0 ? Math.round((totalCompletionsIn7 / totalHabitSlots) * 100) : 0;

  const filteredJournalEntries = journalEntries.filter(entry => {
    if (!journalSearchQuery.trim()) return true;
    const q = journalSearchQuery.toLowerCase();
    const inTitle = (entry.title || '').toLowerCase().includes(q);
    const inContent = (entry.content || '').toLowerCase().includes(q);
    const inTags = (entry.tags || []).some((t: string) => t.toLowerCase().includes(q));
    const inMood = (entry.mood || '').toLowerCase().includes(q);
    return inTitle || inContent || inTags || inMood;
  });

  const featuredJournal = filteredJournalEntries[0] || null;
  const archivalEntries = filteredJournalEntries.slice(1, 5);

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest text-on-surface min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        
        {/* Header / Command Greeting */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Life, Habits & Mind
            </h1>
            <p className="font-body-md text-text-secondary max-w-xl">
              Daily execution, consistent streaks, and distraction-free reflections.
            </p>
          </div>

          {/* Quick Action Pill Dock */}
          <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-full bg-surface-card shadow-sm self-start lg:self-auto border border-hairline-border">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">check_circle</span>
              <span>New Task</span>
            </button>
            <button
              onClick={() => setHabitModalOpen(true)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">bolt</span>
              <span>Log Habit</span>
            </button>
            <button
              onClick={() => {
                if (journalInputRef.current) {
                  journalInputRef.current.focus();
                  journalInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md shadow-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Write Journal</span>
            </button>
          </div>
        </header>

        {/* 3-Column Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: TASKS & PRIORITIES (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">checklist</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Tasks & Priorities</h2>
              </div>
              <span className="font-code text-label-sm text-text-muted px-2 py-0.5 rounded-full bg-surface-container">
                {pendingTasksCount} pending
              </span>
            </div>

            {/* Filter Segmented Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-surface-container-low gap-1 border border-hairline-border">
              {(['today', 'upcoming', 'overdue', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTaskTab(tab)}
                  className={`flex-1 py-1 px-2 rounded-md text-center font-label-sm text-label-sm capitalize transition-colors cursor-pointer ${
                    taskTab === tab
                      ? 'bg-surface-container text-primary font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  type="button"
                >
                  {tab === 'completed' ? 'Done' : tab}
                </button>
              ))}
            </div>

            {/* Task List Stack */}
            <div className="space-y-2 pt-1 min-h-[160px] max-h-[380px] overflow-y-auto pr-0.5">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => {
                  const isDone = task.completed || task.status === 'Completed';
                  const priority = task.priority || 'Medium';

                  return (
                    <div
                      key={task._id || task.id}
                      className="group p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-2.5 border border-hairline-border"
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer border ${
                          isDone 
                            ? 'bg-primary border-primary text-on-primary' 
                            : 'border-outline hover:border-primary'
                        }`}
                        type="button"
                      >
                        {isDone && <span className="material-symbols-outlined text-[12px]">check</span>}
                      </button>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={`font-body-sm text-body-sm leading-snug transition-colors line-clamp-2 ${
                          isDone ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}>
                          {task.title || task.text}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap font-label-sm text-label-sm">
                          <span className={`px-2 py-0.2 rounded-full font-medium ${
                            priority === 'Critical'
                              ? 'bg-error-container text-on-error-container'
                              : priority === 'High'
                              ? 'bg-surface-container text-secondary'
                              : 'bg-surface-container text-text-muted'
                          }`}>
                            {priority}
                          </span>
                          <span className="text-text-muted font-code">#{task.category || 'Personal'}</span>
                          <span className="text-text-muted">{task.dueDate || 'Today'}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteTask(task._id || task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-opacity cursor-pointer shrink-0"
                        title="Delete task"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-text-muted font-body-sm border border-dashed border-hairline-border rounded-lg">
                  {taskTab === 'completed' ? 'No completed tasks yet' : `No ${taskTab} tasks`}
                </div>
              )}
            </div>

            {/* Quick Add Bottom Input */}
            <div className="mt-auto pt-2 border-t border-hairline-border">
              <div className="relative flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 border border-hairline-border focus-within:border-primary">
                <span className="material-symbols-outlined text-[16px] text-text-muted mr-2">add</span>
                <input
                  ref={taskInputRef}
                  value={rapidTaskInput}
                  onChange={e => setRapidTaskInput(e.target.value)}
                  onKeyDown={handleCreateRapidTask}
                  className="w-full bg-transparent text-on-surface placeholder:text-text-muted font-body-sm text-body-sm outline-none"
                  placeholder="Add a task... [Press Enter]"
                  type="text"
                />
                <kbd className="font-code text-label-sm text-text-muted bg-surface-container px-1.5 py-0.5 rounded">↵</kbd>
              </div>
            </div>
          </section>

          {/* COLUMN 2: HABIT STREAKS (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">bolt</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Habit Streaks</h2>
              </div>
              <span className="font-code text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full font-medium">
                {overallConsistencyPct}% consistency
              </span>
            </div>

            {/* 7-Day Header Marker */}
            <div className="flex items-center justify-between text-text-muted font-code text-label-sm px-2">
              <span>Habit</span>
              <div className="flex items-center gap-2">
                {past7Days.map((d) => (
                  <span 
                    key={d.dateStr} 
                    className={`w-4 text-center ${d.isToday ? 'text-secondary font-bold' : ''}`}
                  >
                    {d.dayLetter}
                  </span>
                ))}
              </div>
            </div>

            {/* Habits Matrix Rows */}
            <div className="space-y-2.5 min-h-[160px] max-h-[380px] overflow-y-auto pr-0.5">
              {habits.length > 0 ? (
                habits.map((habit: any) => {
                  const compMap = new Set((habit.completions || []).filter((c: any) => c.completed).map((c: any) => c.date));
                  const streak = habit.streak || 0;
                  const targetDays = habit.targetDaysPerWeek || 7;
                  
                  const hitsIn7 = past7Days.filter(d => compMap.has(d.dateStr)).length;
                  const progressPct = Math.round((hitsIn7 / 7) * 100);
                  const isTodayDone = compMap.has(todayStr);

                  return (
                    <div key={habit._id || habit.id} className="group p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-2 border border-hairline-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-label-md text-label-md font-semibold text-text-primary leading-tight">{habit.name}</p>
                          <span className="font-label-sm text-label-sm text-text-muted">
                            {hitsIn7}/{targetDays} days this week
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-code text-label-sm font-semibold text-secondary tabular-nums">
                            {streak}d {streak >= 3 && '🔥'}
                          </span>
                          <button
                            onClick={(e) => handleDeleteHabit(habit._id || habit.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-error transition-opacity cursor-pointer"
                            title="Delete habit"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar & 7-Day Dots */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="w-24 h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-secondary transition-all duration-300" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {past7Days.slice(0, 6).map((d) => {
                            const completed = compMap.has(d.dateStr);
                            return completed ? (
                              <span key={d.dateStr} className="w-4 h-4 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span key={d.dateStr} className="w-4 h-4 rounded-full bg-surface-container"></span>
                            );
                          })}
                          {/* 7th dot: Today interactive toggle */}
                          <button
                            onClick={() => handleToggleHabitDay(habit)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all text-[9px] font-bold ${
                              isTodayDone
                                ? 'bg-secondary text-on-secondary'
                                : 'bg-surface-container hover:bg-surface-container-high border border-outline'
                            }`}
                            title={isTodayDone ? 'Completed today' : 'Click to complete for today'}
                            type="button"
                          >
                            {isTodayDone && '✓'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-text-muted font-body-sm border border-dashed border-hairline-border rounded-lg space-y-2">
                  <p>No habits established yet</p>
                  <button 
                    onClick={() => setHabitModalOpen(true)}
                    className="text-secondary hover:underline font-label-sm cursor-pointer"
                  >
                    + Create your first habit
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 3: PERSONAL JOURNAL & REFLECTIONS (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">edit_note</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Journal & Mind</h2>
              </div>
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
                title="Search reflections"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
              </button>
            </div>

            {searchOpen && (
              <div className="pt-1">
                <input
                  value={journalSearchQuery}
                  onChange={e => setJournalSearchQuery(e.target.value)}
                  placeholder="Filter reflections..."
                  className="w-full bg-surface-container-low px-3 py-1.5 font-body-sm text-body-sm text-on-surface rounded-lg border border-hairline-border outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            )}

            {/* Featured / Latest Reflection Card */}
            {featuredJournal ? (
              <div className="p-4 rounded-lg bg-surface-container-low space-y-2 relative border border-hairline-border group">
                <div className="flex items-center justify-between">
                  <span className="font-code text-label-sm text-text-muted">
                    {featuredJournal.date || 'Today'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-secondary font-label-sm text-label-sm">
                      {featuredJournal.mood || 'Reflection'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteJournal(featuredJournal._id || featuredJournal.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-error transition-opacity cursor-pointer"
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary leading-snug">
                  {featuredJournal.title || 'Untitled Reflection'}
                </h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed line-clamp-3">
                  {(featuredJournal.content || '').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted font-body-sm border border-dashed border-hairline-border rounded-lg">
                No reflections logged yet.
              </div>
            )}

            {/* Archival Entries */}
            {archivalEntries.length > 0 && (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                {archivalEntries.map((entry: any) => (
                  <div 
                    key={entry._id || entry.id}
                    className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group border border-hairline-border flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-label-md text-label-md text-text-primary truncate">
                          {entry.title}
                        </h4>
                        <span className="font-code text-[11px] text-text-muted shrink-0 ml-2">
                          {entry.date}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteJournal(entry._id || entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-opacity cursor-pointer"
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Composer Box */}
            <div className="mt-auto pt-2 border-t border-hairline-border space-y-2">
              <textarea
                ref={journalInputRef}
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                className="w-full bg-surface-container-low p-3 rounded-lg border border-hairline-border text-on-surface placeholder:text-text-muted font-body-sm text-body-sm outline-none focus:border-primary resize-none"
                placeholder="Capture a reflection or thought..."
                rows={2}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-muted font-label-sm text-label-sm">
                  <select
                    value={journalTag}
                    onChange={e => setJournalTag(e.target.value)}
                    className="px-2 py-0.5 rounded-full bg-surface-container font-code text-xs text-text-secondary outline-none border border-hairline-border cursor-pointer"
                  >
                    <option value="Reflections">#Reflections</option>
                    <option value="Ideas">#Ideas</option>
                    <option value="Wins">#Wins</option>
                    <option value="Gratitude">#Gratitude</option>
                  </select>
                  <select
                    value={journalMood}
                    onChange={e => setJournalMood(e.target.value)}
                    className="px-2 py-0.5 rounded-full bg-surface-container font-code text-xs text-text-secondary outline-none border border-hairline-border cursor-pointer"
                  >
                    <option value="Productive">⚡ Productive</option>
                    <option value="Focused">🎯 Focused</option>
                    <option value="Energized">🔥 Energized</option>
                    <option value="Calm">🌿 Calm</option>
                    <option value="Tired">💤 Tired</option>
                  </select>
                </div>
                <button
                  onClick={handleRecordJournal}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary text-text-primary font-label-md text-label-md transition-colors cursor-pointer font-medium"
                  type="button"
                >
                  Record
                </button>
              </div>
            </div>

          </section>

        </div>

      </div>

      {/* Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Create New Task</h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveTaskModal} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Task Title *</label>
                <input
                  value={tTitle}
                  onChange={e => setTTitle(e.target.value)}
                  placeholder="e.g. Design architectural RFC"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Priority</label>
                  <select
                    value={tPriority}
                    onChange={e => setTPriority(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                  <input
                    value={tCategory}
                    onChange={e => setTCategory(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Due Date</label>
                <input
                  value={tDueDate}
                  onChange={e => setTDueDate(e.target.value)}
                  placeholder="e.g. Today, Tomorrow, YYYY-MM-DD"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {habitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">New Habit</h3>
              <button onClick={() => setHabitModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveHabit} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Habit Name *</label>
                <input
                  value={hName}
                  onChange={e => setHName(e.target.value)}
                  placeholder="e.g. Morning Sunlight & Reading"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                  <select
                    value={hCategory}
                    onChange={e => setHCategory(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  >
                    <option value="Study">Study</option>
                    <option value="Gym">Gym</option>
                    <option value="Reading">Reading</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Coding">Coding</option>
                    <option value="Journaling">Journaling</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Days / Wk</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={hTargetDays}
                    onChange={e => setHTargetDays(parseInt(e.target.value) || 7)}
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHabitModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSimpleStorage, STORAGE_KEYS } from '../utils/simpleStorage';
import { useNotes } from '../contexts/NotesContext';
import { useAuth } from '../contexts/AuthContext';
import { SpotlightCard } from '../components/ui/spotlight-card';
import { AnimatedTabs } from '../components/ui/animated-tabs';
import {
  FileText,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowRight,
  Dumbbell,
  BookOpen,
  Cloud,
  DollarSign,
  Flame
} from 'lucide-react';

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  category?: string;
  createdAt?: number;
}

type Props = {
  onOpen?: (id: string) => void;
  onNew?: () => void;
};

export default function Home({ onOpen, onNew }: Props) {
  const navigate = useNavigate();
  const { notes, setNotes, syncStatus } = useNotes();
  const { username } = useAuth();
  const displayName = username ? (username.charAt(0).toUpperCase() + username.slice(1)) : 'there';
  const [tasks, setTasks] = useSimpleStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  
  // Quick Task input
  const [taskInput, setTaskInput] = useState('');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Quick Note Capture input
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTag, setQuickTag] = useState('');
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);

  // Time & Greeting
  const [greeting, setGreeting] = useState('Good morning');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    setCurrentDateFormatted(now.toLocaleDateString('en-US', options));
  }, []);

  // Task actions
  const addTask = (text: string) => {
    if (!text.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      category: taskCategory,
      createdAt: Date.now()
    };
    setTasks([newTask, ...tasks]);
    setTaskInput('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask(taskInput);
    }
  };

  // Quick Note Save
  const handleSaveQuickNote = () => {
    if (!quickTitle.trim()) return;
    const now = Date.now();
    const newNote = {
      id: crypto.randomUUID(),
      title: quickTitle.trim(),
      content: `<p>${quickTitle.trim()}</p>`,
      tags: quickTag.trim() ? [quickTag.trim().replace(/^#/, '')] : ['Draft'],
      createdAt: now,
      updatedAt: now
    };
    setNotes([newNote, ...notes]);
    setQuickTitle('');
    setQuickTag('');
    setIsQuickExpanded(false);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalWords = useMemo(() => {
    return notes.reduce((acc, note) => {
      const clean = (note.content || '').replace(/<[^>]*>/g, ' ').trim();
      const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
      return acc + words;
    }, 0);
  }, [notes]);

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const recentNotes = notes.slice(0, 5);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-surface text-on-surface antialiased">
      {/* Expansive Container filling screen width naturally */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 py-6 md:py-8 space-y-8">
        
        {/* Top Header & Overview Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border-hairline">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text-primary">
              {greeting}, {displayName}.
            </h1>
            <p className="text-sm text-text-secondary mt-1 font-normal">
              You have <span className="text-text-primary font-medium">{pendingTasks} active tasks</span> and <span className="text-text-primary font-medium">{notes.length} documents</span> in your personal vault.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Weekly Task Progress Ring */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-card border border-border-hairline shadow-xs">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="3" className="text-surface-container-high" fill="none" />
                  <circle 
                    cx="18" cy="18" r="15" 
                    stroke="currentColor" strokeWidth="3" 
                    className="text-primary transition-all duration-500" 
                    fill="none" 
                    strokeDasharray={94.2} 
                    strokeDashoffset={94.2 - (94.2 * progressPercent) / 100} 
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-semibold text-primary tabular-nums">
                  {progressPercent}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-primary">Task Progress</span>
                <span className="text-[11px] text-text-tertiary tabular-nums">
                  {completedTasks} of {totalTasks} finished
                </span>
              </div>
            </div>

            {/* Primary Action: New Note */}
            <button
              onClick={() => onNew ? onNew() : navigate('/notes/edit')}
              className="flex items-center gap-2 px-4 py-2 bg-text-primary hover:opacity-90 active:scale-[0.98] text-surface rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>New Note</span>
            </button>

            {/* Quick Link: Personal OS */}
            <Link
              to="/me"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card border border-border-hairline text-text-primary hover:bg-surface-container hover:text-white transition-colors text-xs font-medium"
            >
              <span>Personal OS</span>
              <ArrowRight size={13} className="text-text-tertiary" />
            </Link>
          </div>
        </div>

        {/* 4 Stat Metric Cards (Full screen breadth with 21st.dev SpotlightCard) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SpotlightCard className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-tertiary mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Notes & Docs</span>
              <FileText size={16} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight tabular-nums">
                {notes.length}
              </div>
              <div className="text-xs text-text-tertiary mt-1 font-normal">
                {totalWords.toLocaleString()} total words indexed
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-tertiary mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Action Items</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight tabular-nums">
                {pendingTasks}
              </div>
              <div className="text-xs text-text-tertiary mt-1 font-normal">
                {completedTasks} completed this week
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-tertiary mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Focus Routine</span>
              <Flame size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight tabular-nums">
                {progressPercent}%
              </div>
              <div className="text-xs text-text-tertiary mt-1 font-normal">
                Weekly consistency score
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-tertiary mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Storage & Cloud</span>
              <Cloud size={16} className={syncStatus === 'error' ? 'text-rose-400' : 'text-emerald-400'} />
            </div>
            <div>
              <div className="text-base sm:text-lg font-semibold text-text-primary tracking-tight flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
                {syncStatus === 'error' ? 'Local Only' : 'Cloud Synced'}
              </div>
              <div className="text-xs text-text-tertiary mt-1 font-normal">
                All changes saved locally
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Main Content Layout: 8 cols left, 4 cols right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Quick Capture + Recent Notes (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Note Capture Card */}
            <SpotlightCard className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
                  <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Quick Capture
                  </span>
                </div>
                <span className="text-[11px] text-text-tertiary font-normal">
                  Press Enter to create note
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Capture an idea, meeting takeaway, or quick thought..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onFocus={() => setIsQuickExpanded(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveQuickNote();
                    }
                  }}
                  className="flex-1 bg-surface-container-high/60 border border-border-hairline rounded-xl px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  disabled={!quickTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-text-primary text-surface hover:opacity-90 disabled:opacity-30 text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  Save Note
                </button>
              </div>

              {isQuickExpanded && (
                <div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-text-tertiary animate-fade-in">
                  <span className="text-[11px] font-medium">Quick Tag:</span>
                  {['Idea', 'Work', 'Personal', 'Meeting', 'Learning'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuickTag(quickTag === tag ? '' : tag)}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                        quickTag === tag 
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
                          : 'bg-surface-container border-border-hairline hover:text-text-primary'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </SpotlightCard>

            {/* Recent Notes Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                  Recent Notes
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-card border border-border-hairline text-text-tertiary text-xs font-medium tabular-nums">
                  {notes.length}
                </span>
              </div>
              <Link 
                to="/notes" 
                className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
              >
                <span>View All Notes</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Recent Notes Grid (Balanced & Spacious) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentNotes.map((note) => {
                const cleanContent = (note.content || '').replace(/<[^>]*>/g, ' ').trim();
                const wordCount = cleanContent ? cleanContent.split(/\s+/).filter(Boolean).length : 0;
                const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <SpotlightCard
                    key={note.id}
                    onClick={() => onOpen && onOpen(note.id)}
                    className="group cursor-pointer flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15 text-[11px] font-medium">
                          {note.tags && note.tags.length > 0 ? note.tags[0] : 'Note'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-tertiary font-normal">
                            {formattedDate}
                          </span>
                          <button
                            onClick={(e) => handleDeleteNote(e, note.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-rose-400 transition-opacity cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
                        {note.title?.trim() || 'Untitled Document'}
                      </h3>

                      <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed font-normal">
                        {cleanContent || 'No written content yet...'}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border-hairline/40 text-[11px] text-text-tertiary">
                      <span className="tabular-nums font-normal">{wordCount} words</span>
                      <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-text-secondary font-medium">
                        Open <ArrowRight size={11} />
                      </span>
                    </div>
                  </SpotlightCard>
                );
              })}

              {/* Always present "+ New Document" card to balance out grid space */}
              <button
                type="button"
                onClick={() => onNew ? onNew() : navigate('/notes/edit')}
                className="p-5 rounded-2xl border border-dashed border-border-hairline hover:border-zinc-600 bg-surface-card/40 hover:bg-surface-card transition-all flex flex-col items-center justify-center text-center min-h-[160px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-border-hairline flex items-center justify-center text-text-tertiary group-hover:text-text-primary group-hover:scale-105 transition-all mb-2">
                  <Plus size={18} />
                </div>
                <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  Create New Document
                </span>
                <span className="text-xs text-text-tertiary mt-1">
                  Rich text, markdown, code blocks & diagrams
                </span>
              </button>
            </div>

            {/* Quick Templates Strip */}
            <div className="p-4 rounded-2xl bg-surface-card/60 border border-border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-medium text-text-secondary">
                Quick Document Templates:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Daily Journal', tag: 'Journal' },
                  { label: 'Meeting Notes', tag: 'Meeting' },
                  { label: 'Weekly Review', tag: 'Review' },
                  { label: 'Brainstorming', tag: 'Ideas' }
                ].map(tmpl => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => {
                      const now = Date.now();
                      const newDoc = {
                        id: crypto.randomUUID(),
                        title: `${tmpl.label} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                        content: `<h2>${tmpl.label}</h2><p>Start writing here...</p>`,
                        tags: [tmpl.tag],
                        createdAt: now,
                        updatedAt: now
                      };
                      setNotes([newDoc, ...notes]);
                      if (onOpen) onOpen(newDoc.id);
                      else navigate('/notes/edit');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-border-hairline text-text-primary hover:text-white hover:bg-surface-container text-xs font-medium transition-colors"
                  >
                    + {tmpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Daily Tasks & Personal OS Snapshots (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Daily Tasks Card */}
            <SpotlightCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">task_alt</span>
                  <h3 className="text-sm font-semibold text-text-primary">Daily Tasks</h3>
                </div>
                <span className="text-xs font-medium text-text-tertiary tabular-nums">
                  {pendingTasks} pending
                </span>
              </div>

              {/* 21st.dev Animated Task Filter Tabs */}
              <AnimatedTabs
                tabs={[
                  { id: 'all', label: 'All', badge: totalTasks },
                  { id: 'pending', label: 'Pending', badge: pendingTasks },
                  { id: 'completed', label: 'Done', badge: completedTasks }
                ]}
                activeTab={taskFilter}
                onChange={(tabId) => setTaskFilter(tabId as 'all' | 'pending' | 'completed')}
                layoutId="home-task-filter-pill"
                size="sm"
                className="w-full justify-between"
              />

              {/* Tasks List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high border border-border-hairline/60 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-text-tertiary shrink-0 hover:text-primary transition-colors" />
                        )}
                        <span className={`text-xs truncate transition-colors ${
                          task.completed 
                            ? 'line-through text-text-tertiary' 
                            : 'text-text-primary'
                        }`}>
                          {task.text}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {task.category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-card text-text-tertiary border border-border-hairline">
                            {task.category}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-rose-400 transition-opacity cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-text-tertiary">
                    {taskFilter === 'completed' ? 'No completed tasks yet.' : 'No active tasks. Add one below!'}
                  </div>
                )}
              </div>

              {/* Inline Add Task Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-border-hairline/60">
                <input
                  type="text"
                  placeholder="+ Add new task... [Press Enter]"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-tertiary outline-none py-1"
                />
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-text-secondary border border-border-hairline outline-none cursor-pointer"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                </select>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-text-tertiary border border-border-hairline">
                  ↵
                </kbd>
              </div>
            </SpotlightCard>

            {/* Personal OS Quick Glances Hub */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Personal OS Hub</h3>
                <Link to="/me" className="text-xs text-primary hover:underline font-medium">
                  Open Overview →
                </Link>
              </div>

              <div className="space-y-2">
                <Link
                  to="/me/finance"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high border border-border-hairline transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                        Finance & Cashflow
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        Daily spends, budgets & ledger
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/me/health"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high border border-border-hairline transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <Dumbbell size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                        Health & Workouts
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        Morning weights, gym sets & PRs
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/me/learning"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high border border-border-hairline transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                        Learning & Capital
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        Deep study sessions & reading
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </SpotlightCard>



          </div>
        </div>
      </div>
    </div>
  );
}
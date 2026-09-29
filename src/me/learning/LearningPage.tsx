import React, { useState, useEffect } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function LearningPage() {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { openQuickAction, refreshKey, onRefresh } = useOutletContext<OutletContextType>();

  const [activeTab, setActiveTab] = useState<'study' | 'courses' | 'projects'>(
    (urlTab === 'courses' || urlTab === 'projects' || urlTab === 'study') ? urlTab : 'study'
  );

  useEffect(() => {
    if (urlTab === 'courses' || urlTab === 'projects' || urlTab === 'study') {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (t: 'study' | 'courses' | 'projects') => {
    setActiveTab(t);
    navigate(`/me/learning/${t}`, { replace: true });
  };

  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Filters
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  // Course Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cProvider, setCProvider] = useState('');
  const [cStatus, setCStatus] = useState('In Progress');
  const [cTargetDate, setCTargetDate] = useState('');
  const [cProgress, setCProgress] = useState('0');
  const [cNotes, setCNotes] = useState('');

  // Project Modal
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pStatus, setPStatus] = useState('In Progress');
  const [pProgress, setPProgress] = useState('10');
  const [pTechStack, setPTechStack] = useState('');
  const [pRepoUrl, setPRepoUrl] = useState('');
  const [pDeployUrl, setPDeployUrl] = useState('');
  const [pDeadline, setPDeadline] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, pRes] = await Promise.all([
        meApi.getStudySessions(),
        meApi.getCourses(),
        meApi.getProjects()
      ]);
      setSessions((sRes || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCourses(cRes || []);
      setProjects(pRes || []);
    } catch (err: any) {
      toast.error('Failed to load learning telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleDeleteSession = async (id: string) => {
    try {
      await meApi.deleteStudySession(id);
      toast.success('Study session deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete study session');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await meApi.deleteCourse(id);
      toast.success('Course deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await meApi.deleteProject(id);
      toast.success('Project deleted');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete project');
    }
  };

  const handleUpdateCourseProgress = async (id: string, delta: number) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const newProg = Math.min(100, Math.max(0, (course.progress || 0) + delta));
    try {
      await meApi.updateCourse(id, { progress: newProg });
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update progress');
    }
  };

  const handleUpdateProjectProgress = async (id: string, delta: number) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    const newProg = Math.min(100, Math.max(0, (proj.progress || 0) + delta));
    try {
      await meApi.updateProject(id, { progress: newProg });
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update progress');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    try {
      await meApi.createCourse({
        name: cName,
        provider: cProvider,
        status: cStatus,
        progress: parseInt(cProgress) || 0,
        targetCompletion: cTargetDate || undefined,
        notes: cNotes
      });
      toast.success(`Course ${cName} created`);
      setCourseModalOpen(false);
      setCName('');
      setCProvider('');
      setCProgress('0');
      setCNotes('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create course');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) return;
    try {
      const stack = pTechStack.split(',').map(s => s.trim()).filter(Boolean);
      await meApi.createProject({
        name: pName,
        description: pDescription,
        status: pStatus,
        progress: parseInt(pProgress) || 0,
        techStack: stack,
        repoUrl: pRepoUrl,
        deployUrl: pDeployUrl,
        deadline: pDeadline || undefined
      });
      toast.success(`Project ${pName} created`);
      setProjModalOpen(false);
      setPName('');
      setPDescription('');
      setPTechStack('');
      setPRepoUrl('');
      setPDeployUrl('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create project');
    }
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isToday = (d: string) => {
    const dt = new Date(d);
    return dt.toDateString() === now.toDateString();
  };

  const todayMinutes = sessions
    .filter(s => isToday(s.date))
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const weekMinutes = sessions
    .filter(s => new Date(s.date) >= startOfWeek)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const monthMinutes = sessions
    .filter(s => new Date(s.date) >= startOfMonth)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const subjectTotals: Record<string, number> = {};
  sessions.forEach(s => {
    const sub = s.subject || 'General';
    subjectTotals[sub] = (subjectTotals[sub] || 0) + (Number(s.duration) || 0);
  });
  const sortedSubjects = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  const activeCoursesCount = courses.filter(c => c.status === 'In Progress').length;
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;

  const filteredCourses = courses.filter(c => {
    if (courseStatusFilter === 'all') return true;
    return c.status === courseStatusFilter;
  });

  const filteredProjects = projects.filter(p => {
    if (projectStatusFilter === 'all') return true;
    return p.status === projectStatusFilter;
  });

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest text-on-surface min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        
        {/* Header / Command Greeting */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Learning & Intellectual Capital
            </h1>
            <p className="font-body-md text-text-secondary max-w-xl">
              Study volume tracking, course curricula completion, and technical builds.
            </p>
          </div>

          {/* Quick Action Pill Dock */}
          <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-full bg-surface-card shadow-sm self-start lg:self-auto border border-hairline-border">
            {(['study', 'courses', 'projects'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer capitalize ${
                  activeTab === tab 
                    ? 'bg-surface-container text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
                }`}
              >
                {tab === 'study' ? 'Study Hours' : tab === 'courses' ? 'Curricula' : 'Projects'}
              </button>
            ))}
            <button
              onClick={() => openQuickAction('study')}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md shadow-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Log Study</span>
            </button>
          </div>
        </header>

        {/* 4 Metric KPI Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Intellectual Performance</span>
            <span className="font-code text-body-sm text-text-muted">Deep Focus</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Today's Deep Work</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">timer</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {(todayMinutes / 60).toFixed(1)}h
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">{todayMinutes} minutes total</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((todayMinutes / 180) * 100))}%` }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Weekly Study Volume</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">date_range</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {(weekMinutes / 60).toFixed(1)}h
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">{(monthMinutes / 60).toFixed(1)}h this month</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((weekMinutes / 600) * 100))}%` }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Active Courses</span>
                <span className="material-symbols-outlined text-[18px] text-secondary">menu_book</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {activeCoursesCount}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">of {courses.length} enrolled</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${courses.length > 0 ? (activeCoursesCount / courses.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Active Projects</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">code</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {activeProjectsCount}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary mt-0.5">in flight</div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${projects.length > 0 ? (activeProjectsCount / projects.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'study' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Subject Breakdown (4 cols) */}
            <div className="lg:col-span-4 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-text-muted">pie_chart</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Subject Breakdown</h2>
                </div>
              </div>
              {sortedSubjects.length === 0 ? (
                <p className="font-body-sm text-body-sm text-text-muted py-6 text-center">No study sessions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedSubjects.map(([subj, mins]) => {
                    const totalMins = sortedSubjects.reduce((acc, [, m]) => acc + m, 0);
                    const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
                    return (
                      <div key={subj} className="space-y-1">
                        <div className="flex justify-between font-label-md text-label-md">
                          <span className="text-text-primary font-medium">{subj}</span>
                          <span className="text-text-secondary font-code text-xs">{(mins / 60).toFixed(1)}h ({pct}%)</span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sessions List (8 cols) */}
            <div className="lg:col-span-8 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Study Sessions & Focus Logs</h2>
                  <p className="font-body-sm text-body-sm text-text-muted mt-0.5">Deep work history and focus blocks.</p>
                </div>
                <button
                  onClick={() => openQuickAction('study')}
                  className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Log Session</span>
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="p-10 text-center text-text-muted font-body-sm">
                  No study sessions recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-lg bg-surface-container-low border border-hairline-border hover:bg-surface-container transition-colors flex items-start justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-md text-label-md font-semibold text-text-primary">{s.subject}</span>
                          {s.studyType && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container font-code text-[11px] text-secondary">
                              {s.studyType}
                            </span>
                          )}
                          <span className="font-code text-label-sm text-text-muted">
                            {s.date}
                          </span>
                        </div>
                        {s.notes && (
                          <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">{s.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-code font-semibold text-secondary">
                          {s.duration} mins
                        </span>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="text-text-muted hover:text-error transition-colors p-1"
                          title="Delete session"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab: COURSES */}
        {activeTab === 'courses' && (
          <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hairline-border">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Curricula & Courses</h2>
                <p className="font-body-sm text-body-sm text-text-muted mt-0.5">Structured learning paths and certifications.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-hairline-border">
                  {['all', 'In Progress', 'Completed', 'Paused'].map(st => (
                    <button
                      key={st}
                      onClick={() => setCourseStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-colors capitalize ${
                        courseStatusFilter === st 
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCourseModalOpen(true)}
                  className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Course</span>
                </button>
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="p-10 text-center text-text-muted font-body-sm">
                No courses found matching criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map(course => {
                  const prog = course.progress || 0;
                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-hairline-border hover:border-hairline-border-bright transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-label-md text-label-md font-semibold text-text-primary leading-tight">
                              {course.name}
                            </h4>
                            {course.provider && (
                              <span className="font-body-sm text-body-sm text-text-muted block mt-0.5">
                                {course.provider}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-code text-[11px] font-medium shrink-0 ${
                            course.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : course.status === 'In Progress'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : 'bg-surface-container text-text-muted border border-hairline-border' 
                          }`}>
                            {course.status}
                          </span>
                        </div>

                        {course.notes && (
                          <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                            {course.notes}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-hairline-border">
                        <div className="flex items-center justify-between font-label-sm text-label-sm">
                          <span className="text-text-muted">Progress</span>
                          <span className="font-semibold text-text-primary tabular-nums">{prog}%</span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateCourseProgress(course.id, -5)}
                              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                              title="-5%"
                            >
                              -5%
                            </button>
                            <button
                              onClick={() => handleUpdateCourseProgress(course.id, 5)}
                              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                              title="+5%"
                            >
                              +5%
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-text-muted hover:text-error transition-colors p-1"
                            title="Delete course"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab: PROJECTS */}
        {activeTab === 'projects' && (
          <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hairline-border">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Technical Builds & Repositories</h2>
                <p className="font-body-sm text-body-sm text-text-muted mt-0.5">Software systems, libraries and production apps.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-hairline-border">
                  {['all', 'In Progress', 'Planning', 'Idea', 'Completed'].map(st => (
                    <button
                      key={st}
                      onClick={() => setProjectStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-colors capitalize ${
                        projectStatusFilter === st 
                          ? 'bg-surface-container text-primary font-medium'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setProjModalOpen(true)}
                  className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Project</span>
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-10 text-center text-text-muted font-body-sm">
                No projects found matching criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map(proj => {
                  const prog = proj.progress || 0;
                  return (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-hairline-border hover:border-hairline-border-bright transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-label-md text-label-md font-semibold text-text-primary leading-tight">
                            {proj.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full font-code text-[11px] font-medium shrink-0 ${
                            proj.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : proj.status === 'In Progress'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : 'bg-surface-container text-text-muted border border-hairline-border' 
                          }`}>
                            {proj.status}
                          </span>
                        </div>

                        {proj.description && (
                          <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                            {proj.description}
                          </p>
                        )}

                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.techStack.map((tech: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-surface-container border border-hairline-border font-code text-[11px] text-text-secondary">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-hairline-border">
                        <div className="flex items-center justify-between font-label-sm text-label-sm">
                          <span className="text-text-muted">Progress</span>
                          <span className="font-semibold text-text-primary tabular-nums">{prog}%</span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateProjectProgress(proj.id, -5)}
                              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                              title="-5%"
                            >
                              -5%
                            </button>
                            <button
                              onClick={() => handleUpdateProjectProgress(proj.id, 5)}
                              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                              title="+5%"
                            >
                              +5%
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-text-muted hover:text-error transition-colors p-1"
                            title="Delete project"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Add Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Add Course</h3>
              <button onClick={() => setCourseModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Specialization"
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Provider / Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. MIT, Coursera"
                    value={cProvider}
                    onChange={e => setCProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Status</label>
                  <select
                    value={cStatus}
                    onChange={e => setCStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={cTargetDate}
                    onChange={e => setCTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Initial Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cProgress}
                    onChange={e => setCProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Notes / Objectives</label>
                <textarea
                  rows={2}
                  value={cNotes}
                  onChange={e => setCNotes(e.target.value)}
                  placeholder="Syllabus notes or goals..."
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {projModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Add Project</h3>
              <button onClick={() => setProjModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed KV Engine"
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Architecture or problem solved..."
                  value={pDescription}
                  onChange={e => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Status</label>
                  <select
                    value={pStatus}
                    onChange={e => setPStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pProgress}
                    onChange={e => setPProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Deadline</label>
                  <input
                    type="date"
                    value={pDeadline}
                    onChange={e => setPDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Go, Raft, gRPC, React"
                  value={pTechStack}
                  onChange={e => setPTechStack(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-hairline-border text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

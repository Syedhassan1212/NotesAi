import React from 'react';
import { useAuth } from "./contexts/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import Home from './note/Home';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { AnimatedThemeToggler } from './note/Components/Theme';
import { Toaster } from './note/Components/Notice';
import { ChatWithErrorBoundary } from './note/Chat';
import NotesPage from './note/Notes/NotesPage';
import EnhancedNoteEditor from './note/Notes/EnhancedNoteEditor';
import { StorageDebugger } from './components/StorageDebugger';
import { migrateFromLocalStorage, isOPFSSupported } from './utils/opfsStorage';
import { NotesProvider, useNotes } from './contexts/NotesContext';
import MeLayout from './me/MeLayout';
import MeDashboard from './me/MeDashboard';
import FinancePage from './me/finance/FinancePage';
import HealthPage from './me/health/HealthPage';
import LearningPage from './me/learning/LearningPage';
import LifePage from './me/life/LifePage';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname || '/';

  type Note = {
    id: string;
    title: string;
    content: string;
    tags: string[];
    updatedAt: number;
    createdAt: number;
  };
  
  // Initialize OPFS migration on app start
  React.useEffect(() => {
    const runMigration = async () => {
      const supported = isOPFSSupported();
      
      if (supported) {
        const { migrated, failed } = await migrateFromLocalStorage();
        if (migrated.length > 0) console.log('✅ Migrated to OPFS:', migrated);
        if (failed.length > 0) console.warn('⚠️ Migration failed for:', failed);
      } else {
        console.warn('⚠️ OPFS not supported, using localStorage fallback');
      }
    };
    runMigration();
  }, []);
  
  const { notes, setNotes } = useNotes();
  const { logout } = useAuth();
  const [filter, setFilter] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const editingNote: Note | null = React.useMemo(() => {
    if (!editingId) return null;
    return notes.find(n => n.id === editingId) ?? null;
  }, [editingId, notes]);

  const upsertNote = React.useCallback((next: Note) => {
    const updated = notes.some(n => n.id === next.id) 
      ? notes.map(n => (n.id === next.id ? next : n))
      : [next, ...notes];
    
    const normalizedNotes = updated.map(note => ({
      ...note,
      createdAt: note.createdAt || note.updatedAt
    }));
    
    const sorted = normalizedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(sorted);
  }, [notes, setNotes]);

  const handleNew = () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newNote: Note = { id, title: '', content: '', tags: [], updatedAt: now, createdAt: now };
    setNotes([newNote, ...notes]);
    setEditingId(id);
    navigate('/notes/edit');
  };

  const handleOpen = (id: string) => {
    setEditingId(id);
    navigate('/notes/edit');
  };

  const handleDelete = (id: string) => {
    const updatedNotes = notes.filter((n: Note) => n.id !== id);
    setNotes(updatedNotes);
    if (editingId === id) setEditingId(null);
  };

  const handleEditorChange = (n: Note) => {
    const updated: Note = { ...n, updatedAt: Date.now() };
    upsertNote(updated);
  };

  const handleSave = () => {
    if (editingNote) {
      const updated: Note = { ...editingNote, updatedAt: Date.now() };
      upsertNote(updated);
    }
    navigate('/notes');
  };

  const handleBack = () => {
    navigate('/notes');
  };

  
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const searchResults = React.useMemo(() => {
    if (!globalSearchQuery) return [];
    const query = globalSearchQuery.toLowerCase();
    return notes.filter(n => 
      n.title?.toLowerCase().includes(query) || 
      n.content?.toLowerCase().includes(query) ||
      n.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [globalSearchQuery, notes]);

  const handleSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePath, navigate]);

  const isDebugPage = activePath === '/debug';

  const NavLink = ({ to, label, isActive }: { to: string, label: string, isActive: boolean }) => (
    <Link 
      to={to} 
      className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
        isActive 
          ? "bg-surface-container-high text-text-primary font-semibold shadow-xs"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-container-high/40"
      }`}
    >
      {label}
    </Link>
  );

  const isMePage = activePath.startsWith('/me');

  return (
    <>
      <div className="bg-surface-container-lowest font-body-md text-body-md text-on-surface antialiased min-h-screen selection:bg-surface-container-high selection:text-primary">
        
        {/* Clean Modern Navigation Header */}
        {!isDebugPage && (
          <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-xl border-b border-border-hairline shadow-xs">
            <div className="h-14 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-6">
              <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                <img src="/favicon.svg" alt="NotesAI" className="w-7 h-7 rounded-lg shrink-0 shadow-xs group-hover:scale-105 transition-transform" />
                <span className="text-base font-semibold text-text-primary tracking-tight">NotesAI</span>
              </Link>
              <nav className="hidden md:flex items-center p-0.5 rounded-full bg-surface-card border border-border-hairline shadow-xs">
                <NavLink to="/" label="Home" isActive={activePath === '/'} />
                <NavLink to="/notes" label="Notes" isActive={activePath.startsWith('/notes')} />
                <NavLink to="/chat" label="Chat" isActive={activePath === '/chat'} />
                <NavLink to="/me" label="Personal OS" isActive={activePath.startsWith('/me')} />
              </nav>
              <div className="flex items-center gap-2">
                
                <div className="relative">
                  {!isSearchOpen ? (
                    <button onClick={handleSearch} className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-card hover:bg-surface-container rounded-lg border border-border-hairline text-text-secondary hover:text-text-primary transition-colors text-xs font-medium shadow-xs" type="button">
                      <span className="material-symbols-outlined text-[15px]">search</span>
                      <span className="font-code-sm text-[10px] text-text-tertiary">⌘K</span>
                    </button>
                  ) : (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center w-64 md:w-80 z-50">
                      <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-text-tertiary pointer-events-none">search</span>
                        <input
                          ref={searchInputRef}
                          value={globalSearchQuery}
                          onChange={e => setGlobalSearchQuery(e.target.value)}
                          onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                          placeholder="Search all notes..."
                          className="w-full pl-8 pr-8 py-1 bg-surface-container-high border border-border-hairline text-on-surface rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-lg font-body-sm text-body-sm transition-all"
                        />
                        <button onClick={() => { setIsSearchOpen(false); setGlobalSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-on-surface">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>

                      {/* Dropdown Results */}
                      {globalSearchQuery && (
                        <div className="absolute top-full mt-2 right-0 w-full md:w-96 bg-surface-container-lowest border border-border-hairline shadow-xl rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                          {searchResults.length > 0 ? (
                            <div className="flex flex-col py-2">
                              <span className="px-3 py-1 font-label-sm text-label-sm text-text-tertiary uppercase tracking-wider">Results</span>
                              {searchResults.map(note => (
                                <button
                                  key={note.id}
                                  onClick={() => {
                                    handleOpen(note.id);
                                    setIsSearchOpen(false);
                                    setGlobalSearchQuery('');
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-surface-container-highest transition-colors flex flex-col gap-0.5 border-b border-border-hairline last:border-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate pr-4">{note.title || 'Untitled'}</span>
                                    <span className="font-code-sm text-[10px] text-text-tertiary shrink-0">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                  <span className="font-body-sm text-body-sm text-text-secondary line-clamp-1">{note.content.replace(/<[^>]*>?/gm, '') || 'No content...'}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center font-body-sm text-body-sm text-text-tertiary">
                              No notes found for "{globalSearchQuery}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors">
                  <AnimatedThemeToggler />
                </div>
                
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-surface-container transition-colors"
                  title="Sign out"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main content */}
        {isDebugPage ? (
          <Routes>
            <Route path="/debug" element={<div className="p-4"><StorageDebugger /></div>} />
          </Routes>
        ) : (
          <main className={`w-full ${isMePage ? "pt-14 bg-surface-container-lowest" : "pt-14 bg-surface"} min-h-screen`}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home onOpen={handleOpen} onNew={handleNew} />} />
                <Route path="/notes" element={<NotesPage notes={notes} onNew={handleNew} onOpen={handleOpen} onDelete={handleDelete} onFilterChange={setFilter} filter={filter} />} />
                <Route path="/notes/edit" element={
                  <motion.div key="notes-edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
                    {editingNote ? (
                      <EnhancedNoteEditor note={editingNote} onChange={handleEditorChange} onSave={handleSave} onBack={handleBack} />
                    ) : (
                      <div className="w-full max-w-4xl mx-auto pt-20 text-center text-sm text-muted-foreground">No note selected</div>
                    )}
                  </motion.div>
                } />
                <Route path="/chat" element={<ChatWithErrorBoundary />} />
                <Route path="/me" element={<MeLayout />}>
                  <Route index element={<MeDashboard />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="finance/:tab" element={<FinancePage />} />
                  <Route path="health" element={<HealthPage />} />
                  <Route path="health/:tab" element={<HealthPage />} />
                  <Route path="learning" element={<LearningPage />} />
                  <Route path="learning/:tab" element={<LearningPage />} />
                  <Route path="life" element={<LifePage />} />
                  <Route path="life/:tab" element={<LifePage />} />
                </Route>
              </Routes>
            </AnimatePresence>
          </main>
        )}
        
        {!isDebugPage && !isMePage && (
          <footer className="w-full bg-surface border-t border-border-hairline py-space-xl">
            <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 flex flex-col sm:flex-row items-center justify-between gap-space-md text-text-tertiary font-label-sm text-label-sm">
              <div><span>NotesAi — Local Cognitive Workspace</span></div>
              
            </div>
          </footer>
        )}
      </div>
      <Toaster />
    </>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <LoginScreen />;

  return (
    <NotesProvider>
      <AppShell />
    </NotesProvider>
  );
}
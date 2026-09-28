import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Plus,
  Compass,
  DollarSign,
  Dumbbell,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Note } from '../../note/Notes/NotesPage';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onOpenNote: (id: string) => void;
  onNewNote: () => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  notes,
  onOpenNote,
  onNewNote,
}: CommandMenuProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation items
  const navItems = [
    { id: 'nav-home', label: 'Go to Home', category: 'Navigation', icon: Compass, action: () => navigate('/') },
    { id: 'nav-notes', label: 'Go to All Notes', category: 'Navigation', icon: FileText, action: () => navigate('/notes') },
    { id: 'nav-chat', label: 'Go to Chat Assistant', category: 'Navigation', icon: MessageSquare, action: () => navigate('/chat') },
    { id: 'nav-me', label: 'Go to Personal OS', category: 'Navigation', icon: Compass, action: () => navigate('/me') },
    { id: 'nav-finance', label: 'Open Finance & Cashflow', category: 'Navigation', icon: DollarSign, action: () => navigate('/me/finance') },
    { id: 'nav-health', label: 'Open Health & Workouts', category: 'Navigation', icon: Dumbbell, action: () => navigate('/me/health') },
    { id: 'nav-learning', label: 'Open Learning & Capital', category: 'Navigation', icon: BookOpen, action: () => navigate('/me/learning') },
  ];

  // Static quick actions
  const actionItems = [
    { id: 'act-new-note', label: 'Create New Document', category: 'Actions', icon: Plus, action: () => onNewNote() },
  ];

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  // Filtered navigation
  const filteredNav = navItems.filter((item) =>
    !query.trim() || item.label.toLowerCase().includes(query.toLowerCase())
  );

  // All combined interactive items
  const allItems: { id: string; label: string; sub?: string; category: string; icon: any; action: () => void }[] = [
    ...actionItems.map(a => ({ ...a, sub: undefined })),
    ...filteredNotes.map(n => ({
      id: `note-${n.id}`,
      label: n.title?.trim() || 'Untitled Note',
      sub: n.tags?.[0] ? `#${n.tags[0]}` : 'Document',
      category: 'Notes',
      icon: FileText,
      action: () => onOpenNote(n.id)
    })),
    ...filteredNav.map(n => ({ ...n, sub: undefined }))
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-surface-card border border-border-hairline rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-hairline bg-surface-card">
              <Search size={18} className="text-text-tertiary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search notes..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
              />
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-high text-text-tertiary border border-border-hairline">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto p-2 space-y-1">
              {allItems.length > 0 ? (
                allItems.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors',
                        isSelected
                          ? 'bg-surface-container-high text-text-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={16} className={isSelected ? 'text-primary' : 'text-text-tertiary'} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                        {item.sub && (
                          <span className="text-[10px] text-text-tertiary shrink-0">
                            {item.sub}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-tertiary uppercase tracking-wider shrink-0 ml-2">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-text-tertiary">
                  No matching results for "{query}"
                </div>
              )}
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border-hairline/60 bg-surface-card/60 text-[11px] text-text-tertiary">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface-container text-[10px] border border-border-hairline">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-surface-container text-[10px] border border-border-hairline">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] border border-border-hairline">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-[10px]">NotesAI Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

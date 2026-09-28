import { useNotes } from "../../contexts/NotesContext";
import { useState } from 'react';

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  createdAt: number;
};

type Props = {
  notes: any[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onFilterChange: (value: string) => void;
  filter: string;
};

export default function NotesPage({ 
  notes, 
  onNew, 
  onOpen, 
  onDelete,
  onFilterChange, 
  filter
}: Props) {
  const { syncStatus } = useNotes();
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'table'>('gallery');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');

  const uniqueTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.content.toLowerCase().includes(filter.toLowerCase()) ||
    note.tags.some((tag: string) => tag.toLowerCase().includes(filter.toLowerCase()))
  );
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'updatedAt') return b.updatedAt - a.updatedAt;
    if (sortBy === 'createdAt') return b.createdAt - a.createdAt;
    return a.title.localeCompare(b.title);
  });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  };

  const getGridClass = () => {
    switch (viewMode) {
      case 'gallery': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
      case 'list': return 'grid grid-cols-1 gap-3';
      case 'table': return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
    }
  };

  return (
    <div className="flex flex-col w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 py-8">

      {/* Header Section */}
      <div className="relative w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-code text-label-sm text-text-muted uppercase tracking-wider">Cognitive Vault</span>
              <span className="w-1 h-1 rounded-full bg-surface-variant"></span>
              <span className="font-code text-label-sm text-text-muted">Indexed via CoreML</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-display text-text-primary tracking-tight font-bold">All Notes</h1>
              <span className="font-body-md text-text-muted font-normal" id="note-counter">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
            </div>
          </div>

          {/* Segmented View Mode Switcher + Action Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center p-0.5 rounded-full bg-surface-card border border-hairline-border shadow-xs">
              <button 
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer ${viewMode === 'gallery' ? 'bg-surface-container-high text-text-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/40 font-medium'}`} 
                onClick={() => setViewMode('gallery')} 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">grid_view</span>
                <span>Gallery</span>
              </button>
              <button 
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer ${viewMode === 'list' ? 'bg-surface-container-high text-text-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/40 font-medium'}`} 
                onClick={() => setViewMode('list')} 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                <span>Compact</span>
              </button>
              <button 
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer ${viewMode === 'table' ? 'bg-surface-container-high text-text-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/40 font-medium'}`} 
                onClick={() => setViewMode('table')} 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">table_rows</span>
                <span>Table</span>
              </button>
            </div>

            <button 
              onClick={onNew}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary hover:opacity-90 rounded-full font-label-md text-label-md font-semibold shadow-xs transition-all cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls & Tag Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button 
            onClick={() => onFilterChange('')}
            className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-medium transition-all whitespace-nowrap border cursor-pointer ${!filter ? 'bg-surface-container-high text-text-primary border-hairline-border-bright shadow-xs font-semibold' : 'bg-surface-card text-text-secondary hover:text-text-primary hover:bg-surface-card-hover border-hairline-border'}`}
          >
            All Documents
          </button>
          {uniqueTags.map((tag, i) => {
            const colors = ['bg-primary', 'bg-secondary', 'bg-blue-400', 'bg-emerald-400'];
            const isSelected = filter === tag;
            return (
              <button 
                key={tag}
                onClick={() => onFilterChange(tag)}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${isSelected ? 'bg-surface-container-high text-text-primary border-hairline-border-bright font-semibold shadow-xs' : 'bg-surface-card text-text-secondary hover:text-text-primary hover:bg-surface-card-hover border-hairline-border'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colors[i % colors.length]}`}></span>
                {tag}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto w-full lg:w-auto justify-between lg:justify-end">
          <div className="relative flex items-center w-full lg:w-64">
            <span className="material-symbols-outlined absolute left-3 text-[16px] text-text-muted">search</span>
            <input 
              id="global-search-input" 
              className="w-full pl-9 pr-3 py-1.5 bg-surface-card hover:bg-surface-card-hover focus:bg-surface-card border border-hairline-border focus:border-hairline-border-bright text-text-primary font-body-sm text-body-sm placeholder:text-text-muted rounded-xl outline-none transition-colors shadow-xs" 
              placeholder="Filter title or keyword..." 
              type="text"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setSortBy(prev => prev === 'updatedAt' ? 'createdAt' : prev === 'createdAt' ? 'title' : 'updatedAt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card hover:bg-surface-card-hover border border-hairline-border rounded-xl font-label-sm text-label-sm text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <span>Sort:</span>
            <span className="font-semibold text-text-primary">
              {sortBy === 'updatedAt' ? 'Last Edited' : sortBy === 'createdAt' ? 'Date Created' : 'Alphabetical'}
            </span>
            <span className="material-symbols-outlined text-[15px]">swap_vert</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className={getGridClass()} id="notes-container">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full py-16 px-6 rounded-2xl bg-surface-card border border-hairline-border flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-surface-container-high/60 border border-hairline-border flex items-center justify-center text-text-muted mb-3">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-text-primary mb-1">No notes found</h3>
            <p className="font-body-sm text-body-sm text-text-secondary max-w-sm mb-4">
              {filter ? `No notes matching "${filter}". Try adjusting your search query.` : 'Get started by creating your very first note.'}
            </p>
            {filter ? (
              <button 
                onClick={() => onFilterChange('')}
                className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-text-primary border border-hairline-border font-label-sm text-label-sm font-medium transition-all shadow-xs cursor-pointer"
              >
                Clear Filter
              </button>
            ) : (
              <button 
                onClick={onNew}
                className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
              >
                Create Note
              </button>
            )}
          </div>
        ) : (
          sortedNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => onOpen(note.id)}
              className="group relative flex flex-col justify-between bg-surface-card hover:bg-surface-card-hover border border-hairline-border hover:border-hairline-border-bright rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer min-h-[220px]"
            >
              <button
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-500/15 text-red-400 z-10 transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                title="Delete note"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-label-sm text-label-sm font-medium">
                    {note.tags && note.tags.length > 0 ? note.tags[0] : 'Note'}
                  </span>
                  <span className="font-label-sm text-label-sm text-text-muted">{formatDate(note.updatedAt || note.createdAt)}</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary group-hover:text-primary transition-colors font-semibold tracking-tight mb-2 pr-6">
                  {note.title?.trim() || 'Untitled'}
                </h2>
                <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3 leading-relaxed">
                  {note.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'No content'}
                </p>
              </div>
              
              <div className="pt-4 mt-4 border-t border-hairline-border/60 flex items-center justify-between font-label-sm text-label-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  <span>{note.tags?.length || 0} Tags</span>
                </div>
                <span className="font-code-sm text-code-sm">{note.content.replace(/<[^>]*>/g, '').split(' ').filter(Boolean).length} words</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cloud Status Footer */}
      <div className="mt-12 p-6 bg-surface-card border border-hairline-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-high/60 border border-hairline-border flex items-center justify-center text-primary shadow-xs">
            {syncStatus === 'syncing' ? <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> : syncStatus === 'error' ? <span className="material-symbols-outlined text-[20px] text-red-400">cloud_off</span> : <span className="material-symbols-outlined text-[20px]">cloud_done</span>}
          </div>
          <div>
            <div className="font-label-md text-label-md text-text-primary font-semibold">{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Offline' : 'Cloud Synced'}</div>
            <div className="font-body-sm text-body-sm text-text-muted">All {notes.length} notes securely backed up to your MongoDB cluster.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 rounded-lg bg-surface-container-high/70 hover:bg-surface-container-high text-text-primary border border-hairline-border font-label-sm text-label-sm font-medium transition-all shadow-xs cursor-pointer">
            Export Markdown
          </button>
          <button className="px-4 py-1.5 rounded-lg bg-surface-container-high/70 hover:bg-surface-container-high text-text-primary border border-hairline-border font-label-sm text-label-sm font-medium transition-all shadow-xs cursor-pointer">
            Backup Vault
          </button>
        </div>
      </div>
    </div>
  );
}

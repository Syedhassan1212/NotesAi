import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
  size?: 'sm' | 'md';
}

/**
 * 21st.dev / Apple macOS Segmented Pill Switcher
 * Spring physics sliding pill indicator with zero layout shift.
 */
export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  className,
  layoutId = 'animated-tab-pill',
  size = 'md',
}: AnimatedTabsProps) {
  const isSm = size === 'sm';

  return (
    <div
      className={cn(
        'relative flex items-center p-0.5 rounded-full bg-surface-card border border-border-hairline shadow-xs',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-full transition-colors font-medium whitespace-nowrap',
              isSm ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-xs',
              isActive
                ? 'text-text-primary font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/40'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-normal',
                  isActive
                    ? 'bg-surface-container-highest text-text-primary'
                    : 'bg-surface-container text-text-tertiary'
                )}
              >
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 z-[-1] rounded-full bg-surface-container-high shadow-xs border border-border-hairline"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

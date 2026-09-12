import React from 'react'

export const STORAGE_KEYS = {
  NOTES: 'notes',
  TASKS: 'tasks', 
  AI_MESSAGES: 'aiMessages'
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

const API_BASE = 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export function useSimpleStorage<T>(
  key: StorageKey,
  defaultValue: T
): [T, (value: T) => boolean, boolean] {
  const [data, setData] = React.useState<T>(defaultValue)
  const [isLoading, setIsLoading] = React.useState(true)
  
  React.useEffect(() => {
    // aiMessages fallback to local storage
    if (key === STORAGE_KEYS.AI_MESSAGES || !localStorage.getItem('token')) {
      const stored = localStorage.getItem(key);
      if (stored) setData(JSON.parse(stored));
      setIsLoading(false);
      return;
    }

    const endpoint = key === STORAGE_KEYS.NOTES ? '/notes' : '/tasks';
    
    fetch(API_BASE + endpoint, { headers: getHeaders() })
      .then(res => res.json())
      .then(fetchedData => {
        if (!fetchedData.error) {
          setData(fetchedData as unknown as T);
        } else {
          // If token expired or error, fallback to local for safety
          const stored = localStorage.getItem(key);
          if (stored) setData(JSON.parse(stored));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch from DB', err);
        const stored = localStorage.getItem(key);
        if (stored) setData(JSON.parse(stored));
        setIsLoading(false);
      });
  }, [key])
  
  // Save data function
  const saveData = React.useCallback((value: T): boolean => {
    setData(value);
    
    // Always save to local cache for offline/optimistic
    localStorage.setItem(key, JSON.stringify(value));
    
    if (key === STORAGE_KEYS.AI_MESSAGES || !localStorage.getItem('token')) {
      return true;
    }

    const endpoint = key === STORAGE_KEYS.NOTES ? '/sync/notes' : '/sync/tasks';
    
    fetch(API_BASE + endpoint, { 
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(value)
    }).catch(err => console.error('Sync failed', err));

    return true;
  }, [key]);
  
  return [data, saveData, isLoading]
}

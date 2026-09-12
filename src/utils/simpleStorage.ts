/**
 * Simple localStorage-based storage utilities
 * This is a reliable fallback that works in all browsers
 */

import React from 'react'

export const STORAGE_KEYS = {
  NOTES: 'notes',
  TASKS: 'tasks', 
  AI_MESSAGES: 'aiMessages'
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * Read data from localStorage
 */
export function readFromStorage<T>(key: StorageKey): T | null {
  try {
    const data = localStorage.getItem(key)
    if (data === null) {
      console.log(`📖 Storage: No data found for key '${key}'`)
      return null
    }
    const parsed = JSON.parse(data) as T
    console.log(`📖 Storage: Successfully read data for key '${key}'`, parsed)
    return parsed
  } catch (error) {
    console.error(`❌ Failed to read data for key '${key}':`, error)
    return null
  }
}

/**
 * Write data to localStorage
 */
export function writeToStorage<T>(key: StorageKey, data: T): boolean {
  try {
    const jsonString = JSON.stringify(data)
    localStorage.setItem(key, jsonString)
    console.log(`💾 Storage: Successfully wrote data for key '${key}'`, data)
    return true
  } catch (error) {
    console.error(`❌ Failed to write data for key '${key}':`, error)
    return false
  }
}

/**
 * Delete data from localStorage
 */
export function deleteFromStorage(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key)
    console.log(`🗑️ Storage: Successfully deleted data for key '${key}'`)
    return true
  } catch (error) {
    console.error(`❌ Failed to delete data for key '${key}':`, error)
    return false
  }
}

/**
 * React hook for simple storage
 */
export function useSimpleStorage<T>(
  key: StorageKey,
  defaultValue: T
): [T, (value: T) => boolean, boolean] {
  const [data, setData] = React.useState<T>(defaultValue)
  const [isLoading, setIsLoading] = React.useState(true)
  
  // Load data on mount
  React.useEffect(() => {
    console.log(`🔄 Loading data for key: ${key}`)
    const storedData = readFromStorage<T>(key)
    if (storedData !== null) {
      setData(storedData)
      console.log(`✅ Loaded data for key: ${key}`)
    } else {
      console.log(`ℹ️ No stored data for key: ${key}, using default`)
    }
    setIsLoading(false)
  }, [key])
  
  // Save data function
  const saveData = React.useCallback((value: T): boolean => {
    const success = writeToStorage(key, value)
    if (success) {
      setData(value)
    }
    return success
  }, [key])
  
  return [data, saveData, isLoading]
}

import { useState, useEffect } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

/**
 * A hook that persists state in localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value to use if no value exists in localStorage
 * @returns A tuple containing the current value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: SetValue<T>) => void] {
    // Get from localStorage then parse stored json or return initialValue
    const readValue = (): T => {
        // Prevent build error "window is undefined" but keep working
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                return initialValue;
            }

            // Handle boolean values stored as strings
            if (typeof initialValue === 'boolean' && (item === 'true' || item === 'false')) {
                return (item === 'true') as T;
            }

            // Handle null values
            if (initialValue === null && item === 'null') {
                return null as T;
            }

            // Try to parse as JSON
            try {
                return JSON.parse(item) as T;
            } catch {
                // If JSON parsing fails, return initialValue
                console.warn(`Invalid JSON in localStorage key "${key}":`, item);
                return initialValue;
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: SetValue<T>) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Save state
            setStoredValue(valueToStore);
            
            // Save to localStorage
            if (typeof window !== 'undefined') {
                // Handle null values
                if (valueToStore === null) {
                    window.localStorage.setItem(key, 'null');
                } else {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Listen for changes to this localStorage key in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch {
                    // If JSON parsing fails, ignore the change
                    console.warn(`Invalid JSON in storage event for key "${key}":`, e.newValue);
                }
            }
        };

        // Add event listener
        window.addEventListener('storage', handleStorageChange);

        // Remove event listener on cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
} 
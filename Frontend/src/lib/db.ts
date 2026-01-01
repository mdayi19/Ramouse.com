import { USE_SERVER_STORAGE, API_BASE_URL } from './config';

export const db = {
  db: null as IDBDatabase | null,

  async init(): Promise<void> {
    // @ts-ignore
    window.db = this;

    if (USE_SERVER_STORAGE) {
      console.log('App running in Server Storage Mode');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported');
        resolve();
        return;
      }

      const request = indexedDB.open('RamouseDB', 1);
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        resolve();
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('orderMedia')) db.createObjectStore('orderMedia');
        if (!db.objectStoreNames.contains('productMedia')) db.createObjectStore('productMedia');
        if (!db.objectStoreNames.contains('profileMedia')) db.createObjectStore('profileMedia');
      };
    });
  },

  async saveMedia<T>(storeName: 'orderMedia' | 'productMedia' | 'profileMedia', key: string, value: any): Promise<void> {
    if (USE_SERVER_STORAGE) {
      // For server storage, upload files to Laravel backend
      const formData = new FormData();

      // Handle different value types
      for (const k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          const v = value[k];

          if (v instanceof File || v instanceof Blob) {
            formData.append('file', v);
          } else if (Array.isArray(v)) {
            v.forEach((item: any) => {
              if (item instanceof File || item instanceof Blob) {
                formData.append('files[]', item);
              }
            });
          }
        }
      }

      try {
        // Use Laravel upload endpoint
        const uploadUrl = formData.has('files[]') ? '/upload/multiple' : '/upload';
        const response = await fetch(`${API_BASE_URL}${uploadUrl}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Server upload failed');
        }

        const result = await response.json();
        console.log('Upload successful:', result);

        // Store the URL references in localStorage for later retrieval
        const storageKey = `${storeName}_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(result.data));

      } catch (e) {
        console.error("Server save error", e);
        throw e;
      }
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(); return; }
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        console.error(`Error saving to IndexedDB store "${storeName}":`, error);
        reject(error);
      }
    });
  },

  async getMedia<T>(storeName: 'orderMedia' | 'productMedia' | 'profileMedia', key: string): Promise<T | undefined> {
    if (USE_SERVER_STORAGE) {
      try {
        // Get from localStorage cache
        const storageKey = `${storeName}_${key}`;
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
        return undefined;
      } catch (e) {
        console.error("Server get error:", e);
        return undefined;
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(undefined); return; }
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.error(`Error getting from IndexedDB store "${storeName}":`, error);
        resolve(undefined);
      }
    });
  },
};
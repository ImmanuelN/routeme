// storage.js
// Lightweight storage helper with a safe in-memory fallback so the bundle
// doesn't fail if `@react-native-async-storage/async-storage` isn't installed.
//
// Recommended: install the official package in your project:
//   expo install @react-native-async-storage/async-storage
// After installing, you can either import it directly in this file or set
// `global.RoutemeAsyncStorage = require('@react-native-async-storage/async-storage').default`
// early in your app (for example in `App.js`) to enable persistence.

import { emit } from './eventBus';

const SEARCH_KEY = 'routeme_search_history_v1';
const STORAGE_CAP = 50; // max entries to keep (non-favorites may be evicted)

// Use global.RoutemeAsyncStorage if user wired it; otherwise fallback to in-memory.
const getAsyncStorage = () => {
  if (global && global.RoutemeAsyncStorage) return global.RoutemeAsyncStorage;
  return null;
};

// In-memory fallback store
const memoryStore = new Map();

const memGetItem = async (key) => {
  return memoryStore.has(key) ? memoryStore.get(key) : null;
};

const memSetItem = async (key, value) => {
  memoryStore.set(key, value);
};

const memRemoveItem = async (key) => {
  memoryStore.delete(key);
};

const warnInstall = () => {
  console.warn(
    "⚠️ [storage] AsyncStorage not installed. Install with: `expo install @react-native-async-storage/async-storage` \n" +
      "Or set `global.RoutemeAsyncStorage = require('@react-native-async-storage/async-storage').default` in App.js to enable persistence."
  );
};

export const loadSearchHistory = async () => {
  const AsyncStorage = getAsyncStorage();
  try {
    const raw = AsyncStorage ? await AsyncStorage.getItem(SEARCH_KEY) : await memGetItem(SEARCH_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('⚠️ [storage] loadSearchHistory failed', err?.message || err);
    return [];
  } finally {
    if (!AsyncStorage) warnInstall();
  }
};

export const saveSearchEntry = async (entry) => {
  const AsyncStorage = getAsyncStorage();
  try {
    const prevRaw = AsyncStorage ? await AsyncStorage.getItem(SEARCH_KEY) : await memGetItem(SEARCH_KEY);
    let list = [];
    if (prevRaw) {
      try {
        list = JSON.parse(prevRaw);
      } catch (e) {
        list = [];
      }
    }

    // Try to preserve existing metadata (favorite) when re-saving the same place.
    const existing = list.find((e) => {
      if (entry.placeId && e.placeId) return e.placeId === entry.placeId;
      return e.latitude === entry.latitude && e.longitude === entry.longitude;
    });

    // Remove duplicates by placeId or lat/lng
    const filtered = list.filter((e) => {
      if (entry.placeId && e.placeId) return e.placeId !== entry.placeId;
      return !(e.latitude === entry.latitude && e.longitude === entry.longitude);
    });

    const newEntry = { ...entry, timestamp: Date.now(), favorite: existing?.favorite || entry.favorite || false };
    filtered.unshift(newEntry);

    // Evict oldest non-favorite entries until under cap. Favorites are protected and won't be evicted.
    let toStore = filtered.slice();
    if (toStore.length > STORAGE_CAP) {
      // remove from the end (oldest) preferentially non-favorites
      for (let i = toStore.length - 1; i >= 0 && toStore.length > STORAGE_CAP; i--) {
        if (!toStore[i].favorite) {
          toStore.splice(i, 1);
        }
      }
      // If still over cap (all remaining are favorites), allow growth (do not evict favorites)
    }
    const raw = JSON.stringify(toStore);
    if (AsyncStorage) {
      await AsyncStorage.setItem(SEARCH_KEY, raw);
    } else {
      await memSetItem(SEARCH_KEY, raw);
    }
    // notify listeners about change
    try {
      emit('searchHistoryChanged');
    } catch (e) {}
  } catch (err) {
    console.warn('⚠️ [storage] saveSearchEntry failed', err?.message || err);
  } finally {
    if (!getAsyncStorage()) warnInstall();
  }
};

export const clearSearchHistory = async () => {
  const AsyncStorage = getAsyncStorage();
  try {
    if (AsyncStorage) await AsyncStorage.removeItem(SEARCH_KEY);
    else await memRemoveItem(SEARCH_KEY);
    try { emit('searchHistoryChanged'); } catch (e) {}
  } catch (err) {
    console.warn('⚠️ [storage] clearSearchHistory failed', err?.message || err);
  } finally {
    if (!AsyncStorage) warnInstall();
  }
};

export const removeSearchEntry = async (matcher) => {
  // matcher can be a function(entry) => boolean OR an object with keys to match
  const AsyncStorage = getAsyncStorage();
  try {
    const prevRaw = AsyncStorage ? await AsyncStorage.getItem(SEARCH_KEY) : await memGetItem(SEARCH_KEY);
    let list = [];
    if (prevRaw) {
      try {
        list = JSON.parse(prevRaw);
      } catch (e) {
        list = [];
      }
    }

    const newList = list.filter((entry) => {
      if (typeof matcher === 'function') return !matcher(entry);
      // matcher as object: match by timestamp, placeId, or lat/lng
      if (matcher.timestamp && entry.timestamp === matcher.timestamp) return false;
      if (matcher.placeId && entry.placeId && entry.placeId === matcher.placeId) return false;
      if (
        matcher.latitude !== undefined &&
        matcher.longitude !== undefined &&
        entry.latitude === matcher.latitude &&
        entry.longitude === matcher.longitude
      )
        return false;
      return true;
    });

    const raw = JSON.stringify(newList);
    if (AsyncStorage) await AsyncStorage.setItem(SEARCH_KEY, raw);
    else await memSetItem(SEARCH_KEY, raw);
    // notify listeners about change
    try {
      emit('searchHistoryChanged');
    } catch (e) {}
  } catch (err) {
    console.warn('⚠️ [storage] removeSearchEntry failed', err?.message || err);
  } finally {
    if (!getAsyncStorage()) warnInstall();
  }
};

export const toggleFavorite = async (matcher) => {
  const AsyncStorage = getAsyncStorage();
  try {
    const prevRaw = AsyncStorage ? await AsyncStorage.getItem(SEARCH_KEY) : await memGetItem(SEARCH_KEY);
    let list = [];
    if (prevRaw) {
      try { list = JSON.parse(prevRaw); } catch (e) { list = []; }
    }

    let changed = false;
    const newList = list.map((entry) => {
      let match = false;
      if (typeof matcher === 'function') match = matcher(entry);
      else if (matcher.timestamp && entry.timestamp === matcher.timestamp) match = true;
      else if (matcher.placeId && entry.placeId && entry.placeId === matcher.placeId) match = true;
      else if (matcher.latitude !== undefined && matcher.longitude !== undefined && entry.latitude === matcher.latitude && entry.longitude === matcher.longitude) match = true;

      if (match) {
        changed = true;
        return { ...entry, favorite: !entry.favorite };
      }
      return entry;
    });

    if (changed) {
      const raw = JSON.stringify(newList);
      if (AsyncStorage) await AsyncStorage.setItem(SEARCH_KEY, raw);
      else await memSetItem(SEARCH_KEY, raw);
      try { emit('searchHistoryChanged'); } catch (e) {}
    }
  } catch (err) {
    console.warn('⚠️ [storage] toggleFavorite failed', err?.message || err);
  } finally {
    if (!getAsyncStorage()) warnInstall();
  }
};

export const loadFavorites = async () => {
  const list = await loadSearchHistory();
  return (list || []).filter((e) => e.favorite);
};

export const notifySearchHistoryChanged = () => {
  try { emit('searchHistoryChanged'); } catch (e) {}
};

export default { loadSearchHistory, saveSearchEntry, clearSearchHistory, removeSearchEntry, toggleFavorite, loadFavorites };

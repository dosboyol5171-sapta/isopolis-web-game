import { PlayerData, TileState, InventoryItem, PlacedAnimal, PerformanceSettings, Quest } from '../types/game';

export interface GameSaveSnapshot {
  version: number;
  timestamp: number;
  player: PlayerData;
  farmTiles: [string, TileState][];
  villageTiles: [string, TileState][];
  houseInteriorTiles?: [string, TileState][];
  inventory: InventoryItem[];
  shippingBin: InventoryItem[];
  animals: PlacedAnimal[];
  quests: Quest[];
  settings?: PerformanceSettings;
}

const OPFS_FILENAME = 'isopolis_save_game.json';
const STORAGE_KEY = 'isopolis_harvest_save_v2';
const SNAPSHOT_DB_NAME = 'isopolis_offline_db';
const SNAPSHOT_STORE = 'game_snapshots';

class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private cacheMemorySnapshot: GameSaveSnapshot | null = null;
  private opfsChecked = false;
  private opfsSupported = false;

  constructor() {
    this.checkOPFSSupport();
    this.initIndexedDB();
  }

  // Probe and check OPFS capability
  public isOPFSAvailable(): boolean {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.getDirectory === 'function') {
      return true;
    }
    return false;
  }

  private async checkOPFSSupport(): Promise<boolean> {
    if (this.opfsChecked) return this.opfsSupported;
    if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.getDirectory !== 'function') {
      this.opfsChecked = true;
      this.opfsSupported = false;
      return false;
    }
    try {
      const root = await navigator.storage.getDirectory();
      this.opfsSupported = !!root;
    } catch (_) {
      this.opfsSupported = false;
    }
    this.opfsChecked = true;
    return this.opfsSupported;
  }

  // 1. OPFS Direct Disk Write (Origin Private File System)
  private async saveToOPFS(jsonStr: string): Promise<boolean> {
    if (!this.isOPFSAvailable()) return false;
    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(OPFS_FILENAME, { create: true });
      if ((fileHandle as any).createWritable) {
        const writable = await (fileHandle as any).createWritable();
        await writable.write(jsonStr);
        await writable.close();
        return true;
      }
    } catch (err) {
      console.warn('OPFS write exception, falling back:', err);
    }
    return false;
  }

  // 1. OPFS Direct Disk Read (Origin Private File System)
  private async loadFromOPFS(): Promise<GameSaveSnapshot | null> {
    if (!this.isOPFSAvailable()) return null;
    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(OPFS_FILENAME);
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text) {
        const parsed = JSON.parse(text) as GameSaveSnapshot;
        if (parsed && parsed.player) {
          return parsed;
        }
      }
    } catch (_) {
      // File not created yet in OPFS or permission pending
    }
    return null;
  }

  // 1. OPFS Direct Delete
  private async clearOPFS(): Promise<void> {
    if (!this.isOPFSAvailable()) return;
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(OPFS_FILENAME).catch(() => {});
    } catch (_) {}
  }

  // 2. High-speed IndexedDB for deep storage & snapshots fallback
  private initIndexedDB() {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(SNAPSHOT_DB_NAME, 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
            db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Save game state: OPFS Native Disk -> IndexedDB -> LocalStorage
  public async saveGame(
    player: PlayerData,
    farmTiles: Map<string, TileState>,
    villageTiles: Map<string, TileState>,
    inventory: InventoryItem[],
    shippingBin: InventoryItem[],
    animals: PlacedAnimal[],
    quests: Quest[],
    settings?: PerformanceSettings,
    houseInteriorTiles?: Map<string, TileState>
  ): Promise<boolean> {
    const snapshot: GameSaveSnapshot = {
      version: 2,
      timestamp: Date.now(),
      player,
      farmTiles: Array.from(farmTiles.entries()),
      villageTiles: Array.from(villageTiles.entries()),
      houseInteriorTiles: houseInteriorTiles ? Array.from(houseInteriorTiles.entries()) : undefined,
      inventory,
      shippingBin,
      animals,
      quests,
      settings,
    };

    this.cacheMemorySnapshot = snapshot;
    const jsonStr = JSON.stringify(snapshot);

    // 1. Primary: Save to OPFS (High-Speed Native Disk)
    const opfsSaved = await this.saveToOPFS(jsonStr);

    // 2. Secondary: Sync to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // 3. Deep Cache: IndexedDB
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
        const store = tx.objectStore(SNAPSHOT_STORE);
        store.put({ id: 'latest_autosave', ...snapshot });
      }
      return true;
    } catch (err) {
      console.error('IndexedDB save failed:', err);
      return opfsSaved;
    }
  }

  // Load saved state: Memory cache -> OPFS Native Disk -> LocalStorage -> IndexedDB
  public async loadGame(): Promise<GameSaveSnapshot | null> {
    if (this.cacheMemorySnapshot) {
      return this.cacheMemorySnapshot;
    }

    // 1. Primary: Try OPFS
    const opfsData = await this.loadFromOPFS();
    if (opfsData && opfsData.player) {
      this.cacheMemorySnapshot = opfsData;
      return opfsData;
    }

    // 2. Secondary: Try LocalStorage
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData) as GameSaveSnapshot;
        if (parsed && parsed.player) {
          this.cacheMemorySnapshot = parsed;
          // Migrate old LocalStorage save forward into OPFS
          this.saveToOPFS(localData).catch(() => {});
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    // 3. Tertiary: Try IndexedDB deep storage
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
        const store = tx.objectStore(SNAPSHOT_STORE);
        const req = store.get('latest_autosave');
        return new Promise((resolve) => {
          req.onsuccess = () => {
            if (req.result) {
              this.cacheMemorySnapshot = req.result;
              resolve(req.result);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        });
      }
    } catch (err) {
      console.warn('IndexedDB read error:', err);
    }

    return null;
  }

  // Clear save data across OPFS, LocalStorage, and IndexedDB
  public async clearSave(): Promise<void> {
    this.cacheMemorySnapshot = null;

    // 1. Clear OPFS
    await this.clearOPFS();

    // 2. Clear LocalStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}

    // 3. Clear IndexedDB
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
        tx.objectStore(SNAPSHOT_STORE).clear();
      } catch (_) {}
    }
  }

  // Name of active primary storage
  public getActiveStorageName(): string {
    if (this.isOPFSAvailable()) {
      return 'OPFS (Native Disk)';
    }
    return 'IndexedDB / LocalStorage';
  }
}

export const storageEngine = new StorageEngine();

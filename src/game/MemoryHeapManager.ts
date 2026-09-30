import * as THREE from 'three';
import { TexturePackPalette } from '../types/game';

/**
 * Pre-allocated ArrayBuffer Memory Heap & Lookup Table (LUT) Manager.
 * Stores spatial grid indexes in high-speed TypedArrays (Uint8Array)
 * and pre-computes 24-hour lighting tables in static RAM to ensure 0 CPU overhead.
 */
export class MemoryHeapManager {
  // Pre-allocated Spatial Grid Type Buffers (48x48 = 2304 max capacity per buffer)
  public static readonly MAX_GRID_SIZE = 48 * 48;

  // TypedArray heaps for ultra-fast O(1) cache queries (No Garbage Collection)
  public static tileTypeHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: Grass, 1: Soil, 2: Water, 3: Path
  public static tileWateredHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: Dry, 1: Watered
  public static tileCropStageHeap = new Int8Array(MemoryHeapManager.MAX_GRID_SIZE); // -1: None, 0..3: Growth Stage
  public static tileDebrisHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: None, 1: Weed, 2: Log, 3: WildTree, 4: SmallStone, 5: BigStone

  // Pre-computed 24-Hour Time-Of-Day Lighting LUT (Lookup Table)
  // Pre-allocates Color instances in RAM so we never instantiate THREE.Color in the game loop
  private static lightingLUT: Array<{
    skyColor: THREE.Color;
    ambColor: THREE.Color;
    ambIntensity: number;
    dirColor: THREE.Color;
    dirIntensity: number;
    dirPosX: number;
    dirPosY: number;
    dirPosZ: number;
  }> = [];

  private static isInitialized = false;

  // Pre-generate LUT on startup into contiguous RAM
  public static initializeLUT(palette: TexturePackPalette) {
    if (this.isInitialized) return;

    this.lightingLUT = new Array(24);

    for (let hour = 0; hour < 24; hour++) {
      let skyHex = palette.skyNoon;
      let ambHex = 0xfef9c3; // Soft warm golden ambient
      let ambInt = 1.35;
      let dirHex = 0xffedd5; // Warm sunlit amber
      let dirInt = 1.40;
      let sunY = 38;
      let sunX = -26; // Sun in top-left behind trees
      let sunZ = -22;

      if (hour >= 5 && hour < 8) {
        // Morning Dawn: Warm golden hour rays
        skyHex = palette.skyMorning;
        ambHex = 0xfef3c7;
        ambInt = 1.25;
        dirHex = 0xfdba74;
        dirInt = 1.30;
        sunY = 24;
        sunX = -32;
        sunZ = -26;
      } else if (hour >= 8 && hour < 16) {
        // Crisp, Warm Sunlit Day (Ghibli Golden Sunlight)
        skyHex = palette.skyNoon;
        ambHex = 0xfef9c3;
        ambInt = 1.38;
        dirHex = 0xfff7ed;
        dirInt = 1.45;
        sunY = 38;
        sunX = -26;
        sunZ = -22;
      } else if (hour >= 16 && hour < 19) {
        // Dusk / Golden Sunset
        skyHex = palette.skySunset;
        ambHex = 0xffedd5;
        ambInt = 1.20;
        dirHex = 0xf97316;
        dirInt = 1.25;
        sunY = 20;
        sunX = -35;
        sunZ = -20;
      } else {
        // Night
        skyHex = palette.skyNight;
        ambHex = 0x93c5fd;
        ambInt = 0.55;
        dirHex = 0x6366f1;
        dirInt = 0.40;
        sunY = 25;
        sunX = -20;
        sunZ = 20;
      }

      this.lightingLUT[hour] = {
        skyColor: new THREE.Color(skyHex),
        ambColor: new THREE.Color(ambHex),
        ambIntensity: ambInt,
        dirColor: new THREE.Color(dirHex),
        dirIntensity: dirInt,
        dirPosX: sunX,
        dirPosY: sunY,
        dirPosZ: sunZ,
      };
    }

    this.isInitialized = true;
  }

  // Instant O(1) Fast-LUT reader (Zero allocation)
  public static getLightingForHour(hour: number) {
    const clampedHour = Math.max(0, Math.min(23, Math.floor(hour)));
    return this.lightingLUT[clampedHour] || this.lightingLUT[12];
  }

  // Fast Grid Coordinate to Flat Index (z * width + x)
  public static getIndex(x: number, z: number, width = 48): number {
    return z * width + x;
  }
}

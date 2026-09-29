import * as THREE from 'three';
import { TileState, PlacedAnimal, PerformanceSettings, TexturePackPalette, MapLocation, InventoryItem, CropType } from '../../types/game';
import { ModelFactory } from './BuildingModels';
import { MemoryHeapManager } from '../MemoryHeapManager';
import { ShaderPipelinePreheater } from './ShaderPipelinePreheater';
import { WorldRegistry } from '../WorldRegistry';

import grassTexUrl from '../../assets/images/botw_meadow_texture_1790669910957.jpg';
import soilTexUrl from '../../assets/images/botw_soil_texture_1790669097811.jpg';
import pathTexUrl from '../../assets/images/botw_path_texture_1790669107514.jpg';
import sandTexUrl from '../../assets/images/botw_sand_texture_1790669117328.jpg';
import rockTexUrl from '../../assets/images/botw_rock_texture_1790669128375.jpg';
import foliageTexUrl from '../../assets/images/botw_foliage_texture_1790670742354.jpg';
import barkTexUrl from '../../assets/images/botw_wood_bark_1790670764588.jpg';

// Global Asset Loading State Manager
export const assetLoadingState = {
  progress: 0,
  isLoaded: false,
  listeners: [] as ((progress: number, isLoaded: boolean) => void)[],
  onUpdate(cb: (progress: number, isLoaded: boolean) => void) {
    this.listeners.push(cb);
    cb(this.progress, this.isLoaded);
  },
  notify() {
    this.listeners.forEach((fn) => fn(this.progress, this.isLoaded));
  },
};

// Texture Loader with Progress Manager
const loadingManager = new THREE.LoadingManager(
  () => {
    assetLoadingState.progress = 100;
    assetLoadingState.isLoaded = true;
    assetLoadingState.notify();
  },
  (_itemUrl, itemsLoaded, itemsTotal) => {
    const pct = Math.round((itemsLoaded / itemsTotal) * 100);
    assetLoadingState.progress = pct;
    assetLoadingState.notify();
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);

function createTileTexture(url: string, repeatScale = 1.0) {
  const tex = textureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatScale, repeatScale);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  return tex;
}

// Procedural High-Fidelity Studio Ghibli Lush Grass Texture Generator
function createGhibliGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Rich Vibrant Emerald Green Gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#38a169');
  grad.addColorStop(0.3, '#48bb78');
  grad.addColorStop(0.7, '#2f855a');
  grad.addColorStop(1, '#276749');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Soft Watercolor Dapples & Sunlit Meadow Patches
  const dapples = [
    { x: 120, y: 140, r: 140, color: 'rgba(110, 231, 183, 0.40)' },
    { x: 380, y: 110, r: 160, color: 'rgba(52, 211, 153, 0.45)' },
    { x: 260, y: 340, r: 180, color: 'rgba(167, 243, 208, 0.35)' },
    { x: 420, y: 400, r: 150, color: 'rgba(34, 197, 94, 0.40)' },
    { x: 80, y: 390, r: 130, color: 'rgba(21, 128, 61, 0.30)' },
    { x: 490, y: 260, r: 120, color: 'rgba(134, 239, 172, 0.35)' },
    { x: 256, y: 180, r: 110, color: 'rgba(187, 247, 208, 0.35)' },
  ];

  dapples.forEach((d) => {
    const radGrad = ctx.createRadialGradient(d.x, d.y, 10, d.x, d.y, d.r);
    radGrad.addColorStop(0, d.color);
    radGrad.addColorStop(1, 'rgba(56, 161, 105, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Delicate Anime Grass Blade Flecks & Texture Grain
  for (let i = 0; i < 550; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 4 + Math.random() * 9;
    const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.6;
    const isHighlight = Math.random() > 0.45;

    ctx.strokeStyle = isHighlight
      ? `rgba(187, 247, 208, ${0.28 + Math.random() * 0.40})`
      : `rgba(22, 101, 52, ${0.22 + Math.random() * 0.35})`;
    ctx.lineWidth = 1.2 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // 4. Tiny scattered micro flower dots (clover whites & buttercup yellows)
  for (let f = 0; f < 45; f++) {
    const fx = Math.random() * 512;
    const fy = Math.random() * 512;
    const isYellow = Math.random() > 0.5;
    ctx.fillStyle = isYellow ? 'rgba(254, 240, 138, 0.70)' : 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.8 + Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const grassTex = createTileTexture(grassTexUrl, 1.0);
const soilTex = createTileTexture(soilTexUrl, 1.0);
const pathTex = createTileTexture(pathTexUrl, 1.0);
const sandTex = createTileTexture(sandTexUrl, 1.0);
const rockTex = createTileTexture(rockTexUrl, 1.0);
const foliageTex = createTileTexture(foliageTexUrl, 1.0);
const barkTex = createTileTexture(barkTexUrl, 1.0);

// Materials with Pure White Multiplier
const grassMat = new THREE.MeshLambertMaterial({ map: grassTex, color: 0xffffff });
const soilMat = new THREE.MeshLambertMaterial({ map: soilTex, color: 0xffffff });
const pathMat = new THREE.MeshLambertMaterial({ map: pathTex, color: 0xffffff });
const sandMat = new THREE.MeshLambertMaterial({ map: sandTex, color: 0xffffff });
const rockMat = new THREE.MeshLambertMaterial({ map: rockTex, color: 0xffffff });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 });
const treeLeafMat = new THREE.MeshLambertMaterial({ map: foliageTex, color: 0xffffff });
const treeTrunkMat = new THREE.MeshLambertMaterial({ map: barkTex, color: 0xffffff });

// Procedural Canvas Shoreline Water Foam Ring
function createWaterFoamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 114, 114);

  ctx.strokeStyle = 'rgba(186, 230, 253, 0.50)';
  ctx.lineWidth = 22;
  ctx.strokeRect(12, 12, 104, 104);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const waterFoamMat = new THREE.MeshBasicMaterial({
  map: createWaterFoamTexture(),
  transparent: true,
  opacity: 0.80,
  depthWrite: false,
});

// Shared Handcrafted Watercolor Drawing Utilities
function drawWatercolorStone(ctx: CanvasRenderingContext2D, sx: number, sy: number, rx: number, ry: number, rot: number, col: string) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(35, 20, 10, 0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 3, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.25, -ry * 0.25, rx * 0.5, ry * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#382618';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function drawWatercolorDaisy(ctx: CanvasRenderingContext2D, fx: number, fy: number, size = 6.0) {
  ctx.save();
  ctx.translate(fx, fy);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2b3f12';
  ctx.lineWidth = 0.7;
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(ang) * size, Math.sin(ang) * size, size * 0.6, size * 0.35, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawWatercolorButtercup(ctx: CanvasRenderingContext2D, fx: number, fy: number, size = 5.0) {
  ctx.save();
  ctx.translate(fx, fy);
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#422800';
  ctx.lineWidth = 0.7;
  for (let a = 0; a < 5; a++) {
    const ang = (a / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(ang) * size, Math.sin(ang) * size, size * 0.55, size * 0.4, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWatercolorBellflower(ctx: CanvasRenderingContext2D, fx: number, fy: number, size = 5.5) {
  ctx.save();
  ctx.translate(fx, fy);
  ctx.fillStyle = '#818cf8';
  ctx.strokeStyle = '#2b1b54';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.9, -size * 0.5, size * 0.9, size * 0.5, size * 0.6, size);
  ctx.lineTo(-size * 0.6, size);
  ctx.bezierCurveTo(-size * 0.9, size * 0.5, -size * 0.9, -size * 0.5, 0, -size);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Handcrafted Studio Ghibli Multi-Variation Transparent Watercolor Dirt Trails (4 Seamless Straight Variations)
function createFarmDirtPathTextures(): THREE.CanvasTexture[] {
  const textures: THREE.CanvasTexture[] = [];

  for (let v = 0; v < 4; v++) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 4) {
      const ny = y / 512;
      let wave = 0;
      let widthMod = 0;
      if (v === 0) {
        wave = Math.sin(ny * Math.PI) * -22 + Math.sin(ny * Math.PI * 3) * 5;
        widthMod = Math.sin(ny * Math.PI) * 12;
      } else if (v === 1) {
        wave = Math.sin(ny * Math.PI * 2) * 4;
        widthMod = Math.sin(ny * Math.PI * 2 + 1.0) * 8;
      } else if (v === 2) {
        wave = Math.sin(ny * Math.PI) * 22 - Math.sin(ny * Math.PI * 3) * 5;
        widthMod = Math.sin(ny * Math.PI) * 12;
      } else {
        wave = Math.sin(ny * Math.PI * 4) * 6;
        widthMod = Math.sin(ny * Math.PI) * 26;
      }

      const pathCenter = 256 + wave;
      const pathWidth = 310 + widthMod;

      const fringeGrad = ctx.createLinearGradient(pathCenter - pathWidth / 2 - 32, 0, pathCenter + pathWidth / 2 + 32, 0);
      fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
      fringeGrad.addColorStop(0.12, 'rgba(115, 70, 32, 0.75)');
      fringeGrad.addColorStop(0.25, '#be824c');
      fringeGrad.addColorStop(0.5, '#deb07c');
      fringeGrad.addColorStop(0.75, '#be824c');
      fringeGrad.addColorStop(0.88, 'rgba(115, 70, 32, 0.75)');
      fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
      ctx.fillStyle = fringeGrad;
      ctx.fillRect(pathCenter - pathWidth / 2 - 32, y, pathWidth + 64, 5);

      const innerTrackW = pathWidth * 0.52;
      const innerGrad = ctx.createLinearGradient(pathCenter - innerTrackW / 2, 0, pathCenter + innerTrackW / 2, 0);
      innerGrad.addColorStop(0, 'rgba(235, 196, 152, 0)');
      innerGrad.addColorStop(0.2, 'rgba(245, 212, 172, 0.65)');
      innerGrad.addColorStop(0.5, 'rgba(255, 226, 190, 0.85)');
      innerGrad.addColorStop(0.8, 'rgba(245, 212, 172, 0.65)');
      innerGrad.addColorStop(1, 'rgba(235, 196, 152, 0)');
      ctx.fillStyle = innerGrad;
      ctx.fillRect(pathCenter - innerTrackW / 2, y, innerTrackW, 5);
    }

    for (let i = 0; i < 500; i++) {
      const y = Math.random() * 512;
      const ny = y / 512;
      let wave = 0;
      if (v === 0) wave = Math.sin(ny * Math.PI) * -22 + Math.sin(ny * Math.PI * 3) * 5;
      else if (v === 1) wave = Math.sin(ny * Math.PI * 2) * 4;
      else if (v === 2) wave = Math.sin(ny * Math.PI) * 22 - Math.sin(ny * Math.PI * 3) * 5;
      else wave = Math.sin(ny * Math.PI * 4) * 6;

      const pathCenter = 256 + wave;
      const spread = (Math.random() - 0.5) * 330;
      const x = pathCenter + spread;
      const s = Math.random() * 3.2 + 1.0;
      const isDark = Math.random() > 0.4;
      const alpha = Math.max(0.15, 1.0 - Math.abs(spread) / 180);
      ctx.fillStyle = isDark ? `rgba(75, 42, 18, ${alpha * 0.6})` : `rgba(250, 226, 190, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (v === 0) {
      drawWatercolorStone(ctx, 365, 80, 16, 10, 0.3, '#8c7d70');
      drawWatercolorStone(ctx, 340, 105, 9, 6, -0.4, '#aa9c8e');
      drawWatercolorStone(ctx, 360, 240, 15, 9, -0.5, '#8c7d70');
      drawWatercolorStone(ctx, 155, 340, 11, 7, 0.4, '#7d6e62');
      drawWatercolorStone(ctx, 370, 430, 17, 11, -0.25, '#847568');
      drawWatercolorDaisy(ctx, 395, 120, 6.5);
      drawWatercolorDaisy(ctx, 415, 260, 6.0);
      drawWatercolorButtercup(ctx, 135, 320, 5.0);
      drawWatercolorBellflower(ctx, 125, 160, 5.5);
    } else if (v === 1) {
      drawWatercolorStone(ctx, 165, 140, 12, 7, -0.2, '#7d6e62');
      drawWatercolorStone(ctx, 350, 280, 14, 9, 0.3, '#8c7d70');
      drawWatercolorStone(ctx, 160, 420, 10, 6, 0.5, '#aa9c8e');
      drawWatercolorButtercup(ctx, 135, 120, 5.5);
      drawWatercolorButtercup(ctx, 385, 300, 5.0);
      drawWatercolorDaisy(ctx, 140, 440, 6.0);
    } else if (v === 2) {
      drawWatercolorStone(ctx, 150, 95, 16, 10, -0.3, '#8c7d70');
      drawWatercolorStone(ctx, 175, 120, 9, 6, 0.4, '#aa9c8e');
      drawWatercolorStone(ctx, 145, 270, 15, 9, 0.5, '#8c7d70');
      drawWatercolorStone(ctx, 360, 360, 12, 7, -0.4, '#7d6e62');
      drawWatercolorStone(ctx, 140, 440, 18, 11, 0.25, '#847568');
      drawWatercolorBellflower(ctx, 115, 130, 6.0);
      drawWatercolorBellflower(ctx, 110, 290, 5.5);
      drawWatercolorDaisy(ctx, 385, 380, 6.5);
      drawWatercolorButtercup(ctx, 375, 160, 5.0);
    } else {
      drawWatercolorStone(ctx, 225, 170, 14, 9, 0.2, '#aa9c8e');
      drawWatercolorStone(ctx, 285, 240, 15, 10, -0.2, '#7d6e62');
      drawWatercolorStone(ctx, 240, 330, 16, 10, 0.3, '#8c7d70');
      drawWatercolorDaisy(ctx, 120, 200, 6.0);
      drawWatercolorDaisy(ctx, 390, 220, 6.5);
      drawWatercolorButtercup(ctx, 125, 360, 5.5);
      drawWatercolorBellflower(ctx, 385, 340, 5.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
  }

  return textures;
}

// 3-Way T-Junction (Pertigaan) Connecting North, South, and East Seamlessly
function createFarmTJunctionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  const pathWidth = 310;

  // 1. Vertical main stem (from y=0 to y=512, x=256)
  for (let y = 0; y < 512; y += 4) {
    const fringeGrad = ctx.createLinearGradient(256 - pathWidth / 2 - 32, 0, 256 + pathWidth / 2 + 32, 0);
    fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
    fringeGrad.addColorStop(0.12, 'rgba(115, 70, 32, 0.75)');
    fringeGrad.addColorStop(0.25, '#be824c');
    fringeGrad.addColorStop(0.5, '#deb07c');
    fringeGrad.addColorStop(0.75, '#be824c');
    fringeGrad.addColorStop(0.88, 'rgba(115, 70, 32, 0.75)');
    fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
    ctx.fillStyle = fringeGrad;
    ctx.fillRect(256 - pathWidth / 2 - 32, y, pathWidth + 64, 5);

    const innerTrackW = pathWidth * 0.52;
    const innerGrad = ctx.createLinearGradient(256 - innerTrackW / 2, 0, 256 + innerTrackW / 2, 0);
    innerGrad.addColorStop(0, 'rgba(235, 196, 152, 0)');
    innerGrad.addColorStop(0.2, 'rgba(245, 212, 172, 0.65)');
    innerGrad.addColorStop(0.5, 'rgba(255, 226, 190, 0.85)');
    innerGrad.addColorStop(0.8, 'rgba(245, 212, 172, 0.65)');
    innerGrad.addColorStop(1, 'rgba(235, 196, 152, 0)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(256 - innerTrackW / 2, y, innerTrackW, 5);
  }

  // 2. Horizontal branch to the right (from x=180 to x=512, y=256)
  for (let x = 180; x <= 512; x += 4) {
    const fringeGrad = ctx.createLinearGradient(0, 256 - pathWidth / 2 - 32, 0, 256 + pathWidth / 2 + 32);
    fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
    fringeGrad.addColorStop(0.12, 'rgba(115, 70, 32, 0.75)');
    fringeGrad.addColorStop(0.25, '#be824c');
    fringeGrad.addColorStop(0.5, '#deb07c');
    fringeGrad.addColorStop(0.75, '#be824c');
    fringeGrad.addColorStop(0.88, 'rgba(115, 70, 32, 0.75)');
    fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
    ctx.fillStyle = fringeGrad;
    ctx.fillRect(x, 256 - pathWidth / 2 - 32, 5, pathWidth + 64);

    const innerTrackW = pathWidth * 0.52;
    const innerGrad = ctx.createLinearGradient(0, 256 - innerTrackW / 2, 0, 256 + innerTrackW / 2);
    innerGrad.addColorStop(0, 'rgba(235, 196, 152, 0)');
    innerGrad.addColorStop(0.2, 'rgba(245, 212, 172, 0.65)');
    innerGrad.addColorStop(0.5, 'rgba(255, 226, 190, 0.85)');
    innerGrad.addColorStop(0.8, 'rgba(245, 212, 172, 0.65)');
    innerGrad.addColorStop(1, 'rgba(235, 196, 152, 0)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(x, 256 - innerTrackW / 2, 5, innerTrackW);
  }

  // 3. Wide Smooth Central Loam Hub connecting all 3 directions seamlessly
  const hubGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 210);
  hubGrad.addColorStop(0, 'rgba(255, 226, 190, 0.95)');
  hubGrad.addColorStop(0.4, '#deb07c');
  hubGrad.addColorStop(0.7, '#be824c');
  hubGrad.addColorStop(0.9, 'rgba(115, 70, 32, 0.75)');
  hubGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.fill();

  // 4. Fine Earth Grains and Stepping River Stones at junction
  for (let i = 0; i < 500; i++) {
    const rx = (Math.random() - 0.5) * 360;
    const ry = (Math.random() - 0.5) * 440;
    const x = 256 + rx;
    const y = 256 + ry;
    if (x >= 50 && (rx * rx + ry * ry < 48000 || Math.abs(rx) < 160 || (ry > -160 && ry < 160 && rx > 0))) {
      const s = Math.random() * 3.2 + 1.0;
      const isDark = Math.random() > 0.4;
      ctx.fillStyle = isDark ? 'rgba(75, 42, 18, 0.5)' : 'rgba(250, 226, 190, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Stones in the junction hub and corner elbows
  drawWatercolorStone(ctx, 230, 210, 15, 10, 0.2, '#aa9c8e');
  drawWatercolorStone(ctx, 280, 280, 14, 9, -0.3, '#7d6e62');
  drawWatercolorStone(ctx, 390, 95, 16, 10, 0.5, '#8c7d70');
  drawWatercolorStone(ctx, 390, 415, 16, 10, -0.5, '#8c7d70');
  drawWatercolorStone(ctx, 130, 256, 18, 11, 0.1, '#847568');

  // Wildflowers along outer edge (west) and corner fillets (northeast & southeast)
  drawWatercolorDaisy(ctx, 105, 180, 6.5);
  drawWatercolorDaisy(ctx, 105, 330, 6.0);
  drawWatercolorButtercup(ctx, 420, 75, 5.5);
  drawWatercolorButtercup(ctx, 420, 435, 5.5);
  drawWatercolorBellflower(ctx, 95, 256, 6.0);
  drawWatercolorBellflower(ctx, 435, 256, 5.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 2-Way L-Turn Corner (Tikungan Sudut) Connecting South and East Smoothly
function createFarmCornerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  const cx = 512;
  const cy = 512;
  const pathRadius = 256;
  const pathWidth = 310;

  for (let r = pathRadius - pathWidth / 2 - 32; r <= pathRadius + pathWidth / 2 + 32; r += 4) {
    const distFromCenter = Math.abs(r - pathRadius);
    const normDist = distFromCenter / (pathWidth / 2 + 32);
    if (normDist > 1) continue;

    const alpha = (1 - normDist * normDist) * 0.9;
    const isLoam = distFromCenter < (pathWidth * 0.26);
    ctx.strokeStyle = isLoam ? `rgba(255, 226, 190, ${alpha * 0.95})` : `rgba(190, 130, 76, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, (3 * Math.PI) / 2);
    ctx.stroke();
  }

  // Smooth entry transitions at edges
  const gradSouth = ctx.createLinearGradient(256 - pathWidth / 2 - 32, 512, 256 + pathWidth / 2 + 32, 512);
  gradSouth.addColorStop(0, 'rgba(105, 62, 28, 0)');
  gradSouth.addColorStop(0.25, '#be824c');
  gradSouth.addColorStop(0.5, '#deb07c');
  gradSouth.addColorStop(0.75, '#be824c');
  gradSouth.addColorStop(1, 'rgba(105, 62, 28, 0)');
  ctx.fillStyle = gradSouth;
  ctx.fillRect(256 - pathWidth / 2 - 32, 506, pathWidth + 64, 6);

  const gradEast = ctx.createLinearGradient(512, 256 - pathWidth / 2 - 32, 512, 256 + pathWidth / 2 + 32);
  gradEast.addColorStop(0, 'rgba(105, 62, 28, 0)');
  gradEast.addColorStop(0.25, '#be824c');
  gradEast.addColorStop(0.5, '#deb07c');
  gradEast.addColorStop(0.75, '#be824c');
  gradEast.addColorStop(1, 'rgba(105, 62, 28, 0)');
  ctx.fillStyle = gradEast;
  ctx.fillRect(506, 256 - pathWidth / 2 - 32, 6, pathWidth + 64);

  // Gravel flecks & stepping stones along corner
  for (let i = 0; i < 400; i++) {
    const ang = Math.PI + Math.random() * (Math.PI / 2);
    const r = pathRadius + (Math.random() - 0.5) * (pathWidth + 40);
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    const s = Math.random() * 3.0 + 1.0;
    const isDark = Math.random() > 0.4;
    ctx.fillStyle = isDark ? 'rgba(75, 42, 18, 0.55)' : 'rgba(250, 226, 190, 0.65)';
    ctx.beginPath();
    ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWatercolorStone(ctx, 330, 330, 16, 10, -0.7, '#8c7d70');
  drawWatercolorStone(ctx, 170, 470, 12, 7, 0.3, '#aa9c8e');
  drawWatercolorStone(ctx, 470, 170, 12, 7, -0.3, '#aa9c8e');
  drawWatercolorDaisy(ctx, 140, 440, 6.0);
  drawWatercolorDaisy(ctx, 440, 140, 6.0);
  drawWatercolorButtercup(ctx, 230, 230, 5.5);
  drawWatercolorBellflower(ctx, 190, 300, 5.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 4-Way Crossroad (Perempatan) Connecting all 4 Directions
function createFarmCrossroadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  const pathWidth = 310;

  // Vertical
  for (let y = 0; y < 512; y += 4) {
    const fringeGrad = ctx.createLinearGradient(256 - pathWidth / 2 - 32, 0, 256 + pathWidth / 2 + 32, 0);
    fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
    fringeGrad.addColorStop(0.25, '#be824c');
    fringeGrad.addColorStop(0.5, '#deb07c');
    fringeGrad.addColorStop(0.75, '#be824c');
    fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
    ctx.fillStyle = fringeGrad;
    ctx.fillRect(256 - pathWidth / 2 - 32, y, pathWidth + 64, 5);
  }

  // Horizontal
  for (let x = 0; x < 512; x += 4) {
    const fringeGrad = ctx.createLinearGradient(0, 256 - pathWidth / 2 - 32, 0, 256 + pathWidth / 2 + 32);
    fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
    fringeGrad.addColorStop(0.25, '#be824c');
    fringeGrad.addColorStop(0.5, '#deb07c');
    fringeGrad.addColorStop(0.75, '#be824c');
    fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
    ctx.fillStyle = fringeGrad;
    ctx.fillRect(x, 256 - pathWidth / 2 - 32, 5, pathWidth + 64);
  }

  // Central circular plaza hub
  const hubGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 220);
  hubGrad.addColorStop(0, 'rgba(255, 226, 190, 0.95)');
  hubGrad.addColorStop(0.45, '#deb07c');
  hubGrad.addColorStop(0.75, '#be824c');
  hubGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.fill();

  // Corner Stepping Stones & Wildflowers
  drawWatercolorStone(ctx, 110, 110, 16, 10, 0.4, '#8c7d70');
  drawWatercolorStone(ctx, 400, 110, 16, 10, -0.4, '#8c7d70');
  drawWatercolorStone(ctx, 110, 400, 16, 10, -0.4, '#8c7d70');
  drawWatercolorStone(ctx, 400, 400, 16, 10, 0.4, '#8c7d70');
  drawWatercolorStone(ctx, 256, 256, 18, 12, 0.1, '#aa9c8e');

  drawWatercolorDaisy(ctx, 90, 130, 6.0);
  drawWatercolorDaisy(ctx, 420, 130, 6.0);
  drawWatercolorButtercup(ctx, 90, 380, 5.5);
  drawWatercolorButtercup(ctx, 420, 380, 5.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Dead End Terminal (Ujung Jalan)
function createFarmDeadEndTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  const pathWidth = 310;

  // Bottom entry
  for (let y = 256; y < 512; y += 4) {
    const fringeGrad = ctx.createLinearGradient(256 - pathWidth / 2 - 32, 0, 256 + pathWidth / 2 + 32, 0);
    fringeGrad.addColorStop(0, 'rgba(105, 62, 28, 0)');
    fringeGrad.addColorStop(0.25, '#be824c');
    fringeGrad.addColorStop(0.5, '#deb07c');
    fringeGrad.addColorStop(0.75, '#be824c');
    fringeGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
    ctx.fillStyle = fringeGrad;
    ctx.fillRect(256 - pathWidth / 2 - 32, y, pathWidth + 64, 5);
  }

  // Rounded end bulb
  const bulbGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 180);
  bulbGrad.addColorStop(0, 'rgba(255, 226, 190, 0.9)');
  bulbGrad.addColorStop(0.5, '#deb07c');
  bulbGrad.addColorStop(0.8, '#be824c');
  bulbGrad.addColorStop(1, 'rgba(105, 62, 28, 0)');
  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.fill();

  drawWatercolorStone(ctx, 256, 220, 18, 11, 0, '#8c7d70');
  drawWatercolorStone(ctx, 200, 280, 13, 8, -0.3, '#aa9c8e');
  drawWatercolorStone(ctx, 310, 280, 13, 8, 0.3, '#7d6e62');
  drawWatercolorDaisy(ctx, 256, 160, 6.5);
  drawWatercolorButtercup(ctx, 190, 190, 5.5);
  drawWatercolorBellflower(ctx, 320, 190, 5.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const farmDirtStraightMats = createFarmDirtPathTextures().map(
  (tex) =>
    new THREE.MeshLambertMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
    })
);

const farmDirtTJunctionMat = new THREE.MeshLambertMaterial({
  map: createFarmTJunctionTexture(),
  color: 0xffffff,
  transparent: true,
  depthWrite: false,
});

const farmDirtCornerMat = new THREE.MeshLambertMaterial({
  map: createFarmCornerTexture(),
  color: 0xffffff,
  transparent: true,
  depthWrite: false,
});

const farmDirtCrossroadMat = new THREE.MeshLambertMaterial({
  map: createFarmCrossroadTexture(),
  color: 0xffffff,
  transparent: true,
  depthWrite: false,
});

const farmDirtDeadEndMat = new THREE.MeshLambertMaterial({
  map: createFarmDeadEndTexture(),
  color: 0xffffff,
  transparent: true,
  depthWrite: false,
});

// Handcrafted Organic Garden Furrow Border (Tilled Moist Earth Mound)
function createSoilBorderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  const center = 128;
  const outerRadius = 112;
  const innerRadius = 78;

  // Soft wavy furrow ridge with organic scalloped dirt edge
  for (let r = outerRadius; r >= innerRadius; r -= 2.5) {
    const t = (r - innerRadius) / (outerRadius - innerRadius);
    const alpha = (1 - t * t) * 0.88;
    ctx.fillStyle = `rgba(58, 32, 14, ${alpha})`;
    ctx.beginPath();
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const wobble =
        Math.sin(angle * 6) * 4.5 +
        Math.cos(angle * 12) * 3.0 +
        Math.sin(angle * 22) * 1.8;
      const curR = r + wobble;
      const px = center + Math.cos(angle) * curR;
      const py = center + Math.sin(angle) * curR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Crumbly dark moist soil specks and tiny garden pebbles
  for (let i = 0; i < 220; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = innerRadius + Math.random() * (outerRadius - innerRadius + 6);
    const cx = center + Math.cos(angle) * dist;
    const cy = center + Math.sin(angle) * dist;
    const size = 1.0 + Math.random() * 3.2;
    const darkness = 0.45 + Math.random() * 0.45;
    ctx.fillStyle = `rgba(42, 22, 10, ${darkness})`;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const soilBorderMat = new THREE.MeshBasicMaterial({
  map: createSoilBorderTexture(),
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
});

// Stylized Delicate Studio Ghibli Grass Clump (Slender, graceful, aesthetic proportions)
function createBotWTuftGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  // 5 delicate, slender blades with organic gentle heights (0.09 - 0.14) and natural outward curves
  const positions: number[] = [
    // Center upright blade
    -0.012, 0, 0,
     0.012, 0, 0,
     0.000, 0.135, 0.020,
    // Blade North-East (leaning outward)
    -0.004, 0, -0.010,
     0.015, 0, -0.003,
     0.038, 0.118, 0.016,
    // Blade North-West (leaning outward)
     0.004, 0, -0.010,
    -0.015, 0, -0.003,
    -0.036, 0.110, 0.014,
    // Blade South-East
     0.012, 0,  0.008,
    -0.005, 0,  0.014,
     0.026, 0.095, -0.028,
    // Blade South-West
    -0.012, 0,  0.008,
     0.005, 0,  0.014,
    -0.028, 0.090, -0.025,
  ];

  // Natural Sunlit Gradient: Base = rich emerald green, Tip = radiant soft lime
  const colors: number[] = [
    // Center blade
    0.16, 0.60, 0.25,   0.16, 0.60, 0.25,   0.60, 0.94, 0.40,
    // North-East
    0.18, 0.64, 0.28,   0.18, 0.64, 0.28,   0.65, 0.96, 0.44,
    // North-West
    0.18, 0.64, 0.28,   0.18, 0.64, 0.28,   0.62, 0.95, 0.42,
    // South-East
    0.15, 0.58, 0.24,   0.15, 0.58, 0.24,   0.55, 0.90, 0.36,
    // South-West
    0.15, 0.58, 0.24,   0.15, 0.58, 0.24,   0.55, 0.90, 0.36,
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  return geom;
}

// Helper function to create a 3-tier stylized conifer / pine tree leaf geometry (Zelda BotW style)
function createTieredTreeLeafGeometry(): THREE.BufferGeometry {
  const t1 = new THREE.ConeGeometry(1.30, 1.2, 7);
  t1.translate(0, 0.9, 0);
  const t2 = new THREE.ConeGeometry(0.98, 1.0, 7);
  t2.translate(0, 1.6, 0);
  const t3 = new THREE.ConeGeometry(0.66, 0.9, 7);
  t3.translate(0, 2.25, 0);

  const pos1 = Array.from(t1.attributes.position.array);
  const pos2 = Array.from(t2.attributes.position.array);
  const pos3 = Array.from(t3.attributes.position.array);

  const norm1 = Array.from(t1.attributes.normal.array);
  const norm2 = Array.from(t2.attributes.normal.array);
  const norm3 = Array.from(t3.attributes.normal.array);

  const uv1 = Array.from(t1.attributes.uv.array);
  const uv2 = Array.from(t2.attributes.uv.array);
  const uv3 = Array.from(t3.attributes.uv.array);

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute([...pos1, ...pos2, ...pos3], 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute([...norm1, ...norm2, ...norm3], 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute([...uv1, ...uv2, ...uv3], 2));

  const i1 = t1.index ? Array.from(t1.index.array) : [];
  const i2 = t2.index ? Array.from(t2.index.array) : [];
  const i3 = t3.index ? Array.from(t3.index.array) : [];
  if (i1.length > 0) {
    const vCount1 = t1.attributes.position.count;
    const vCount2 = t2.attributes.position.count;
    const offsetI2 = i2.map((i) => i + vCount1);
    const offsetI3 = i3.map((i) => i + vCount1 + vCount2);
    merged.setIndex([...i1, ...offsetI2, ...offsetI3]);
  }
  t1.dispose();
  t2.dispose();
  t3.dispose();
  return merged;
}

// Helper to merge buffer geometries with UVs and Normals
function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;
  let hasIndices = false;

  for (const g of geos) {
    if (!g.attributes.normal) {
      g.computeVertexNormals();
    }
    positions.push(...Array.from(g.attributes.position.array));
    normals.push(...Array.from(g.attributes.normal.array));
    if (g.attributes.uv) {
      uvs.push(...Array.from(g.attributes.uv.array));
    } else {
      for (let i = 0; i < g.attributes.position.count; i++) {
        uvs.push(0.5, 0.5);
      }
    }
    if (g.index) {
      hasIndices = true;
      for (let i = 0; i < g.index.array.length; i++) {
        indices.push(g.index.array[i] + vertOffset);
      }
    }
    vertOffset += g.attributes.position.count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (hasIndices && indices.length > 0) {
    merged.setIndex(indices);
  }
  merged.computeVertexNormals();
  return merged;
}

// 1. Studio Ghibli Fluffy Broadleaf Cloud Oak leaf geometry (Ultra-fast low-poly icosahedron)
function createCloudOakLeafGeometry(): THREE.BufferGeometry {
  const g1 = new THREE.IcosahedronGeometry(1.25, 0);
  g1.translate(0, 1.85, 0);
  const g2 = new THREE.IcosahedronGeometry(0.9, 0);
  g2.translate(-0.65, 1.5, 0.4);
  const g3 = new THREE.IcosahedronGeometry(0.95, 0);
  g3.translate(0.65, 1.55, -0.3);
  const g4 = new THREE.IcosahedronGeometry(0.85, 0);
  g4.translate(0.3, 1.45, 0.6);
  const g5 = new THREE.IcosahedronGeometry(0.8, 0);
  g5.translate(-0.4, 2.35, -0.2);

  return mergeBufferGeometries([g1, g2, g3, g4, g5]);
}

// 2. Golden Birch / Autumn Maple Tall Oval leaf geometry
function createBirchLeafGeometry(): THREE.BufferGeometry {
  const g1 = new THREE.IcosahedronGeometry(0.95, 0);
  g1.translate(0, 1.6, 0);
  const g2 = new THREE.IcosahedronGeometry(0.88, 0);
  g2.translate(0.1, 2.25, 0.1);
  const g3 = new THREE.IcosahedronGeometry(0.72, 0);
  g3.translate(-0.1, 2.8, -0.1);
  const g4 = new THREE.IcosahedronGeometry(0.5, 0);
  g4.translate(0, 3.25, 0);

  return mergeBufferGeometries([g1, g2, g3, g4]);
}

// 3. Flowering Sakura / Apple Blossom Spreading Umbrella leaf geometry
function createBlossomLeafGeometry(): THREE.BufferGeometry {
  const g1 = new THREE.IcosahedronGeometry(1.35, 0);
  g1.scale(1.2, 0.8, 1.2);
  g1.translate(0, 1.7, 0);
  const g2 = new THREE.IcosahedronGeometry(0.88, 0);
  g2.translate(-0.75, 1.45, -0.3);
  const g3 = new THREE.IcosahedronGeometry(0.88, 0);
  g3.translate(0.75, 1.45, 0.3);
  const g4 = new THREE.IcosahedronGeometry(0.82, 0);
  g4.translate(0, 2.15, 0);

  return mergeBufferGeometries([g1, g2, g3, g4]);
}

// Smooth 3D Heightfield Elevation Y(x, z, location, type)
export function calculateTileElevation(
  x: number,
  z: number,
  location: MapLocation,
  tileType: string
): number {
  if (tileType === 'water') {
    return -0.06;
  }
  if (tileType === 'soil') {
    return 0.018; // Elevated slightly above meadow base ground (Y = 0) so hoed soil tiles are 100% visible!
  }
  if (tileType === 'path') {
    return 0.012; // Natural 3D stepping stone lift
  }
  return 0.0;
}

export class GameScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private activePalette: TexturePackPalette;
  private dirLight!: THREE.DirectionalLight;
  private ambLight!: THREE.AmbientLight;

  private meadowMesh!: THREE.Mesh;
  private groundInstancedMesh!: THREE.InstancedMesh;
  private visualGrassMesh!: THREE.InstancedMesh;
  private visualSoilMesh!: THREE.InstancedMesh;
  private visualPathStraightMeshes: THREE.InstancedMesh[] = [];
  private visualPathTJunctionMesh!: THREE.InstancedMesh;
  private visualPathCornerMesh!: THREE.InstancedMesh;
  private visualPathCrossroadMesh!: THREE.InstancedMesh;
  private visualPathDeadEndMesh!: THREE.InstancedMesh;
  private visualSandMesh!: THREE.InstancedMesh;
  private visualRockMesh!: THREE.InstancedMesh;
  private visualWaterMesh!: THREE.InstancedMesh;
  private visualWaterFoamMesh!: THREE.InstancedMesh;
  private visualSoilBorderMesh!: THREE.InstancedMesh;
  private visualTuftsMesh!: THREE.InstancedMesh;
  private visualFlowersMesh!: THREE.InstancedMesh;
  private pathButterflies: { group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh; basePos: THREE.Vector3; speed: number; radius: number; phase: number }[] = [];
  private buildingGroup: THREE.Group;
  private treeTrunkInstanced!: THREE.InstancedMesh;
  private treeOakLeafInstanced!: THREE.InstancedMesh;
  private treeBirchLeafInstanced!: THREE.InstancedMesh;
  private treeBlossomLeafInstanced!: THREE.InstancedMesh;
  private outerRoadInstancedMesh!: THREE.InstancedMesh;
  private gateVistaGroup: THREE.Group;
  private cropMeshMap = new Map<string, THREE.Group>();
  private debrisMeshMap = new Map<string, THREE.Group>();
  private animalGroup: THREE.Group;
  private tileCursorGroup!: THREE.Group;
  private cursorFillMat!: THREE.MeshBasicMaterial;
  private cursorBorderMat!: THREE.LineBasicMaterial;
  private cursorCornerMat!: THREE.LineBasicMaterial;
  private tileCursor: THREE.Group;
  private tileCursor3x3: THREE.Group;
  private cursor3x3Mat: THREE.LineBasicMaterial;
  private playerMesh: THREE.Group;
  private heldItemGroup: THREE.Group | null = null;
  private currentHeldItem: InventoryItem | null = null;

  public isGridCursorHidden = false;
  public isSprinting = false;
  private dustPool: { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vy: number; vz: number }[] = [];

  private settings: PerformanceSettings;
  private inputVector = { x: 0, z: 0 };
  private targetTilePos: THREE.Vector3 | null = null;
  private walkAnimTime = 0;
  private isDestroyed = false;

  // Dynamic Camera Pitch & Distance State for Enhanced 3D Depth & Perspective Foreshortening
  private currentPitch = 0.663; // ~38 degrees rich 3D perspective angle (far objects noticeably smaller)
  private currentCamDist = 13.5; // Closer camera for strong focal presence & background depth

  // Grid dimensions: Farm = 28x28 (784 tiles), Village = 48x48 (2,304 tiles)
  public gridWidth = 28;
  public gridHeight = 28;
  public tileSize = 1.2;

  // Performance tracking & 24 FPS limiter
  public currentFps = 24;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private lastFrameTimestamp = 0;

  // Shared ground geometry and material
  private tileGeometry: THREE.BufferGeometry;
  private tileMaterial: THREE.MeshLambertMaterial;

  // Reusable Zero-Allocation Vectors for Render Loop
  private dummyCamPos = new THREE.Vector3();
  private dummyFocus = new THREE.Vector3();
  private smoothedCamFocus = new THREE.Vector3();
  private isCamInitialized = false;

  // Active Location & Boundary Transitions
  public currentLocation: MapLocation = 'farm';
  private onExitReachedCallback?: (target: MapLocation, spawnPos?: { x: number; z: number }) => void;
  private lastExitTriggerTime = 0;

  // Callbacks
  private onTileTapCallback?: (x: number, z: number) => void;

  constructor(container: HTMLDivElement, palette: TexturePackPalette, settings: PerformanceSettings) {
    this.container = container;
    this.activePalette = palette;
    this.settings = settings;
    this.clock = new THREE.Clock();

    // 1. Scene & Clear Horizon (No Distant Blur or Fog Lag)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(palette.skyNoon);
    this.scene.fog = null;

    // 2. Camera - Dynamic 3D Perspective Projection with Strong Depth
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    const initialFov = aspect < 1 ? 62 : 55;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.5, 500);

    // Calculate initial camera position with rich 3D isometric perspective rotated slightly right (36 degrees)
    const initialAzimuth = Math.PI * 0.20;
    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = this.currentCamDist * Math.sin(this.currentPitch);
    const offsetX = horizDist * Math.cos(initialAzimuth);
    const offsetZ = horizDist * Math.sin(initialAzimuth);
    this.camera.position.set(offsetX, camY, offsetZ);
    this.camera.lookAt(0, 0.5, 0);

    // 3. Bright, Crisp, Vibrant Sunlit Lighting
    this.ambLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(this.ambLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.20);
    this.dirLight.position.set(25, 40, 20);
    this.dirLight.castShadow = false;
    this.scene.add(this.dirLight);

    // 4. WebGL Renderer with Native Double-Buffering & High Performance
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(width, height);
    const maxPR = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(maxPR);
    this.renderer.shadowMap.enabled = false;

    // Clear stale canvas children before attaching
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    // WebGL Context Loss Recovery (Prevents main canvas freezing while minimap moves)
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL Context Lost - Restoring...');
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.info('WebGL Context Restored - Resuming 3D Render');
      if (!this.isDestroyed) {
        this.renderer.render(this.scene, this.camera);
      }
    }, false);

    // 5. Surrounding Meadow (infinite horizon)
    this.setupSurroundingMeadow();

    // 6. Geometry & Material Cache - Flat 2D Plane Geometry for crisp, seamless ground
    this.tileGeometry = new THREE.PlaneGeometry(this.tileSize * 1.01, this.tileSize * 1.01);
    this.tileGeometry.rotateX(-Math.PI / 2);
    this.tileMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true,
    });

    // 7. Dynamic Groups
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    this.gateVistaGroup = new THREE.Group();
    this.scene.add(this.gateVistaGroup);

    this.animalGroup = new THREE.Group();
    this.scene.add(this.animalGroup);

    // 8. Elegant & Aesthetic Ground-Flat Tile Cursor (Penanda Petak Low-Poly Flat Super Clean)
    this.tileCursorGroup = new THREE.Group();

    // A. Soft Glowing Soil Fill Mesh (Plane lying flat on ground)
    const fillGeo = new THREE.PlaneGeometry(this.tileSize * 0.94, this.tileSize * 0.94);
    fillGeo.rotateX(-Math.PI / 2);
    this.cursorFillMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cursorFillMesh = new THREE.Mesh(fillGeo, this.cursorFillMat);
    cursorFillMesh.position.y = 0.028;
    this.tileCursorGroup.add(cursorFillMesh);

    // B. Clean Flat 2D Perimeter Line Loop (Lies flat on tile surface at Y = 0.035, NO vertical 3D box wires!)
    const halfS = (this.tileSize * 0.96) / 2;
    const borderPoints = [
      new THREE.Vector3(-halfS, 0.035, -halfS),
      new THREE.Vector3(halfS, 0.035, -halfS),
      new THREE.Vector3(halfS, 0.035, halfS),
      new THREE.Vector3(-halfS, 0.035, halfS),
      new THREE.Vector3(-halfS, 0.035, -halfS),
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    this.cursorBorderMat = new THREE.LineBasicMaterial({ color: 0x86efac, linewidth: 2, transparent: true, opacity: 0.85 });
    const cursorBorderMesh = new THREE.Line(borderGeo, this.cursorBorderMat);
    this.tileCursorGroup.add(cursorBorderMesh);

    // C. 4 Flat Corner Reticle Accents (Subtle gold brackets flat on tile corners at Y = 0.040)
    const bracketPoints: number[] = [];
    const bLen = this.tileSize * 0.20;
    // Top-Left
    bracketPoints.push(-halfS, 0.040, -halfS + bLen, -halfS, 0.040, -halfS, -halfS + bLen, 0.040, -halfS);
    // Top-Right
    bracketPoints.push(halfS - bLen, 0.040, -halfS, halfS, 0.040, -halfS, halfS, 0.040, -halfS + bLen);
    // Bottom-Right
    bracketPoints.push(halfS, 0.040, halfS - bLen, halfS, 0.040, halfS, halfS - bLen, 0.040, halfS);
    // Bottom-Left
    bracketPoints.push(-halfS + bLen, 0.040, halfS, -halfS, 0.040, halfS, -halfS, 0.040, halfS - bLen);

    const bracketGeo = new THREE.BufferGeometry();
    bracketGeo.setAttribute('position', new THREE.Float32BufferAttribute(bracketPoints, 3));
    this.cursorCornerMat = new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 3, transparent: true, opacity: 0.95 });
    const bracketMesh = new THREE.LineSegments(bracketGeo, this.cursorCornerMat);
    this.tileCursorGroup.add(bracketMesh);

    this.tileCursor = this.tileCursorGroup;
    this.scene.add(this.tileCursorGroup);

    // 9. Smart 3x3 Sowing Grid Indicator
    this.tileCursor3x3 = new THREE.Group();
    this.cursor3x3Mat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });

    const outer3x3Geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.tileSize * 3 * 0.98, 0.22, this.tileSize * 3 * 0.98));
    const outer3x3Mesh = new THREE.Mesh(outer3x3Geo, this.cursor3x3Mat);
    this.tileCursor3x3.add(outer3x3Mesh);

    // Add 9 inner sub-cell wireframes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const subGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.tileSize * 0.94, 0.22, this.tileSize * 0.94));
        const subMesh = new THREE.Mesh(subGeo, this.cursor3x3Mat);
        subMesh.position.set(dx * this.tileSize, 0, dz * this.tileSize);
        this.tileCursor3x3.add(subMesh);
      }
    }
    this.tileCursor3x3.position.y = 0.12;
    this.tileCursor3x3.visible = false;
    this.scene.add(this.tileCursor3x3);

    // Player
    this.playerMesh = ModelFactory.createPlayer(this.activePalette);
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const initX = 7 * this.tileSize - halfW + this.tileSize / 2;
    const initZ = 12 * this.tileSize - halfH + this.tileSize / 2;
    this.playerMesh.position.set(initX, 0.2, initZ);
    this.scene.add(this.playerMesh);

    // Setup Environment
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();

    // Initialize RAM Lookup Table (LUT) and Preheat WebGL Shader Pipeline
    MemoryHeapManager.initializeLUT(this.activePalette);
    ShaderPipelinePreheater.preheatPipeline(this.renderer, this.camera, this.activePalette);

    // Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    this.setupRaycasting();

    this.lastFpsUpdate = performance.now();
    this.renderer.setAnimationLoop(this.animate);
  }

  // Meadow Base with Large-Scale Organic Ghibli Vertex Color Noise (Destroys Repetition Completely)
  private setupSurroundingMeadow() {
    if (this.meadowMesh) {
      this.scene.remove(this.meadowMesh);
      this.meadowMesh.geometry.dispose();
      (this.meadowMesh.material as THREE.Material).dispose();
    }

    // Optimized 64x64 vertex grid over 380 meters for smooth Ghibli rolling landscape color variations
    const meadowGeo = new THREE.PlaneGeometry(380, 380, 64, 64);
    const meadowTex = grassTex.clone();
    meadowTex.wrapS = THREE.RepeatWrapping;
    meadowTex.wrapT = THREE.RepeatWrapping;
    meadowTex.repeat.set(32, 32);
    meadowTex.center.set(0.5, 0.5);
    meadowTex.rotation = Math.PI * 0.35; // Slanted diagonally matching 3D perspective angle
    meadowTex.needsUpdate = true;

    // Multi-Octave Organic Terrain Shade Noise across 400m field (Sunlit Lime + Vibrant Emerald + Deep Forest Shadow)
    const pos = meadowGeo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getY(i); // PlaneGeometry flat Y is local Z

      // 4-octave spatial frequency noise combining macro hills, mid-range patches, fine meadow ripples, and micro tuft shading
      const n1 = Math.sin(vx * 0.015 + vz * 0.012) * 0.5 + 0.5; // Macro rolling terrain
      const n2 = Math.cos(vx * 0.045 - vz * 0.038) * 0.5 + 0.5; // Mid-frequency shade patches
      const n3 = Math.sin(vx * 0.11 + vz * 0.095) * 0.5 + 0.5;  // Fine Ghibli meadow ripples
      const n4 = Math.cos(vx * 0.22 - vz * 0.19) * 0.5 + 0.5;   // Micro grass shading

      const blend = n1 * 0.42 + n2 * 0.30 + n3 * 0.18 + n4 * 0.10;

      // Multi-tone Ghibli Color Palette:
      // - Sunlit Lime Green (high ridges & sunlit patches)
      // - Vibrant Emerald Green (lush rolling central fields)
      // - Deep Forest Shadow (cool canopy shade)
      let r = 0.82, g = 0.95, b = 0.72;

      if (blend > 0.65) {
        // Sunlit Lime Green (high ridges bathed in sunlight)
        const t = (blend - 0.65) / 0.35;
        r = 0.88 + t * 0.12;
        g = 0.98 + t * 0.02;
        b = 0.62 - t * 0.12;
      } else if (blend > 0.42) {
        // Vibrant Emerald Green (lush Ghibli central meadow)
        const t = (blend - 0.42) / 0.23;
        r = 0.76 + t * 0.12;
        g = 0.92 + t * 0.06;
        b = 0.72 - t * 0.10;
      } else if (blend > 0.22) {
        // Warm Mossy Transition
        const t = (blend - 0.22) / 0.20;
        r = 0.68 + t * 0.08;
        g = 0.84 + t * 0.08;
        b = 0.66 + t * 0.06;
      } else {
        // Deep Forest Shadow (cool forest canopy shadow)
        const t = blend / 0.22;
        r = 0.56 + t * 0.12;
        g = 0.70 + t * 0.14;
        b = 0.58 + t * 0.08;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    meadowGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const meadowMat = new THREE.MeshLambertMaterial({
      map: meadowTex,
      vertexColors: true,
      color: 0xffffff,
    });
    this.meadowMesh = new THREE.Mesh(meadowGeo, meadowMat);
    this.meadowMesh.rotation.x = -Math.PI / 2;
    this.meadowMesh.position.y = 0;
    this.meadowMesh.frustumCulled = true;
    this.scene.add(this.meadowMesh);
  }

  public setOnTileTap(cb: (x: number, z: number) => void) {
    this.onTileTapCallback = cb;
  }

  public setOnExitReached(cb: (target: MapLocation, spawnPos?: { x: number; z: number }) => void) {
    this.onExitReachedCallback = cb;
  }

  // Handle direct touch tap on 3D tiles
  private setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointer = (clientX: number, clientY: number) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      if (this.groundInstancedMesh) {
        const intersects = raycaster.intersectObject(this.groundInstancedMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const id = intersects[0].instanceId;
          const gx = id % this.gridWidth;
          const gz = Math.floor(id / this.gridWidth);

          if (this.onTileTapCallback) {
            this.onTileTapCallback(gx, gz);
          }
        }
      }
    };

    let touchStartTime = 0;
    let startX = 0;
    let startY = 0;

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      touchStartTime = performance.now();
      startX = e.clientX;
      startY = e.clientY;
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const diffTime = performance.now() - touchStartTime;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (diffTime < 400 && dist < 14) {
        handlePointer(e.clientX, e.clientY);
      }
    });
  }

  // Create Ground Grid using Texture-Mapped Instanced Meshes
  public setupGroundGrid() {
    if (this.groundInstancedMesh) {
      this.scene.remove(this.groundInstancedMesh);
      this.groundInstancedMesh.dispose();
    }
    if (this.visualGrassMesh) {
      this.scene.remove(this.visualGrassMesh);
      this.visualGrassMesh.dispose();
      this.scene.remove(this.visualSoilMesh);
      this.visualSoilMesh.dispose();
      if (this.visualPathStraightMeshes && this.visualPathStraightMeshes.length > 0) {
        this.visualPathStraightMeshes.forEach((m) => {
          this.scene.remove(m);
          m.dispose();
        });
        this.visualPathStraightMeshes = [];
      }
      if (this.visualPathTJunctionMesh) {
        this.scene.remove(this.visualPathTJunctionMesh);
        this.visualPathTJunctionMesh.dispose();
      }
      if (this.visualPathCornerMesh) {
        this.scene.remove(this.visualPathCornerMesh);
        this.visualPathCornerMesh.dispose();
      }
      if (this.visualPathCrossroadMesh) {
        this.scene.remove(this.visualPathCrossroadMesh);
        this.visualPathCrossroadMesh.dispose();
      }
      if (this.visualPathDeadEndMesh) {
        this.scene.remove(this.visualPathDeadEndMesh);
        this.visualPathDeadEndMesh.dispose();
      }
      this.scene.remove(this.visualSandMesh);
      this.visualSandMesh.dispose();
      this.scene.remove(this.visualRockMesh);
      this.visualRockMesh.dispose();
      this.scene.remove(this.visualWaterMesh);
      this.visualWaterMesh.dispose();
      if (this.visualWaterFoamMesh) {
        this.scene.remove(this.visualWaterFoamMesh);
        this.visualWaterFoamMesh.dispose();
      }
      if (this.visualSoilBorderMesh) {
        this.scene.remove(this.visualSoilBorderMesh);
        this.visualSoilBorderMesh.dispose();
      }
      if (this.visualTuftsMesh) {
        this.scene.remove(this.visualTuftsMesh);
        this.visualTuftsMesh.dispose();
        this.scene.remove(this.visualFlowersMesh);
        this.visualFlowersMesh.dispose();
      }
    }

    const totalTiles = this.gridWidth * this.gridHeight;
    this.groundInstancedMesh = new THREE.InstancedMesh(this.tileGeometry, new THREE.MeshBasicMaterial({ visible: false }), totalTiles);
    this.groundInstancedMesh.frustumCulled = true;

    this.visualGrassMesh = new THREE.InstancedMesh(this.tileGeometry, grassMat, totalTiles);
    this.visualSoilMesh = new THREE.InstancedMesh(this.tileGeometry, soilMat, totalTiles);
    
    // Auto-Tiling Ghibli Watercolor Path Decal Meshes
    this.visualPathStraightMeshes = farmDirtStraightMats.map((mat) => {
      const activeMat = this.currentLocation === 'farm' ? mat : pathMat;
      const mesh = new THREE.InstancedMesh(this.tileGeometry, activeMat, totalTiles);
      mesh.frustumCulled = true;
      return mesh;
    });

    const activeTMat = this.currentLocation === 'farm' ? farmDirtTJunctionMat : pathMat;
    this.visualPathTJunctionMesh = new THREE.InstancedMesh(this.tileGeometry, activeTMat, totalTiles);
    this.visualPathTJunctionMesh.frustumCulled = true;

    const activeCornerMat = this.currentLocation === 'farm' ? farmDirtCornerMat : pathMat;
    this.visualPathCornerMesh = new THREE.InstancedMesh(this.tileGeometry, activeCornerMat, totalTiles);
    this.visualPathCornerMesh.frustumCulled = true;

    const activeCrossroadMat = this.currentLocation === 'farm' ? farmDirtCrossroadMat : pathMat;
    this.visualPathCrossroadMesh = new THREE.InstancedMesh(this.tileGeometry, activeCrossroadMat, totalTiles);
    this.visualPathCrossroadMesh.frustumCulled = true;

    const activeDeadEndMat = this.currentLocation === 'farm' ? farmDirtDeadEndMat : pathMat;
    this.visualPathDeadEndMesh = new THREE.InstancedMesh(this.tileGeometry, activeDeadEndMat, totalTiles);
    this.visualPathDeadEndMesh.frustumCulled = true;

    this.visualSandMesh = new THREE.InstancedMesh(this.tileGeometry, sandMat, totalTiles);
    this.visualRockMesh = new THREE.InstancedMesh(this.tileGeometry, rockMat, totalTiles);
    this.visualWaterMesh = new THREE.InstancedMesh(this.tileGeometry, waterMat, totalTiles);

    // Stylized Multi-Blade Organic BotW Grass Tufts
    const tuftGeo = createBotWTuftGeometry();
    const tuftMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const flowerGeo = new THREE.DodecahedronGeometry(0.045);
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });

    this.visualTuftsMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, totalTiles * 2);
    this.visualFlowersMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, totalTiles);

    // Soft Earthen Dirt Edge Decal & Shoreline Foam
    const borderGeo = new THREE.PlaneGeometry(this.tileSize * 1.15, this.tileSize * 1.15);
    borderGeo.rotateX(-Math.PI / 2);
    this.visualSoilBorderMesh = new THREE.InstancedMesh(borderGeo, soilBorderMat, totalTiles);
    this.visualSoilBorderMesh.frustumCulled = true;

    const foamGeo = new THREE.PlaneGeometry(this.tileSize * 1.05, this.tileSize * 1.05);
    foamGeo.rotateX(-Math.PI / 2);
    this.visualWaterFoamMesh = new THREE.InstancedMesh(foamGeo, waterFoamMat, totalTiles);
    this.visualWaterFoamMesh.frustumCulled = true;

    // Instance Color Buffers for Watered Soil & Multi-Tone Flowers
    this.visualSoilMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(totalTiles * 3), 3);
    this.visualFlowersMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(totalTiles * 3), 3);

    this.visualGrassMesh.frustumCulled = true;
    this.visualSoilMesh.frustumCulled = true;
    this.visualPathStraightMeshes.forEach((m) => { m.frustumCulled = true; });
    this.visualSandMesh.frustumCulled = true;
    this.visualRockMesh.frustumCulled = true;
    this.visualWaterMesh.frustumCulled = true;
    this.visualTuftsMesh.frustumCulled = true;
    this.visualFlowersMesh.frustumCulled = true;

    this.scene.add(this.groundInstancedMesh);
    this.scene.add(this.visualGrassMesh);
    this.scene.add(this.visualSoilBorderMesh);
    this.scene.add(this.visualSoilMesh);
    this.visualPathStraightMeshes.forEach((m) => { this.scene.add(m); });
    this.scene.add(this.visualPathTJunctionMesh);
    this.scene.add(this.visualPathCornerMesh);
    this.scene.add(this.visualPathCrossroadMesh);
    this.scene.add(this.visualPathDeadEndMesh);
    this.scene.add(this.visualSandMesh);
    this.scene.add(this.visualRockMesh);
    this.scene.add(this.visualWaterMesh);
    this.scene.add(this.visualWaterFoamMesh);
    this.scene.add(this.visualTuftsMesh);
    this.scene.add(this.visualFlowersMesh);
  }

  // Gate Vistas: Detailed Roadside Fences, Glowing Lanterns, Signposts, and Distant Regional Landmarks
  private setupGateVistas() {
    while (this.gateVistaGroup.children.length > 0) {
      const child = this.gateVistaGroup.children[0];
      this.gateVistaGroup.remove(child);
      if ((child as any).dispose) (child as any).dispose();
    }

    if (this.currentLocation === 'house_interior') return;

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const regionConfig = WorldRegistry.getRegion(this.currentLocation);

    for (const gate of regionConfig.gates) {
      if (!gate.passageOpeningSide) continue;

      const gMinX = gate.triggerArea.minX * this.tileSize - halfW + this.tileSize / 2;
      const gMaxX = gate.triggerArea.maxX * this.tileSize - halfW + this.tileSize / 2;
      const gMinZ = gate.triggerArea.minZ * this.tileSize - halfH + this.tileSize / 2;
      const gMaxZ = gate.triggerArea.maxZ * this.tileSize - halfH + this.tileSize / 2;
      const gCenterX = (gMinX + gMaxX) / 2;
      const gCenterZ = (gMinZ + gMaxZ) / 2;

      // 1. Trail Directional Signpost at the road entrance
      const sign = ModelFactory.createSignpost();
      if (gate.passageOpeningSide === 'north') {
        sign.position.set(gCenterX + 1.8, 0, gCenterZ - 1.2);
        sign.rotation.y = Math.PI;
      } else if (gate.passageOpeningSide === 'south') {
        sign.position.set(gCenterX + 1.8, 0, gCenterZ + 1.2);
      } else if (gate.passageOpeningSide === 'west') {
        sign.position.set(gCenterX - 1.2, 0, gCenterZ + 1.8);
        sign.rotation.y = Math.PI / 2;
      } else {
        sign.position.set(gCenterX + 1.2, 0, gCenterZ + 1.8);
        sign.rotation.y = -Math.PI / 2;
      }
      this.gateVistaGroup.add(sign);

      // 2. Roadside Wooden Fences lining both sides of the outward road
      const fenceDists = [2.2, 5.2, 8.2, 11.2];
      for (const d of fenceDists) {
        if (gate.passageOpeningSide === 'north') {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX + curveOffset;
          const rz = gCenterZ - d;

          const fLeft = ModelFactory.createRusticFence();
          fLeft.position.set(rx - 1.4, 0, rz);
          fLeft.rotation.y = Math.PI / 2;
          this.gateVistaGroup.add(fLeft);

          const fRight = ModelFactory.createRusticFence();
          fRight.position.set(rx + 1.4, 0, rz);
          fRight.rotation.y = Math.PI / 2;
          this.gateVistaGroup.add(fRight);
        } else if (gate.passageOpeningSide === 'south') {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX + curveOffset;
          const rz = gCenterZ + d;

          const fLeft = ModelFactory.createRusticFence();
          fLeft.position.set(rx - 1.4, 0, rz);
          fLeft.rotation.y = Math.PI / 2;
          this.gateVistaGroup.add(fLeft);

          const fRight = ModelFactory.createRusticFence();
          fRight.position.set(rx + 1.4, 0, rz);
          fRight.rotation.y = Math.PI / 2;
          this.gateVistaGroup.add(fRight);
        }
      }

      // Roadside Glowing Lantern Posts
      const lampDists = [3.5, 9.5];
      for (const d of lampDists) {
        if (gate.passageOpeningSide === 'north') {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const lamp = ModelFactory.createRoadsideLantern();
          lamp.position.set(gCenterX + curveOffset + 1.5, 0, gCenterZ - d);
          this.gateVistaGroup.add(lamp);
        } else if (gate.passageOpeningSide === 'south') {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const lamp = ModelFactory.createRoadsideLantern();
          lamp.position.set(gCenterX + curveOffset + 1.5, 0, gCenterZ + d);
          this.gateVistaGroup.add(lamp);
        }
      }

      // 3. Destination Vista Landmark at the trail's end (d = 14 to 16m)
      const vistaTarget = gate.targetLocation;
      if (gate.passageOpeningSide === 'north') {
        const d = 15.0;
        const curveOffset = Math.sin((d - 4.0) * 0.28) * 2.2;
        const vx = gCenterX + curveOffset;
        const vz = gCenterZ - d;

        if (vistaTarget === 'crossroads') {
          const bench = ModelFactory.createRestBench();
          bench.position.set(vx + 1.8, 0, vz);
          bench.rotation.y = Math.PI / 4;
          this.gateVistaGroup.add(bench);

          const cSign = ModelFactory.createSignpost();
          cSign.position.set(vx - 1.6, 0, vz - 0.8);
          this.gateVistaGroup.add(cSign);
        } else if (vistaTarget === 'village') {
          const lamp = ModelFactory.createRoadsideLantern();
          lamp.position.set(vx - 1.2, 0, vz);
          this.gateVistaGroup.add(lamp);
        } else if (vistaTarget === 'mountain') {
          const crystal = ModelFactory.createCrystalCluster();
          crystal.position.set(vx + 1.2, 0, vz);
          this.gateVistaGroup.add(crystal);
        }
      } else if (gate.passageOpeningSide === 'south') {
        const d = 15.0;
        const curveOffset = Math.sin((d - 4.0) * 0.28) * 2.2;
        const vx = gCenterX + curveOffset;
        const vz = gCenterZ + d;

        if (vistaTarget === 'crossroads') {
          const bench = ModelFactory.createRestBench();
          bench.position.set(vx + 1.8, 0, vz);
          this.gateVistaGroup.add(bench);
        } else if (vistaTarget === 'farm') {
          const fence = ModelFactory.createRusticFence();
          fence.position.set(vx, 0, vz + 1.5);
          this.gateVistaGroup.add(fence);
        }
      }

      // 4. Artistic Stone-to-Dirt Transition Threshold (Stepping Stones & Dispersed Flagstones)
      if (this.currentLocation === 'farm' && gate.passageOpeningSide === 'north') {
        const stoneGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.035, 7);
        const stoneMat = new THREE.MeshLambertMaterial({ map: pathTex, color: 0xe2e8f0 });
        const smallStoneGeo = new THREE.DodecahedronGeometry(0.09, 0);
        const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

        // Cluster of naturally embedded transition flagstones & stepping stones
        const stoneOffsets: [number, number, number, number][] = [
          // Gate threshold (paved entrance pavers)
          [-0.32, 0.2, 0.95, 0.2],
          [ 0.00, 0.1, 1.05, -0.4],
          [ 0.32, 0.25, 0.95, 0.6],
          [-0.18, 0.5, 0.85, -0.1],
          [ 0.20, 0.6, 0.90, 0.3],
          // Transition zone (dispersed stepping stones tapering into the single dirt trail)
          [-0.25, 1.1, 0.82, 0.5],
          [ 0.12, 1.3, 0.88, -0.6],
          [ 0.28, 1.6, 0.78, 0.2],
          [-0.15, 2.0, 0.72, 0.8],
          [ 0.22, 2.3, 0.68, -0.3],
          // Last scattered subtle river stepping stones
          [-0.18, 2.8, 0.60, 0.4],
          [ 0.14, 3.1, 0.55, -0.5],
        ];

        stoneOffsets.forEach(([ox, oz, scale, rot]) => {
          const stone = new THREE.Mesh(stoneGeo, stoneMat);
          stone.position.set(gCenterX + ox, 0.018, gCenterZ + oz);
          stone.scale.set(scale, 1.0, scale);
          stone.rotation.y = rot;
          this.gateVistaGroup.add(stone);
        });

        // Scatter tiny river pebbles along the road edges
        for (let i = 0; i < 16; i++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 0.8 + Math.random() * 0.6;
          const pz = gCenterZ + Math.random() * 3.2;
          const px = gCenterX + (Math.random() > 0.5 ? pDist : -pDist);
          const pebble = new THREE.Mesh(smallStoneGeo, pebbleMat);
          pebble.position.set(px, 0.015, pz);
          pebble.scale.set(1.0, 0.5, 1.2);
          pebble.rotation.y = pAngle;
          this.gateVistaGroup.add(pebble);
        }
      }
    }
  }

  // Instanced Stylized Trees & Deep Outer Broadleaf Forest Canopy (Cloud Oaks + Golden Birches + Sakura Blossoms)
  private setupInstancedTrees() {
    if (this.treeTrunkInstanced) {
      this.scene.remove(this.treeTrunkInstanced);
      this.treeTrunkInstanced.dispose();
    }
    if (this.treeOakLeafInstanced) {
      this.scene.remove(this.treeOakLeafInstanced);
      this.treeOakLeafInstanced.dispose();
    }
    if (this.treeBirchLeafInstanced) {
      this.scene.remove(this.treeBirchLeafInstanced);
      this.treeBirchLeafInstanced.dispose();
    }
    if (this.treeBlossomLeafInstanced) {
      this.scene.remove(this.treeBlossomLeafInstanced);
      this.treeBlossomLeafInstanced.dispose();
    }
    if (this.outerRoadInstancedMesh) {
      this.scene.remove(this.outerRoadInstancedMesh);
      this.outerRoadInstancedMesh.dispose();
    }

    // Inside the house, no perimeter forest trees needed
    if (this.currentLocation === 'house_interior') {
      return;
    }

    // Populate Gate Vistas (fences, lanterns, signposts, and destination landmarks)
    this.setupGateVistas();

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const borderDistX = halfW - 1.2;
    const borderDistZ = halfH - 1.2;

    const regionConfig = WorldRegistry.getRegion(this.currentLocation);

    // 1. Create Outward Winding Cobblestone Roads for Gates (eliminates the "jalan buntu" illusion!)
    const outerRoadPositions: { x: number; z: number }[] = [];
    const roadClearancePoints: { x: number; z: number; radius: number }[] = [];

    for (const gate of regionConfig.gates) {
      if (!gate.passageOpeningSide) continue;
      const gMinX = gate.triggerArea.minX * this.tileSize - halfW + this.tileSize / 2;
      const gMaxX = gate.triggerArea.maxX * this.tileSize - halfW + this.tileSize / 2;
      const gMinZ = gate.triggerArea.minZ * this.tileSize - halfH + this.tileSize / 2;
      const gMaxZ = gate.triggerArea.maxZ * this.tileSize - halfH + this.tileSize / 2;
      const gCenterX = (gMinX + gMaxX) / 2;
      const gCenterZ = (gMinZ + gMaxZ) / 2;

      if (gate.passageOpeningSide === 'north') {
        for (let d = 0.6; d <= 16.0; d += 1.1) {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX + curveOffset;
          const rz = gCenterZ - d;
          outerRoadPositions.push({ x: rx - 0.55, z: rz });
          outerRoadPositions.push({ x: rx + 0.55, z: rz });
          roadClearancePoints.push({ x: rx, z: rz, radius: 1.85 });
        }
      } else if (gate.passageOpeningSide === 'south') {
        for (let d = 0.6; d <= 16.0; d += 1.1) {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX + curveOffset;
          const rz = gCenterZ + d;
          outerRoadPositions.push({ x: rx - 0.55, z: rz });
          outerRoadPositions.push({ x: rx + 0.55, z: rz });
          roadClearancePoints.push({ x: rx, z: rz, radius: 1.85 });
        }
      } else if (gate.passageOpeningSide === 'west') {
        for (let d = 0.6; d <= 16.0; d += 1.1) {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX - d;
          const rz = gCenterZ + curveOffset;
          outerRoadPositions.push({ x: rx, z: rz - 0.55 });
          outerRoadPositions.push({ x: rx, z: rz + 0.55 });
          roadClearancePoints.push({ x: rx, z: rz, radius: 1.85 });
        }
      } else if (gate.passageOpeningSide === 'east') {
        for (let d = 0.6; d <= 16.0; d += 1.1) {
          const curveOffset = d > 4.0 ? Math.sin((d - 4.0) * 0.28) * 2.2 : 0;
          const rx = gCenterX + d;
          const rz = gCenterZ + curveOffset;
          outerRoadPositions.push({ x: rx, z: rz - 0.55 });
          outerRoadPositions.push({ x: rx, z: rz + 0.55 });
          roadClearancePoints.push({ x: rx, z: rz, radius: 1.85 });
        }
      }
    }

    if (outerRoadPositions.length > 0) {
      const roadGeo = new THREE.PlaneGeometry(this.tileSize * 1.02, this.tileSize * 1.02);
      roadGeo.rotateX(-Math.PI / 2);
      this.outerRoadInstancedMesh = new THREE.InstancedMesh(roadGeo, pathMat, outerRoadPositions.length);
      const rDummy = new THREE.Object3D();
      for (let i = 0; i < outerRoadPositions.length; i++) {
        const rp = outerRoadPositions[i];
        rDummy.position.set(rp.x, 0.012, rp.z);
        rDummy.updateMatrix();
        this.outerRoadInstancedMesh.setMatrixAt(i, rDummy.matrix);
      }
      this.outerRoadInstancedMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(this.outerRoadInstancedMesh);
    }

    // 2. Gather blocked clearance zones for tree placement
    const blockedZones: { x: number; z: number; radius: number }[] = [];

    // Gates archway area
    for (const gate of regionConfig.gates) {
      const gMinX = gate.triggerArea.minX * this.tileSize - halfW + this.tileSize / 2;
      const gMaxX = gate.triggerArea.maxX * this.tileSize - halfW + this.tileSize / 2;
      const gMinZ = gate.triggerArea.minZ * this.tileSize - halfH + this.tileSize / 2;
      const gMaxZ = gate.triggerArea.maxZ * this.tileSize - halfH + this.tileSize / 2;
      const gCenterX = (gMinX + gMaxX) / 2;
      const gCenterZ = (gMinZ + gMaxZ) / 2;
      blockedZones.push({ x: gCenterX, z: gCenterZ, radius: 3.8 });
    }

    // Include road clearance corridor so trees flank the road without stepping on it
    blockedZones.push(...roadClearancePoints);

    // Static props (Farmhouse, Windmill, Shipping Bin, Gate structures, etc.)
    for (const prop of regionConfig.staticProps) {
      const pX = prop.gridX * this.tileSize - halfW + this.tileSize / 2;
      const pZ = prop.gridZ * this.tileSize - halfH + this.tileSize / 2;
      const r = prop.type === 'gate' ? 3.8 : (prop.type === 'farmhouse' ? 4.8 : 3.0);
      blockedZones.push({ x: pX, z: pZ, radius: r });
    }

    const isTreeBlocked = (tx: number, tz: number): boolean => {
      for (const b of blockedZones) {
        if (Math.hypot(tx - b.x, tz - b.z) < b.radius) {
          return true;
        }
      }
      return false;
    };

    interface TreeInstanceData {
      x: number;
      z: number;
      scale: number;
      rot: number;
      colorIdx: number;
      type: 'oak' | 'birch' | 'blossom';
    }

    const allTrees: TreeInstanceData[] = [];
    const oakTrees: TreeInstanceData[] = [];
    const birchTrees: TreeInstanceData[] = [];
    const blossomTrees: TreeInstanceData[] = [];
    const spacing = 3.2; // Optimized spacing for smooth 60 FPS performance while maintaining lush canopy
    const addCandidate = (x: number, z: number, baseScale = 1.0) => {
      if (isTreeBlocked(x, z)) return;
      const hash = Math.abs(Math.floor(x * 79 + z * 41));
      const scale = baseScale * (1.10 + (hash % 5) * 0.10);
      const rot = ((hash % 360) * Math.PI) / 180;
      const colorIdx = hash % 5;

      // 3 Distinct Non-Pine Broadleaf Species (40% Cloud Oak, 35% Golden Birch, 25% Sakura Blossom)
      const typeMod = hash % 10;
      const type: 'oak' | 'birch' | 'blossom' = typeMod < 4 ? 'oak' : (typeMod < 7 ? 'birch' : 'blossom');

      const tree = { x, z, scale, rot, colorIdx, type };
      allTrees.push(tree);
      if (type === 'oak') {
        oakTrees.push(tree);
      } else if (type === 'birch') {
        birchTrees.push(tree);
      } else {
        blossomTrees.push(tree);
      }
    };

    // 3. Dense Multi-Layer Forest Canopy Illusion (Spans 18 meters outward into the horizon)
    const minXOut = -borderDistX - 18.0;
    const maxXOut = borderDistX + 18.0;
    const minZOut = -borderDistZ - 18.0;
    const maxZOut = borderDistZ + 18.0;

    for (let z = minZOut; z <= maxZOut; z += spacing) {
      for (let x = minXOut; x <= maxXOut; x += spacing) {
        const isInsidePlayArea =
          x > -borderDistX + 0.6 &&
          x < borderDistX - 0.6 &&
          z > -borderDistZ + 0.6 &&
          z < borderDistZ - 0.6;

        if (isInsidePlayArea) continue;

        // Subtle organic jitter to avoid artificial grid rows in the wild forest
        const hash = Math.abs(Math.floor(x * 73 + z * 37));
        const jitterX = ((hash % 9) - 4) * 0.16;
        const jitterZ = (((hash >> 3) % 9) - 4) * 0.16;
        const candidateX = x + jitterX;
        const candidateZ = z + jitterZ;

        // Distance from playable fence border (0 = right on boundary, > 0 = further out in forest)
        const distFromBorder = Math.max(
          Math.max(-borderDistX - candidateX, candidateX - borderDistX, 0),
          Math.max(-borderDistZ - candidateZ, candidateZ - borderDistZ, 0)
        );

        // Gradually taller trees forming a majestic amphitheater backdrop
        const baseScale = 0.95 + Math.min(distFromBorder * 0.035, 0.55);
        addCandidate(candidateX, candidateZ, baseScale);
      }
    }

    const totalCount = allTrees.length;
    if (totalCount === 0) return;

    // A. Trunk Instanced Mesh (Shared by all broadleaf trees)
    const trunkGeo = new THREE.CylinderGeometry(0.20, 0.38, 1.4, 6);
    this.treeTrunkInstanced = new THREE.InstancedMesh(trunkGeo, treeTrunkMat, totalCount);
    this.treeTrunkInstanced.frustumCulled = true;

    // B. Studio Ghibli Fluffy Cloud Oak Foliage Mesh
    const oakGeo = createCloudOakLeafGeometry();
    this.treeOakLeafInstanced = new THREE.InstancedMesh(oakGeo, treeLeafMat, Math.max(oakTrees.length, 1));
    this.treeOakLeafInstanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(oakTrees.length, 1) * 3), 3);
    this.treeOakLeafInstanced.frustumCulled = true;

    // C. Golden Birch / Autumn Maple Foliage Mesh
    const birchGeo = createBirchLeafGeometry();
    this.treeBirchLeafInstanced = new THREE.InstancedMesh(birchGeo, treeLeafMat, Math.max(birchTrees.length, 1));
    this.treeBirchLeafInstanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(birchTrees.length, 1) * 3), 3);
    this.treeBirchLeafInstanced.frustumCulled = true;

    // D. Sakura / Apple Blossom Foliage Mesh
    const blossomGeo = createBlossomLeafGeometry();
    this.treeBlossomLeafInstanced = new THREE.InstancedMesh(blossomGeo, treeLeafMat, Math.max(blossomTrees.length, 1));
    this.treeBlossomLeafInstanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(blossomTrees.length, 1) * 3), 3);
    this.treeBlossomLeafInstanced.frustumCulled = true;

    const dummy = new THREE.Object3D();

    // Natural Anime Foliage Color Palettes
    const oakPalette = [
      new THREE.Color(0x86efac), // Vibrant spring oak green
      new THREE.Color(0x4ade80), // Lush broadleaf emerald
      new THREE.Color(0x22c55e), // Rich forest canopy green
      new THREE.Color(0x16a34a), // Deep ancient wood green
      new THREE.Color(0xbbf7d0), // Soft moss lime highlight
    ];

    const birchPalette = [
      new THREE.Color(0xfef08a), // Sunlit golden honey
      new THREE.Color(0xfacc15), // Vibrant birch gold
      new THREE.Color(0xfbbf24), // Warm autumn amber
      new THREE.Color(0xf59e0b), // Deep maple ochre
      new THREE.Color(0xfde047), // Soft sunny lime
    ];

    const blossomPalette = [
      new THREE.Color(0xfbcfe8), // Sakura soft pink
      new THREE.Color(0xf472b6), // Spring rose blossom
      new THREE.Color(0xfda4af), // Gentle peach blossom
      new THREE.Color(0xfef08a), // Golden blossom pistil
      new THREE.Color(0xdcfce7), // Fresh spring sprout green
    ];

    // Populate trunks
    for (let i = 0; i < totalCount; i++) {
      const p = allTrees[i];
      dummy.position.set(p.x, 0.7 * p.scale, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      this.treeTrunkInstanced.setMatrixAt(i, dummy.matrix);
    }

    // Populate Cloud Oaks
    for (let i = 0; i < oakTrees.length; i++) {
      const p = oakTrees[i];
      dummy.position.set(p.x, 0.7 * p.scale, p.z);
      dummy.rotation.set(0, p.rot - 0.4, 0);
      dummy.scale.set(p.scale * 1.05, p.scale * 1.05, p.scale * 1.05);
      dummy.updateMatrix();
      this.treeOakLeafInstanced.setMatrixAt(i, dummy.matrix);
      this.treeOakLeafInstanced.setColorAt(i, oakPalette[p.colorIdx]);
    }

    // Populate Golden Birches
    for (let i = 0; i < birchTrees.length; i++) {
      const p = birchTrees[i];
      dummy.position.set(p.x, 0.7 * p.scale, p.z);
      dummy.rotation.set(0, p.rot + 0.5, 0);
      dummy.scale.set(p.scale * 0.95, p.scale * 1.15, p.scale * 0.95);
      dummy.updateMatrix();
      this.treeBirchLeafInstanced.setMatrixAt(i, dummy.matrix);
      this.treeBirchLeafInstanced.setColorAt(i, birchPalette[p.colorIdx]);
    }

    // Populate Sakura Blossoms
    for (let i = 0; i < blossomTrees.length; i++) {
      const p = blossomTrees[i];
      dummy.position.set(p.x, 0.7 * p.scale, p.z);
      dummy.rotation.set(0, p.rot + 0.2, 0);
      dummy.scale.set(p.scale * 1.12, p.scale * 0.96, p.scale * 1.12);
      dummy.updateMatrix();
      this.treeBlossomLeafInstanced.setMatrixAt(i, dummy.matrix);
      this.treeBlossomLeafInstanced.setColorAt(i, blossomPalette[p.colorIdx]);
    }

    this.treeTrunkInstanced.instanceMatrix.needsUpdate = true;
    this.treeOakLeafInstanced.instanceMatrix.needsUpdate = true;
    this.treeBirchLeafInstanced.instanceMatrix.needsUpdate = true;
    this.treeBlossomLeafInstanced.instanceMatrix.needsUpdate = true;
    if (this.treeOakLeafInstanced.instanceColor) this.treeOakLeafInstanced.instanceColor.needsUpdate = true;
    if (this.treeBirchLeafInstanced.instanceColor) this.treeBirchLeafInstanced.instanceColor.needsUpdate = true;
    if (this.treeBlossomLeafInstanced.instanceColor) this.treeBlossomLeafInstanced.instanceColor.needsUpdate = true;

    this.treeTrunkInstanced.geometry.computeBoundingSphere();
    this.treeOakLeafInstanced.geometry.computeBoundingSphere();
    this.treeBirchLeafInstanced.geometry.computeBoundingSphere();
    this.treeBlossomLeafInstanced.geometry.computeBoundingSphere();

    this.scene.add(this.treeTrunkInstanced);
    this.scene.add(this.treeOakLeafInstanced);
    this.scene.add(this.treeBirchLeafInstanced);
    this.scene.add(this.treeBlossomLeafInstanced);
  }

  // Fast Tile update with Texture Pack Visual Instanced Meshes
  public updateTiles(tiles: Map<string, TileState>) {
    if (!this.groundInstancedMesh) return;

    const dummy = new THREE.Object3D();
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const totalTiles = this.gridWidth * this.gridHeight;

    const currentCropKeys = new Set<string>();
    const currentDebrisKeys = new Set<string>();

    let gIdx = 0;
    let sIdx = 0;
    let sbIdx = 0;
    const pStraightIndices = [0, 0, 0, 0];
    let pTJunctionIdx = 0;
    let pCornerIdx = 0;
    let pCrossroadIdx = 0;
    let pDeadEndIdx = 0;
    let sdIdx = 0;
    let rIdx = 0;
    let wIdx = 0;
    let wfIdx = 0;
    let tfIdx = 0;
    let flIdx = 0;

    const isCoast = this.currentLocation === 'coast';
    const isMountain = this.currentLocation === 'mountain';

    tiles.forEach((tile) => {
      const idx = tile.z * this.gridWidth + tile.x;
      if (idx < 0 || idx >= this.gridWidth * this.gridHeight) return;

      dummy.scale.set(1, 1, 1);

      const posX = tile.x * this.tileSize - halfW + this.tileSize / 2;
      const posZ = tile.z * this.tileSize - halfH + this.tileSize / 2;

      // Deterministic 4-Direction Rotation Index for Organic Variation
      const rotIdx = (tile.x * 37 + tile.z * 17) % 4;
      const rotAngle = rotIdx * (Math.PI / 2);

      const tileElevY = calculateTileElevation(tile.x, tile.z, this.currentLocation, tile.type);

      // Raycasting Collision Mesh
      dummy.position.set(posX, tileElevY, posZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      this.groundInstancedMesh.setMatrixAt(idx, dummy.matrix);

      // Visual Textured Meshes
      if (tile.type === 'water') {
        dummy.position.set(posX, tileElevY, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualWaterMesh.setMatrixAt(wIdx++, dummy.matrix);

        // Water shoreline foam ring where water borders land
        const northTile = tiles.get(`${tile.x}_${tile.z - 1}`);
        const southTile = tiles.get(`${tile.x}_${tile.z + 1}`);
        const westTile = tiles.get(`${tile.x - 1}_${tile.z}`);
        const eastTile = tiles.get(`${tile.x + 1}_${tile.z}`);
        const hasLandNeighbor = (!northTile || northTile.type !== 'water') ||
                                (!southTile || southTile.type !== 'water') ||
                                (!westTile || westTile.type !== 'water') ||
                                (!eastTile || eastTile.type !== 'water');
        if (hasLandNeighbor) {
          dummy.position.set(posX, tileElevY + 0.005, posZ);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          this.visualWaterFoamMesh.setMatrixAt(wfIdx++, dummy.matrix);
        }
      } else if (tile.type === 'path') {
        const northTile = tiles.get(`${tile.x}_${tile.z - 1}`);
        const southTile = tiles.get(`${tile.x}_${tile.z + 1}`);
        const westTile = tiles.get(`${tile.x - 1}_${tile.z}`);
        const eastTile = tiles.get(`${tile.x + 1}_${tile.z}`);

        const isPathType = (t?: TileState) => t && t.type === 'path';
        const hasN = isPathType(northTile);
        const hasS = isPathType(southTile);
        const hasW = isPathType(westTile);
        const hasE = isPathType(eastTile);

        const neighborCount = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0) + (hasE ? 1 : 0);

        // 1. Render Underlying Meadow Grass base under the path
        dummy.position.set(posX, tileElevY, posZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.visualGrassMesh.setMatrixAt(gIdx++, dummy.matrix);

        // 2. Complete Auto-Tiling for Seamless Connected Road Network
        if (neighborCount === 4) {
          // 4-Way Crossroad (Perempatan)
          dummy.position.set(posX, tileElevY + 0.004, posZ);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1.02, 1, 1.02);
          dummy.updateMatrix();
          this.visualPathCrossroadMesh.setMatrixAt(pCrossroadIdx++, dummy.matrix);
        } else if (neighborCount === 3) {
          // 3-Way T-Junction (Pertigaan)
          let tAngle = 0;
          if (!hasW) {
            // Stem North-South, Branch East (e.g. at farm entrance gate to farmhouse)
            tAngle = 0;
          } else if (!hasE) {
            // Stem North-South, Branch West
            tAngle = Math.PI;
          } else if (!hasS) {
            // Stem West-East, Branch North
            tAngle = Math.PI / 2;
          } else {
            // Stem West-East, Branch South
            tAngle = -Math.PI / 2;
          }
          dummy.position.set(posX, tileElevY + 0.004, posZ);
          dummy.rotation.set(0, tAngle, 0);
          dummy.scale.set(1.02, 1, 1.02);
          dummy.updateMatrix();
          this.visualPathTJunctionMesh.setMatrixAt(pTJunctionIdx++, dummy.matrix);
        } else if (neighborCount === 2) {
          if (hasN && hasS) {
            // Straight North-South
            const varIdx = (tile.x * 37 + tile.z * 19) % 4;
            const shouldFlip = ((tile.x * 13 + tile.z * 7) % 2 === 1);
            const finalAngle = shouldFlip ? Math.PI : 0;
            const microScale = 1.01 + Math.sin(tile.x * 1.7 + tile.z * 2.3) * 0.02;

            dummy.position.set(posX, tileElevY + 0.004, posZ);
            dummy.rotation.set(0, finalAngle, 0);
            dummy.scale.set(microScale, 1, microScale);
            dummy.updateMatrix();
            this.visualPathStraightMeshes[varIdx].setMatrixAt(pStraightIndices[varIdx]++, dummy.matrix);
          } else if (hasW && hasE) {
            // Straight West-East
            const varIdx = (tile.x * 37 + tile.z * 19) % 4;
            const shouldFlip = ((tile.x * 13 + tile.z * 7) % 2 === 1);
            const finalAngle = Math.PI / 2 + (shouldFlip ? Math.PI : 0);
            const microScale = 1.01 + Math.sin(tile.x * 1.7 + tile.z * 2.3) * 0.02;

            dummy.position.set(posX, tileElevY + 0.004, posZ);
            dummy.rotation.set(0, finalAngle, 0);
            dummy.scale.set(microScale, 1, microScale);
            dummy.updateMatrix();
            this.visualPathStraightMeshes[varIdx].setMatrixAt(pStraightIndices[varIdx]++, dummy.matrix);
          } else {
            // Corner Turn (Tikungan Sudut L)
            let cAngle = 0;
            if (hasS && hasE) {
              cAngle = 0;
            } else if (hasE && hasN) {
              cAngle = Math.PI / 2;
            } else if (hasN && hasW) {
              cAngle = Math.PI;
            } else {
              cAngle = -Math.PI / 2;
            }
            dummy.position.set(posX, tileElevY + 0.004, posZ);
            dummy.rotation.set(0, cAngle, 0);
            dummy.scale.set(1.02, 1, 1.02);
            dummy.updateMatrix();
            this.visualPathCornerMesh.setMatrixAt(pCornerIdx++, dummy.matrix);
          }
        } else if (neighborCount === 1) {
          // Dead End Terminal (Ujung Jalan)
          let dAngle = 0;
          if (hasS) dAngle = 0;
          else if (hasW) dAngle = Math.PI / 2;
          else if (hasN) dAngle = Math.PI;
          else dAngle = -Math.PI / 2;

          dummy.position.set(posX, tileElevY + 0.004, posZ);
          dummy.rotation.set(0, dAngle, 0);
          dummy.scale.set(1.02, 1, 1.02);
          dummy.updateMatrix();
          this.visualPathDeadEndMesh.setMatrixAt(pDeadEndIdx++, dummy.matrix);
        } else {
          // Isolated Single Tile
          dummy.position.set(posX, tileElevY + 0.004, posZ);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1.02, 1, 1.02);
          dummy.updateMatrix();
          this.visualPathStraightMeshes[0].setMatrixAt(pStraightIndices[0]++, dummy.matrix);
        }

        // 3. Subtle 3D Edge Wildflowers along the road fringe
        const edgeSeed = Math.sin(tile.x * 31.7 + tile.z * 53.2) * 10000;
        const edgeFrac = edgeSeed - Math.floor(edgeSeed);
        if (edgeFrac > 0.55 && flIdx < totalTiles) {
          const side = edgeFrac > 0.78 ? 0.44 : -0.44;
          const offX = hasN || hasS ? side : (edgeFrac - 0.5) * 0.4;
          const offZ = hasN || hasS ? (edgeFrac - 0.5) * 0.4 : side;
          dummy.position.set(posX + offX, tileElevY + 0.025, posZ + offZ);
          dummy.scale.set(0.42, 0.42, 0.42);
          dummy.rotation.set(0, edgeFrac * Math.PI * 2, 0);
          dummy.updateMatrix();
          this.visualFlowersMesh.setMatrixAt(flIdx, dummy.matrix);
          const fColor = edgeFrac > 0.8
            ? new THREE.Color(0xffffff)
            : edgeFrac > 0.65
            ? new THREE.Color(0xfbbf24)
            : new THREE.Color(0x818cf8);
          this.visualFlowersMesh.setColorAt(flIdx, fColor);
          flIdx++;
        }
      } else if (tile.type === 'soil') {
        const northTile = tiles.get(`${tile.x}_${tile.z - 1}`);
        const southTile = tiles.get(`${tile.x}_${tile.z + 1}`);
        const westTile = tiles.get(`${tile.x - 1}_${tile.z}`);
        const eastTile = tiles.get(`${tile.x + 1}_${tile.z}`);
        const hasGrassNeighbor = (!northTile || northTile.type === 'grass') ||
                                 (!southTile || southTile.type === 'grass') ||
                                 (!westTile || westTile.type === 'grass') ||
                                 (!eastTile || eastTile.type === 'grass');
        if (hasGrassNeighbor) {
          dummy.position.set(posX, tileElevY + 0.002, posZ);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1.12, 1, 1.12);
          dummy.updateMatrix();
          this.visualSoilBorderMesh.setMatrixAt(sbIdx++, dummy.matrix);
        }

        dummy.position.set(posX, tileElevY + 0.005, posZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.visualSoilMesh.setMatrixAt(sIdx, dummy.matrix);
        // Rich, fertile dark earth (glistening moist loam when watered)
        const soilColor = tile.isWatered ? new THREE.Color(0x784424) : new THREE.Color(0xddaf85);
        this.visualSoilMesh.setColorAt(sIdx, soilColor);
        sIdx++;
      } else if (isCoast) {
        dummy.position.set(posX, tileElevY + 0.002, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualSandMesh.setMatrixAt(sdIdx++, dummy.matrix);
      } else if (isMountain) {
        dummy.position.set(posX, tileElevY + 0.002, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualRockMesh.setMatrixAt(rIdx++, dummy.matrix);
      } else {
        // Grass tiles reveal the seamless continuous BotW meadow plane underneath with zero tile seams!

        // Stylized 3D Delicate Anime Grass Tufts & Wildflowers (Organic Natural Clustering)
        if (!tile.crop && !tile.debris) {
          const patchSeed = Math.sin(tile.x * 12.9898 + tile.z * 78.233) * 43758.5453;
          const patchVal = patchSeed - Math.floor(patchSeed);

          // Only ~26% of tiles spawn tufts, creating organic meadow groupings instead of rigid grid repetition
          if (patchVal > 0.74) {
            const clusterCount = patchVal > 0.91 ? 3 : (patchVal > 0.83 ? 2 : 1);
            for (let k = 0; k < clusterCount; k++) {
              const kSeed = Math.sin((tile.x + k * 2.7) * 39.34 + (tile.z + k * 5.3) * 91.12) * 23421.63;
              const kFrac = kSeed - Math.floor(kSeed);
              const kRot = kFrac * Math.PI * 2;
              // Organic scale variation
              const kScale = 0.40 + ((kFrac * 10) % 1) * 0.22;
              // Wide randomized offset across the tile boundary to break any square look
              const kOffX = (((kFrac * 100) % 1) - 0.5) * (this.tileSize * 0.82);
              const kOffZ = (((kFrac * 1000) % 1) - 0.5) * (this.tileSize * 0.82);

              dummy.position.set(posX + kOffX, tileElevY, posZ + kOffZ);
              dummy.rotation.set(0, kRot, 0);
              dummy.scale.set(kScale, kScale, kScale);
              dummy.updateMatrix();
              this.visualTuftsMesh.setMatrixAt(tfIdx++, dummy.matrix);
            }
          }

          // Rare Delicate Wildflower Buds (Tiny, scattered sparsely across the field)
          if (patchVal < 0.07) {
            const fSeed = Math.sin(tile.x * 51.23 + tile.z * 27.81) * 19283.4;
            const fFrac = fSeed - Math.floor(fSeed);
            const fOffX = (fFrac - 0.5) * 0.7;
            const fOffZ = (((fFrac * 10) % 1) - 0.5) * 0.7;
            dummy.position.set(posX + fOffX, tileElevY + 0.025, posZ + fOffZ);
            dummy.scale.set(0.48, 0.48, 0.48);
            dummy.rotation.set(0, fFrac * Math.PI * 2, 0);
            dummy.updateMatrix();
            this.visualFlowersMesh.setMatrixAt(flIdx, dummy.matrix);
            const flowerColor = (fFrac > 0.5) ? new THREE.Color(0xfef08a) : new THREE.Color(0x93c5fd);
            this.visualFlowersMesh.setColorAt(flIdx, flowerColor);
            flIdx++;
          }
        }
      }

      const key = `${tile.x}_${tile.z}`;

      // Check crop mesh
      if (tile.crop) {
        currentCropKeys.add(key);
        const existingCrop = this.cropMeshMap.get(key);
        if (!existingCrop || existingCrop.userData.stage !== tile.crop.stage || existingCrop.userData.type !== tile.crop.type) {
          if (existingCrop) {
            this.scene.remove(existingCrop);
          }
          const cropMesh = ModelFactory.createCrop(tile.crop.type, tile.crop.stage, this.activePalette);
          cropMesh.position.set(posX, tileElevY + 0.2, posZ);
          cropMesh.userData = { stage: tile.crop.stage, type: tile.crop.type };
          cropMesh.frustumCulled = true;
          this.scene.add(cropMesh);
          this.cropMeshMap.set(key, cropMesh);
        }
      }

      // Check debris mesh
      if (tile.debris) {
        currentDebrisKeys.add(key);
        const existingDebris = this.debrisMeshMap.get(key);
        if (!existingDebris || existingDebris.userData.type !== tile.debris) {
          if (existingDebris) {
            this.scene.remove(existingDebris);
          }
          const debrisMesh = ModelFactory.createDebris(tile.debris, this.activePalette);
          debrisMesh.position.set(posX, tileElevY + 0.18, posZ);
          debrisMesh.userData = { type: tile.debris };
          debrisMesh.frustumCulled = true;
          this.scene.add(debrisMesh);
          this.debrisMeshMap.set(key, debrisMesh);
        }
      }
    });

    // Update active render counts for each textured mesh
    this.visualGrassMesh.count = gIdx;
    this.visualSoilMesh.count = sIdx;
    this.visualSoilBorderMesh.count = sbIdx;
    this.visualPathStraightMeshes.forEach((m, i) => {
      m.count = pStraightIndices[i];
      m.instanceMatrix.needsUpdate = true;
    });
    this.visualPathTJunctionMesh.count = pTJunctionIdx;
    this.visualPathTJunctionMesh.instanceMatrix.needsUpdate = true;
    this.visualPathCornerMesh.count = pCornerIdx;
    this.visualPathCornerMesh.instanceMatrix.needsUpdate = true;
    this.visualPathCrossroadMesh.count = pCrossroadIdx;
    this.visualPathCrossroadMesh.instanceMatrix.needsUpdate = true;
    this.visualPathDeadEndMesh.count = pDeadEndIdx;
    this.visualPathDeadEndMesh.instanceMatrix.needsUpdate = true;
    this.visualSandMesh.count = sdIdx;
    this.visualRockMesh.count = rIdx;
    this.visualWaterMesh.count = wIdx;
    this.visualWaterFoamMesh.count = wfIdx;
    this.visualTuftsMesh.count = tfIdx;
    this.visualFlowersMesh.count = flIdx;

    this.visualGrassMesh.instanceMatrix.needsUpdate = true;
    this.visualSoilMesh.instanceMatrix.needsUpdate = true;
    this.visualSoilBorderMesh.instanceMatrix.needsUpdate = true;
    this.visualSandMesh.instanceMatrix.needsUpdate = true;
    this.visualRockMesh.instanceMatrix.needsUpdate = true;
    this.visualWaterMesh.instanceMatrix.needsUpdate = true;
    this.visualWaterFoamMesh.instanceMatrix.needsUpdate = true;
    this.visualTuftsMesh.instanceMatrix.needsUpdate = true;
    this.visualFlowersMesh.instanceMatrix.needsUpdate = true;
    this.groundInstancedMesh.instanceMatrix.needsUpdate = true;

    if (this.visualSoilMesh.instanceColor) this.visualSoilMesh.instanceColor.needsUpdate = true;
    if (this.visualFlowersMesh.instanceColor) this.visualFlowersMesh.instanceColor.needsUpdate = true;

    // Remove harvested crops
    this.cropMeshMap.forEach((mesh, key) => {
      if (!currentCropKeys.has(key)) {
        this.scene.remove(mesh);
        this.cropMeshMap.delete(key);
      }
    });

    // Remove cleared debris
    this.debrisMeshMap.forEach((mesh, key) => {
      if (!currentDebrisKeys.has(key)) {
        this.scene.remove(mesh);
        this.debrisMeshMap.delete(key);
      }
    });
  }

  // Static Buildings & Props Setup from WorldRegistry
  private setupStaticBuildings() {
    // Remove all existing buildings cleanly
    while (this.buildingGroup.children.length > 0) {
      const child = this.buildingGroup.children[0];
      this.buildingGroup.remove(child);
    }

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const region = WorldRegistry.getRegion(this.currentLocation);

    region.staticProps.forEach((prop) => {
      const posX = prop.gridX * this.tileSize - halfW + this.tileSize / 2;
      const posZ = prop.gridZ * this.tileSize - halfH + this.tileSize / 2;
      const posY = prop.worldY ?? 0.1;

      let meshGroup: THREE.Group | null = null;

      if (prop.type === 'farmhouse') {
        meshGroup = ModelFactory.createFarmhouse(this.activePalette);
      } else if (prop.type === 'windmill') {
        meshGroup = ModelFactory.createWindmill(this.activePalette);
      } else if (prop.type === 'shipping_bin') {
        meshGroup = ModelFactory.createShippingBin(this.activePalette);
      } else if (prop.type === 'wooden_bridge') {
        meshGroup = ModelFactory.createWoodenBridge();
      } else if (prop.type === 'gate') {
        const isNorth = prop.rotationY === undefined || prop.rotationY === 0;
        meshGroup = ModelFactory.createGateArchway(isNorth);
      } else if (prop.type === 'interior_bed') {
        meshGroup = ModelFactory.createBed();
      } else if (prop.type === 'interior_kitchen') {
        meshGroup = ModelFactory.createKitchenCounter();
      } else if (prop.type === 'interior_chest') {
        meshGroup = ModelFactory.createStorageChest();
      } else if (prop.type === 'interior_dining_table') {
        meshGroup = ModelFactory.createDiningTable();
      } else if (prop.type === 'interior_fireplace') {
        meshGroup = ModelFactory.createFireplace();
      } else if (prop.type === 'interior_rug') {
        meshGroup = ModelFactory.createCozyRug();
      } else if (prop.type === 'interior_walls') {
        meshGroup = ModelFactory.createInteriorWalls(region.width, region.height, this.tileSize);
      } else if (prop.type === 'signpost') {
        meshGroup = ModelFactory.createSignpost();
      } else if (prop.type === 'mine_entrance') {
        meshGroup = ModelFactory.createMineEntrance();
      } else if (prop.type === 'crystal_cluster') {
        meshGroup = ModelFactory.createCrystalCluster();
      } else if (prop.type === 'rest_bench') {
        meshGroup = ModelFactory.createRestBench();
      } else if (prop.type === 'lighthouse') {
        meshGroup = ModelFactory.createLighthouse();
      } else if (prop.type === 'pier_dock') {
        meshGroup = ModelFactory.createPierDock();
      } else if (prop.type === 'fishing_boat') {
        meshGroup = ModelFactory.createFishingBoat();
      } else if (prop.type === 'stone_stairs') {
        meshGroup = ModelFactory.createStoneStairs();
      } else if (prop.type === 'fishing_shack') {
        meshGroup = ModelFactory.createFishingShack();
      }

      if (meshGroup) {
        meshGroup.position.set(posX, posY, posZ);
        if (prop.rotationY) {
          meshGroup.rotation.y = prop.rotationY;
        }
        meshGroup.frustumCulled = true;
        this.buildingGroup.add(meshGroup);
      }
    });

    // Animated Nature Butterflies fluttering along the Nature Trails
    this.pathButterflies.forEach((b) => {
      this.scene.remove(b.group);
      b.leftWing.geometry.dispose();
      (b.leftWing.material as THREE.Material).dispose();
      b.rightWing.geometry.dispose();
      (b.rightWing.material as THREE.Material).dispose();
    });
    this.pathButterflies = [];

    if (this.currentLocation === 'farm') {
      const butterflyColors = [0xfef08a, 0x93c5fd, 0xd8b4fe]; // Yellow, Blue, Lavender
      const butterflySpawns = [
        { x: 6 * this.tileSize - halfW + this.tileSize / 2, z: 4 * this.tileSize - halfH + this.tileSize / 2, speed: 1.2, radius: 1.4, phase: 0 },
        { x: 6 * this.tileSize - halfW + this.tileSize / 2, z: 15 * this.tileSize - halfH + this.tileSize / 2, speed: 0.9, radius: 1.8, phase: 2.1 },
        { x: 13 * this.tileSize - halfW + this.tileSize / 2, z: 7 * this.tileSize - halfH + this.tileSize / 2, speed: 1.1, radius: 1.5, phase: 4.3 },
      ];

      butterflySpawns.forEach((sp, idx) => {
        const bGroup = new THREE.Group();
        const wingMat = new THREE.MeshBasicMaterial({ color: butterflyColors[idx % 3], side: THREE.DoubleSide });
        const wingGeo = new THREE.PlaneGeometry(0.12, 0.08);

        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.x = -0.06;
        bGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.x = 0.06;
        bGroup.add(rightWing);

        bGroup.position.set(sp.x, 0.45, sp.z);
        this.scene.add(bGroup);

        this.pathButterflies.push({
          group: bGroup,
          leftWing,
          rightWing,
          basePos: new THREE.Vector3(sp.x, 0.45, sp.z),
          speed: sp.speed,
          radius: sp.radius,
          phase: sp.phase,
        });
      });
    }
  }

  // Switch between any registered WorldRegion Map
  public switchLocation(
    location: MapLocation,
    tiles: Map<string, TileState>,
    spawnPos?: { x: number; z: number }
  ) {
    this.currentLocation = location;
    const region = WorldRegistry.getRegion(location);
    this.gridWidth = region.width;
    this.gridHeight = region.height;

    // Clear existing crops & debris meshes
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();

    // Re-build ground and buildings
    this.setupSurroundingMeadow();
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();
    this.updateTiles(tiles);

    // Position player
    const targetSpawn = spawnPos || region.defaultSpawn;
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const posX = targetSpawn.x * this.tileSize - halfW + this.tileSize / 2;
    const posZ = targetSpawn.z * this.tileSize - halfH + this.tileSize / 2;

    this.playerMesh.position.set(posX, 0.2, posZ);
    this.targetTilePos = null;
    this.inputVector = { x: 0, z: 0 };
    this.lastExitTriggerTime = performance.now() + 2500; // 2.5 seconds gate trigger immunity upon spawning

    // Center perspective camera on player
    const maxCamSpan = halfW - 4.5;
    const camFocusX = Math.max(-maxCamSpan, Math.min(maxCamSpan, posX));
    const camFocusZ = Math.max(-maxCamSpan, Math.min(maxCamSpan, posZ));

    this.smoothedCamFocus.set(camFocusX, 0.2, camFocusZ);
    this.isCamInitialized = true;

    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = 0.2 + this.currentCamDist * Math.sin(this.currentPitch);
    const offsetXZ = horizDist * 0.7071;

    this.camera.position.set(camFocusX + offsetXZ, camY, camFocusZ + offsetXZ);
    this.camera.lookAt(camFocusX, 0.8, camFocusZ);

    // Warm up & force immediate pre-render of new map
    this.renderer.render(this.scene, this.camera);
  }

  // Check if player is standing near the Shipping Bin (Farm only)
  public isNearShippingBin(): boolean {
    if (this.currentLocation !== 'farm') return false;
    const dist = Math.hypot(this.playerMesh.position.x - 3.0, this.playerMesh.position.z - (-9.5));
    return dist < 2.5;
  }

  // Display Item Held Overhead (Mengangkat Barang Keluar dari Tas di Atas Kepala Karakter)
  public setPlayerHeldItem(item: { id: string; name: string; icon: string; cropType?: CropType } | null) {
    if (this.heldItemGroup) {
      this.playerMesh.remove(this.heldItemGroup);
      this.heldItemGroup.traverse((child) => {
        if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      this.heldItemGroup = null;
    }

    if (!item) return;

    const heldGroup = new THREE.Group();
    heldGroup.name = 'held_item';

    // 1. Soft glowing golden halo ring beneath the held item
    const haloGeo = new THREE.RingGeometry(0.18, 0.28, 16);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = -0.05;
    heldGroup.add(haloMesh);

    // 2. 3D Crop / Material Model or Crisp Emoji Billboard
    if (item.cropType) {
      const cropProp = ModelFactory.createCrop(item.cropType, 3, this.activePalette);
      cropProp.scale.set(1.2, 1.2, 1.2);
      heldGroup.add(cropProp);
    } else if (item.id === 'res_wood') {
      const woodProp = ModelFactory.createDebris('log', this.activePalette);
      woodProp.scale.set(0.85, 0.85, 0.85);
      heldGroup.add(woodProp);
    } else if (item.id === 'res_stone') {
      const stoneProp = ModelFactory.createDebris('small_stone', this.activePalette);
      stoneProp.scale.set(1.1, 1.1, 1.1);
      heldGroup.add(stoneProp);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(16, 16, 224, 224, 36);
      ctx.fill();
      ctx.stroke();

      ctx.font = '110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.65, 0.65, 0.65);
      heldGroup.add(sprite);
    }

    heldGroup.position.set(0, 1.25, 0);
    this.heldItemGroup = heldGroup;
    this.playerMesh.add(heldGroup);
  }

  // Animals
  public updateAnimals(animals: PlacedAnimal[]) {
    while (this.animalGroup.children.length > 0) {
      this.animalGroup.remove(this.animalGroup.children[0]);
    }

    if (this.currentLocation !== 'farm') return;

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    animals.forEach((a) => {
      let mesh: THREE.Group;
      if (a.type === 'chicken') mesh = ModelFactory.createChicken();
      else if (a.type === 'cow') mesh = ModelFactory.createCow();
      else mesh = ModelFactory.createSheep();

      const posX = a.x * this.tileSize - halfW + this.tileSize / 2;
      const posZ = a.z * this.tileSize - halfH + this.tileSize / 2;

      mesh.position.set(posX, 0.2, posZ);
      mesh.frustumCulled = true;
      this.animalGroup.add(mesh);
    });
  }

  // Set Day/Night Sky & Lights using pre-computed MemoryHeapManager LUT (Zero Allocation)
  public setTimeAndWeather(timeHour: number, weather: 'sunny' | 'rainy' | 'foggy' | 'golden') {
    const lut = MemoryHeapManager.getLightingForHour(timeHour);
    if (lut) {
      this.scene.background = lut.skyColor;
      this.ambLight.color = lut.ambColor;
      this.ambLight.intensity = weather === 'rainy' ? lut.ambIntensity * 0.7 : lut.ambIntensity;
      this.dirLight.color = lut.dirColor;
      this.dirLight.intensity = weather === 'rainy' ? lut.dirIntensity * 0.5 : lut.dirIntensity;
      this.dirLight.position.set(lut.dirPosX, lut.dirPosY, lut.dirPosZ);
    }
  }

  // Apply Texture Pack
  public applyTexturePack(palette: TexturePackPalette) {
    this.activePalette = palette;
    this.scene.background = new THREE.Color(palette.skyNoon);
    this.setupSurroundingMeadow();
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();
  }

  // Apply Performance Settings & Camera Zoom
  public applyPerformanceSettings(settings: PerformanceSettings) {
    this.settings = settings;
    const maxPR = Math.min(window.devicePixelRatio || 1, 1.25);
    this.renderer.setPixelRatio(maxPR);
    this.updateCameraBounds();
  }

  public updateCameraBounds() {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    this.camera.aspect = aspect;
    const zoom = this.settings.cameraZoom || 1.4;
    const baseFov = aspect < 1 ? 62 : 55;
    this.camera.fov = baseFov / (zoom * 0.7);
    this.camera.updateProjectionMatrix();
  }

  // Direct Input Vector from Touch Joystick
  public setInputVector(x: number, z: number) {
    this.inputVector.x = x;
    this.inputVector.z = z;
  }

  // Toggle Grid Cursor Visibility (Sembunyikan Penanda Petak)
  public setGridCursorHidden(hidden: boolean) {
    this.isGridCursorHidden = hidden;
    if (hidden) {
      if (this.tileCursor) this.tileCursor.visible = false;
      if (this.tileCursor3x3) this.tileCursor3x3.visible = false;
    }
  }

  // Toggle Sprint Mode (Mode Lari Cepat)
  public setSprinting(sprinting: boolean) {
    this.isSprinting = sprinting;
  }

  // Switch between 1x1 cursor and 3x3 planting grid indicator with smart ready-soil color
  public setCursorMode(mode: 'single' | '3x3', hasReadyTiles: boolean = true, actionType: string = 'default') {
    if (this.isGridCursorHidden) {
      if (this.tileCursor) this.tileCursor.visible = false;
      if (this.tileCursor3x3) this.tileCursor3x3.visible = false;
      return;
    }

    if (mode === '3x3') {
      this.tileCursor.visible = false;
      this.tileCursor3x3.visible = true;
      this.cursor3x3Mat.color.setHex(hasReadyTiles ? 0x22c55e : 0xef4444);
    } else {
      this.tileCursor.visible = true;
      this.tileCursor3x3.visible = false;

      // Dynamic theme color according to action type
      if (actionType === 'water') {
        this.cursorFillMat.color.setHex(0x0284c7);
        this.cursorBorderMat.color.setHex(0x38bdf8);
      } else if (actionType === 'harvest' || actionType === 'collect') {
        this.cursorFillMat.color.setHex(0xd97706);
        this.cursorBorderMat.color.setHex(0xfacc15);
      } else if (actionType === 'debris') {
        this.cursorFillMat.color.setHex(0x92400e);
        this.cursorBorderMat.color.setHex(0xf59e0b);
      } else {
        this.cursorFillMat.color.setHex(hasReadyTiles ? 0x22c55e : 0x10b981);
        this.cursorBorderMat.color.setHex(0x86efac);
      }
    }
  }

  // Tap-to-move target
  public movePlayerToGrid(gx: number, gz: number) {
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    this.targetTilePos = new THREE.Vector3(
      gx * this.tileSize - halfW + this.tileSize / 2,
      0.2,
      gz * this.tileSize - halfH + this.tileSize / 2
    );
  }

  // Get currently targeted or standing grid position
  public getPlayerGridPos(): { x: number; z: number } {
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    const gx = Math.floor((this.playerMesh.position.x + halfW) / this.tileSize);
    const gz = Math.floor((this.playerMesh.position.z + halfH) / this.tileSize);

    return {
      x: Math.max(0, Math.min(this.gridWidth - 1, gx)),
      z: Math.max(0, Math.min(this.gridHeight - 1, gz)),
    };
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.renderer.setSize(width, height);
    this.updateCameraBounds();
  };

  public updatePerformanceSettings(newSettings: PerformanceSettings) {
    this.settings = newSettings;
    if (newSettings.cameraZoom) {
      this.currentCamDist = 13.5 / newSettings.cameraZoom;
      this.updateCameraBounds();
    }
  }

  // Live Hardware Telemetry Stats Getter
  public getPerformanceMetrics() {
    const mem = typeof performance !== 'undefined' ? (performance as any).memory : null;
    const targetFps = this.settings.fpsLimit || 60;
    const frameBudgetMs = 1000 / targetFps;
    const cpuPct = Math.min(99, Math.max(1, Math.round((this.lastFrameRenderTimeMs / frameBudgetMs) * 100)));

    return {
      fps: this.currentFps,
      targetFps,
      frameTimeMs: Math.round(this.lastFrameRenderTimeMs * 10) / 10,
      cpuUsagePct: cpuPct,
      ramMb: mem ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : 0,
      drawCalls: this.renderer.info.render.calls || 0,
      triangles: this.renderer.info.render.triangles || 0,
    };
  }

  private lastFrameRenderTimeMs = 0;

  // Main Render & Physics Animation Loop
  private animate = () => {
    if (this.isDestroyed) return;

    // Exact FPS Throttler / Lock
    const fpsLimit = this.settings.fpsLimit || 60;
    if (fpsLimit > 0 && fpsLimit < 240) {
      const targetInterval = 1000 / fpsLimit;
      const nowMs = performance.now();
      const elapsed = nowMs - this.lastFrameTimestamp;
      if (elapsed < targetInterval - 1) {
        return; // Skip rendering frame to lock target FPS
      }
      this.lastFrameTimestamp = nowMs - (elapsed % targetInterval);
    }

    const frameStartTime = performance.now();

    try {
      const delta = Math.min(this.clock.getDelta(), 0.1);

      // FPS Counter
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

    const inputLen = Math.hypot(this.inputVector.x, this.inputVector.z);
    let isWalking = false;

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    // Movement
    if (inputLen > 0.08) {
      this.targetTilePos = null;
      isWalking = true;

      const angle = Math.atan2(this.inputVector.z, this.inputVector.x) - Math.PI / 4;
      const speed = this.isSprinting ? 8.2 : 4.8;
      const moveDist = speed * Math.min(1.0, inputLen) * delta;

      const targetFacing = -angle + Math.PI / 2;
      const facingAlpha = 1 - Math.exp(-18.0 * delta);
      this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, targetFacing, facingAlpha);

      const dx = Math.cos(angle) * moveDist;
      const dz = Math.sin(angle) * moveDist;

      // 1. Try X movement with solid obstacle collision
      const targetX = this.playerMesh.position.x + dx;
      const curZ = this.playerMesh.position.z;
      const gridX_X = (targetX + halfW - this.tileSize / 2) / this.tileSize;
      const gridZ_X = (curZ + halfH - this.tileSize / 2) / this.tileSize;
      if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX_X, gridZ_X)) {
        this.playerMesh.position.x = targetX;
      }

      // 2. Try Z movement with solid obstacle collision (allows smooth sliding along walls)
      const curX = this.playerMesh.position.x;
      const targetZ = this.playerMesh.position.z + dz;
      const gridX_Z = (curX + halfW - this.tileSize / 2) / this.tileSize;
      const gridZ_Z = (targetZ + halfH - this.tileSize / 2) / this.tileSize;
      if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX_Z, gridZ_Z)) {
        this.playerMesh.position.z = targetZ;
      }
    }
    // Tap-to-move
    else if (this.targetTilePos) {
      const dist = this.playerMesh.position.distanceTo(this.targetTilePos);
      if (dist > 0.08) {
        isWalking = true;
        const dirX = this.targetTilePos.x - this.playerMesh.position.x;
        const dirZ = this.targetTilePos.z - this.playerMesh.position.z;
        const facing = Math.atan2(dirX, dirZ);
        this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, facing, 0.3);

        const moveDist = Math.min(1.0, 10.0 * delta);
        const nextX = THREE.MathUtils.lerp(this.playerMesh.position.x, this.targetTilePos.x, moveDist);
        const nextZ = THREE.MathUtils.lerp(this.playerMesh.position.z, this.targetTilePos.z, moveDist);

        const gridX = (nextX + halfW - this.tileSize / 2) / this.tileSize;
        const gridZ = (nextZ + halfH - this.tileSize / 2) / this.tileSize;

        if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX, gridZ)) {
          this.playerMesh.position.x = nextX;
          this.playerMesh.position.z = nextZ;
        } else {
          this.targetTilePos = null;
        }
      } else {
        this.targetTilePos = null;
      }
    }

    // Clamp player movement strictly inside perimeter tree boundary, but ALLOW walking through gate passages!
    const curWorldX = this.playerMesh.position.x;

    const bounds = WorldRegistry.getRegionBoundaries(this.currentLocation, curWorldX, halfW, halfH);
    this.playerMesh.position.x = Math.max(bounds.minBoundX, Math.min(bounds.maxBoundX, this.playerMesh.position.x));
    this.playerMesh.position.z = Math.max(bounds.minBoundZ, Math.min(bounds.maxBoundZ, this.playerMesh.position.z));

    // Check Map Transition Trigger at Gate dynamically via WorldRegistry
    const curGrid = this.getPlayerGridPos();
    if (now >= this.lastExitTriggerTime && this.onExitReachedCallback) {
      const activeGate = WorldRegistry.checkGateTrigger(this.currentLocation, curGrid.x, curGrid.z);
      if (activeGate) {
        this.lastExitTriggerTime = now + 3000;
        this.onExitReachedCallback(activeGate.targetLocation, activeGate.targetSpawn);
      }
    }

    // Calculate player standing tile elevation height
    const pGrid = this.getPlayerGridPos();
    const standElevY = calculateTileElevation(pGrid.x, pGrid.z, this.currentLocation, 'grass');
    const basePlayerY = standElevY + 0.2;

    // Stable Player Root Elevation (Smooth gliding, no jittery camera bounce)
    this.playerMesh.position.y = THREE.MathUtils.lerp(this.playerMesh.position.y, basePlayerY, 0.2);

    if (isWalking) {
      this.walkAnimTime += delta * (this.isSprinting ? 22 : 12);
      // Gentle subtle natural body sway (rotation only, does not jitter camera position)
      this.playerMesh.rotation.z = Math.sin(this.walkAnimTime) * (this.isSprinting ? 0.060 : 0.035);

      // Spawn lively dust trail particles when sprinting
      if (this.isSprinting && Math.random() > 0.35) {
        this.spawnDustPuff(this.playerMesh.position.x, basePlayerY, this.playerMesh.position.z);
      }
    } else {
      this.playerMesh.rotation.z = THREE.MathUtils.lerp(this.playerMesh.rotation.z, 0, 0.2);
    }

    // Animate Held Item Above Player Head (Harvest Moon / Stardew style overhead carrying)
    if (this.heldItemGroup) {
      this.heldItemGroup.position.y = 1.25 + Math.sin(now * 0.005) * 0.04;
      this.heldItemGroup.rotation.y += delta * 1.5;
    }

    this.updateDustParticles(delta);

    // Update Tile Cursor Position & Pulsing Animation
    if (!this.isGridCursorHidden) {
      const curPos = this.getPlayerGridPos();
      const cursorX = curPos.x * this.tileSize - halfW + this.tileSize / 2;
      const cursorZ = curPos.z * this.tileSize - halfH + this.tileSize / 2;
      const hoverPulse = Math.sin(now * 0.005) * 0.02 + 0.03;

      this.tileCursor.position.x = cursorX;
      this.tileCursor.position.y = standElevY + hoverPulse;
      this.tileCursor.position.z = cursorZ;

      this.tileCursor3x3.position.x = cursorX;
      this.tileCursor3x3.position.y = standElevY + hoverPulse;
      this.tileCursor3x3.position.z = cursorZ;

      if (this.cursorFillMat) {
        this.cursorFillMat.opacity = 0.30 + Math.sin(now * 0.006) * 0.10;
      }
    } else {
      this.tileCursor.visible = false;
      this.tileCursor3x3.visible = false;
    }

    // Smooth 3D Perspective Camera Tracking & Auto-Tilt near Gates
    const targetPlayerPos = this.playerMesh.position;

    // Check proximity to ANY gate or door trigger area
    let isNearGate = false;
    const regionGates = WorldRegistry.getRegion(this.currentLocation).gates;
    const curGridPos = this.getPlayerGridPos();

    for (const g of regionGates) {
      const gateCenterX = (g.triggerArea.minX + g.triggerArea.maxX) / 2;
      const gateCenterZ = (g.triggerArea.minZ + g.triggerArea.maxZ) / 2;
      const distToGate = Math.hypot(curGridPos.x - gateCenterX, curGridPos.z - gateCenterZ);
      if (distToGate <= 4.2) {
        isNearGate = true;
        break;
      }
    }

    // Target Pitch: 28° (0.488 rad) when approaching gate for cinematic entrance, 38° (0.663 rad) normal for strong 3D depth
    // Target Dist: 10.2 units in compact maps for cozy close zoom, 13.5 units in large maps for rich perspective
    const isCompactMap = this.currentLocation === 'crossroads' || this.currentLocation === 'house_interior';
    const targetPitch = isNearGate ? 0.488 : 0.663;
    const defaultDist = isCompactMap ? 10.2 : 13.5;
    const targetDist = isNearGate ? 9.8 : defaultDist;

    const camPitchAlpha = 1 - Math.exp(-6.0 * delta);
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, camPitchAlpha);
    this.currentCamDist = THREE.MathUtils.lerp(this.currentCamDist, targetDist, camPitchAlpha);

    const maxCamSpan = halfW - 4.2;
    const rawFocusX = Math.max(-maxCamSpan, Math.min(maxCamSpan, targetPlayerPos.x));
    const rawFocusZ = Math.max(-maxCamSpan, Math.min(maxCamSpan, targetPlayerPos.z));
    const rawFocusY = basePlayerY;

    // Smoothly track focal center without any jitter or desync
    if (!this.isCamInitialized) {
      this.smoothedCamFocus.set(rawFocusX, rawFocusY, rawFocusZ);
      this.isCamInitialized = true;
    } else {
      const focusAlpha = 1 - Math.exp(-14.0 * delta);
      this.smoothedCamFocus.x = THREE.MathUtils.lerp(this.smoothedCamFocus.x, rawFocusX, focusAlpha);
      this.smoothedCamFocus.y = THREE.MathUtils.lerp(this.smoothedCamFocus.y, rawFocusY, focusAlpha);
      this.smoothedCamFocus.z = THREE.MathUtils.lerp(this.smoothedCamFocus.z, rawFocusZ, focusAlpha);
    }

    const camAzimuth = Math.PI * 0.20; // 36 degrees rotated right for rich 3D perspective
    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = this.smoothedCamFocus.y + this.currentCamDist * Math.sin(this.currentPitch);
    const offsetX = horizDist * Math.cos(camAzimuth);
    const offsetZ = horizDist * Math.sin(camAzimuth);

    this.camera.position.set(this.smoothedCamFocus.x + offsetX, camY, this.smoothedCamFocus.z + offsetZ);
    this.camera.lookAt(this.smoothedCamFocus.x, this.smoothedCamFocus.y + 0.6, this.smoothedCamFocus.z);

    // Rotate Windmill blades if in farm
    if (this.currentLocation === 'farm' && Math.hypot(targetPlayerPos.x - 8.5, targetPlayerPos.z - (-10.5)) < 25) {
      const blades = this.buildingGroup.getObjectByName('windmill_blades');
      if (blades) {
        blades.rotation.z += 0.02;
      }
    }

    // Animate Nature Butterflies (Gentle Wing Flaps & Figure-8 Flight along Country Road)
    if (this.currentLocation === 'farm' && this.pathButterflies.length > 0) {
      const time = this.clock.getElapsedTime();
      this.pathButterflies.forEach((b) => {
        const flap = Math.sin(time * 24 + b.phase) * 0.75;
        b.leftWing.rotation.y = flap;
        b.rightWing.rotation.y = -flap;
        const flightAngle = time * b.speed + b.phase;
        b.group.position.x = b.basePos.x + Math.sin(flightAngle) * b.radius;
        b.group.position.z = b.basePos.z + Math.cos(flightAngle * 0.8) * b.radius;
        b.group.position.y = b.basePos.y + Math.sin(time * 3 + b.phase) * 0.15;
        b.group.rotation.y = -flightAngle + Math.PI / 2;
      });
    }

    this.renderer.render(this.scene, this.camera);
    this.lastFrameRenderTimeMs = performance.now() - frameStartTime;
    } catch (err) {
      console.error('GameScene 3D animation loop error:', err);
    }
  };

  private spawnDustPuff(px: number, py: number, pz: number) {
    if (this.dustPool.length > 18) return;
    const dustGeo = new THREE.SphereGeometry(0.10 + Math.random() * 0.08, 6, 6);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.65,
    });
    const mesh = new THREE.Mesh(dustGeo, dustMat);
    mesh.position.set(px + (Math.random() - 0.5) * 0.22, py + 0.03, pz + (Math.random() - 0.5) * 0.22);
    this.scene.add(mesh);
    this.dustPool.push({
      mesh,
      life: 0,
      maxLife: 0.30,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.5 + Math.random() * 0.3,
      vz: (Math.random() - 0.5) * 0.6,
    });
  }

  private updateDustParticles(delta: number) {
    for (let i = this.dustPool.length - 1; i >= 0; i--) {
      const p = this.dustPool[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.dustPool.splice(i, 1);
      } else {
        const progress = p.life / p.maxLife;
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.mesh.scale.setScalar(1.0 + progress * 1.6);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.65;
      }
    }
  }

  /**
   * Captures a pristine, 100% clean full HD screenshot of the 3D world
   * without any UI overlays, tile indicators, or touch cursor artifacts.
   */
  public captureCleanScreenshot(): string {
    const wasCursorVisible = this.tileCursor ? this.tileCursor.visible : false;
    const was3x3Visible = this.tileCursor3x3 ? this.tileCursor3x3.visible : false;
    if (this.tileCursor) this.tileCursor.visible = false;
    if (this.tileCursor3x3) this.tileCursor3x3.visible = false;

    // Force an immediate pristine frame render
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore cursor state
    if (this.tileCursor) this.tileCursor.visible = wasCursorVisible;
    if (this.tileCursor3x3) this.tileCursor3x3.visible = was3x3Visible;
    return dataUrl;
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    if (this.meadowMesh) {
      this.scene.remove(this.meadowMesh);
      this.meadowMesh.geometry.dispose();
      (this.meadowMesh.material as THREE.Material).dispose();
    }
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();
    this.tileGeometry.dispose();
    this.tileMaterial.dispose();
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      if (this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
      this.renderer.dispose();
    }
  }
}

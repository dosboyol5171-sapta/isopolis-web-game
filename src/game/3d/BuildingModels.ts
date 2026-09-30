import * as THREE from 'three';
import { CropType, GrowthStage, TexturePackPalette, DebrisType } from '../../types/game';

// Global High-Performance Cache for Materials & Geometries (Zero-allocation on duplicate objects)
const materialCache = new Map<string, THREE.MeshLambertMaterial>();
const geometryCache = new Map<string, THREE.BufferGeometry>();

export function getCachedMaterial(colorHex: string, roughness = 0.8, metalness = 0.1): THREE.MeshLambertMaterial {
  const key = `${colorHex}_${roughness}_${metalness}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(colorHex),
      flatShading: true,
    });
    materialCache.set(key, mat);
  }
  return mat;
}

export function createMaterial(colorHex: string, roughness = 0.8, metalness = 0.1): THREE.MeshLambertMaterial {
  return getCachedMaterial(colorHex, roughness, metalness);
}

function getCachedGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = factory();
    geometryCache.set(key, geo);
  }
  return geo;
}

// --- Procedural High-Fidelity Textures for Farmhouse & Debris (Studio Ghibli / Story of Seasons Style) ---

// 1. Concentric Annual Tree Growth Rings (Penampang Lingkaran Tahun Kayu)
let logEndTexture: THREE.CanvasTexture | null = null;
function getLogEndTexture(): THREE.CanvasTexture {
  if (logEndTexture) return logEndTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Outer dark bark ring
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();

  // Inner warm sapwood base
  const woodGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 116);
  woodGrad.addColorStop(0, '#c7a379');
  woodGrad.addColorStop(0.35, '#d8b994');
  woodGrad.addColorStop(0.78, '#b89269');
  woodGrad.addColorStop(1, '#8d633d');
  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  // Concentric annual growth rings
  ctx.lineWidth = 1.6;
  for (let r = 18; r < 114; r += 7.5) {
    ctx.strokeStyle = `rgba(107, 68, 38, ${0.45 + (r % 15 === 0 ? 0.3 : 0)})`;
    ctx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const wobble = Math.sin(angle * 5 + r) * 1.8 + Math.cos(angle * 3) * 1.2;
      const x = 128 + Math.cos(angle) * (r + wobble);
      const y = 128 + Math.sin(angle) * (r + wobble);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Heartwood center & radial drying micro-cracks
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.arc(128, 128, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5a3818';
  ctx.lineWidth = 1.8;
  const crackAngles = [0.4, 2.1, 4.3];
  crackAngles.forEach((ang) => {
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(ang) * 95, 128 + Math.sin(ang) * 95);
    ctx.stroke();
  });

  logEndTexture = new THREE.CanvasTexture(canvas);
  logEndTexture.colorSpace = THREE.SRGBColorSpace;
  return logEndTexture;
}

// 2. Log Bark Texture with subtle green moss patches
let logBarkTexture: THREE.CanvasTexture | null = null;
function getLogBarkTexture(): THREE.CanvasTexture {
  if (logBarkTexture) return logBarkTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#653e28';
  ctx.fillRect(0, 0, 256, 256);

  // Bark grain furrows
  for (let x = 0; x < 256; x += 4) {
    const isDeep = x % 16 === 0;
    ctx.fillStyle = isDeep ? 'rgba(40, 20, 10, 0.65)' : 'rgba(140, 90, 55, 0.4)';
    ctx.fillRect(x, 0, isDeep ? 2.5 : 1.5, 256);
  }

  // Soft patches of green moss on top of the log
  for (let m = 0; m < 35; m++) {
    const mx = Math.random() * 256;
    const my = Math.random() * 120;
    const rad = 6 + Math.random() * 16;
    const mossGrad = ctx.createRadialGradient(mx, my, 2, mx, my, rad);
    mossGrad.addColorStop(0, 'rgba(101, 163, 13, 0.7)');
    mossGrad.addColorStop(1, 'rgba(77, 124, 15, 0)');
    ctx.fillStyle = mossGrad;
    ctx.beginPath();
    ctx.arc(mx, my, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  logBarkTexture = new THREE.CanvasTexture(canvas);
  logBarkTexture.wrapS = THREE.RepeatWrapping;
  logBarkTexture.wrapT = THREE.RepeatWrapping;
  logBarkTexture.colorSpace = THREE.SRGBColorSpace;
  return logBarkTexture;
}

// 3. Mossy Weathered River Boulder Texture
let mossyBoulderTexture: THREE.CanvasTexture | null = null;
function getMossyBoulderTexture(): THREE.CanvasTexture {
  if (mossyBoulderTexture) return mossyBoulderTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Natural river stone grey base with subtle warm tone
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#a8a29e');
  baseGrad.addColorStop(0.5, '#78716c');
  baseGrad.addColorStop(1, '#57534e');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Weathered stone grain & flecks
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 1.0 + Math.random() * 3.0;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(231, 229, 228, 0.25)' : 'rgba(41, 37, 36, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Organic Ghibli Moss Patches (Vibrant lime & forest greens)
  const mossPatches = [
    { x: 180, y: 140, r: 120, col: '#65a30d' },
    { x: 320, y: 160, r: 140, col: '#84cc16' },
    { x: 120, y: 280, r: 90, col: '#4d7c0f' },
    { x: 380, y: 320, r: 110, col: '#65a30d' },
    { x: 260, y: 220, r: 130, col: '#84cc16' },
    { x: 240, y: 90, r: 80, col: '#a3e635' },
  ];

  mossPatches.forEach((p) => {
    const mGrad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.r);
    mGrad.addColorStop(0, p.col);
    mGrad.addColorStop(0.7, 'rgba(77, 124, 15, 0.7)');
    mGrad.addColorStop(1, 'rgba(54, 83, 20, 0)');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // White Lichen Clusters
  for (let l = 0; l < 40; l++) {
    const lx = Math.random() * 512;
    const ly = Math.random() * 512;
    const lr = 3 + Math.random() * 8;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine stone fissures
  ctx.strokeStyle = 'rgba(41, 37, 36, 0.55)';
  ctx.lineWidth = 1.4;
  for (let c = 0; c < 5; c++) {
    let cx = 100 + Math.random() * 312;
    let cy = 100 + Math.random() * 312;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * 45;
      cy += (Math.random() - 0.5) * 45;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  mossyBoulderTexture = new THREE.CanvasTexture(canvas);
  mossyBoulderTexture.colorSpace = THREE.SRGBColorSpace;
  return mossyBoulderTexture;
}

// 4. Layered Terracotta Shingle Roof Texture
let roofShingleTexture: THREE.CanvasTexture | null = null;
function getRoofShingleTexture(): THREE.CanvasTexture {
  if (roofShingleTexture) return roofShingleTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 512);

  const rowCount = 8;
  const rowH = 512 / rowCount;

  for (let r = 0; r < rowCount; r++) {
    const y = r * rowH;
    const rGrad = ctx.createLinearGradient(0, y, 0, y + rowH);
    rGrad.addColorStop(0, '#ea580c'); // Sunlit terracotta orange
    rGrad.addColorStop(0.65, '#c2410c');
    rGrad.addColorStop(0.88, '#9a3412');
    rGrad.addColorStop(1, '#451a03'); // Shingle overlap shadow
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, y, 512, rowH);

    const shingleW = 42;
    const offset = (r % 2 === 0) ? 0 : shingleW / 2;
    ctx.fillStyle = 'rgba(40, 15, 5, 0.45)';
    for (let x = offset; x < 512; x += shingleW) {
      ctx.fillRect(x, y + 4, 2, rowH - 4);
    }
  }

  roofShingleTexture = new THREE.CanvasTexture(canvas);
  roofShingleTexture.wrapS = THREE.RepeatWrapping;
  roofShingleTexture.wrapT = THREE.RepeatWrapping;
  roofShingleTexture.repeat.set(1.5, 1.5);
  roofShingleTexture.colorSpace = THREE.SRGBColorSpace;
  return roofShingleTexture;
}

export class ModelFactory {
  // --- PLAYER MODEL (Anime Ghibli Farmer Boy matching Image 1) ---
  public static createPlayer(palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = 'player';

    // Soft Directional Drop Shadow (offset towards bottom-right matching top-left sun)
    const shadowMat = getCachedMaterial('#071207', 1, 0);
    shadowMat.transparent = true;
    shadowMat.opacity = 0.40;
    const shadowGeo = getCachedGeometry('player_shadow_v3', () => new THREE.PlaneGeometry(0.55, 0.42));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.10, 0.015, 0.12);
    group.add(shadow);

    // Boots (Dark Leather Boots)
    const bootMat = getCachedMaterial('#451a03');
    const bootGeo = getCachedGeometry('player_boots_v3', () => new THREE.BoxGeometry(0.24, 0.16, 0.30));
    const boots = new THREE.Mesh(bootGeo, bootMat);
    boots.position.y = 0.08;
    group.add(boots);

    // Dark Brown Work Trousers
    const pantsMat = getCachedMaterial('#3f2010');
    const pantsGeo = getCachedGeometry('player_pants_v3', () => new THREE.CylinderGeometry(0.23, 0.21, 0.22, 8));
    const pants = new THREE.Mesh(pantsGeo, pantsMat);
    pants.position.y = 0.24;
    group.add(pants);

    // Royal Cobalt Blue Farmer Tunic (as in Image 1)
    const tunicMat = getCachedMaterial('#2563eb');
    const tunicGeo = getCachedGeometry('player_tunic_v3', () => new THREE.CylinderGeometry(0.25, 0.23, 0.40, 8));
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.y = 0.48;
    group.add(tunic);

    // Leather Waist Belt with Brass Buckle
    const beltMat = getCachedMaterial('#2d1500');
    const beltGeo = getCachedGeometry('player_belt_v3', () => new THREE.CylinderGeometry(0.255, 0.255, 0.06, 8));
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.35;
    group.add(belt);

    const buckleMat = getCachedMaterial('#f59e0b');
    const buckleGeo = getCachedGeometry('player_belt_buckle_v3', () => new THREE.BoxGeometry(0.08, 0.07, 0.05));
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.35, 0.25);
    group.add(buckle);

    // Matching Blue Sleeves & Arms
    const sleeveMat = getCachedMaterial('#1d4ed8');
    const skinMat = getCachedMaterial('#fed7aa');
    const armGeo = getCachedGeometry('player_arm_v3', () => new THREE.BoxGeometry(0.12, 0.26, 0.12));
    const handGeo = getCachedGeometry('player_hand_v3', () => new THREE.SphereGeometry(0.065, 6, 6));

    const armL = new THREE.Mesh(armGeo, sleeveMat);
    armL.position.set(-0.25, 0.46, 0);
    group.add(armL);
    const handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(-0.25, 0.30, 0);
    group.add(handL);

    const armR = new THREE.Mesh(armGeo, sleeveMat);
    armR.position.set(0.25, 0.46, 0);
    group.add(armR);
    const handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(0.25, 0.30, 0);
    group.add(handR);

    // Leather Adventure Satchel / Backpack on Back (matching Image 1)
    const packMat = getCachedMaterial('#9a3412');
    const packGeo = getCachedGeometry('player_pack_body', () => new THREE.BoxGeometry(0.26, 0.30, 0.14));
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.48, -0.16);
    group.add(pack);

    const flapGeo = getCachedGeometry('player_pack_flap_v3', () => new THREE.BoxGeometry(0.27, 0.12, 0.15));
    const flap = new THREE.Mesh(flapGeo, packMat);
    flap.position.set(0, 0.58, -0.16);
    group.add(flap);

    const packBuckleGeo = getCachedGeometry('player_pack_buckle_v3', () => new THREE.BoxGeometry(0.06, 0.06, 0.03));
    const packBuckle = new THREE.Mesh(packBuckleGeo, buckleMat);
    packBuckle.position.set(0, 0.47, -0.24);
    group.add(packBuckle);

    // Head
    const headGeo = getCachedGeometry('player_head_v3', () => new THREE.SphereGeometry(0.24, 12, 12));
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.82;
    group.add(head);

    // Natural Stylized Hair (Warm Chestnut Brown with Layered Anime Bangs & Volume)
    const hairMat = getCachedMaterial('#452212'); // Rich deep chestnut anime hair

    // 1. Main Hair Volume / Top Crown Dome
    const hairCrownGeo = getCachedGeometry('player_hair_crown', () => new THREE.SphereGeometry(0.265, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62));
    const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
    hairCrown.position.set(0, 0.86, -0.02);
    hairCrown.rotation.x = 0.15;
    group.add(hairCrown);

    // 2. Front Layered Bangs / Fringe
    const bangCenterGeo = getCachedGeometry('player_hair_bang_c', () => new THREE.ConeGeometry(0.08, 0.16, 5));
    const bangC = new THREE.Mesh(bangCenterGeo, hairMat);
    bangC.position.set(0, 0.92, 0.22);
    bangC.rotation.set(-0.35, 0, 0);
    group.add(bangC);

    const bangLeftGeo = getCachedGeometry('player_hair_bang_l', () => new THREE.ConeGeometry(0.07, 0.15, 5));
    const bangL = new THREE.Mesh(bangLeftGeo, hairMat);
    bangL.position.set(-0.11, 0.91, 0.20);
    bangL.rotation.set(-0.3, 0.2, 0.25);
    group.add(bangL);

    const bangRightGeo = getCachedGeometry('player_hair_bang_r', () => new THREE.ConeGeometry(0.07, 0.15, 5));
    const bangR = new THREE.Mesh(bangRightGeo, hairMat);
    bangR.position.set(0.11, 0.91, 0.20);
    bangR.rotation.set(-0.3, -0.2, -0.25);
    group.add(bangR);

    // 3. Side Locks (Framing cheeks)
    const sideLockGeo = getCachedGeometry('player_hair_sidelock', () => new THREE.BoxGeometry(0.06, 0.20, 0.12));
    const lockL = new THREE.Mesh(sideLockGeo, hairMat);
    lockL.position.set(-0.23, 0.81, 0.05);
    lockL.rotation.z = 0.08;
    group.add(lockL);

    const lockR = new THREE.Mesh(sideLockGeo, hairMat);
    lockR.position.set(0.23, 0.81, 0.05);
    lockR.rotation.z = -0.08;
    group.add(lockR);

    // 4. Back Fluff / Layered Neck Locks
    const backHairGeo = getCachedGeometry('player_hair_back', () => new THREE.BoxGeometry(0.36, 0.18, 0.14));
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, 0.77, -0.18);
    group.add(backHair);

    // 5. Anime Eyes (Expressive dark glossy pupils)
    const eyeMat = getCachedMaterial('#1e293b');
    const eyeGeo = getCachedGeometry('player_eye', () => new THREE.BoxGeometry(0.045, 0.06, 0.02));
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.085, 0.83, 0.23);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.085, 0.83, 0.23);
    group.add(eyeR);

    return group;
  }

  // --- FARMHOUSE (Artisan Rustic Farmhouse with Terracotta Tiled Roof & Timber Frame) ---
  public static createFarmhouse(palette: TexturePackPalette): THREE.Group {
    const house = new THREE.Group();

    // 1. Soft Contact Base Drop Shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x071207,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadowGeo = getCachedGeometry('house_shadow_v3', () => new THREE.PlaneGeometry(4.2, 3.6));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.015, 0.1);
    house.add(shadow);

    // 2. Stone Foundation Base Plinth
    const stoneBaseMat = getCachedMaterial('#57534e');
    const stoneBaseGeo = getCachedGeometry('house_stone_base_v3', () => new THREE.BoxGeometry(3.3, 0.45, 2.7));
    const stoneBase = new THREE.Mesh(stoneBaseGeo, stoneBaseMat);
    stoneBase.position.y = 0.225;
    house.add(stoneBase);

    // 3. Timber Log Clapboard Siding Walls
    const wallMat = getCachedMaterial('#9a522c');
    const wallGeo = getCachedGeometry('house_wall_timber_v3', () => new THREE.BoxGeometry(3.1, 1.55, 2.5));
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.22;
    house.add(walls);

    // 4. Vertical Corner Posts & Trim Beams (Balok Sudut Kayu Jati)
    const timberPostMat = getCachedMaterial('#451a03');
    const postGeo = getCachedGeometry('house_corner_post', () => new THREE.BoxGeometry(0.18, 1.6, 0.18));
    const postPositions = [
      [-1.52, 1.25, -1.22],
      [ 1.52, 1.25, -1.22],
      [-1.52, 1.25,  1.22],
      [ 1.52, 1.25,  1.22],
    ];
    postPositions.forEach(([px, py, pz]) => {
      const post = new THREE.Mesh(postGeo, timberPostMat);
      post.position.set(px, py, pz);
      house.add(post);
    });

    // Horizontal Beam Trim (Pemisah Dinding)
    const beamGeo = getCachedGeometry('house_mid_beam', () => new THREE.BoxGeometry(3.18, 0.12, 2.58));
    const midBeam = new THREE.Mesh(beamGeo, timberPostMat);
    midBeam.position.y = 1.95;
    house.add(midBeam);

    // 5. Classic Pitched Terracotta Clay Shingle Gable Roof (Atap Pelana Genteng Estetik)
    const shingleMat = new THREE.MeshLambertMaterial({
      map: getRoofShingleTexture(),
      color: 0xffffff,
    });

    // Front Slope (facing +Z)
    const roofSlopeGeo = getCachedGeometry('house_roof_slope', () => new THREE.BoxGeometry(3.5, 0.12, 1.7));
    const frontRoof = new THREE.Mesh(roofSlopeGeo, shingleMat);
    frontRoof.position.set(0, 2.45, 0.65);
    frontRoof.rotation.x = Math.PI * 0.19;
    house.add(frontRoof);

    // Back Slope (facing -Z)
    const backRoof = new THREE.Mesh(roofSlopeGeo, shingleMat);
    backRoof.position.set(0, 2.45, -0.65);
    backRoof.rotation.x = -Math.PI * 0.19;
    house.add(backRoof);

    // Ridge Beam Peak (Balok Bubungan Atap)
    const ridgeGeo = getCachedGeometry('house_roof_ridge', () => new THREE.BoxGeometry(3.6, 0.16, 0.16));
    const ridge = new THREE.Mesh(ridgeGeo, timberPostMat);
    ridge.position.set(0, 2.88, 0);
    house.add(ridge);

    // Triangular Gable Wall Fills (Dinding Segitiga Bawah Atap)
    const gableMat = getCachedMaterial('#854122');
    const gableGeo = getCachedGeometry('house_gable_tri', () => {
      const geom = new THREE.ConeGeometry(1.35, 0.9, 3);
      geom.rotateY(Math.PI / 2);
      return geom;
    });
    const gableL = new THREE.Mesh(gableGeo, gableMat);
    gableL.scale.set(1.0, 1.0, 0.08);
    gableL.position.set(-1.54, 2.42, 0);
    house.add(gableL);

    const gableR = new THREE.Mesh(gableGeo, gableMat);
    gableR.scale.set(1.0, 1.0, 0.08);
    gableR.position.set(1.54, 2.42, 0);
    house.add(gableR);

    // Attic Round Window on East Gable
    const atticWinMat = getCachedMaterial('#bae6fd');
    const atticWinGeo = getCachedGeometry('house_attic_win', () => new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8));
    const atticWin = new THREE.Mesh(atticWinGeo, atticWinMat);
    atticWin.rotation.z = Math.PI / 2;
    atticWin.position.set(1.55, 2.45, 0);
    house.add(atticWin);

    // 6. Solid Wooden Door with Handle & Stone Step
    const doorMat = getCachedMaterial('#3f1d0b');
    const doorGeo = getCachedGeometry('house_door_v3', () => new THREE.BoxGeometry(0.65, 1.15, 0.08));
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(-0.35, 0.85, 1.28);
    house.add(door);

    const doorHandleMat = getCachedMaterial('#f59e0b');
    const doorHandleGeo = getCachedGeometry('house_door_handle', () => new THREE.SphereGeometry(0.04, 6, 6));
    const doorHandle = new THREE.Mesh(doorHandleGeo, doorHandleMat);
    doorHandle.position.set(-0.15, 0.85, 1.34);
    house.add(doorHandle);

    const stepMat = getCachedMaterial('#78716c');
    const stepGeo = getCachedGeometry('house_door_step', () => new THREE.BoxGeometry(0.85, 0.14, 0.4));
    const step = new THREE.Mesh(stepGeo, stepMat);
    step.position.set(-0.35, 0.07, 1.45);
    house.add(step);

    // 7. Artisan Windows with Frames & Flower Box Planter
    const frameMat = getCachedMaterial('#fef08a');
    const glassMat = getCachedMaterial('#7dd3fc');

    // Front Window
    const winFrameGeo = getCachedGeometry('house_win_frame', () => new THREE.BoxGeometry(0.65, 0.65, 0.08));
    const winFrame = new THREE.Mesh(winFrameGeo, frameMat);
    winFrame.position.set(0.75, 1.3, 1.28);
    house.add(winFrame);

    const winGlassGeo = getCachedGeometry('house_win_glass', () => new THREE.BoxGeometry(0.55, 0.55, 0.09));
    const winGlass = new THREE.Mesh(winGlassGeo, glassMat);
    winGlass.position.set(0.75, 1.3, 1.285);
    house.add(winGlass);

    // Flower Box under Front Window
    const planterMat = getCachedMaterial('#5c2e14');
    const planterGeo = getCachedGeometry('house_planter', () => new THREE.BoxGeometry(0.75, 0.16, 0.22));
    const planter = new THREE.Mesh(planterGeo, planterMat);
    planter.position.set(0.75, 0.94, 1.35);
    house.add(planter);

    const flowerColors = ['#f43f5e', '#fbbf24', '#ffffff', '#38bdf8'];
    for (let f = 0; f < 5; f++) {
      const flMat = getCachedMaterial(flowerColors[f % flowerColors.length]);
      const flGeo = getCachedGeometry('house_flower_bloom', () => new THREE.DodecahedronGeometry(0.045));
      const fl = new THREE.Mesh(flGeo, flMat);
      fl.position.set(0.48 + f * 0.13, 1.05, 1.35);
      house.add(fl);
    }

    // 8. Stone Chimney with Terracotta Pot Cap
    const chimMat = getCachedMaterial('#475569');
    const chimGeo = getCachedGeometry('house_chim_v3', () => new THREE.BoxGeometry(0.45, 1.35, 0.45));
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(-0.85, 2.5, -0.45);
    house.add(chim);

    const potMat = getCachedMaterial('#ea580c');
    const potGeo = getCachedGeometry('house_chim_pot', () => new THREE.CylinderGeometry(0.14, 0.12, 0.3, 6));
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-0.85, 3.25, -0.45);
    house.add(pot);

    // 9. Side Props: Firewood Stack (Tumpukan Kayu Bakar) & Water Barrel
    const logBarkM = new THREE.MeshLambertMaterial({ map: getLogBarkTexture(), color: 0xffffff });
    const logEndM = new THREE.MeshLambertMaterial({ map: getLogEndTexture(), color: 0xffffff });
    const woodLogGeo = getCachedGeometry('house_prop_log', () => new THREE.CylinderGeometry(0.1, 0.1, 0.65, 6));

    const firewoodPositions = [
      [1.65, 0.1, -0.4],
      [1.65, 0.1, -0.15],
      [1.65, 0.26, -0.28],
    ];
    firewoodPositions.forEach(([fx, fy, fz]) => {
      const pLog = new THREE.Mesh(woodLogGeo, logBarkM);
      pLog.rotation.z = Math.PI / 2;
      pLog.position.set(fx, fy, fz);
      house.add(pLog);

      const endMesh = new THREE.Mesh(getCachedGeometry('prop_log_end', () => new THREE.CircleGeometry(0.095, 6)), logEndM);
      endMesh.position.set(fx, fy, fz + 0.33);
      house.add(endMesh);
    });

    // Rain Water Barrel
    const barrelMat = getCachedMaterial('#451a03');
    const barrelGeo = getCachedGeometry('house_water_barrel', () => new THREE.CylinderGeometry(0.24, 0.22, 0.55, 8));
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(-1.62, 0.28, 0.85);
    house.add(barrel);

    const hoopMat = getCachedMaterial('#1e293b');
    const hoopGeo = getCachedGeometry('barrel_hoop', () => new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8));
    const hoop1 = new THREE.Mesh(hoopGeo, hoopMat);
    hoop1.position.set(-1.62, 0.38, 0.85);
    house.add(hoop1);
    const hoop2 = new THREE.Mesh(hoopGeo, hoopMat);
    hoop2.position.set(-1.62, 0.18, 0.85);
    house.add(hoop2);

    return house;
  }

  // --- WINDMILL ---
  public static createWindmill(palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();

    // Tower Base
    const towerMat = getCachedMaterial(palette.stoneColor);
    const towerGeo = getCachedGeometry('windmill_tower', () => new THREE.CylinderGeometry(1.0, 1.4, 3.2, 6));
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 1.6;
    group.add(tower);

    // Cap / Dome
    const capMat = getCachedMaterial(palette.roofColor);
    const capGeo = getCachedGeometry('windmill_cap', () => new THREE.ConeGeometry(1.2, 1.0, 6));
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 3.7;
    group.add(cap);

    // Windmill Blades Rotor
    const blades = new THREE.Group();
    blades.name = 'windmill_blades';
    blades.position.set(0, 3.2, 1.05);

    const bladeMat = getCachedMaterial(palette.woodColor);
    const bladeGeo = getCachedGeometry('windmill_blade_geo', () => new THREE.BoxGeometry(0.2, 2.6, 0.05));

    const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.z = Math.PI / 2;

    blades.add(blade1);
    blades.add(blade2);
    group.add(blades);

    return group;
  }

  // --- BEAUTIFUL ARCHED WOODEN RIVER BRIDGE ---
  public static createWoodenBridge(): THREE.Group {
    const bridge = new THREE.Group();
    bridge.name = 'wooden_bridge';

    const woodPlankMat1 = getCachedMaterial('#8d5b4c');
    const woodPlankMat2 = getCachedMaterial('#966050');
    const woodPlankMat3 = getCachedMaterial('#7d4e3f');
    const darkWoodMat = getCachedMaterial('#4a2e25');
    const stoneBaseMat = getCachedMaterial('#78716c');
    const brassMat = getCachedMaterial('#d97706', 0.4, 0.6);
    const lanternGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Stone Foundation Ramps on Riverbanks (North Z = -1.22, South Z = +1.22)
    const stoneGeo = getCachedGeometry('bridge_stone_abutment', () => new THREE.BoxGeometry(1.48, 0.22, 0.45));
    const stoneNorth = new THREE.Mesh(stoneGeo, stoneBaseMat);
    stoneNorth.position.set(0, 0.04, -1.22);
    bridge.add(stoneNorth);

    const stoneSouth = new THREE.Mesh(stoneGeo, stoneBaseMat);
    stoneSouth.position.set(0, 0.04, 1.22);
    bridge.add(stoneSouth);

    // 2. Heavy Timber Support Piles Under Bridge in Riverbed
    const pileGeo = getCachedGeometry('bridge_pile', () => new THREE.CylinderGeometry(0.08, 0.09, 0.55, 6));
    const crossbeamGeo = getCachedGeometry('bridge_crossbeam', () => new THREE.BoxGeometry(1.36, 0.10, 0.12));

    const pilePositions = [
      { x: -0.58, z: -0.65 },
      { x: 0.58, z: -0.65 },
      { x: -0.58, z: 0.65 },
      { x: 0.58, z: 0.65 },
    ];
    pilePositions.forEach((pos) => {
      const pile = new THREE.Mesh(pileGeo, darkWoodMat);
      pile.position.set(pos.x, -0.06, pos.z);
      bridge.add(pile);
    });

    const beamN = new THREE.Mesh(crossbeamGeo, darkWoodMat);
    beamN.position.set(0, 0.04, -0.65);
    bridge.add(beamN);

    const beamS = new THREE.Mesh(crossbeamGeo, darkWoodMat);
    beamS.position.set(0, 0.04, 0.65);
    bridge.add(beamS);

    // 3. Arched Timber Planks Deck (11 Individual Rustic Planks spanning from Z = -1.1 to +1.1)
    const plankWidth = 1.38;
    const plankThickness = 0.07;
    const plankLength = 0.18;
    const plankGeo = getCachedGeometry('bridge_deck_plank', () => new THREE.BoxGeometry(plankWidth, plankThickness, plankLength));
    const numPlanks = 11;

    for (let i = 0; i < numPlanks; i++) {
      const t = (i / (numPlanks - 1)) * 2 - 1; // from -1 to +1
      const pz = t * 1.08;
      // Gentle arch: highest in the center (Y = 0.16), tapering to Y = 0.08 at ends
      const py = 0.08 + Math.cos(t * Math.PI * 0.5) * 0.07;
      // Slight pitch tilt following the arch curvature
      const rotX = -Math.sin(t * Math.PI * 0.5) * 0.08;

      const mat = i % 3 === 0 ? woodPlankMat1 : (i % 3 === 1 ? woodPlankMat2 : woodPlankMat3);
      const plank = new THREE.Mesh(plankGeo, mat);
      plank.position.set(0, py, pz);
      plank.rotation.x = rotX;
      bridge.add(plank);
    }

    // 4. Sturdy Handrail Posts (6 upright posts: 3 on West, 3 on East)
    const postGeo = getCachedGeometry('bridge_rail_post', () => new THREE.BoxGeometry(0.11, 0.54, 0.11));
    const postCapGeo = getCachedGeometry('bridge_post_cap', () => new THREE.ConeGeometry(0.09, 0.08, 4));

    const postZs = [-1.08, 0, 1.08];
    const sideXs = [-0.64, 0.64];

    sideXs.forEach((px) => {
      postZs.forEach((pz) => {
        const archY = 0.08 + Math.cos((pz / 1.08) * Math.PI * 0.5) * 0.07;
        const post = new THREE.Mesh(postGeo, darkWoodMat);
        post.position.set(px, archY + 0.24, pz);
        bridge.add(post);

        const cap = new THREE.Mesh(postCapGeo, darkWoodMat);
        cap.position.set(px, archY + 0.52, pz);
        cap.rotation.y = Math.PI / 4;
        bridge.add(cap);
      });
    });

    // 5. Dual Longitudinal Curved Handrails
    const railTopGeo = getCachedGeometry('bridge_rail_top', () => new THREE.BoxGeometry(0.08, 0.08, 2.36));
    const railMidGeo = getCachedGeometry('bridge_rail_mid', () => new THREE.BoxGeometry(0.06, 0.06, 2.36));

    sideXs.forEach((px) => {
      const topRail = new THREE.Mesh(railTopGeo, darkWoodMat);
      topRail.position.set(px, 0.50, 0);
      bridge.add(topRail);

      const midRail = new THREE.Mesh(railMidGeo, woodPlankMat1);
      midRail.position.set(px, 0.32, 0);
      bridge.add(midRail);
    });

    // 6. Cozy Warm Lanterns on Entrance Posts
    const lanternGeo = getCachedGeometry('bridge_lantern_box', () => new THREE.BoxGeometry(0.12, 0.16, 0.12));
    const lanternGlowGeo = getCachedGeometry('bridge_lantern_glow', () => new THREE.SphereGeometry(0.05, 6, 6));

    const lanternSpawns = [
      { x: -0.64, z: -1.08 },
      { x: 0.64, z: 1.08 },
    ];
    lanternSpawns.forEach((lp) => {
      const lanternBox = new THREE.Mesh(lanternGeo, brassMat);
      lanternBox.position.set(lp.x, 0.56, lp.z);
      bridge.add(lanternBox);

      const glow = new THREE.Mesh(lanternGlowGeo, lanternGlowMat);
      glow.position.set(lp.x, 0.56, lp.z);
      bridge.add(glow);
    });

    return bridge;
  }

  // --- GATE ARCHWAY ---
  public static createGateArchway(isNorthGate = true): THREE.Group {
    const gate = new THREE.Group();
    gate.name = isNorthGate ? 'north_gate' : 'south_gate';

    const pillarMat = getCachedMaterial('#4e342e');
    const bannerMat = getCachedMaterial(isNorthGate ? '#7e22ce' : '#15803d');
    const goldTrimMat = getCachedMaterial('#facc15');

    // Left & Right Wooden Pillars
    const pillarGeo = getCachedGeometry('gate_pillar', () => new THREE.BoxGeometry(0.25, 2.2, 0.25));
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-1.1, 1.1, 0);
    gate.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(1.1, 1.1, 0);
    gate.add(rightPillar);

    // Crossbeam
    const beamGeo = getCachedGeometry('gate_beam', () => new THREE.BoxGeometry(2.6, 0.28, 0.28));
    const crossbeam = new THREE.Mesh(beamGeo, pillarMat);
    crossbeam.position.set(0, 2.1, 0);
    gate.add(crossbeam);

    // Signboard
    const signGeo = getCachedGeometry('gate_sign', () => new THREE.BoxGeometry(1.8, 0.6, 0.1));
    const sign = new THREE.Mesh(signGeo, bannerMat);
    sign.position.set(0, 1.7, 0);
    gate.add(sign);

    // Gold Trim
    const trimGeo = getCachedGeometry('gate_trim', () => new THREE.BoxGeometry(1.9, 0.08, 0.12));
    const trimTop = new THREE.Mesh(trimGeo, goldTrimMat);
    trimTop.position.set(0, 2.02, 0);
    gate.add(trimTop);

    return gate;
  }

  // --- CROPS (Lush Storybook Vegetables matching Image 1: Savoy Cabbage, Carrots, Radishes, Pumpkins) ---
  public static createCrop(cropType: CropType, stage: GrowthStage, palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = `crop_${cropType}_${stage}`;

    // Base Furrowed Soil Ridge Mound
    const soilMoundMat = getCachedMaterial('#3f1d0b');
    const moundGeo = getCachedGeometry('crop_soil_mound', () => new THREE.SphereGeometry(0.18, 6, 4));
    const mound = new THREE.Mesh(moundGeo, soilMoundMat);
    mound.scale.set(1.2, 0.35, 1.2);
    mound.position.y = 0.02;
    group.add(mound);

    // Stage 0: Baby Sprout Seedling
    if (stage === 0) {
      const sproutMat = getCachedMaterial('#84cc16');
      const leafGeo = getCachedGeometry('crop_leaf_sprout', () => new THREE.ConeGeometry(0.045, 0.16, 4));
      const leafL = new THREE.Mesh(leafGeo, sproutMat);
      leafL.position.set(-0.045, 0.08, 0);
      leafL.rotation.z = 0.45;
      group.add(leafL);

      const leafR = new THREE.Mesh(leafGeo, sproutMat);
      leafR.position.set(0.045, 0.08, 0);
      leafR.rotation.z = -0.45;
      group.add(leafR);

      return group;
    }

    // Stage 1: Young Growing Plant
    if (stage === 1) {
      const youngGreenMat = getCachedMaterial('#4ade80');
      const shootGeo = getCachedGeometry('crop_shoot_1', () => new THREE.ConeGeometry(0.08, 0.28, 5));
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const shoot = new THREE.Mesh(shootGeo, youngGreenMat);
        shoot.position.set(Math.cos(ang) * 0.06, 0.14, Math.sin(ang) * 0.06);
        shoot.rotation.set(Math.sin(ang) * 0.25, ang, -Math.cos(ang) * 0.25);
        group.add(shoot);
      }
      return group;
    }

    // Stage 2 & 3: Rich Volumetric Vegetables
    const scale = stage === 2 ? 0.72 : 1.0;

    // A. CABBAGE / SAVOY CABBAGE (Leafy Green Vegetables - exactly as seen in front row of Image 1!)
    if (cropType === 'rice' || cropType === 'corn') {
      const outerLeafMat = getCachedMaterial('#15803d');
      const midLeafMat = getCachedMaterial('#22c55e');
      const heartMat = getCachedMaterial('#86efac');

      // Crinkly Outer Savoy Leaves cupping outward
      const leafOuterGeo = getCachedGeometry('cabbage_leaf_outer', () => new THREE.DodecahedronGeometry(0.16 * scale));
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const leaf = new THREE.Mesh(leafOuterGeo, outerLeafMat);
        leaf.scale.set(1.2, 0.4, 0.9);
        leaf.position.set(Math.cos(ang) * 0.16 * scale, 0.08 * scale, Math.sin(ang) * 0.16 * scale);
        leaf.rotation.set(Math.sin(ang) * 0.4, ang, -Math.cos(ang) * 0.4);
        group.add(leaf);
      }

      // Mid Leaf Layer
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 + 0.3;
        const leaf = new THREE.Mesh(leafOuterGeo, midLeafMat);
        leaf.scale.set(1.0, 0.5, 0.8);
        leaf.position.set(Math.cos(ang) * 0.10 * scale, 0.14 * scale, Math.sin(ang) * 0.10 * scale);
        leaf.rotation.set(Math.sin(ang) * 0.3, ang, -Math.cos(ang) * 0.3);
        group.add(leaf);
      }

      // Plump Central Cabbage Head (Stage 3 ready harvest)
      if (stage === 3) {
        const headGeo = getCachedGeometry('cabbage_head_core', () => new THREE.DodecahedronGeometry(0.18));
        const head = new THREE.Mesh(headGeo, heartMat);
        head.position.set(0, 0.20, 0);
        group.add(head);
      }
    }
    // B. CARROTS with Lush Feathery Tops & Bright Orange Roots Peeking from Earth (matching Image 1!)
    else if (cropType === 'carrot') {
      const fernMat = getCachedMaterial('#15803d');
      const frondMat = getCachedMaterial('#22c55e');
      const carrotOrangeMat = getCachedMaterial('#ea580c');

      // Feathery fern tops
      const fernGeo = getCachedGeometry(`carrot_frond_${scale}`, () => new THREE.ConeGeometry(0.08 * scale, 0.42 * scale, 4));
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const fern = new THREE.Mesh(fernGeo, i % 2 === 0 ? fernMat : frondMat);
        fern.position.set(Math.cos(ang) * 0.08 * scale, 0.24 * scale, Math.sin(ang) * 0.08 * scale);
        fern.rotation.set(Math.sin(ang) * 0.35, ang, -Math.cos(ang) * 0.35);
        group.add(fern);
      }

      // Orange Carrot Shoulder emerging above soil
      const shoulderGeo = getCachedGeometry('carrot_shoulder', () => new THREE.CylinderGeometry(0.09 * scale, 0.06 * scale, 0.14 * scale, 6));
      const shoulder = new THREE.Mesh(shoulderGeo, carrotOrangeMat);
      shoulder.position.set(0, 0.07 * scale, 0);
      group.add(shoulder);
    }
    // C. RADISH / STRAWBERRY / TURNIP with Ruby-Red Bulbs (matching Image 1!)
    else if (cropType === 'strawberry' || cropType === 'tomato') {
      const leafMat = getCachedMaterial('#15803d');
      const bulbMat = getCachedMaterial('#e11d48'); // Ruby red

      // Sprawling green leaves
      const leafGeo = getCachedGeometry(`radish_leaf_${scale}`, () => new THREE.ConeGeometry(0.10 * scale, 0.32 * scale, 4));
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI * 2) / 4;
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(Math.cos(ang) * 0.09 * scale, 0.20 * scale, Math.sin(ang) * 0.09 * scale);
        leaf.rotation.set(Math.sin(ang) * 0.45, ang, -Math.cos(ang) * 0.45);
        group.add(leaf);
      }

      // Plump Ruby Radish / Tomato Fruit
      if (stage === 3) {
        const bulbGeo = getCachedGeometry('radish_bulb', () => new THREE.SphereGeometry(0.13, 6, 6));
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(0, 0.10, 0);
        group.add(bulb);
      }
    }
    // D. PUMPKIN with Golden Orange Ribbed Body & Tendrils
    else {
      const vineMat = getCachedMaterial('#15803d');
      const pumpkinMat = getCachedMaterial('#ea580c');
      const stemDarkMat = getCachedMaterial('#2d5a27');

      // Broad vine leaves
      const vineGeo = getCachedGeometry(`pumpkin_vine_${scale}`, () => new THREE.ConeGeometry(0.14 * scale, 0.28 * scale, 4));
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const vine = new THREE.Mesh(vineGeo, vineMat);
        vine.position.set(Math.cos(ang) * 0.14 * scale, 0.12 * scale, Math.sin(ang) * 0.14 * scale);
        vine.rotation.set(Math.sin(ang) * 0.6, ang, -Math.cos(ang) * 0.6);
        group.add(vine);
      }

      // Harvest ready pumpkin
      if (stage === 3) {
        const pGeo = getCachedGeometry('pumpkin_body_geo', () => new THREE.SphereGeometry(0.22, 8, 8));
        const pMesh = new THREE.Mesh(pGeo, pumpkinMat);
        pMesh.scale.set(1.2, 0.8, 1.2);
        pMesh.position.set(0, 0.14, 0);
        group.add(pMesh);

        const stemGeo = getCachedGeometry('pumpkin_stem_geo', () => new THREE.CylinderGeometry(0.03, 0.04, 0.12, 5));
        const stem = new THREE.Mesh(stemGeo, stemDarkMat);
        stem.position.set(0, 0.32, 0);
        group.add(stem);
      }
    }

    return group;
  }

  // --- ANIMAL MODELS (Village Hen & Baby Chicks matching Image 1!) ---
  public static createChicken(): THREE.Group {
    const group = new THREE.Group();

    // 1. Soft Drop Shadow
    const shadowMat = getCachedMaterial('#071207', 1, 0);
    shadowMat.transparent = true;
    shadowMat.opacity = 0.38;
    const shadowGeo = getCachedGeometry('chicken_shadow', () => new THREE.PlaneGeometry(0.70, 0.50));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.06, 0.015, 0.08);
    group.add(shadow);

    // 2. MAMA HEN (Warm Russet-Brown Village Hen matching Image 1!)
    const henMat = getCachedMaterial('#9a3412'); // Rich warm russet brown
    const wingMat = getCachedMaterial('#7c2d12'); // Darker chestnut wing feathers
    const tailMat = getCachedMaterial('#451a03'); // Dark tail plume
    const combMat = getCachedMaterial('#dc2626'); // Vibrant red comb
    const beakMat = getCachedMaterial('#f59e0b'); // Golden yellow beak
    const eyeMat = getCachedMaterial('#0f172a');

    // Hen Body (plump rounded hen)
    const bodyGeo = getCachedGeometry('hen_body_v3', () => new THREE.SphereGeometry(0.20, 8, 8));
    const body = new THREE.Mesh(bodyGeo, henMat);
    body.scale.set(1.0, 1.1, 1.3);
    body.position.set(0, 0.26, 0);
    group.add(body);

    // Hen Wings (folded on sides)
    const wingGeo = getCachedGeometry('hen_wing_v3', () => new THREE.BoxGeometry(0.06, 0.18, 0.24));
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.19, 0.28, 0);
    wingL.rotation.z = 0.1;
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.19, 0.28, 0);
    wingR.rotation.z = -0.1;
    group.add(wingR);

    // Hen Upright Fan Tail
    const tailGeo = getCachedGeometry('hen_tail_v3', () => new THREE.ConeGeometry(0.10, 0.22, 5));
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.36, -0.22);
    tail.rotation.x = -0.65;
    group.add(tail);

    // Hen Neck & Head
    const headGeo = getCachedGeometry('hen_head_v3', () => new THREE.SphereGeometry(0.11, 7, 7));
    const head = new THREE.Mesh(headGeo, henMat);
    head.position.set(0, 0.44, 0.15);
    group.add(head);

    // Red Comb on Top of Head
    const combGeo = getCachedGeometry('hen_comb_v3', () => new THREE.BoxGeometry(0.04, 0.10, 0.14));
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 0.55, 0.14);
    group.add(comb);

    // Red Wattle Under Beak
    const wattleGeo = getCachedGeometry('hen_wattle_v3', () => new THREE.SphereGeometry(0.04, 5, 5));
    const wattle = new THREE.Mesh(wattleGeo, combMat);
    wattle.position.set(0, 0.39, 0.24);
    group.add(wattle);

    // Golden Beak
    const beakGeo = getCachedGeometry('hen_beak_v3', () => new THREE.ConeGeometry(0.04, 0.10, 4));
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.43, 0.28);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    // Eyes
    const eyeGeo = getCachedGeometry('hen_eye_v3', () => new THREE.SphereGeometry(0.02, 4, 4));
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.09, 0.46, 0.20);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.09, 0.46, 0.20);
    group.add(eyeR);

    // 3. BABY CHICKS (2 Adorable Yellow Chicks pecking ground as in Image 1!)
    const chickMat = getCachedMaterial('#facc15'); // Fluffy chick yellow
    const chickBeakMat = getCachedMaterial('#ea580c');
    const chickGeo = getCachedGeometry('chick_body_v3', () => new THREE.SphereGeometry(0.075, 6, 6));
    const chickBeakGeo = getCachedGeometry('chick_beak_v3', () => new THREE.ConeGeometry(0.02, 0.05, 4));

    // Chick 1 (pecking ground in front)
    const chick1 = new THREE.Mesh(chickGeo, chickMat);
    chick1.position.set(0.24, 0.08, 0.14);
    group.add(chick1);
    const cBeak1 = new THREE.Mesh(chickBeakGeo, chickBeakMat);
    cBeak1.position.set(0.24, 0.05, 0.21);
    cBeak1.rotation.x = Math.PI * 0.7;
    group.add(cBeak1);

    // Chick 2 (chirping beside mama)
    const chick2 = new THREE.Mesh(chickGeo, chickMat);
    chick2.position.set(-0.20, 0.08, -0.10);
    group.add(chick2);
    const cBeak2 = new THREE.Mesh(chickBeakGeo, chickBeakMat);
    cBeak2.position.set(-0.20, 0.09, -0.04);
    cBeak2.rotation.x = Math.PI * 0.3;
    group.add(cBeak2);

    return group;
  }

  // --- RUSTIC WOODEN POST & RAIL FENCE (matching Image 1!) ---
  public static createRusticFence(length = 2.0): THREE.Group {
    const fence = new THREE.Group();
    fence.name = 'wooden_fence';

    const timberMat = getCachedMaterial('#5c382e');
    const darkWoodMat = getCachedMaterial('#3f241a');

    // 1. Two Sturdy Weathered Wooden Posts
    const postGeo = getCachedGeometry('fence_post_geo', () => new THREE.BoxGeometry(0.13, 0.76, 0.13));
    const capGeo = getCachedGeometry('fence_post_cap_geo', () => new THREE.ConeGeometry(0.10, 0.08, 4));

    const halfL = length / 2;
    [-halfL, halfL].forEach((px) => {
      const post = new THREE.Mesh(postGeo, timberMat);
      post.position.set(px, 0.38, 0);
      fence.add(post);

      const cap = new THREE.Mesh(capGeo, darkWoodMat);
      cap.position.set(px, 0.78, 0);
      cap.rotation.y = Math.PI / 4;
      fence.add(cap);
    });

    // 2. Dual Split Rails (Top and Mid rails running between posts)
    const railTopGeo = getCachedGeometry(`fence_rail_top_${length}`, () => new THREE.BoxGeometry(length + 0.1, 0.08, 0.08));
    const railTop = new THREE.Mesh(railTopGeo, timberMat);
    railTop.position.set(0, 0.56, 0);
    fence.add(railTop);

    const railMidGeo = getCachedGeometry(`fence_rail_mid_${length}`, () => new THREE.BoxGeometry(length + 0.1, 0.08, 0.08));
    const railMid = new THREE.Mesh(railMidGeo, timberMat);
    railMid.position.set(0, 0.32, 0);
    fence.add(railMid);

    return fence;
  }

  // --- CONIFER PINE / FIR TREE (Tall Evergreen matching forest in Image 1!) ---
  public static createPineTree(): THREE.Group {
    const tree = new THREE.Group();
    tree.name = 'pine_tree';

    // 1. Ground Drop Shadow
    const shadowMat = getCachedMaterial('#071207', 1, 0);
    shadowMat.transparent = true;
    shadowMat.opacity = 0.42;
    const shadowGeo = getCachedGeometry('pine_shadow_geo', () => new THREE.PlaneGeometry(2.4, 1.8));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.2, 0.015, 0.2);
    tree.add(shadow);

    // 2. Tall Sturdy Trunk
    const trunkMat = getCachedMaterial('#451a03');
    const trunkGeo = getCachedGeometry('pine_trunk_geo', () => new THREE.CylinderGeometry(0.20, 0.32, 2.8, 6));
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.4;
    tree.add(trunk);

    // 3. Four Layered Conical Needle Foliage Tiers (Layered evergreen tones)
    const pineTiers = [
      { r: 1.35, h: 1.3, y: 2.2, color: '#1b4332' }, // Deep forest base
      { r: 1.10, h: 1.2, y: 2.9, color: '#2d6a4f' }, // Mid pine
      { r: 0.82, h: 1.1, y: 3.6, color: '#40916c' }, // Sunlit green
      { r: 0.52, h: 0.9, y: 4.2, color: '#52b788' }, // Peak tip
    ];

    pineTiers.forEach((tier, idx) => {
      const tierMat = getCachedMaterial(tier.color);
      const tierGeo = getCachedGeometry(`pine_tier_${idx}`, () => new THREE.ConeGeometry(tier.r, tier.h, 7));
      const tierMesh = new THREE.Mesh(tierGeo, tierMat);
      tierMesh.position.y = tier.y;
      tree.add(tierMesh);
    });

    return tree;
  }

  // --- FLOATING WATER LILY PAD & LOTUS BLOSSOM (Studio Ghibli River Accent) ---
  public static createWaterLily(): THREE.Group {
    const lily = new THREE.Group();
    lily.name = 'water_lily';

    const padMat = getCachedMaterial('#166534');
    const padGeo = getCachedGeometry('lily_pad_geo', () => new THREE.CylinderGeometry(0.24, 0.24, 0.015, 8));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.008;
    lily.add(pad);

    const flowerMat = getCachedMaterial('#f472b6');
    const flowerGeo = getCachedGeometry('lotus_flower_geo', () => new THREE.DodecahedronGeometry(0.065));
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(0.04, 0.045, 0.02);
    lily.add(flower);

    const centerMat = getCachedMaterial('#fde047');
    const centerGeo = getCachedGeometry('lotus_center_geo', () => new THREE.SphereGeometry(0.025, 4, 4));
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.set(0.04, 0.075, 0.02);
    lily.add(center);

    return lily;
  }

  public static createCow(): THREE.Group {
    const group = new THREE.Group();
    const bodyMat = getCachedMaterial('#f5f5f5');
    const spotMat = getCachedMaterial('#212121');
    const pinkMat = getCachedMaterial('#f8bbd0');

    const bodyGeo = getCachedGeometry('cow_body', () => new THREE.BoxGeometry(0.8, 0.6, 1.2));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    const spotGeo = getCachedGeometry('cow_spot', () => new THREE.BoxGeometry(0.82, 0.3, 0.4));
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.position.set(0, 0.55, 0);
    group.add(spot);

    const headGeo = getCachedGeometry('cow_head', () => new THREE.BoxGeometry(0.4, 0.38, 0.45));
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0.75, 0.65);
    group.add(head);

    const snoutGeo = getCachedGeometry('cow_snout', () => new THREE.BoxGeometry(0.32, 0.18, 0.2));
    const snout = new THREE.Mesh(snoutGeo, pinkMat);
    snout.position.set(0, 0.68, 0.85);
    group.add(snout);

    return group;
  }

  public static createSheep(): THREE.Group {
    const group = new THREE.Group();
    const woolMat = getCachedMaterial('#eceff1');
    const faceMat = getCachedMaterial('#37474f');

    const bodyGeo = getCachedGeometry('sheep_body', () => new THREE.DodecahedronGeometry(0.55));
    const body = new THREE.Mesh(bodyGeo, woolMat);
    body.position.y = 0.55;
    group.add(body);

    const headGeo = getCachedGeometry('sheep_head', () => new THREE.BoxGeometry(0.3, 0.28, 0.35));
    const head = new THREE.Mesh(headGeo, faceMat);
    head.position.set(0, 0.6, 0.5);
    group.add(head);

    return group;
  }

  // --- KOTAK PENGIRIMAN (SHIPPING BIN) ---
  public static createShippingBin(palette: TexturePackPalette): THREE.Group {
    const bin = new THREE.Group();
    bin.name = 'shipping_bin';

    const chestMat = getCachedMaterial('#8B4513');
    const chestGeo = getCachedGeometry('bin_chest', () => new THREE.BoxGeometry(1.2, 0.75, 0.8));
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.y = 0.375;
    bin.add(chest);

    const lidMat = getCachedMaterial('#A0522D');
    const lidGeo = getCachedGeometry('bin_lid', () => new THREE.BoxGeometry(1.26, 0.2, 0.86));
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.8;
    bin.add(lid);

    const metalMat = getCachedMaterial('#d4af37');
    const strapGeo = getCachedGeometry('bin_strap', () => new THREE.BoxGeometry(0.1, 0.78, 0.82));
    const strapL = new THREE.Mesh(strapGeo, metalMat);
    strapL.position.set(-0.35, 0.4, 0);
    bin.add(strapL);

    const strapR = new THREE.Mesh(strapGeo, metalMat);
    strapR.position.set(0.35, 0.4, 0);
    bin.add(strapR);

    const latchGeo = getCachedGeometry('bin_latch', () => new THREE.BoxGeometry(0.18, 0.2, 0.08));
    const latch = new THREE.Mesh(latchGeo, metalMat);
    latch.position.set(0, 0.65, 0.42);
    bin.add(latch);

    const postMat = getCachedMaterial('#4a3728');
    const postGeo = getCachedGeometry('bin_post', () => new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4));
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0.55, 0.6, 0.35);
    bin.add(post);

    const flagMat = getCachedMaterial('#e74c3c');
    const flagGeo = getCachedGeometry('bin_flag', () => new THREE.BoxGeometry(0.25, 0.16, 0.04));
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.7, 1.1, 0.35);
    bin.add(flag);

    return bin;
  }

  // --- DEBRIS / WILD OBJECTS (High-Fidelity Ghibli Mossy Boulders & Annual Ring Logs) ---
  public static createDebris(type: DebrisType, palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = `debris_${type}`;

    if (type === 'log') {
      // 1. Soft Contact Drop Shadow on Ground
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x071207,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });
      const shadowGeo = getCachedGeometry('debris_log_shadow_v3', () => new THREE.PlaneGeometry(1.25, 0.62));
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.rotation.z = Math.PI / 4;
      shadow.position.set(0, 0.015, 0);
      group.add(shadow);

      // 2. Trunk with Rich Bark & Moss Texture
      const barkMat = new THREE.MeshLambertMaterial({ map: getLogBarkTexture(), color: 0xffffff });
      const logGeo = getCachedGeometry('debris_log_v3', () => new THREE.CylinderGeometry(0.20, 0.22, 1.0, 10));
      const logMesh = new THREE.Mesh(logGeo, barkMat);
      logMesh.rotation.z = Math.PI / 2;
      logMesh.rotation.y = Math.PI / 4;
      logMesh.position.y = 0.18;
      group.add(logMesh);

      // 3. Cut Log Ends with Concentric Annual Growth Rings (Lingkaran Tahun Kayu)
      const ringMat = new THREE.MeshLambertMaterial({ map: getLogEndTexture(), color: 0xffffff });
      const endGeo = getCachedGeometry('debris_log_end_v3', () => new THREE.CircleGeometry(0.198, 12));

      // End 1 (South-East facing cut)
      const end1 = new THREE.Mesh(endGeo, ringMat);
      end1.position.set(0.354, 0.18, -0.354);
      end1.rotation.y = Math.PI / 4;
      group.add(end1);

      // End 2 (North-West facing cut)
      const end2 = new THREE.Mesh(endGeo, ringMat);
      end2.position.set(-0.354, 0.18, 0.354);
      end2.rotation.y = -Math.PI * 0.75;
      group.add(end2);
    } else if (type === 'wild_tree') {
      const trunkMat = getCachedMaterial('#5d4037');
      const trunkGeo = getCachedGeometry('debris_tree_trunk', () => new THREE.CylinderGeometry(0.12, 0.18, 0.9, 6));
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(0, 0.45, 0);
      group.add(trunk);

      const leafMat = getCachedMaterial('#22c55e');
      const leafMat2 = getCachedMaterial('#16a34a');
      const leafGeo1 = getCachedGeometry('debris_tree_leaf1', () => new THREE.DodecahedronGeometry(0.55));
      const leaf1 = new THREE.Mesh(leafGeo1, leafMat);
      leaf1.position.set(0, 0.95, 0);
      group.add(leaf1);

      const leafGeo2 = getCachedGeometry('debris_tree_leaf2', () => new THREE.DodecahedronGeometry(0.40));
      const leaf2 = new THREE.Mesh(leafGeo2, leafMat2);
      leaf2.position.set(-0.22, 0.8, 0.15);
      group.add(leaf2);

      const leafGeo3 = getCachedGeometry('debris_tree_leaf3', () => new THREE.DodecahedronGeometry(0.38));
      const leaf3 = new THREE.Mesh(leafGeo3, leafMat);
      leaf3.position.set(0.22, 0.85, -0.12);
      group.add(leaf3);
    } else if (type === 'small_stone') {
      // 1. Soft Ground Contact Shadow
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x071207,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      const shadowGeo = getCachedGeometry('debris_small_shadow_v3', () => new THREE.CircleGeometry(0.34, 12));
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, 0.015, 0);
      group.add(shadow);

      // 2. Rounded River Pebble with Mossy Boulder Texture
      const pebbleGeo = getCachedGeometry('debris_pebble_v3', () => {
        const geom = new THREE.DodecahedronGeometry(0.25, 1);
        geom.scale(1.22, 0.72, 0.96);
        return geom;
      });
      const pebbleMat = new THREE.MeshLambertMaterial({
        map: getMossyBoulderTexture(),
        color: 0xffffff,
      });
      const stone = new THREE.Mesh(pebbleGeo, pebbleMat);
      stone.position.set(0, 0.14, 0);
      group.add(stone);
    } else if (type === 'big_stone') {
      // 1. Soft Ground Contact Shadow (Bayangan Kontak Alami)
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x071207,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const shadowGeo = getCachedGeometry('debris_boulder_shadow_v3', () => new THREE.CircleGeometry(0.72, 16));
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, 0.015, 0);
      group.add(shadow);

      // 2. Sculpted Natural River Boulder Geometry (Grounded, Rounded, Naturally Perturbed)
      const boulderGeo = getCachedGeometry('debris_mossy_boulder_v3', () => {
        const geom = new THREE.IcosahedronGeometry(0.55, 2);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);

          // Flatten bottom slightly for stable ground contact
          let newY = vy;
          if (newY < -0.1) {
            newY *= 0.65;
          }

          // Gentle natural boulder organic wobble
          const noise = Math.sin(vx * 3.5 + vy * 2.8) * 0.06 + Math.cos(vz * 3.2) * 0.05;
          pos.setXYZ(i, vx * 1.15 + noise, newY + noise * 0.5, vz * 1.05 + noise);
        }
        geom.computeVertexNormals();
        return geom;
      });

      const boulderMat = new THREE.MeshLambertMaterial({
        map: getMossyBoulderTexture(),
        color: 0xffffff,
      });
      const boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.position.set(0, 0.32, 0);
      group.add(boulder);
    } else if (type === 'weed') {
      const weedMat1 = getCachedMaterial('#4ade80');
      const weedMat2 = getCachedMaterial('#22c55e');
      const bladeGeo = getCachedGeometry('debris_weed_blade_cozy', () => new THREE.ConeGeometry(0.045, 0.28, 4));
      
      const blade1 = new THREE.Mesh(bladeGeo, weedMat1);
      blade1.position.set(-0.08, 0.14, 0.04);
      blade1.rotation.z = 0.22;
      group.add(blade1);

      const blade2 = new THREE.Mesh(bladeGeo, weedMat2);
      blade2.position.set(0.08, 0.14, -0.04);
      blade2.rotation.z = -0.22;
      group.add(blade2);

      const blade3 = new THREE.Mesh(bladeGeo, weedMat1);
      blade3.position.set(0.0, 0.16, 0.0);
      blade3.rotation.x = -0.15;
      group.add(blade3);
    }

    return group;
  }

  // --- FARMHOUSE INTERIOR PROPS & FURNITURE ---

  // 1. Cozy Bed
  public static createBed(): THREE.Group {
    const bed = new THREE.Group();
    bed.name = 'interior_bed';

    const woodMat = getCachedMaterial('#5c382e');
    const mattressMat = getCachedMaterial('#fafafa');
    const blanketMat = getCachedMaterial('#3b82f6');
    const pillowMat = getCachedMaterial('#fef08a');

    // Wooden Frame
    const frameGeo = getCachedGeometry('bed_frame', () => new THREE.BoxGeometry(1.4, 0.3, 2.0));
    const frame = new THREE.Mesh(frameGeo, woodMat);
    frame.position.y = 0.15;
    bed.add(frame);

    // Headboard
    const headGeo = getCachedGeometry('bed_headboard', () => new THREE.BoxGeometry(1.4, 0.9, 0.15));
    const headboard = new THREE.Mesh(headGeo, woodMat);
    headboard.position.set(0, 0.45, -0.92);
    bed.add(headboard);

    // Mattress
    const matGeo = getCachedGeometry('bed_mat', () => new THREE.BoxGeometry(1.24, 0.25, 1.8));
    const mattress = new THREE.Mesh(matGeo, mattressMat);
    mattress.position.set(0, 0.38, 0);
    bed.add(mattress);

    // Blanket
    const blanketGeo = getCachedGeometry('bed_blanket', () => new THREE.BoxGeometry(1.26, 0.26, 1.2));
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(0, 0.39, 0.3);
    bed.add(blanket);

    // Pillow
    const pillowGeo = getCachedGeometry('bed_pillow', () => new THREE.BoxGeometry(0.8, 0.14, 0.4));
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(0, 0.52, -0.6);
    bed.add(pillow);

    return bed;
  }

  // 2. Kitchen Counter & Stove
  public static createKitchenCounter(): THREE.Group {
    const kitchen = new THREE.Group();
    kitchen.name = 'interior_kitchen';

    const woodMat = getCachedMaterial('#78350f');
    const marbleMat = getCachedMaterial('#e2e8f0');
    const metalMat = getCachedMaterial('#334155');
    const potMat = getCachedMaterial('#ef4444');

    // Cabinet Base
    const cabGeo = getCachedGeometry('kitchen_cabinet', () => new THREE.BoxGeometry(1.8, 0.8, 0.9));
    const cabinet = new THREE.Mesh(cabGeo, woodMat);
    cabinet.position.y = 0.4;
    kitchen.add(cabinet);

    // Countertop Marble
    const topGeo = getCachedGeometry('kitchen_top', () => new THREE.BoxGeometry(1.88, 0.1, 0.98));
    const top = new THREE.Mesh(topGeo, marbleMat);
    top.position.y = 0.85;
    kitchen.add(top);

    // Stove Burner
    const burnerGeo = getCachedGeometry('kitchen_burner', () => new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8));
    const burner = new THREE.Mesh(burnerGeo, metalMat);
    burner.position.set(0.4, 0.92, 0);
    kitchen.add(burner);

    // Soup Pot
    const potGeo = getCachedGeometry('kitchen_pot', () => new THREE.CylinderGeometry(0.16, 0.14, 0.25, 6));
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(0.4, 1.05, 0);
    kitchen.add(pot);

    // Sink Basin
    const sinkGeo = getCachedGeometry('kitchen_sink', () => new THREE.BoxGeometry(0.5, 0.05, 0.5));
    const sink = new THREE.Mesh(sinkGeo, metalMat);
    sink.position.set(-0.4, 0.91, 0);
    kitchen.add(sink);

    return kitchen;
  }

  // 3. Storage Chest
  public static createStorageChest(): THREE.Group {
    const chest = new THREE.Group();
    chest.name = 'interior_chest';

    const woodMat = getCachedMaterial('#854d0e');
    const goldMat = getCachedMaterial('#facc15');

    // Chest Body
    const bodyGeo = getCachedGeometry('chest_body', () => new THREE.BoxGeometry(1.0, 0.6, 0.7));
    const body = new THREE.Mesh(bodyGeo, woodMat);
    body.position.y = 0.3;
    chest.add(body);

    // Chest Lid
    const lidGeo = getCachedGeometry('chest_lid', () => new THREE.BoxGeometry(1.04, 0.15, 0.74));
    const lid = new THREE.Mesh(lidGeo, woodMat);
    lid.position.y = 0.65;
    chest.add(lid);

    // Gold Lock Clasp
    const lockGeo = getCachedGeometry('chest_lock', () => new THREE.BoxGeometry(0.15, 0.15, 0.08));
    const lock = new THREE.Mesh(lockGeo, goldMat);
    lock.position.set(0, 0.55, 0.38);
    chest.add(lock);

    return chest;
  }

  // 4. Dining Table & Stool
  public static createDiningTable(): THREE.Group {
    const table = new THREE.Group();
    table.name = 'interior_dining_table';

    const woodMat = getCachedMaterial('#a16207');
    const clothMat = getCachedMaterial('#fef3c7');
    const potMat = getCachedMaterial('#06b6d4');

    // Tabletop
    const topGeo = getCachedGeometry('dining_table_top', () => new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12));
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 0.65;
    table.add(top);

    // Table Leg
    const legGeo = getCachedGeometry('dining_table_leg', () => new THREE.CylinderGeometry(0.12, 0.2, 0.62, 6));
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.y = 0.31;
    table.add(leg);

    // Tablecloth
    const clothGeo = getCachedGeometry('dining_tablecloth', () => new THREE.CylinderGeometry(0.5, 0.5, 0.02, 10));
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 0.7;
    table.add(cloth);

    // Teapot on Table
    const teaGeo = getCachedGeometry('dining_teapot', () => new THREE.SphereGeometry(0.12, 6, 6));
    const teapot = new THREE.Mesh(teaGeo, potMat);
    teapot.position.set(0, 0.82, 0);
    table.add(teapot);

    // 2 Stools
    const stoolGeo = getCachedGeometry('dining_stool', () => new THREE.CylinderGeometry(0.25, 0.25, 0.35, 8));
    const stool1 = new THREE.Mesh(stoolGeo, woodMat);
    stool1.position.set(-0.8, 0.175, 0);
    table.add(stool1);

    const stool2 = new THREE.Mesh(stoolGeo, woodMat);
    stool2.position.set(0.8, 0.175, 0);
    table.add(stool2);

    return table;
  }

  // 5. Cozy Fireplace Hearth
  public static createFireplace(): THREE.Group {
    const hearth = new THREE.Group();
    hearth.name = 'interior_fireplace';

    const brickMat = getCachedMaterial('#991b1b');
    const mantelMat = getCachedMaterial('#451a03');
    const fireMat = getCachedMaterial('#f97316');
    const emberMat = getCachedMaterial('#eab308');

    // Fireplace Chimney & Brick Structure
    const brickGeo = getCachedGeometry('fireplace_brick', () => new THREE.BoxGeometry(1.6, 1.8, 0.7));
    const brick = new THREE.Mesh(brickGeo, brickMat);
    brick.position.y = 0.9;
    hearth.add(brick);

    // Fire Chamber Cutout Backplate
    const chamberMat = getCachedMaterial('#1c1917');
    const chamberGeo = getCachedGeometry('fireplace_chamber', () => new THREE.BoxGeometry(0.9, 0.7, 0.4));
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.position.set(0, 0.45, 0.18);
    hearth.add(chamber);

    // Fire Flame / Glowing Embers
    const fireGeo = getCachedGeometry('fireplace_flame', () => new THREE.ConeGeometry(0.25, 0.4, 5));
    const flame = new THREE.Mesh(fireGeo, fireMat);
    flame.position.set(0, 0.45, 0.2);
    hearth.add(flame);

    const emberGeo = getCachedGeometry('fireplace_ember', () => new THREE.DodecahedronGeometry(0.12));
    const ember = new THREE.Mesh(emberGeo, emberMat);
    ember.position.set(-0.15, 0.35, 0.25);
    hearth.add(ember);

    // Wooden Mantel Shelf
    const mantelGeo = getCachedGeometry('fireplace_mantel', () => new THREE.BoxGeometry(1.8, 0.12, 0.85));
    const mantel = new THREE.Mesh(mantelGeo, mantelMat);
    mantel.position.set(0, 1.5, 0);
    hearth.add(mantel);

    return hearth;
  }

  // 6. Decorative Soft Rug
  public static createCozyRug(): THREE.Group {
    const rugGroup = new THREE.Group();
    rugGroup.name = 'interior_rug';

    const mainRugMat = getCachedMaterial('#b91c1c');
    const borderMat = getCachedMaterial('#fde047');

    const mainGeo = getCachedGeometry('rug_main', () => new THREE.BoxGeometry(2.4, 0.03, 1.8));
    const main = new THREE.Mesh(mainGeo, mainRugMat);
    main.position.y = 0.02;
    rugGroup.add(main);

    const borderGeo = getCachedGeometry('rug_border', () => new THREE.BoxGeometry(2.6, 0.02, 2.0));
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.01;
    rugGroup.add(border);

    return rugGroup;
  }

  // 7. Interior Wall Enclosure with Sunlight Windows
  public static createInteriorWalls(gridW = 10, gridH = 10, tileSize = 1.3): THREE.Group {
    const walls = new THREE.Group();
    walls.name = 'interior_walls';

    const wallMat = getCachedMaterial('#fed7aa'); // Warm creamy wallpaper
    const trimMat = getCachedMaterial('#78350f'); // Dark timber baseboard
    const winGlassMat = getCachedMaterial('#67e8f9'); // Sky blue glowing glass

    const roomW = gridW * tileSize;
    const roomH = gridH * tileSize;
    const wallHeight = 2.4;
    const halfW = roomW / 2;
    const halfH = roomH / 2;

    // North Wall (Back)
    const northGeo = getCachedGeometry(`wall_north_${gridW}`, () => new THREE.BoxGeometry(roomW, wallHeight, 0.3));
    const northWall = new THREE.Mesh(northGeo, wallMat);
    northWall.position.set(0, wallHeight / 2, -halfH + 0.15);
    walls.add(northWall);

    // North Wall Timber Trim
    const trimGeo = getCachedGeometry(`wall_trim_${gridW}`, () => new THREE.BoxGeometry(roomW, 0.2, 0.35));
    const northTrim = new THREE.Mesh(trimGeo, trimMat);
    northTrim.position.set(0, 0.1, -halfH + 0.15);
    walls.add(northTrim);

    // West Wall (Left)
    const sideGeo = getCachedGeometry(`wall_side_${gridH}`, () => new THREE.BoxGeometry(0.3, wallHeight, roomH));
    const westWall = new THREE.Mesh(sideGeo, wallMat);
    westWall.position.set(-halfW + 0.15, wallHeight / 2, 0);
    walls.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(sideGeo, wallMat);
    eastWall.position.set(halfW - 0.15, wallHeight / 2, 0);
    walls.add(eastWall);

    // Windows with sunlight frames
    const winGeo = getCachedGeometry('interior_window', () => new THREE.BoxGeometry(1.2, 1.0, 0.1));
    const winGlass = new THREE.Mesh(winGeo, winGlassMat);
    winGlass.position.set(2.5, 1.4, -halfH + 0.32);
    walls.add(winGlass);

    // South Exit Door Mat
    const matGeo = getCachedGeometry('interior_doormat', () => new THREE.BoxGeometry(1.8, 0.04, 0.8));
    const matMesh = new THREE.Mesh(matGeo, trimMat);
    matMesh.position.set(0, 0.02, halfH - 0.8);
    walls.add(matMesh);

    return walls;
  }

  // 8. Crossroads Directional Signpost
  public static createSignpost(): THREE.Group {
    const post = new THREE.Group();
    post.name = 'signpost';

    const stoneMat = getCachedMaterial('#78716c');
    const woodMat = getCachedMaterial('#78350f');
    const signMat = getCachedMaterial('#d97706');
    const lampMat = getCachedMaterial('#fef08a');

    // Stone Base Pedestal
    const baseGeo = getCachedGeometry('sign_base', () => new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8));
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.15;
    post.add(base);

    // Main Wooden Pole
    const poleGeo = getCachedGeometry('sign_pole', () => new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8));
    const pole = new THREE.Mesh(poleGeo, woodMat);
    pole.position.y = 1.25;
    post.add(pole);

    // North Sign Board (Desa Isopolis)
    const boardGeo = getCachedGeometry('sign_board', () => new THREE.BoxGeometry(0.8, 0.22, 0.06));
    const boardN = new THREE.Mesh(boardGeo, signMat);
    boardN.position.set(0, 2.0, 0.35);
    post.add(boardN);

    // South Sign Board (Kebun Isopolis)
    const boardS = new THREE.Mesh(boardGeo, signMat);
    boardS.position.set(0, 1.75, -0.35);
    post.add(boardS);

    // West Sign Board (Pegunungan & Tambang)
    const boardW = new THREE.Mesh(boardGeo, signMat);
    boardW.position.set(-0.35, 1.5, 0);
    boardW.rotation.y = Math.PI / 2;
    post.add(boardW);

    // East Sign Board (Pelabuhan Pesisir)
    const boardE = new THREE.Mesh(boardGeo, signMat);
    boardE.position.set(0.35, 1.25, 0);
    boardE.rotation.y = Math.PI / 2;
    post.add(boardE);

    // Lantern Cap
    const lampGeo = getCachedGeometry('sign_lamp', () => new THREE.DodecahedronGeometry(0.18));
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.y = 2.38;
    post.add(lamp);

    return post;
  }

  // Roadside Wooden Lantern Post for Gates & Highways
  public static createRoadsideLantern(): THREE.Group {
    const post = new THREE.Group();
    const woodMat = getCachedMaterial('#4e342e');
    const glowMat = getCachedMaterial('#fef08a', 0.2, 0.9);
    const ironMat = getCachedMaterial('#262626');

    // Post
    const postGeo = getCachedGeometry('road_lamp_post', () => new THREE.CylinderGeometry(0.08, 0.1, 1.6, 6));
    const pole = new THREE.Mesh(postGeo, woodMat);
    pole.position.y = 0.8;
    post.add(pole);

    // Cross arm
    const armGeo = getCachedGeometry('road_lamp_arm', () => new THREE.BoxGeometry(0.35, 0.06, 0.06));
    const arm = new THREE.Mesh(armGeo, woodMat);
    arm.position.set(0.12, 1.45, 0);
    post.add(arm);

    // Iron Cap
    const capGeo = getCachedGeometry('road_lamp_cap', () => new THREE.ConeGeometry(0.16, 0.1, 5));
    const cap = new THREE.Mesh(capGeo, ironMat);
    cap.position.set(0.24, 1.48, 0);
    post.add(cap);

    // Glowing Lantern
    const glassGeo = getCachedGeometry('road_lamp_glass', () => new THREE.BoxGeometry(0.15, 0.2, 0.15));
    const glass = new THREE.Mesh(glassGeo, glowMat);
    glass.position.set(0.24, 1.34, 0);
    post.add(glass);

    return post;
  }

  // 9. Mountain Mine Entrance Archway
  public static createMineEntrance(): THREE.Group {
    const mine = new THREE.Group();
    mine.name = 'mine_entrance';

    const woodMat = getCachedMaterial('#451a03');
    const darkMat = getCachedMaterial('#0c0a09');
    const stoneMat = getCachedMaterial('#57534e');
    const lampMat = getCachedMaterial('#fef08a');

    // Rock Cliff Arch Frame
    const cliffGeo = getCachedGeometry('mine_cliff', () => new THREE.BoxGeometry(3.6, 2.8, 1.2));
    const cliff = new THREE.Mesh(cliffGeo, stoneMat);
    cliff.position.y = 1.4;
    mine.add(cliff);

    // Cavern Dark Interior Hole
    const caveGeo = getCachedGeometry('mine_cave_hole', () => new THREE.BoxGeometry(2.0, 2.0, 1.3));
    const caveHole = new THREE.Mesh(caveGeo, darkMat);
    caveHole.position.set(0, 1.0, 0.05);
    mine.add(caveHole);

    // Wooden Beams Support Framework
    const beamVertGeo = getCachedGeometry('mine_beam_v', () => new THREE.BoxGeometry(0.25, 2.1, 0.25));
    const beamHorizGeo = getCachedGeometry('mine_beam_h', () => new THREE.BoxGeometry(2.4, 0.25, 0.25));

    const leftBeam = new THREE.Mesh(beamVertGeo, woodMat);
    leftBeam.position.set(-1.0, 1.05, 0.65);
    mine.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamVertGeo, woodMat);
    rightBeam.position.set(1.0, 1.05, 0.65);
    mine.add(rightBeam);

    const topBeam = new THREE.Mesh(beamHorizGeo, woodMat);
    topBeam.position.set(0, 2.05, 0.65);
    mine.add(topBeam);

    // Mine Lantern Hanging
    const lampGeo = getCachedGeometry('mine_lamp', () => new THREE.DodecahedronGeometry(0.15));
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, 1.8, 0.75);
    mine.add(lamp);

    return mine;
  }

  // 10. Crystal Ore Cluster
  public static createCrystalCluster(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'crystal_cluster';

    const crystalMat = getCachedMaterial('#ec4899', 0.2, 0.8);
    const blueMat = getCachedMaterial('#38bdf8', 0.2, 0.8);
    const rockMat = getCachedMaterial('#44403c');

    // Rock Base
    const baseGeo = getCachedGeometry('crystal_base', () => new THREE.DodecahedronGeometry(0.5, 1));
    const base = new THREE.Mesh(baseGeo, rockMat);
    base.position.y = 0.2;
    group.add(base);

    // Spire 1 (Pink Crystal)
    const spireGeo1 = getCachedGeometry('crystal_spire1', () => new THREE.ConeGeometry(0.2, 0.9, 5));
    const spire1 = new THREE.Mesh(spireGeo1, crystalMat);
    spire1.position.set(0.05, 0.6, 0);
    spire1.rotation.z = -0.15;
    group.add(spire1);

    // Spire 2 (Blue Crystal)
    const spireGeo2 = getCachedGeometry('crystal_spire2', () => new THREE.ConeGeometry(0.15, 0.7, 5));
    const spire2 = new THREE.Mesh(spireGeo2, blueMat);
    spire2.position.set(-0.2, 0.45, 0.1);
    spire2.rotation.z = 0.25;
    group.add(spire2);

    return group;
  }

  // 11. Crossroads Rest-Stop Bench & Lamp
  public static createRestBench(): THREE.Group {
    const benchGroup = new THREE.Group();
    benchGroup.name = 'rest_bench';

    const woodMat = getCachedMaterial('#92400e');
    const ironMat = getCachedMaterial('#262626');
    const lampMat = getCachedMaterial('#fef08a');

    // Bench Seat Plank
    const seatGeo = getCachedGeometry('bench_seat', () => new THREE.BoxGeometry(1.6, 0.1, 0.5));
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.set(0, 0.45, 0);
    benchGroup.add(seat);

    // Bench Backrest
    const backGeo = getCachedGeometry('bench_back', () => new THREE.BoxGeometry(1.6, 0.5, 0.08));
    const back = new THREE.Mesh(backGeo, woodMat);
    back.position.set(0, 0.75, -0.22);
    benchGroup.add(back);

    // Bench Iron Legs
    const legGeo = getCachedGeometry('bench_leg', () => new THREE.BoxGeometry(0.1, 0.45, 0.5));
    const legL = new THREE.Mesh(legGeo, ironMat);
    legL.position.set(-0.65, 0.225, 0);
    benchGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, ironMat);
    legR.position.set(0.65, 0.225, 0);
    benchGroup.add(legR);

    // Nearby Lamp Post
    const postGeo = getCachedGeometry('bench_lamppost', () => new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6));
    const post = new THREE.Mesh(postGeo, ironMat);
    post.position.set(1.1, 1.0, 0);
    benchGroup.add(post);

    const lampGeo = getCachedGeometry('bench_lamp', () => new THREE.DodecahedronGeometry(0.18));
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(1.1, 2.0, 0);
    benchGroup.add(lamp);

    return benchGroup;
  }

  // 12. Coastal Lighthouse
  public static createLighthouse(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'lighthouse';

    const whiteMat = getCachedMaterial('#f8fafc');
    const redMat = getCachedMaterial('#dc2626');
    const darkMat = getCachedMaterial('#1e293b');
    const glassMat = getCachedMaterial('#fef08a', 0.2, 0.9);

    // Stone Base Pedestal
    const baseGeo = getCachedGeometry('lh_base', () => new THREE.CylinderGeometry(1.6, 1.8, 0.8, 12));
    const base = new THREE.Mesh(baseGeo, darkMat);
    base.position.y = 0.4;
    group.add(base);

    // Tower White Ring 1
    const t1Geo = getCachedGeometry('lh_t1', () => new THREE.CylinderGeometry(1.4, 1.6, 1.5, 12));
    const t1 = new THREE.Mesh(t1Geo, whiteMat);
    t1.position.y = 1.55;
    group.add(t1);

    // Tower Red Ring 2
    const t2Geo = getCachedGeometry('lh_t2', () => new THREE.CylinderGeometry(1.2, 1.4, 1.5, 12));
    const t2 = new THREE.Mesh(t2Geo, redMat);
    t2.position.y = 3.05;
    group.add(t2);

    // Tower White Ring 3
    const t3Geo = getCachedGeometry('lh_t3', () => new THREE.CylinderGeometry(1.0, 1.2, 1.5, 12));
    const t3 = new THREE.Mesh(t3Geo, whiteMat);
    t3.position.y = 4.55;
    group.add(t3);

    // Top Platform & Balcony Railing
    const platGeo = getCachedGeometry('lh_plat', () => new THREE.CylinderGeometry(1.2, 1.1, 0.25, 12));
    const plat = new THREE.Mesh(platGeo, darkMat);
    plat.position.y = 5.4;
    group.add(plat);

    // Lantern Glass House
    const glassGeo = getCachedGeometry('lh_glass', () => new THREE.CylinderGeometry(0.8, 0.8, 1.0, 8));
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 6.0;
    group.add(glass);

    // Conical Roof
    const roofGeo = getCachedGeometry('lh_roof', () => new THREE.ConeGeometry(1.0, 1.0, 8));
    const roof = new THREE.Mesh(roofGeo, redMat);
    roof.position.y = 7.0;
    group.add(roof);

    return group;
  }

  // 13. Wooden Pier/Dock
  public static createPierDock(): THREE.Group {
    const dock = new THREE.Group();
    dock.name = 'pier_dock';

    const woodMat = getCachedMaterial('#78350f');
    const plankMat = getCachedMaterial('#b45309');

    // Wooden Support Pilings
    const pileGeo = getCachedGeometry('pier_piling', () => new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6));
    const positions = [
      [-1.2, -1.5], [1.2, -1.5],
      [-1.2, 0], [1.2, 0],
      [-1.2, 1.5], [1.2, 1.5]
    ];

    positions.forEach(([px, pz]) => {
      const piling = new THREE.Mesh(pileGeo, woodMat);
      piling.position.set(px, 0.8, pz);
      dock.add(piling);
    });

    // Deck Platform
    const deckGeo = getCachedGeometry('pier_deck', () => new THREE.BoxGeometry(2.8, 0.15, 3.8));
    const deck = new THREE.Mesh(deckGeo, plankMat);
    deck.position.set(0, 1.55, 0);
    dock.add(deck);

    return dock;
  }

  // 14. Fishing Boat
  public static createFishingBoat(): THREE.Group {
    const boat = new THREE.Group();
    boat.name = 'fishing_boat';

    const hullMat = getCachedMaterial('#0284c7');
    const rimMat = getCachedMaterial('#f1f5f9');
    const woodMat = getCachedMaterial('#92400e');

    // Boat Hull Base
    const hullGeo = getCachedGeometry('boat_hull', () => new THREE.BoxGeometry(1.2, 0.5, 2.4));
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.25;
    boat.add(hull);

    // Boat Top Rim
    const rimGeo = getCachedGeometry('boat_rim', () => new THREE.BoxGeometry(1.3, 0.1, 2.5));
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.55;
    boat.add(rim);

    // Seat Board
    const seatGeo = getCachedGeometry('boat_seat', () => new THREE.BoxGeometry(1.1, 0.08, 0.4));
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.set(0, 0.4, 0);
    boat.add(seat);

    return boat;
  }

  // 15. Stone Cliff Stairs (Down from Village)
  public static createStoneStairs(): THREE.Group {
    const stairs = new THREE.Group();
    stairs.name = 'stone_stairs';

    const stoneMat = getCachedMaterial('#64748b');
    const darkMat = getCachedMaterial('#334155');

    // 4 Steps descending
    for (let i = 0; i < 4; i++) {
      const stepGeo = getCachedGeometry(`st_step_${i}`, () => new THREE.BoxGeometry(2.8, 0.3, 0.6));
      const step = new THREE.Mesh(stepGeo, i % 2 === 0 ? stoneMat : darkMat);
      step.position.set(0, 1.2 - i * 0.3, -0.9 + i * 0.6);
      stairs.add(step);
    }

    // Side Stone Pillars
    const pilGeo = getCachedGeometry('st_pillar', () => new THREE.BoxGeometry(0.3, 1.5, 2.6));
    const pL = new THREE.Mesh(pilGeo, darkMat);
    pL.position.set(-1.55, 0.75, 0);
    stairs.add(pL);

    const pR = new THREE.Mesh(pilGeo, darkMat);
    pR.position.set(1.55, 0.75, 0);
    stairs.add(pR);

    return stairs;
  }

  // 16. Coastal Fishing Shack / Shop
  public static createFishingShack(): THREE.Group {
    const shack = new THREE.Group();
    shack.name = 'fishing_shack';

    const woodMat = getCachedMaterial('#0284c7');
    const roofMat = getCachedMaterial('#e0f2fe');
    const darkWood = getCachedMaterial('#075985');

    // Shack Walls
    const wallGeo = getCachedGeometry('shack_wall', () => new THREE.BoxGeometry(2.6, 2.0, 2.2));
    const walls = new THREE.Mesh(wallGeo, woodMat);
    walls.position.y = 1.0;
    shack.add(walls);

    // Overhanging Canopy Roof
    const roofGeo = getCachedGeometry('shack_roof', () => new THREE.BoxGeometry(3.0, 0.2, 2.6));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.1;
    shack.add(roof);

    // Doorway
    const doorGeo = getCachedGeometry('shack_door', () => new THREE.BoxGeometry(0.8, 1.4, 0.1));
    const door = new THREE.Mesh(doorGeo, darkWood);
    door.position.set(0, 0.7, 1.11);
    shack.add(door);

    return shack;
  }
}


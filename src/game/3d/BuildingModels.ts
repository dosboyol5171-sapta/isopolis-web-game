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

export class ModelFactory {
  // --- PLAYER MODEL ---
  public static createPlayer(palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = 'player';

    // Soft Contact Drop Shadow
    const shadowMat = getCachedMaterial('#000000', 1, 0);
    shadowMat.transparent = true;
    shadowMat.opacity = 0.35;
    const shadowGeo = getCachedGeometry('player_shadow', () => new THREE.CircleGeometry(0.38, 12));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    // Boots
    const bootMat = getCachedMaterial('#332211');
    const bootGeo = getCachedGeometry('player_boots', () => new THREE.BoxGeometry(0.24, 0.15, 0.32));
    const boots = new THREE.Mesh(bootGeo, bootMat);
    boots.position.y = 0.08;
    group.add(boots);

    // Body / Overalls / Blue Jeans & Vest
    const bodyMat = getCachedMaterial('#1e3a8a');
    const bodyGeo = getCachedGeometry('player_body_v2', () => new THREE.CylinderGeometry(0.24, 0.22, 0.52, 8));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.42;
    group.add(body);

    // Shirt Arms
    const shirtMat = getCachedMaterial('#dc2626');
    const armGeo = getCachedGeometry('player_arm', () => new THREE.BoxGeometry(0.12, 0.32, 0.12));
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.24, 0.45, 0);
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.24, 0.45, 0);
    group.add(armR);

    // Head
    const skinMat = getCachedMaterial('#fed7aa'); // Natural healthy skin tone
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

  // --- FARMHOUSE ---
  public static createFarmhouse(palette: TexturePackPalette): THREE.Group {
    const house = new THREE.Group();

    // Soft Contact Base Shadow
    const shadowMat = getCachedMaterial('#000000', 1, 0);
    shadowMat.transparent = true;
    shadowMat.opacity = 0.35;
    const shadowGeo = getCachedGeometry('house_shadow', () => new THREE.PlaneGeometry(3.6, 3.6));
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    house.add(shadow);

    // Stone Foundation Base Trim
    const stoneBaseMat = getCachedMaterial('#64748b');
    const stoneBaseGeo = getCachedGeometry('house_stone_base', () => new THREE.BoxGeometry(2.7, 0.4, 2.7));
    const stoneBase = new THREE.Mesh(stoneBaseGeo, stoneBaseMat);
    stoneBase.position.y = 0.2;
    house.add(stoneBase);

    // Timber Log Walls
    const wallMat = getCachedMaterial('#b45309');
    const wallGeo = getCachedGeometry('house_wall_timber', () => new THREE.BoxGeometry(2.5, 1.5, 2.5));
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.15;
    house.add(walls);

    // Red Roof Tiles (Overhang Gable Roof)
    const roofMat = getCachedMaterial('#b91c1c');
    const roofGeo = getCachedGeometry('house_roof_gable', () => new THREE.ConeGeometry(2.4, 1.3, 4));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.45;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    // Wooden Door with Frame
    const doorMat = getCachedMaterial('#451a03');
    const doorGeo = getCachedGeometry('house_door_v2', () => new THREE.BoxGeometry(0.7, 1.1, 0.12));
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.75, 1.26);
    house.add(door);

    // Warm Glowing Window
    const winMat = getCachedMaterial('#fef08a');
    const winGeo = getCachedGeometry('house_win_v2', () => new THREE.BoxGeometry(0.55, 0.55, 0.12));
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(0.7, 1.25, 1.26);
    house.add(win);

    // Stone Chimney with Cap
    const chimMat = getCachedMaterial('#475569');
    const chimGeo = getCachedGeometry('house_chim_v2', () => new THREE.BoxGeometry(0.45, 1.2, 0.45));
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(-0.75, 2.2, -0.5);
    house.add(chim);

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

  // --- WOODEN BRIDGE ---
  public static createWoodenBridge(): THREE.Group {
    const bridge = new THREE.Group();
    bridge.name = 'wooden_bridge';

    const woodMat = getCachedMaterial('#8d5b4c');
    const darkWoodMat = getCachedMaterial('#5c382e');

    // Planks Deck
    const deckGeo = getCachedGeometry('bridge_deck', () => new THREE.BoxGeometry(1.24, 0.12, 1.24));
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 0.08;
    bridge.add(deck);

    // Left & Right Handrails
    const railGeo = getCachedGeometry('bridge_rail', () => new THREE.BoxGeometry(0.1, 0.25, 1.24));
    const railL = new THREE.Mesh(railGeo, darkWoodMat);
    railL.position.set(-0.55, 0.24, 0);
    bridge.add(railL);

    const railR = new THREE.Mesh(railGeo, darkWoodMat);
    railR.position.set(0.55, 0.24, 0);
    bridge.add(railR);

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

  // --- CROPS (PADI, JAGUNG, STROBERI, DLL) ---
  public static createCrop(cropType: CropType, stage: GrowthStage, palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = `crop_${cropType}_${stage}`;

    const stemMat = getCachedMaterial('#4caf50');
    const scaleFactor = (stage + 1) / 4;

    if (cropType === 'rice' || cropType === 'corn') {
      const stemGeo = getCachedGeometry(`crop_stem_${scaleFactor}`, () => new THREE.CylinderGeometry(0.04, 0.06, 0.8 * scaleFactor, 4));
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.4 * scaleFactor;
      group.add(stem);

      if (stage === 3) {
        const itemMat = getCachedMaterial(cropType === 'rice' ? '#ffe082' : '#f1c40f');
        const grainGeo = getCachedGeometry('crop_grain', () => new THREE.CylinderGeometry(0.08, 0.08, 0.3, 5));
        const grain = new THREE.Mesh(grainGeo, itemMat);
        grain.position.set(0, 0.6 * scaleFactor, 0);
        group.add(grain);
      }
    } else if (cropType === 'strawberry' || cropType === 'tomato') {
      const bushGeo = getCachedGeometry(`crop_bush_${scaleFactor}`, () => new THREE.DodecahedronGeometry(0.28 * scaleFactor));
      const bush = new THREE.Mesh(bushGeo, stemMat);
      bush.position.y = 0.25 * scaleFactor;
      group.add(bush);

      if (stage === 3) {
        const fruitMat = getCachedMaterial(cropType === 'strawberry' ? '#e74c3c' : '#ff5722');
        const fruitGeo = getCachedGeometry('crop_fruit_sphere', () => new THREE.SphereGeometry(0.08, 5, 5));
        for (let i = 0; i < 3; i++) {
          const fruit = new THREE.Mesh(fruitGeo, fruitMat);
          const angle = (i * Math.PI * 2) / 3;
          fruit.position.set(Math.cos(angle) * 0.2, 0.25, Math.sin(angle) * 0.2);
          group.add(fruit);
        }
      }
    } else {
      const topGeo = getCachedGeometry(`crop_cone_${scaleFactor}`, () => new THREE.ConeGeometry(0.2 * scaleFactor, 0.4 * scaleFactor, 5));
      const top = new THREE.Mesh(topGeo, stemMat);
      top.position.y = 0.2 * scaleFactor;
      group.add(top);

      if (stage === 3) {
        const fruitMat = getCachedMaterial(cropType === 'carrot' ? '#e67e22' : '#d35400');
        const fruitGeo = getCachedGeometry('crop_cone_carrot', () => new THREE.ConeGeometry(0.15, 0.4, 5));
        const fruit = new THREE.Mesh(fruitGeo, fruitMat);
        fruit.position.y = 0.1;
        if (cropType === 'carrot') fruit.rotation.x = Math.PI;
        group.add(fruit);
      }
    }

    return group;
  }

  // --- ANIMAL MODELS ---
  public static createChicken(): THREE.Group {
    const group = new THREE.Group();
    const whiteMat = getCachedMaterial('#ffffff');
    const redMat = getCachedMaterial('#e74c3c');
    const yellowMat = getCachedMaterial('#f1c40f');

    const bodyGeo = getCachedGeometry('chicken_body', () => new THREE.BoxGeometry(0.3, 0.28, 0.35));
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.y = 0.25;
    group.add(body);

    const combGeo = getCachedGeometry('chicken_comb', () => new THREE.BoxGeometry(0.06, 0.1, 0.12));
    const comb = new THREE.Mesh(combGeo, redMat);
    comb.position.set(0, 0.43, 0.1);
    group.add(comb);

    const beakGeo = getCachedGeometry('chicken_beak', () => new THREE.ConeGeometry(0.05, 0.1, 4));
    const beak = new THREE.Mesh(beakGeo, yellowMat);
    beak.position.set(0, 0.3, 0.22);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    return group;
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

  // --- DEBRIS / WILD OBJECTS ---
  public static createDebris(type: DebrisType, palette: TexturePackPalette): THREE.Group {
    const group = new THREE.Group();
    group.name = `debris_${type}`;

    if (type === 'log') {
      const barkMat = getCachedMaterial('#6d4c41');
      const logGeo = getCachedGeometry('debris_log', () => new THREE.CylinderGeometry(0.18, 0.22, 0.9, 6));
      const logMesh = new THREE.Mesh(logGeo, barkMat);
      logMesh.rotation.z = Math.PI / 2;
      logMesh.rotation.y = Math.PI / 4;
      logMesh.position.y = 0.15;
      group.add(logMesh);

      const innerWoodMat = getCachedMaterial('#d7ccc8');
      const endGeo = getCachedGeometry('debris_log_end', () => new THREE.CircleGeometry(0.17, 6));
      const end1 = new THREE.Mesh(endGeo, innerWoodMat);
      end1.position.set(-0.35, 0.15, 0.35);
      end1.rotation.y = -Math.PI / 4;
      group.add(end1);
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
      const stoneMat = getCachedMaterial('#78909c');
      const stoneGeo = getCachedGeometry('debris_small_stone', () => new THREE.DodecahedronGeometry(0.25, 0));
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.scale.set(1.2, 0.65, 0.9);
      stone.position.set(0, 0.12, 0);
      group.add(stone);
    } else if (type === 'big_stone') {
      const boulderMat = getCachedMaterial('#455a64');
      const boulderGeo = getCachedGeometry('debris_big_stone', () => new THREE.DodecahedronGeometry(0.52, 0));
      const boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.scale.set(1.2, 0.9, 1.1);
      boulder.position.set(0, 0.35, 0);
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

  // Rustic Wooden Roadside Fence Section
  public static createRusticFence(): THREE.Group {
    const fence = new THREE.Group();
    const woodMat = getCachedMaterial('#5c3d2e');

    // Posts
    const postGeo = getCachedGeometry('fence_post', () => new THREE.CylinderGeometry(0.07, 0.08, 0.9, 5));
    const p1 = new THREE.Mesh(postGeo, woodMat);
    p1.position.set(-0.7, 0.45, 0);
    fence.add(p1);

    const p2 = new THREE.Mesh(postGeo, woodMat);
    p2.position.set(0.7, 0.45, 0);
    fence.add(p2);

    // Rails
    const railGeo = getCachedGeometry('fence_rail', () => new THREE.BoxGeometry(1.48, 0.07, 0.07));
    const r1 = new THREE.Mesh(railGeo, woodMat);
    r1.position.set(0, 0.65, 0);
    fence.add(r1);

    const r2 = new THREE.Mesh(railGeo, woodMat);
    r2.position.set(0, 0.35, 0);
    fence.add(r2);

    return fence;
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


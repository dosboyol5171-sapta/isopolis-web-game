import React, { useMemo } from 'react';
import { TileState, MapLocation } from '../types/game';
import { MapPin } from 'lucide-react';
import { WorldRegistry } from '../game/WorldRegistry';

interface MiniMapWidgetProps {
  currentLocation: MapLocation;
  playerGridPos: { x: number; z: number };
  tiles: Map<string, TileState>;
  gridWidth: number;
  gridHeight: number;
  onClick: () => void;
}

export const MiniMapWidget: React.FC<MiniMapWidgetProps> = React.memo(({
  currentLocation,
  playerGridPos,
  tiles,
  gridWidth,
  gridHeight,
  onClick,
}) => {
  const gW = gridWidth > 0 ? gridWidth : 28;
  const gH = gridHeight > 0 ? gridHeight : 28;

  const rawX = typeof playerGridPos?.x === 'number' && !isNaN(playerGridPos.x) ? playerGridPos.x : 7;
  const rawZ = typeof playerGridPos?.z === 'number' && !isNaN(playerGridPos.z) ? playerGridPos.z : 12;
  const px = Math.max(0, Math.min(gW - 1, rawX));
  const pz = Math.max(0, Math.min(gH - 1, rawZ));

  const isInterior = currentLocation === 'house_interior';

  // Base ground color
  const baseGroundColor = isInterior
    ? '#92400e'
    : currentLocation === 'mountain'
    ? '#475569'
    : currentLocation === 'coast'
    ? '#e2b170'
    : '#2e7d32';

  // Extract non-default tiles for SVG drawing
  const tileElements = useMemo(() => {
    if (!tiles || tiles.size === 0) return [];
    const elements: {
      key: string;
      x: number;
      z: number;
      type: string;
      color: string;
      hasCrop?: boolean;
      cropStage?: number;
      debris?: string;
    }[] = [];

    tiles.forEach((tile, key) => {
      let color = '';
      if (tile.type === 'water') {
        color = '#0284c7';
      } else if (tile.type === 'path') {
        color = currentLocation === 'mountain' ? '#78716c' : '#d97706';
      } else if (tile.type === 'stone') {
        color = '#64748b';
      } else if (tile.type === 'log') {
        color = '#78350f';
      } else if (tile.type === 'building') {
        color = '#b45309';
      } else if (tile.type === 'soil') {
        color = tile.isWatered ? '#3e2723' : '#6d4c41';
      }

      if (color || tile.debris) {
        elements.push({
          key,
          x: tile.x,
          z: tile.z,
          type: tile.type,
          color,
          hasCrop: !!tile.crop,
          cropStage: tile.crop?.stage,
          debris: tile.debris,
        });
      }
    });

    return elements;
  }, [tiles, currentLocation]);

  const region = useMemo(() => {
    try {
      return WorldRegistry.getRegion(currentLocation);
    } catch {
      return null;
    }
  }, [currentLocation]);

  const getLocationLabel = () => {
    switch (currentLocation) {
      case 'farm':
        return 'KEBUN';
      case 'crossroads':
        return 'SIMPANG';
      case 'village':
        return 'DESA';
      case 'mountain':
        return 'TAMBANG';
      case 'coast':
        return 'PANTAI';
      case 'house_interior':
        return 'RUMAH';
      default:
        return 'PETA';
    }
  };

  return (
    <button
      onClick={onClick}
      style={{ minWidth: '70px', width: '70px' }}
      className="group relative flex flex-col items-center bg-black/85 hover:bg-black/95 active:scale-95 border-2 border-emerald-400/80 hover:border-emerald-300 rounded-2xl p-1 shadow-2xl transition-all pointer-events-auto shrink-0 flex-none cursor-pointer z-30"
      title="Buka Peta Besar Wilayah & Pusat Kendali"
    >
      {/* Visual Vector Radar (100% Reliable SVG - Zero Canvas Black Screens) */}
      <div
        style={{ width: '60px', height: '60px' }}
        className="relative rounded-xl overflow-hidden border border-emerald-400/70 shadow-inner bg-slate-950 flex items-center justify-center shrink-0"
      >
        <svg
          viewBox={`0 0 ${gW} ${gH}`}
          className="w-full h-full block select-none"
          preserveAspectRatio="none"
        >
          {/* 1. Base Ground */}
          <rect x="0" y="0" width={gW} height={gH} fill={baseGroundColor} />

          {/* 2. Perimeter Borders */}
          {isInterior ? (
            <>
              {/* Wooden walls for house interior */}
              <rect x="0" y="0" width={gW} height="1" fill="#451a03" />
              <rect x="0" y="0" width="1" height={gH} fill="#451a03" />
              <rect x={gW - 1} y="0" width="1" height={gH} fill="#451a03" />
              <rect x="0" y={gH - 1} width="3.5" height="1" fill="#451a03" />
              <rect x={gW - 3.5} y={gH - 1} width="3.5" height="1" fill="#451a03" />
            </>
          ) : (
            <>
              {/* Forest perimeter border trees for outdoor maps */}
              <rect x="0" y="0" width={gW} height="1.2" fill="#14532d" />
              <rect x="0" y={gH - 1.2} width={gW} height="1.2" fill="#14532d" />
              <rect x="0" y="0" width="1.2" height={gH} fill="#14532d" />
              <rect x={gW - 1.2} y="0" width="1.2" height={gH} fill="#14532d" />
            </>
          )}

          {/* 3. Render Custom Tiles (Water, Paths, Soil, Stones, Crops) */}
          {tileElements.map((t) => (
            <g key={t.key}>
              {t.color && (
                <rect
                  x={t.x}
                  y={t.z}
                  width="1.05"
                  height="1.05"
                  fill={t.color}
                />
              )}
              {t.hasCrop && (
                <circle
                  cx={t.x + 0.5}
                  cy={t.z + 0.5}
                  r="0.35"
                  fill={t.cropStage === 3 ? '#facc15' : '#84cc16'}
                />
              )}
              {t.debris && (
                <rect
                  x={t.x + 0.2}
                  y={t.z + 0.2}
                  width={t.debris === 'big_stone' || t.debris === 'wild_tree' ? '0.75' : '0.55'}
                  height={t.debris === 'big_stone' || t.debris === 'wild_tree' ? '0.75' : '0.55'}
                  fill={
                    t.debris === 'weed'
                      ? '#a3e635'
                      : t.debris === 'small_stone' || t.debris === 'big_stone'
                      ? '#cbd5e1'
                      : '#a16207'
                  }
                />
              )}
            </g>
          ))}

          {/* 4. Region Static Props & Landmarks */}
          {region?.staticProps?.map((prop) => {
            if (prop.type === 'farmhouse') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 1.5}
                  y={prop.gridZ - 1.4}
                  width="3.2"
                  height="2.6"
                  fill="#dc2626"
                  rx="0.2"
                />
              );
            }
            if (prop.type === 'windmill') {
              return (
                <circle
                  key={prop.id}
                  cx={prop.gridX}
                  cy={prop.gridZ}
                  r="1.3"
                  fill="#94a3b8"
                />
              );
            }
            if (prop.type === 'shipping_bin') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 0.7}
                  y={prop.gridZ - 0.5}
                  width="1.4"
                  height="1.0"
                  fill="#8B4513"
                />
              );
            }
            if (prop.type === 'wooden_bridge') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 0.6}
                  y={prop.gridZ - 1.1}
                  width="1.2"
                  height="2.2"
                  fill="#8d5b4c"
                />
              );
            }
            if (prop.type === 'gate') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 1.0}
                  y={prop.gridZ - 0.5}
                  width="2.0"
                  height="1.0"
                  fill="#9333ea"
                />
              );
            }
            if (prop.type === 'lighthouse') {
              return (
                <circle
                  key={prop.id}
                  cx={prop.gridX}
                  cy={prop.gridZ}
                  r="1.5"
                  fill="#ef4444"
                />
              );
            }
            if (prop.type === 'mine_entrance') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 1.2}
                  y={prop.gridZ - 0.8}
                  width="2.4"
                  height="1.6"
                  fill="#1e293b"
                />
              );
            }
            if (prop.type === 'interior_bed') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 0.8}
                  y={prop.gridZ - 1.1}
                  width="1.6"
                  height="2.2"
                  fill="#3b82f6"
                  rx="0.2"
                />
              );
            }
            if (prop.type === 'interior_kitchen') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 1.1}
                  y={prop.gridZ - 0.6}
                  width="2.2"
                  height="1.2"
                  fill="#334155"
                />
              );
            }
            if (prop.type === 'interior_chest') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 0.5}
                  y={prop.gridZ - 0.5}
                  width="1.0"
                  height="1.0"
                  fill="#eab308"
                />
              );
            }
            if (prop.type === 'interior_rug') {
              return (
                <rect
                  key={prop.id}
                  x={prop.gridX - 1.1}
                  y={prop.gridZ - 1.1}
                  width="2.2"
                  height="2.2"
                  fill="#b91c1c"
                  rx="0.2"
                />
              );
            }
            return null;
          })}

          {/* 5. Gate Openings */}
          {region?.gates?.map((gate) => (
            <rect
              key={gate.id}
              x={gate.triggerArea.minX}
              y={gate.triggerArea.minZ}
              width={Math.max(1.2, gate.triggerArea.maxX - gate.triggerArea.minX + 1)}
              height={Math.max(1.2, gate.triggerArea.maxZ - gate.triggerArea.minZ + 1)}
              fill="rgba(168, 85, 247, 0.8)"
            />
          ))}

          {/* 6. Real-time Player Pin (Glowing Blip) */}
          <circle
            cx={px + 0.5}
            cy={pz + 0.5}
            r={Math.max(1.2, (gW / 28) * 1.8)}
            fill="#facc15"
            opacity="0.5"
          />
          <circle
            cx={px + 0.5}
            cy={pz + 0.5}
            r={Math.max(0.7, (gW / 28) * 0.9)}
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth={Math.max(0.15, (gW / 28) * 0.25)}
          />
        </svg>

        {/* Location badge on radar */}
        <div className="absolute bottom-0.5 left-0.5 text-[7px] font-black text-amber-200 bg-black/90 px-1 py-0.2 rounded border border-white/30 uppercase tracking-tight shadow pointer-events-none">
          {getLocationLabel()}
        </div>

        {/* Radar North Pin */}
        <div className="absolute top-0.5 right-0.5 text-[7px] font-black text-emerald-200 bg-emerald-950/90 px-1 py-0.2 rounded border border-emerald-500/60 shadow pointer-events-none">
          U
        </div>

        {/* Live scanner gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent pointer-events-none opacity-40 animate-pulse" />
      </div>

      {/* Mini-Map Footer Tag with Real-time Player Coordinates */}
      <div className="flex items-center gap-0.5 mt-0.5 text-[8px] font-extrabold text-amber-300 font-mono tracking-tight whitespace-nowrap">
        <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
        <span>
          {Math.floor(rawX)},{Math.floor(rawZ)}
        </span>
      </div>
    </button>
  );
});

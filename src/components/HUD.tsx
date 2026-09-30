import React, { useState, useEffect } from 'react';
import { PlayerData, TileState, MapLocation } from '../types/game';
import { Sun, Moon, CloudRain, Clock, Zap, Activity, Maximize, Settings, MapPin } from 'lucide-react';
import { MiniMapWidget } from './MiniMapWidget';
import { WorldRegistry } from '../game/WorldRegistry';

interface HUDProps {
  player: PlayerData;
  fps: number;
  playerGridPos: { x: number; z: number };
  tiles: Map<string, TileState>;
  gridWidth: number;
  gridHeight: number;
  telemetry?: {
    fps: number;
    targetFps: number;
    frameTimeMs: number;
    cpuUsagePct: number;
    ramMb: number;
    drawCalls: number;
    triangles: number;
  };
  onOpenBigMap: () => void;
  onSleep: () => void;
  onFastTravel?: (target: MapLocation) => void;
  onOpenSettings?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  fps,
  playerGridPos,
  tiles,
  gridWidth,
  gridHeight,
  telemetry,
  onOpenBigMap,
  onSleep,
  onFastTravel,
  onOpenSettings,
}) => {
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const isNight = player.timeHour >= 19 || player.timeHour < 6;

  const format12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const h = h12 < 10 ? `0${h12}` : `${h12}`;
    const m = minute < 10 ? `0${minute}` : `${minute}`;
    return `${h}:${m} ${period}`;
  };

  const energyPercent = Math.min(100, Math.max(0, (player.energy / player.maxEnergy) * 100));
  const activeRegion = WorldRegistry.getRegion(player.currentLocation);

  return (
    <div className="absolute top-0 left-0 right-0 p-2 pointer-events-none z-20 flex items-start justify-between gap-2 select-none w-full max-w-full">
      {/* 1. Main Header Status Bar (Pure Transparent Container - Zero Blur, Zero Animations) */}
      <div className="pointer-events-auto bg-black/60 border border-white/20 rounded-2xl p-1.5 shadow-xl flex items-center gap-2 text-slate-100 flex-1 min-w-0 overflow-x-auto scrollbar-none touch-pan-x">
        {/* Farm Profile & Region */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white/10 rounded-xl px-2 py-1 border border-white/10">
          <div className="text-amber-300 shrink-0">
            {isNight ? (
              <Moon className="w-3.5 h-3.5" />
            ) : player.weather === 'rainy' ? (
              <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex flex-col leading-tight shrink-0">
            <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-400 whitespace-nowrap">
              <span>{activeRegion.name}</span>
              <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1 rounded-full shrink-0 font-mono">
                {activeRegion.width}x{activeRegion.height}
              </span>
            </div>
            <div className="text-[9px] text-slate-300 font-mono whitespace-nowrap">
              Hari ke-{player.day}
            </div>
          </div>
        </div>

        {/* Real-time Player Coordinates Badge (Red Pin Highlight) */}
        <div className="bg-rose-500/15 border border-rose-400/40 rounded-xl px-2 py-1 flex items-center gap-1.5 text-rose-200 shadow-sm shrink-0 font-mono">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[7.5px] uppercase tracking-wider font-extrabold text-rose-300">Koordinat</span>
            <span className="text-[10px] font-black text-rose-100 mt-0.5 whitespace-nowrap">
              X:{playerGridPos.x.toFixed(1)} Z:{playerGridPos.z.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Stamina Zap Bar */}
        <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 rounded-xl px-2 py-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <div className="flex flex-col leading-none shrink-0">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-300 whitespace-nowrap">Stamina</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-10 h-1.5 bg-black/40 rounded-full overflow-hidden border border-amber-400/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-black text-amber-200 leading-none">{player.energy}</span>
            </div>
          </div>
        </div>

        {/* 12-Hour AM/PM Clock */}
        <div className="bg-sky-500/15 border border-sky-400/30 rounded-xl px-2 py-1 flex items-center gap-1 text-sky-200 shadow-sm shrink-0">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-mono font-black text-[11px] tracking-tight whitespace-nowrap">{format12Hour(player.timeHour, player.timeMinute)}</span>
        </div>

        {/* Live FPS & Telemetry Button */}
        <button
          onClick={() => setShowTelemetryModal((prev) => !prev)}
          className="bg-black/60 hover:bg-black/80 active:scale-95 border border-emerald-500/40 rounded-xl px-2 py-1 flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-400 cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
          title="Klik untuk statistik hardware & CPU"
        >
          <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{fps} FPS</span>
        </button>

        {/* Fullscreen Portrait Mode Toggle */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 p-1.5 rounded-xl border border-white/15 shadow shrink-0 cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        </button>

        {/* Settings / Pengaturan Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 p-1.5 rounded-xl border border-white/15 shadow shrink-0 cursor-pointer"
            title="Pengaturan Game"
          >
            <Settings className="w-3.5 h-3.5 text-slate-200 shrink-0" />
          </button>
        )}

        {/* Sleep button if Night */}
        {(isNight || player.energy < 20) && (
          <button
            onClick={onSleep}
            className="bg-indigo-600/80 active:bg-indigo-500 text-white p-1.5 rounded-xl shadow border border-indigo-300/40 text-[9px] font-bold shrink-0 cursor-pointer"
            title="Tidur"
          >
            <Moon className="w-3 h-3 shrink-0" />
          </button>
        )}
      </div>

      {/* 2. REAL VISUAL MINI-MAP RADAR WIDGET (Top Right) */}
      <MiniMapWidget
        currentLocation={player.currentLocation}
        playerGridPos={playerGridPos}
        tiles={tiles}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onClick={onOpenBigMap}
      />

      {/* 3. LIVE HARDWARE & CPU TELEMETRY STATS MODAL */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-4 w-full max-w-sm text-slate-100 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-extrabold text-sm text-slate-100">Statistik Hardware & CPU Live</span>
              </div>
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              Metrik performa WebGL 3D real-time yang sedang diproses oleh hardware HP/PC Anda:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">Lock Frame Rate</span>
                <span className="text-emerald-400 font-black text-sm">{telemetry?.fps || fps} / {telemetry?.targetFps || 24} FPS</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">Frame Render Latency</span>
                <span className="text-sky-300 font-black text-sm">{telemetry?.frameTimeMs || 0} ms</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">Est. Beban CPU/GPU</span>
                <span className="text-amber-300 font-black text-sm">{telemetry?.cpuUsagePct || 5}% CPU</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">Penggunaan Memori JS</span>
                <span className="text-purple-300 font-black text-sm">{telemetry?.ramMb ? `${telemetry.ramMb} MB` : 'Aktif'}</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">WebGL Draw Calls</span>
                <span className="text-teal-300 font-black text-sm">{telemetry?.drawCalls || 0} Calls</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">Poligon / Triangles</span>
                <span className="text-indigo-300 font-black text-sm">{(telemetry?.triangles || 0).toLocaleString()} Poly</span>
              </div>
            </div>

            <button
              onClick={() => setShowTelemetryModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 rounded-xl transition-all active:scale-95"
            >
              Tutup Overlay Hardware
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

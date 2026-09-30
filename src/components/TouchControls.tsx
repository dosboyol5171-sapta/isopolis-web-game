import React, { useRef, useCallback, useEffect } from 'react';
import { ToolType, InventoryItem, DebrisType } from '../types/game';
import { Droplets, Sprout, Hand, Shovel, Axe, Pickaxe, Scissors, Package, Wrench, Eye, EyeOff, Zap, ArrowUpCircle } from 'lucide-react';

interface TouchControlsProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  activeItem: InventoryItem | null;
  setActiveItem: (item: InventoryItem) => void;
  inventory: InventoryItem[];
  selectorMode: 'tools' | 'items';
  onToggleSelectorMode: () => void;
  onOpenSeedSelect?: () => void;
  onMoveVector: (dx: number, dz: number) => void;
  onActionButton: () => void;
  actionButtonText: string;
  isCollectible?: boolean;
  isNearShippingBin?: boolean;
  targetedDebris?: DebrisType;
  showGridCursor?: boolean;
  onToggleGridCursor?: () => void;
  isSprinting?: boolean;
  onToggleSprint?: () => void;
  onJump?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = React.memo(({
  activeTool,
  setActiveTool,
  activeItem,
  setActiveItem,
  inventory,
  selectorMode,
  onToggleSelectorMode,
  onOpenSeedSelect,
  onMoveVector,
  onActionButton,
  actionButtonText,
  isCollectible = false,
  isNearShippingBin = false,
  targetedDebris,
  showGridCursor = true,
  onToggleGridCursor,
  isSprinting = false,
  onToggleSprint,
  onJump,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const resetJoystick = useCallback(() => {
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
    onMoveVector(0, 0);
  }, [onMoveVector]);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 38;

    let knobX = dx;
    let knobY = dy;

    if (dist > maxRadius) {
      const angle = Math.atan2(dy, dx);
      knobX = Math.cos(angle) * maxRadius;
      knobY = Math.sin(angle) * maxRadius;
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0px)`;
    }

    onMoveVector(knobX / maxRadius, knobY / maxRadius);
  }, [onMoveVector]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    updateKnob(e.clientX, e.clientY);
  };

  // Robust window-level multi-touch pointer listeners
  // Ensures analog tracking is never lost or hijacked when tapping other buttons with other fingers
  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (pointerIdRef.current !== e.pointerId) return;
      updateKnob(e.clientX, e.clientY);
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (pointerIdRef.current === e.pointerId) {
        resetJoystick();
      }
    };

    const onWindowPointerCancel = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (pointerIdRef.current === e.pointerId) {
        resetJoystick();
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: false });
    window.addEventListener('pointercancel', onWindowPointerCancel, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerCancel);
    };
  }, [updateKnob, resetJoystick]);

  const handleAction = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (_) {}
    onActionButton();
  }, [onActionButton]);

  // Multi-Touch Instant Trigger Ref & Helpers (Prevents click delays & touch conflicts while holding analog)
  const lastActionTimeRef = useRef(0);
  const triggerActionInstant = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastActionTimeRef.current < 100) return;
    lastActionTimeRef.current = now;
    handleAction();
  }, [handleAction]);

  const lastSprintTimeRef = useRef(0);
  const triggerSprintInstant = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastSprintTimeRef.current < 120) return;
    lastSprintTimeRef.current = now;
    if (onToggleSprint) onToggleSprint();
  }, [onToggleSprint]);

  const lastGridToggleTimeRef = useRef(0);
  const triggerGridToggleInstant = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastGridToggleTimeRef.current < 120) return;
    lastGridToggleTimeRef.current = now;
    if (onToggleGridCursor) onToggleGridCursor();
  }, [onToggleGridCursor]);

  const lastSelectorModeTimeRef = useRef(0);
  const triggerSelectorModeInstant = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastSelectorModeTimeRef.current < 120) return;
    lastSelectorModeTimeRef.current = now;
    onToggleSelectorMode();
  }, [onToggleSelectorMode]);

  // Tools without 'panen'
  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'hoe', label: 'Cangkul', icon: <Shovel className="w-4 h-4" /> },
    { id: 'water', label: 'Siram', icon: <Droplets className="w-4 h-4 text-cyan-300" /> },
    { id: 'plant', label: 'Tanam', icon: <Sprout className="w-4 h-4 text-lime-300" /> },
    { id: 'axe', label: 'Kapak', icon: <Axe className="w-4 h-4 text-orange-300" /> },
    { id: 'sickle', label: 'Sabit', icon: <Scissors className="w-4 h-4 text-yellow-300" /> },
    { id: 'pickaxe', label: 'Beliung', icon: <Pickaxe className="w-4 h-4 text-slate-300" /> },
  ];

  const getActionIcon = () => {
    // 1. If tile has mature crop/item ready to pick up
    if (isCollectible) {
      return <Hand className="w-7 h-7 drop-shadow text-amber-300 animate-bounce" />;
    }

    // 2. If tile has debris / wild obstacle (batang kayu, pohon liar, batu kecil/besar, rumput liar)
    if (targetedDebris) {
      if (targetedDebris === 'weed') {
        return <Scissors className="w-7 h-7 drop-shadow text-lime-300 animate-pulse" />;
      }
      if (targetedDebris === 'log' || targetedDebris === 'wild_tree') {
        return <Axe className="w-7 h-7 drop-shadow text-amber-300 animate-pulse" />;
      }
      if (targetedDebris === 'small_stone' || targetedDebris === 'big_stone') {
        return <Pickaxe className="w-7 h-7 drop-shadow text-cyan-200 animate-pulse" />;
      }
    }

    // 3. If near Shipping Bin (Kotak Pengiriman)
    if (isNearShippingBin) {
      return <Package className="w-7 h-7 drop-shadow text-amber-200 animate-pulse" />;
    }

    // 4. If in Item Mode and item selected
    if (selectorMode === 'items' && activeItem) {
      return <span className="text-2xl drop-shadow">{activeItem.icon}</span>;
    }

    // 5. Tool Icon
    switch (activeTool) {
      case 'water':
        return <Droplets className="w-7 h-7 drop-shadow text-cyan-200" />;
      case 'plant':
        return <Sprout className="w-7 h-7 drop-shadow text-lime-200" />;
      case 'axe':
        return <Axe className="w-7 h-7 drop-shadow text-orange-200" />;
      case 'sickle':
        return <Scissors className="w-7 h-7 drop-shadow text-yellow-200" />;
      case 'pickaxe':
        return <Pickaxe className="w-7 h-7 drop-shadow text-slate-200" />;
      default:
        return <Shovel className="w-7 h-7 drop-shadow" />;
    }
  };

  const getButtonText = () => {
    if (isCollectible) return 'AMBIL';
    if (targetedDebris) {
      if (targetedDebris === 'weed') return 'BABAT';
      if (targetedDebris === 'log' || targetedDebris === 'wild_tree') return 'TEBANG';
      if (targetedDebris === 'small_stone' || targetedDebris === 'big_stone') return 'HANCUR';
    }
    if (isNearShippingBin) {
      return selectorMode === 'items' && activeItem ? 'KIRIM' : 'KOTAK';
    }
    return actionButtonText;
  };

  return (
    <>
      {/* Desktop Keyboard Helper Banner (Pinned to top center on large screens, completely non-obtrusive) */}
      <div className="hidden lg:flex fixed top-16 left-1/2 -translate-x-1/2 z-20 items-center gap-2 px-3.5 py-1 bg-black/70 backdrop-blur-xs border border-white/15 rounded-full text-[10px] text-slate-300 pointer-events-none shadow-xl font-medium select-none">
        <span>[WASD / Panah] Gerak</span>
        <span className="text-slate-600">·</span>
        <span>[Spasi] Lompat</span>
        <span className="text-slate-600">·</span>
        <span>[Shift] Lari</span>
        <span className="text-slate-600">·</span>
        <span>[E / Enter] Aksi</span>
        <span className="text-slate-600">·</span>
        <span>[Q / Tab] Mode Alat/Tas</span>
        <span className="text-slate-600">·</span>
        <span>[1-6] Pilih Cepat</span>
      </div>

      {/* Main Touch Controls Bottom Container - Strictly Anchored to Bottom */}
      <div className="fixed inset-x-0 bottom-0 pointer-events-none z-20 flex flex-col justify-end p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none w-full max-w-full overflow-hidden">
        {/* Joystick (Left) and Action Button + Helper Toggles (Right) */}
        <div className="flex justify-between items-end px-2 mb-2">
          {/* Left Block: Analog Joystick (Clean, Ergonomic & Uncluttered) */}
          <div className="flex flex-col items-start">
            {/* Transparent Virtual Joystick */}
            <div
              ref={joystickRef}
              onPointerDown={handlePointerDown}
              className="pointer-events-auto relative w-24 h-24 rounded-full bg-black/45 border-2 border-white/30 flex items-center justify-center touch-none shadow-2xl backdrop-blur-xs active:border-emerald-400/80"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                <div className="w-full h-[1px] bg-white" />
                <div className="absolute h-full w-[1px] bg-white" />
              </div>

              {/* Glowing Thumb Knob */}
              <div
                ref={knobRef}
                className="w-11 h-11 rounded-full bg-emerald-500/90 shadow-lg border-2 border-white/70 will-change-transform flex items-center justify-center pointer-events-none"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white/70 shadow-inner" />
              </div>
            </div>
          </div>

          {/* Right Block: Dynamic Action Button + Helper Toggles (Ergonomic Thumb Cluster) */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            {/* Quick Utility Row: Penanda Petak Toggle & Mode Lari Toggle */}
            <div className="flex items-center gap-1.5">
              {/* Tombol Sembunyikan/Tampilkan Penanda Petak */}
              {onToggleGridCursor && (
                <button
                  onPointerDown={triggerGridToggleInstant}
                  className={`touch-none px-2 py-1 rounded-xl border flex items-center gap-1 shadow-md active:scale-95 transition-all text-[9.5px] font-bold tracking-tight ${
                    showGridCursor
                      ? 'bg-emerald-900/85 text-emerald-200 border-emerald-400/50 shadow-emerald-950/40'
                      : 'bg-slate-900/85 text-slate-400 border-slate-700/50'
                  }`}
                  title={showGridCursor ? "Sembunyikan Penanda Petak 3D" : "Tampilkan Penanda Petak 3D"}
                >
                  {showGridCursor ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-300" />
                      <span>PETAK</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      <span>SEMBUNYI</span>
                    </>
                  )}
                </button>
              )}

              {/* Tombol Mode Lari / Jalan */}
              {onToggleSprint && (
                <button
                  onPointerDown={triggerSprintInstant}
                  className={`touch-none px-2.5 py-1 rounded-xl border flex items-center gap-1 shadow-md active:scale-95 transition-all text-[9.5px] font-black tracking-wide cursor-pointer ${
                    isSprinting
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-200 shadow-orange-500/40 ring-1 ring-amber-300'
                      : 'bg-black/70 text-slate-300 border-white/25 hover:text-white'
                  }`}
                  title="Ganti Mode Lari Cepat / Jalan Santai [Shift]"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSprinting ? 'text-yellow-100 fill-amber-200' : 'text-slate-300'}`} />
                  <span>{isSprinting ? 'LARI ⚡' : 'JALAN'}</span>
                </button>
              )}
            </div>

            {/* Action Row: Hop / Jump Button + Main Action Button side-by-side for easy thumb reach */}
            <div className="flex items-end gap-2">
              {/* Tombol Lompat / Hop Karakter */}
              {onJump && (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onJump();
                    try {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate(12);
                      }
                    } catch (_) {}
                  }}
                  className="touch-none w-12 h-12 rounded-full border-2 border-sky-300/60 flex flex-col items-center justify-center gap-0.5 shadow-xl active:scale-90 transition-all bg-gradient-to-b from-sky-600 to-sky-800 text-white cursor-pointer mb-1 shadow-sky-950/50"
                  title="Lompat / Hop Karakter [Spasi]"
                >
                  <ArrowUpCircle className="w-5 h-5 text-sky-200" />
                  <span className="text-[8px] font-black tracking-wider uppercase">LOMPAT</span>
                </button>
              )}

              {/* Dynamic Main Action Button (Supports Multi-Touch simultaneously with Joystick) */}
              <button
                onPointerDown={triggerActionInstant}
                className={`touch-none w-20 h-20 rounded-full text-white font-extrabold shadow-2xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all duration-75 border-2 ${
                  isCollectible
                    ? 'bg-gradient-to-t from-amber-600 to-yellow-500 border-amber-200 shadow-amber-500/60 ring-2 ring-yellow-400/40 animate-pulse'
                    : targetedDebris === 'weed'
                    ? 'bg-gradient-to-t from-lime-700 to-emerald-600 border-lime-300 shadow-lime-500/50 ring-2 ring-lime-400/30'
                    : targetedDebris === 'log' || targetedDebris === 'wild_tree'
                    ? 'bg-gradient-to-t from-amber-800 to-orange-600 border-orange-300 shadow-orange-500/50 ring-2 ring-orange-400/30'
                    : targetedDebris === 'small_stone' || targetedDebris === 'big_stone'
                    ? 'bg-gradient-to-t from-slate-700 to-cyan-800 border-cyan-300 shadow-cyan-500/50 ring-2 ring-cyan-400/30'
                    : isNearShippingBin
                    ? 'bg-gradient-to-t from-amber-700 to-amber-500 border-amber-300 shadow-amber-600/50 ring-2 ring-amber-400/30'
                    : 'bg-emerald-600/90 active:bg-emerald-500 border-emerald-300/60 shadow-emerald-950/60'
                }`}
              >
                {getActionIcon()}
                <span className={`text-[11px] font-black tracking-wider uppercase drop-shadow ${isCollectible || targetedDebris || isNearShippingBin ? 'text-amber-100' : ''}`}>
                  {getButtonText()}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Item Info Badge floating above bottom bar */}
        {selectorMode === 'items' && activeItem && (
          <div className="pointer-events-none self-center mb-1 bg-black/85 border border-amber-400/50 text-amber-200 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-[10px] font-bold animate-in fade-in slide-in-from-bottom-2 duration-150">
            <span className="text-sm leading-none drop-shadow">{activeItem.icon}</span>
            <span>{activeItem.name}</span>
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono text-[9px]">
              x{activeItem.count}
            </span>
            <span className="text-[8.5px] text-slate-300 ml-1 border-l border-white/20 pl-1.5">
              Tekan ANGKAT untuk memegang
            </span>
          </div>
        )}

        {/* Bottom Toolbar Container (Integrates Mode Switcher on Left + Animated Contents on Right) */}
        <div className="pointer-events-auto w-full bg-black/75 border border-white/20 rounded-2xl p-1.5 shadow-xl flex items-center gap-2 overflow-hidden relative">
          {/* Integrated Left Switcher Button (Stays stationary on left) */}
          <button
            onPointerDown={triggerSelectorModeInstant}
            className={`shrink-0 touch-none px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-[10px] font-black tracking-wide z-10 cursor-pointer ${
              selectorMode === 'items'
                ? 'bg-amber-600/95 text-white border-amber-300/80 shadow-amber-500/30 ring-1 ring-amber-400/40'
                : 'bg-emerald-700/90 text-white border-emerald-300/60 shadow-emerald-500/30 ring-1 ring-emerald-400/30'
            }`}
            title="Ganti Mode Alat / Mode Tas Barang"
          >
            {selectorMode === 'items' ? (
              <>
                <Package className="w-4 h-4 text-amber-200 animate-pulse" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] font-extrabold uppercase">TAS</span>
                  <span className="text-[7.5px] text-amber-200 font-mono font-bold">{inventory.length} BARANG</span>
                </div>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 text-emerald-200" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] font-extrabold uppercase">ALAT</span>
                  <span className="text-[7.5px] text-emerald-200 font-mono font-bold">6 ALAT</span>
                </div>
              </>
            )}
          </button>

          {/* Vertical Separator */}
          <div className="w-[1px] h-8 bg-white/25 shrink-0" />

          {/* Animated Scrollable Items Container (Fully Swipeable / Scrollable horizontally on touch) */}
          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 touch-pan-x min-h-[46px]">
            <div key={selectorMode} className="animate-switch-slide flex items-center gap-1.5 shrink-0">
              {selectorMode === 'tools' ? (
                /* Mode 1: Alat Tani */
                tools.map((t) => {
                  const isActive = activeTool === t.id;
                  return (
                    <button
                      key={t.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveTool(t.id);
                        if (t.id === 'plant' && onOpenSeedSelect) {
                          onOpenSeedSelect();
                        }
                        try {
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                            navigator.vibrate(10);
                          }
                        } catch (_) {}
                      }}
                      className={`min-w-[58px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 active:scale-95 touch-pan-x cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600/90 text-white font-black shadow-md border border-emerald-300/50 scale-[1.03]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 font-semibold'
                      }`}
                    >
                      {t.icon}
                      <span className="text-[9px] mt-0.5 tracking-tight truncate whitespace-nowrap">
                        {t.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                /* Mode 2: Seleksi Barang (Geser Kiri/Kanan dengan Usapan Jari) */
                inventory.length > 0 ? (
                  inventory.map((item) => {
                    const isActive = activeItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setActiveItem(item);
                          try {
                            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                              navigator.vibrate(10);
                            }
                          } catch (_) {}
                        }}
                        className={`min-w-[68px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 active:scale-95 border touch-pan-x cursor-pointer ${
                          isActive
                            ? 'bg-amber-600/90 text-white font-black shadow-md border-amber-300 scale-[1.03] ring-1 ring-amber-200/50'
                            : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base leading-none drop-shadow">{item.icon}</span>
                          <span className="text-[8px] bg-black/50 text-amber-300 px-1 rounded-full font-mono font-bold">
                            {item.count}
                          </span>
                        </div>
                        <span className="text-[8px] mt-0.5 tracking-tight truncate max-w-[60px] whitespace-nowrap font-medium">
                          {item.name}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-1 text-[10px] text-slate-400 italic px-4">
                    Tas kosong. Buka Pasar untuk membeli barang!
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

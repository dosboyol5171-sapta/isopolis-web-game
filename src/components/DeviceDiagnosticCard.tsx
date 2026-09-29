import React, { useState, useEffect } from 'react';
import { Cpu, Monitor, HardDrive, CheckCircle2, AlertCircle, RefreshCw, Layers, Sparkles, Activity, Info } from 'lucide-react';

export interface SystemCapabilities {
  webgl1: boolean;
  webgl2: boolean;
  webgpu: boolean;
  webgpuAdapterName?: string;
  webgpuStatusText: string;
  opfs: boolean;
  opfsStatusText: string;
  indexedDb: boolean;
  localStorage: boolean;
  storageEstimate?: {
    quotaMB: number;
    usageMB: number;
  };
  rendererInfo?: string;
  cpuCores?: number;
  deviceMemoryGB?: number;
  userAgent: string;
  screenInfo: string;
  lastChecked: Date;
}

export const DeviceDiagnosticCard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [caps, setCaps] = useState<SystemCapabilities | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);

    // 1. WebGL 1.0 & WebGL 2.0 Check
    let webgl1 = false;
    let webgl2 = false;
    let rendererInfo = 'Standard GPU';

    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        webgl2 = true;
        webgl1 = true;
        const dbg = gl2.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          rendererInfo = gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || rendererInfo;
        }
      } else {
        const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl1) {
          webgl1 = true;
          const dbg = (gl1 as any).getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
            rendererInfo = (gl1 as any).getParameter(dbg.UNMASKED_RENDERER_WEBGL) || rendererInfo;
          }
        }
      }
    } catch (_) {
      // Ignore
    }

    // 2. WebGPU Check & Adapter probe
    let webgpu = false;
    let webgpuAdapterName: string | undefined;
    let webgpuStatusText = 'Tidak Didukung di Browser Ini';

    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          webgpu = true;
          const info = adapter.info || (await (adapter as any).requestAdapterInfo?.());
          if (info) {
            webgpuAdapterName = info.description || info.vendor || info.architecture || 'Vulkan / Hardware Adapter';
            webgpuStatusText = `Aktif & Siap (${webgpuAdapterName})`;
          } else {
            webgpuStatusText = 'Aktif & Siap (Hardware Accelerated)';
          }
        } else {
          webgpuStatusText = 'Tersedia di API, namun Adapter GPU belum aktif';
        }
      } catch (err: any) {
        webgpuStatusText = `API Ada, Akses Ditolak: ${err?.message || 'Driver tidak merespons'}`;
      }
    }

    // 3. OPFS (Origin Private File System) Check
    let opfs = false;
    let opfsStatusText = 'Tidak Didukung (Gunakan LocalStorage)';
    let storageEstimate: { quotaMB: number; usageMB: number } | undefined;

    if (typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.getDirectory === 'function') {
      try {
        const root = await navigator.storage.getDirectory();
        if (root) {
          // Perform lightweight test file creation to verify write permissions
          const testHandle = await root.getFileHandle('__diagnostic_test.tmp', { create: true });
          const writable = await (testHandle as any).createWritable?.();
          if (writable) {
            await writable.write('ok');
            await writable.close();
          }
          await root.removeEntry('__diagnostic_test.tmp').catch(() => {});

          opfs = true;
          opfsStatusText = 'Aktif & Beroperasi (Kecepatan Disk Asli)';
        }
      } catch (err: any) {
        opfs = true; // API exists
        opfsStatusText = `Aktif (${err?.message || 'Izin terbatas'})`;
      }
    }

    // Storage Estimate
    if (typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.estimate === 'function') {
      try {
        const est = await navigator.storage.estimate();
        if (est && est.quota) {
          storageEstimate = {
            quotaMB: Math.round(est.quota / (1024 * 1024)),
            usageMB: Math.round((est.usage || 0) / (1024 * 1024)),
          };
        }
      } catch (_) {}
    }

    // IndexedDB & LocalStorage
    const indexedDb = typeof window !== 'undefined' && 'indexedDB' in window;
    const localStorageAvailable = typeof window !== 'undefined' && 'localStorage' in window;

    // CPU & Memory
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
    const cpuCores = nav.hardwareConcurrency;
    const deviceMemoryGB = nav.deviceMemory;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const screenInfo = typeof window !== 'undefined' 
      ? `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x DPR)` 
      : 'N/A';

    setCaps({
      webgl1,
      webgl2,
      webgpu,
      webgpuAdapterName,
      webgpuStatusText,
      opfs,
      opfsStatusText,
      indexedDb,
      localStorage: localStorageAvailable,
      storageEstimate,
      rendererInfo,
      cpuCores,
      deviceMemoryGB,
      userAgent,
      screenInfo,
      lastChecked: new Date(),
    });

    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-3.5 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-sky-300">
            Diagnostik Perangkat & API Lingkungan
          </h3>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/70 hover:bg-sky-900 border border-sky-600/40 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Memeriksa...' : 'Uji Ulang'}</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 leading-tight">
        Informasi kemampuan akselerasi grafis (WebGL vs WebGPU), sistem berkas OPFS, dan spesifikasi perangkat Anda.
      </p>

      {/* Grid of Diagnostic Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {/* 1. WebGL 2.0 Engine */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-slate-200">WebGL 2.0 (Engine Aktif)</span>
            </div>
            {caps?.webgl2 ? (
              <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> AKTIF
              </span>
            ) : (
              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> WebGL 1.0
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={caps?.rendererInfo}>
            GPU: <span className="text-slate-300 font-mono">{caps?.rendererInfo || 'Mendeteksi...'}</span>
          </div>
        </div>

        {/* 2. WebGPU Next-Gen */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold text-slate-200">WebGPU (Next-Gen)</span>
            </div>
            {caps?.webgpu ? (
              <span className="text-[9px] font-extrabold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/40 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> DIDUKUNG
              </span>
            ) : (
              <span className="text-[9px] font-extrabold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
                <Info className="w-2.5 h-2.5 text-slate-400" /> WebGL Standar
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            Status: <span className="text-slate-300 font-mono">{caps?.webgpuStatusText || 'Mengecek...'}</span>
          </div>
        </div>

        {/* 3. OPFS Storage */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-slate-200">OPFS (Private File System)</span>
            </div>
            {caps?.opfs ? (
              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> TERSEDIA
              </span>
            ) : (
              <span className="text-[9px] font-extrabold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
                <Info className="w-2.5 h-2.5" /> LocalStorage
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            Status: <span className="text-slate-300">{caps?.opfsStatusText || 'Mengecek...'}</span>
          </div>
        </div>

        {/* 4. Kapasitas & Memori Sistem */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-slate-200">Hardware & Layar</span>
            </div>
            <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40">
              {caps?.cpuCores ? `${caps.cpuCores} Core CPU` : 'Multi-Core'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
            <span>RAM: <strong className="text-slate-300">{caps?.deviceMemoryGB ? `≥ ${caps.deviceMemoryGB} GB` : 'Tersedia'}</strong></span>
            <span>Layar: <strong className="text-slate-300">{caps?.screenInfo}</strong></span>
            {caps?.storageEstimate && (
              <span>Disk Kuota: <strong className="text-emerald-400">{(caps.storageEstimate.quotaMB / 1024).toFixed(1)} GB</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

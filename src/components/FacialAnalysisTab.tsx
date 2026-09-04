import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Smile, 
  Video, 
  VideoOff, 
  Sparkles, 
  Activity, 
  Eye, 
  User, 
  Award, 
  TrendingUp, 
  Info 
} from 'lucide-react';
import { FacialMetrics } from '../types';
import { startLandmarkTrackingEngine } from '../services/expressionTrackerService';

export const FacialAnalysisTab: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [usingSimulation, setUsingSimulation] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FacialMetrics>({
    emotion: 'Focused',
    eyeContactPercent: 92,
    smilePercent: 15,
    blinkCount: 4,
    postureStatus: 'Good'
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanupEngineRef = useRef<(() => void) | null>(null);

  // Synchronize stream and canvas overlay loop with isActive state
  useEffect(() => {
    if (isActive) {
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Start the overlay drawing loop (handles canvas mounting gracefully)
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          if (cleanupEngineRef.current) cleanupEngineRef.current();
          cleanupEngineRef.current = startLandmarkTrackingEngine({
            canvas: canvasRef.current,
            isActive: true,
            onMetricsUpdate: (newMetrics) => {
              setMetrics(newMetrics);
            }
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (cleanupEngineRef.current) {
        cleanupEngineRef.current();
        cleanupEngineRef.current = null;
      }
    }
  }, [isActive, stream]);

  // Clean up streams & overlay loops on unmount
  useEffect(() => {
    return () => {
      stopMedia();
      if (cleanupEngineRef.current) {
        cleanupEngineRef.current();
        cleanupEngineRef.current = null;
      }
    };
  }, []);

  const startMedia = async () => {
    setSimulationNotice(null);
    let timeoutId: any = setTimeout(() => {
      console.warn('Camera request timed out inside iframe, launching biometric simulation.');
      setSimulationNotice('Camera timed out (iframe security policy). Running in Biometric Simulation Mode.');
      startSimulation();
    }, 1500);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser/environment.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      clearTimeout(timeoutId);
      setStream(mediaStream);
      setUsingSimulation(false);
      setIsActive(true);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Camera access unavailable. Loading placeholder simulation.', err);
      setSimulationNotice('Webcam blocked in preview sandbox. Running in Biometric Simulation Mode!');
      startSimulation();
    }
  };

  const startSimulation = () => {
    setUsingSimulation(true);
    setIsActive(true);
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setUsingSimulation(false);
    setSimulationNotice(null);
    if (cleanupEngineRef.current) {
      cleanupEngineRef.current();
      cleanupEngineRef.current = null;
    }
  };

  return (
    <div id="facial-analysis-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* LEFT COLUMN: LIVE VIDEO SCREEN */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="px-6 py-4 bg-[#111422] border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <User className="w-4 h-4" /> Composure & Facial Landmark Mesh
            </div>
            {isActive && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                SCANNING LIVE
              </span>
            )}
          </div>

          {/* Combined Video & FaceMesh Overlay */}
          <div className="aspect-video bg-[#090a0f] relative flex items-center justify-center overflow-hidden">
            {simulationNotice && (
              <div className="absolute top-4 left-4 right-4 z-20 px-3.5 py-2.5 bg-indigo-950/95 border border-indigo-500/40 rounded-xl text-[11px] text-indigo-200 font-medium shadow-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
                <span>{simulationNotice}</span>
              </div>
            )}

            {isActive ? (
              <>
                {!stream ? (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c16] via-[#090a10] to-[#040508] flex flex-col items-center justify-center overflow-hidden">
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                    
                    {/* Glowing Scanner Line */}
                    <motion.div 
                      className="absolute left-0 right-0 h-0.5 bg-emerald-500/50 shadow-[0_0_12px_#10b981] z-10"
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Cyber Face Silhouette */}
                    <motion.div 
                      className="w-24 h-24 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center relative shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </motion.div>
                    
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-4">Biometric Scan Simulation</span>
                  </div>
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover scale-x-[-1] opacity-75"
                  />
                )}
                
                {/* Overlying tracking canvas */}
                <canvas 
                  ref={canvasRef} 
                  width="640" 
                  height="360" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 scale-x-[-1]" 
                />
              </>
            ) : (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-600 w-fit mx-auto">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Face Landmarks Offline</h4>
                  <p className="text-xs text-zinc-500 mt-1">Initialize your system camera to test focus points and expression ratios.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-[#0a0c14] border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-zinc-400 max-w-md">
              <span className="font-bold text-white block mb-0.5">Biometric Sandbox Privacy Guarantee</span>
              All spatial coordinates are modeled entirely on-CPU within your browser viewport. No data is cached externally.
            </div>
            
            <button 
              id="camera-mesh-toggle"
              onClick={isActive ? stopMedia : startMedia}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${isActive ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700' : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300'}`}
            >
              {isActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {isActive ? 'Disconnect Tracker' : 'Establish Live Tracker'}
            </button>
          </div>
        </div>

        {/* GUIDES AND INFORMATION BAR */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400">
            <span className="font-bold text-white block">How AI Coaches Your Body Language</span>
            <p className="leading-relaxed">
              Global recruiters evaluate structural confidence through non-verbal indicators. Maintain focused pupil positioning within the center box, smile slightly during introductory stages, and keep your shoulders level to secure high demeanor score marks.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: METRIC CHARTS & STATISTICS */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-5 text-left space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Activity className="w-4 h-4 text-emerald-400" /> Landmark Telemetry
          </h3>

          <div className="space-y-5">
            {/* Emotion Heuristic */}
            <div>
              <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                <span>Calculated Pose State</span>
                <span className="text-emerald-400 font-bold font-mono">{metrics.emotion}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full">
                <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: metrics.emotion === 'Focused' ? '100%' : '50%' }} />
              </div>
            </div>

            {/* Eye Contact Stability */}
            <div>
              <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                <span>Eye Contact Stability</span>
                <span className="text-indigo-400 font-bold font-mono">{metrics.eyeContactPercent}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.eyeContactPercent}%` }} />
              </div>
            </div>

            {/* Smile Index */}
            <div>
              <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                <span>Smile Index Ratio</span>
                <span className="text-amber-400 font-bold font-mono">{metrics.smilePercent}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.smilePercent}%` }} />
              </div>
            </div>

            {/* Blink Rate Monitor */}
            <div className="flex justify-between items-center bg-[#141722]/50 border border-zinc-800 p-3.5 rounded-xl text-xs">
              <span className="text-zinc-400 font-medium">Blinks Count (Session)</span>
              <span className="font-bold text-white font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                {metrics.blinkCount} blinks
              </span>
            </div>

            {/* Posture alignment */}
            <div className="flex justify-between items-center bg-[#141722]/50 border border-zinc-800 p-3.5 rounded-xl text-xs">
              <span className="text-zinc-400 font-medium">Spine Posture Alignment</span>
              <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                {metrics.postureStatus}
              </span>
            </div>
          </div>
        </div>

        {/* DEMEANOR CALIBRATION INDEX */}
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-5 text-left">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Optimal Benchmarks</h4>
          <div className="space-y-3.5 text-xs text-zinc-400">
            <div className="flex justify-between items-center">
              <span>Eye Focus Ratio</span>
              <span className="text-zinc-300 font-medium">&gt; 85% stability</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Smile Frequency</span>
              <span className="text-zinc-300 font-medium">Intro & Outro peaks</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Blink Intervals</span>
              <span className="text-zinc-300 font-medium">10 - 15 per min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

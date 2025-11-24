import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Activity, Zap, Triangle, Hexagon, Circle, Square } from 'lucide-react';
import { generateIdentity } from './services/geminiService';
import { AppState, DetectionResult, AIResponse } from './types';
import FaceOverlay from './components/FaceOverlay';

// Global FaceAPI declaration
declare global {
  interface Window {
    faceapi: any;
  }
}

// --- SUB-COMPONENTS ---

// Optimized CSS-only Rain to prevent React Render Cycle overload
const CssAsciiRain = () => {
    // Generate static drops once
    const drops = useRef(Array.from({ length: 40 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        chars: "01XYZアイウ"
    }))).current;

    return (
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
            {drops.map((d, i) => (
                <div 
                    key={i}
                    className="absolute text-cyan-500 font-mono text-xs font-bold glow-text animate-rain"
                    style={{ 
                        left: `${d.left}%`, 
                        animationDuration: `${d.duration}s`,
                        animationDelay: `-${d.delay}s`
                    }}
                >
                    {d.chars}
                </div>
            ))}
            <style>{`
                @keyframes rain {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                .animate-rain {
                    animation-name: rain;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    writing-mode: vertical-rl;
                }
            `}</style>
        </div>
    );
};

interface CyberTagProps {
    data: any;
    x: number;
    y: number;
    delay: number;
    isPrimary?: boolean;
}

const CyberTag: React.FC<CyberTagProps> = ({ data, x, y, delay, isPrimary = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // If it's primary, we show full info. If alternative, we show collapsed "Data Bit" until hover.
    const showFull = isPrimary || isHovered;

    // Smart Positioning Logic
    const isRightSide = x > 50;
    const isBottomSide = y > 60;

    // Anchor the expanded card based on screen position
    const anchorClass = `
        absolute 
        ${isBottomSide ? 'bottom-full mb-2' : 'top-full mt-2'} 
        ${isRightSide ? 'right-0' : 'left-0'}
    `;

    // Safe Data Access and Label Generation
    const genderRaw = data.gender || 'neutral';
    const genderLower = String(genderRaw).toLowerCase();
    
    const isMale = genderLower.includes('male') && !genderLower.includes('female');
    const isFemale = genderLower.includes('female');
    
    // Robust Age Extraction
    let displayAge = '?';
    if (data.age !== undefined && data.age !== null) {
        // If it's a number (from faceapi), round it.
        if (typeof data.age === 'number') {
            displayAge = String(Math.round(data.age));
        } else {
            // If string (from AI), try to extract digits, but allow "20s"
            const str = String(data.age);
            // Remove anything that isn't a digit or 's' or '+' (e.g. 20s, 30+, 25)
            const clean = str.replace(/[^0-9s+]/g, '');
            displayAge = clean.length > 0 ? clean : str;
        }
    }
    
    const label = `${genderLower}/${displayAge}`;

    // Default / Non-Binary
    let colorClass = "border-lime-400 text-lime-400"; 
    let glowClass = "shadow-[0_0_10px_rgba(132,204,22,0.4)]";
    let bgHeader = "bg-lime-900/50";
    let Icon = Square;

    if (isMale) {
        colorClass = "border-cyan-400 text-cyan-400";
        glowClass = "shadow-[0_0_15px_rgba(34,211,238,0.5)]";
        bgHeader = "bg-cyan-900/50";
        Icon = Triangle;
    } else if (isFemale) {
        colorClass = "border-fuchsia-500 text-fuchsia-400";
        glowClass = "shadow-[0_0_15px_rgba(217,70,239,0.5)]";
        bgHeader = "bg-fuchsia-900/50";
        Icon = Hexagon;
    }

    return (
        <div 
            className={`absolute z-40 flex items-center justify-center transition-all duration-200 ease-linear`} 
            style={{ 
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0, 
                animation: `fadeIn 0.5s ease-out forwards ${delay}ms` 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>

            {/* --- HIT AREA --- */}
            {/* Massive invisible area to capture mouse easily */}
            <div className="absolute -inset-12 bg-transparent z-30 cursor-pointer rounded-full" />

            {/* Connector Line (only for Primary) */}
            {isPrimary && (
                 <div className={`absolute -top-12 left-1/2 w-[1px] h-12 bg-gradient-to-b from-transparent to-${colorClass.split(' ')[0].replace('border-', '')} opacity-50 pointer-events-none`} />
            )}

            {/* Wrapper for hover expansion */}
            <div className={`relative ${showFull ? 'z-50' : 'z-40'}`}>
                
                {/* 1. COLLAPSED VIEW (Data Bit) */}
                <div className={`
                    ${showFull ? 'opacity-0' : 'opacity-100'}
                    transition-opacity duration-300
                    flex items-center gap-2 px-3 py-1
                    border ${colorClass} ${glowClass}
                    bg-slate-900/70 backdrop-blur-md
                    whitespace-nowrap pointer-events-none
                `}>
                    <Icon size={10} className={colorClass} />
                    <span className="text-[10px] font-mono tracking-wider text-white/90">{label}</span>
                </div>

                {/* 2. EXPANDED VIEW (Full Card) */}
                <div className={`
                    ${anchorClass}
                    ${showFull ? 'opacity-100 visible' : 'opacity-0 invisible'}
                    transition-opacity duration-200
                    min-w-[260px] max-w-[300px]
                    border ${colorClass} ${glowClass}
                    bg-slate-900/90 backdrop-blur-xl shadow-2xl
                    z-50
                `}>
                    {/* Header */}
                    <div className={`${bgHeader} p-3 border-b ${colorClass} flex items-center justify-between`}>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-white/40 tracking-widest">IDENTITY_DETECTED</span>
                            <div className={`text-lg font-bold tracking-tight text-white flex items-center gap-2`}>
                                <Icon size={16} fill="currentColor" className={colorClass} />
                                <span>{label.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Body: Bio */}
                    <div className="p-4">
                        <p className="text-xs text-white/90 font-mono leading-relaxed">
                            {data.text || data.bio}
                        </p>
                        
                        {/* Footer: Tags / Bias */}
                        <div className="mt-3 flex flex-wrap gap-2">
                             {data.biasType && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-900/50 text-red-400 border border-red-900 rounded">
                                    ERR: {data.biasType}
                                </span>
                            )}
                            {data.tags && data.tags.map((t: string, i: number) => (
                                <span key={i} className={`text-[9px] px-1.5 py-0.5 border ${colorClass} text-white/70 bg-black/40`}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                     {/* Decorative Elements */}
                    <div className={`absolute top-0 left-0 w-1.5 h-1.5 bg-white mix-blend-overlay`}></div>
                    <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 ${colorClass.replace('text-', 'bg-')}`}></div>
                </div>

            </div>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING_MODELS);
  const [error, setError] = useState<string>('');
  const [faceData, setFaceData] = useState<any>(null); // Always live
  const [lockedFaceData, setLockedFaceData] = useState<any>(null); // Frozen at snapshot
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [countdown, setCountdown] = useState(3);
  
  // Track dominant expression for UI
  const [dominantExpression, setDominantExpression] = useState('scannning...');

  // Load Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        if (!window.faceapi) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        const faceapi = window.faceapi;
        // Use Tiny Face Detector for speed
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);

        startVideo();
      } catch (err) {
        console.error(err);
        setError('SYS_ERR: MODEL_LOAD_FAIL');
      }
    };
    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            setAppState(AppState.WAITING_FOR_FACE);
            startDetection();
        };
      }
    } catch (err) {
      setError('ACCESS DENIED: OPTIC SENSORS OFFLINE');
    }
  };

  const startDetection = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      
      const faceapi = window.faceapi;
      if (!faceapi) return;

      try {
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        if (detection) {
            setFaceData(detection);
            
            // Only update expression if we aren't displaying results (locked state expression)
            // Or keep expression live? Let's keep expression live for fun, but Age/Gender locked.
            const expr = detection.expressions;
            const dom = Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b);
            setDominantExpression(dom);
        } else {
            setFaceData(null);
        }
      } catch (e) {
          // Silent catch to prevent crash loop
      }
    }, 100);
    return () => clearInterval(interval);
  };

  const startSequence = () => {
    if (!faceData) return;
    setAppState(AppState.COUNTDOWN);
    setCountdown(3);
    
    const countInt = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(countInt);
                triggerGeneration();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const triggerGeneration = async () => {
      setAppState(AppState.GENERATING);
      
      // CRITICAL: SNAPSHOT THE DATA. 
      // This "locks" the age/gender perception at this moment.
      // But the video feed continues (Live AR).
      const snapshot = { ...faceData }; 
      setLockedFaceData(snapshot);

      const result: DetectionResult = {
        age: snapshot.age,
        gender: snapshot.gender,
        genderProbability: snapshot.genderProbability,
        expressions: snapshot.expressions,
      };

      try {
        const data = await generateIdentity(result);
        setAiData(data);
        setAppState(AppState.DISPLAYING);
      } catch (e) {
        setError("GENERATION_ABORTED");
        setLockedFaceData(null);
        setAppState(AppState.WAITING_FOR_FACE);
      }
  };

  const reset = () => {
      setAppState(AppState.WAITING_FOR_FACE);
      setAiData(null);
      setLockedFaceData(null);
  };

  // Generate fixed positions for alternatives so they form a cloud around the screen
  // They don't track the face, they form the "System Environment"
  // RETURNS [x, y] in percentages
  const getFixedTagPosition = (index: number, total: number) => {
      // Golden Angle distribution for a nice scattered cloud
      const goldenAngle = 137.5; 
      const radius = 22 + (index * 2.2); // Expanding spiral
      const theta = index * goldenAngle * (Math.PI / 180);
      
      // Offset from center (50, 50)
      const x = 50 + radius * Math.cos(theta);
      const y = 45 + (radius * 0.75) * Math.sin(theta); // slightly flatter ellipse

      // Clamp to screen with padding
      const safeX = Math.max(8, Math.min(92, x));
      const safeY = Math.max(12, Math.min(88, y));

      return { x: safeX, y: safeY };
  };

  // Calculate Primary Tag Position based on live face
  const getPrimaryTagPosition = () => {
      // Use LIVE faceData if available for tracking, otherwise fallback to locked.
      // This enables the tag to follow the user's head movement.
      const targetData = faceData || lockedFaceData;
      
      if (!targetData) return { x: 50, y: 50 };
      
      // Video is 1280x720 (ish). We need to map face coords to percentages.
      // Note: Video is mirrored with scale-x-[-1].
      // FaceAPI coords are RAW (unmirrored). 
      // We need to flip the X coordinate calculation to match the mirrored visual.
      
      const { x, y, width, height } = targetData.detection.box;
      const videoWidth = videoRef.current?.videoWidth || 1280;
      const videoHeight = videoRef.current?.videoHeight || 720;
      
      // Calculate center points
      const centerX = x + width / 2;
      const bottomY = y + height;
      
      // Calculate percentage
      // MIRROR FIX: subtract (centerX/width) from 1 (100%)
      let percentX = 100 - ((centerX / videoWidth) * 100);
      let percentY = (bottomY / videoHeight) * 100;
      
      // Add offset for the tag
      percentY += 5; 

      return { x: percentX, y: percentY };
  };

  const primaryPos = getPrimaryTagPosition();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-mono text-white">
        
        <CssAsciiRain />

        {/* --- LAYER 1: LIVE VIDEO (Mirrored) --- */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
             <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1] opacity-60 mix-blend-screen"
                style={{ filter: 'contrast(1.1) brightness(1.2) grayscale(0.2)' }}
             />
             {/* FaceOverlay receives LIVE data for position, but LOCKED data for text info */}
             <FaceOverlay 
                videoRef={videoRef} 
                faceData={faceData} 
                lockedFaceData={lockedFaceData}
                expression={dominantExpression} 
             />
        </div>

        {/* --- LAYER 2: UI --- */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
            
            {/* Header / HUD */}
            <div className="flex justify-between items-start">
                <div className="border-l-4 border-cyan-500 pl-3">
                    <h1 className="text-2xl font-bold text-cyan-400 tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
                        IDENTITY_FRAGMENTOR <span className="text-xs align-top opacity-50">v3.0_AR</span>
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-cyan-700 mt-1">
                        <Activity size={10} className="animate-pulse" />
                        <span>NEURAL_NET: {appState === AppState.DISPLAYING ? 'LOCKED' : 'SCANNING'}</span>
                    </div>
                </div>
            </div>

            {/* Center Stage: Trigger */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                
                {appState === AppState.WAITING_FOR_FACE && (
                    <button 
                        onClick={startSequence}
                        disabled={!faceData}
                        className={`
                            relative px-10 py-4 bg-black/60 border border-cyan-500/50 
                            backdrop-blur hover:bg-cyan-900/30 hover:border-cyan-400
                            transition-all duration-200 group overflow-hidden clip-path-polygon
                        `}
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)' }}
                    >
                        <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="flex items-center gap-3">
                            <Zap className={`w-5 h-5 ${faceData ? 'text-cyan-400' : 'text-gray-600'}`} />
                            <span className={`font-bold tracking-[0.2em] ${faceData ? 'text-white' : 'text-gray-500'}`}>
                                {faceData ? "INITIALIZE_SCAN" : "WAITING_SUBJECT..."}
                            </span>
                        </div>
                    </button>
                )}

                {appState === AppState.COUNTDOWN && (
                    <div className="text-[150px] font-bold text-cyan-500 opacity-80 animate-ping">
                        {countdown}
                    </div>
                )}

                {appState === AppState.GENERATING && (
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-fuchsia-500 border-l-transparent rounded-full animate-spin"></div>
                         <div className="text-cyan-400 text-xs tracking-widest animate-pulse mt-4">FRAGMENTING_IDENTITY...</div>
                    </div>
                )}
            </div>

            {/* --- LAYER 3: RESULTS (Live AR) --- */}
            {appState === AppState.DISPLAYING && aiData && lockedFaceData && (
                <div className="absolute inset-0 pointer-events-auto">
                    
                    {/* Reset Button */}
                    <button 
                        onClick={reset}
                        className="absolute top-6 right-1/2 translate-x-1/2 p-2 bg-black border border-red-500/50 text-red-500 hover:bg-red-900/50 hover:text-white transition-colors z-50 rounded"
                    >
                        <RefreshCw size={16} />
                    </button>

                    {/* Primary Identity - FOLLOWS FACE WITH SMOOTHING */}
                     <CyberTag 
                        data={{
                            text: aiData.primaryIdentity.bio,
                            gender: lockedFaceData.gender,
                            age: Math.round(lockedFaceData.age) + 'yo',
                            biasType: "PRIMARY MATCH",
                            tags: aiData.primaryIdentity.tags
                        }}
                        x={primaryPos.x}
                        y={primaryPos.y}
                        delay={0}
                        isPrimary={true}
                     />

                    {/* Alternatives - FIXED CLOUD (The "System" output) */}
                    {aiData.alternatives.map((alt, i) => {
                        const pos = getFixedTagPosition(i, aiData.alternatives.length);
                        return (
                            <CyberTag 
                                key={i}
                                data={alt}
                                x={pos.x}
                                y={pos.y}
                                delay={i * 50} // Fast cascade
                                isPrimary={false}
                            />
                        );
                    })}

                </div>
            )}
            
            {/* Footer */}
            <div className="flex justify-between items-end text-[10px] text-gray-600">
                <div className="flex gap-4">
                    <span>CAM_ISO: AUTO</span>
                    <span>TRACKING: {faceData ? 'LOCKED' : 'SEARCHING'}</span>
                </div>
            </div>

        </div>
    </div>
  );
};

export default App;
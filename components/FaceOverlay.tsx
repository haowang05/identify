import React, { useEffect, useRef } from 'react';

interface FaceOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  faceData: any; // The Live Data for positioning
  lockedFaceData: any; // The Frozen Data for text (optional)
  expression: string;
}

const FaceOverlay: React.FC<FaceOverlayProps> = ({ videoRef, faceData, lockedFaceData, expression }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If no live face, maybe draw a "SEARCHING..." text in the center
    if (!faceData) {
        ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
        ctx.font = "16px 'Share Tech Mono'";
        ctx.textAlign = "center";
        ctx.fillText("SEARCHING_SUBJECT...", canvas.width/2, canvas.height/2);
        ctx.textAlign = "left"; // Reset
        return;
    }

    const box = faceData.detection.box;
    const landmarks = faceData.landmarks;
    const dataDisplay = lockedFaceData || faceData;

    // --- COORDINATE SYSTEM ---
    // The video is CSS flipped (scale-x-[-1]).
    // To align drawing with the visual video, we essentially need to draw in a mirror world.
    // We transform the context so X coordinates are flipped. 
    // This allows us to use the RAW faceAPI coordinates for shapes!
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // --- CYBERPUNK HUD DESIGN (Drawn in Mirrored Space) ---

    // 1. Face Bounding Box (Corners only)
    const color = '#00f3ff'; // Cyan Neon
    const pad = 20;

    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    // Use raw coordinates because the context is flipped
    const x = box.x;
    const y = box.y;
    const w = box.width;
    const h = box.height;

    // Top Left
    ctx.beginPath();
    ctx.moveTo(x - pad, y - pad + 20);
    ctx.lineTo(x - pad, y - pad);
    ctx.lineTo(x - pad + 20, y - pad);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(x + w + pad - 20, y - pad);
    ctx.lineTo(x + w + pad, y - pad);
    ctx.lineTo(x + w + pad, y - pad + 20);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(x - pad, y + h + pad - 20);
    ctx.lineTo(x - pad, y + h + pad);
    ctx.lineTo(x - pad + 20, y + h + pad);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(x + w + pad - 20, y + h + pad);
    ctx.lineTo(x + w + pad, y + h + pad);
    ctx.lineTo(x + w + pad, y + h + pad - 20);
    ctx.stroke();

    // 3. Landmarks - Digital Points
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; 
    faceData.landmarks.positions.forEach((pt: any, i: number) => {
        if (i % 4 === 0 || i > 30) { 
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 4. Eyes - Cyber Lines
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    ctx.strokeStyle = "rgba(255, 0, 85, 0.5)";
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(leftEye[0].x, leftEye[0].y);
    leftEye.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEye[0].x, rightEye[0].y);
    rightEye.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
    ctx.closePath();
    ctx.stroke();
    
    // 5. Scanning Vertical Line
    if (!lockedFaceData) {
        const time = Date.now() / 1000;
        const scanY = y + (Math.sin(time * 3) + 1) / 2 * h;
        
        ctx.beginPath();
        ctx.moveTo(x - pad, scanY);
        ctx.lineTo(x + w + pad, scanY);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Restore context to Normal Space for Text (so it's not backwards)
    ctx.restore();

    // --- TEXT DRAWING (Normal Space) ---
    // We need to manually calculate the position for text in Normal Space
    // mirrorX logic: visual X = width - raw X
    // The box right edge (in raw) is x + w. In visual mirror, that is the LEFT edge.
    // The box left edge (in raw) is x. In visual mirror, that is the RIGHT edge.
    
    const colorSec = '#ff0055'; 
    ctx.fillStyle = color;
    ctx.font = "12px 'Share Tech Mono'";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    
    // Position text to the visually RIGHT side of the box
    // In mirror world, Visual Right corresponds to raw X (the left edge of raw box)
    // Let's double check: 
    // Raw Box: |(x)......(x+w)|
    // Mirror:  |(mirrored x+w)......(mirrored x)|
    // We want text at (mirrored x) + padding
    
    const visualRightEdge = canvas.width - x;
    const visualTop = y;

    const scoreText = lockedFaceData ? "ID_LOCKED" : `ID_SIG: ${Math.floor(dataDisplay.detection.score * 100)}%`;
    
    ctx.fillText(scoreText, visualRightEdge + pad + 5, visualTop);
    ctx.fillStyle = colorSec;
    ctx.fillText(`EXPR: ${expression.toUpperCase()}`, visualRightEdge + pad + 5, visualTop + 15);

  }, [faceData, lockedFaceData, expression, videoRef]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
    />
  );
};

export default FaceOverlay;
# Identity Fragmentor — Real-Time AR Identity Generation Experiment Using FaceAPI and Gemini

## Project Overview
**Identity Fragmentor** is a web-based real-time Augmented Reality (AR) application. It leverages on-device **Computer Vision** for facial tracking and integrates the reasoning capabilities of **Google Gemini** to generate and render appearance-related “identity labels” in real time.

This project explores how to seamlessly combine the contextual understanding of generative AI with live video streams to create a low-latency, immersive interactive experience.

---

## Core Tech Stack

- **Frontend Framework:** React 19 + TypeScript + Tailwind CSS  
- **Computer Vision:** `face-api.js` (a lightweight, browser-based face detection model built on TensorFlow.js)  
- **Generative AI:** Google Gemini API (`gemini-2.5-flash`) for high-throughput, low-latency creative text generation  
- **Rendering:** HTML5 Canvas (facial overlays) + DOM Overlay (UI interactions)

---

## Technical Highlights & Implementation Details

### 1. Hybrid Architecture

**On-device processing:**  
- `face-api.js` runs locally in the browser at ~30fps, extracting facial landmarks, expressions, age, and gender.  
- Ensures real-time responsiveness and privacy-preserving computation.

**Cloud processing:**  
- Only when the user triggers a “scan,” structured facial feature data is sent to the Gemini API.  
- Gemini returns identity descriptions strictly conforming to a predefined JSON Schema.

---

### 2. Coordinate Mapping & Mirroring

To resolve the classic mirroring problem in Web-based AR:

- The video stream is flipped via `CSS: scaleX(-1)` to match mirror-like user perception.  
- On the Canvas overlay, matrix transformations (`ctx.scale(-1, 1)`) and custom coordinate mapping ensure that:
  - face bounding boxes  
  - floating tags  
follow the mirrored video stream accurately with pixel-level alignment.

---

### 3. Smooth Tracking Algorithm

To reduce UI jitter caused by per-frame redrawing:

- A combination of **CSS transitions** and **React state management** is used.  
- The primary identity tag adopts dynamic anchor-point positioning.  
- Micro-noise from detection is smoothed out using soft transitions, maintaining responsiveness without visual shaking.

---

### 4. Structured Prompt Engineering

A strict `responseSchema` is defined to force Gemini to output standardized JSON, including:

```json
{
  "primaryIdentity": "...",
  "alternatives": ["...", "...", "..."]
}

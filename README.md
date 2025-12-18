
# 🎄 Gesture-driven Particle Xmas Tree

An interactive 3D experience featuring a particle-based Christmas tree that reacts to your hand gestures using MediaPipe and React Three Fiber.

## ✨ Features

- **AI Hand Tracking**: Real-time gesture recognition (Open Hand, Fist, OK Sign).
- **Dynamic Particles**: 8,000 particles morphing between a tree and a cosmic cloud.
- **Themed Environments**: Switch between Warm, Ice, and Neon modes.
- **Multilingual Support**: Supports English and Simplified Chinese.
- **Responsive UI**: Works on both desktop and mobile browsers.

## 🖐️ Hand Gestures

- **✋ Open Hand**: Grow the tree from stardust.
- **✊ Fist**: Explode the tree into a cloud of particles.
- **👌 OK Sign**: Cycle through different lighting themes.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Permissions**:
   The app requires camera access for hand tracking. If access is denied, use the manual buttons in the control panel.

## 🛠️ Project Structure

- `/components`: 3D Scene and UI components.
- `/gesture`: MediaPipe integration and gesture logic.
- `App.tsx`: Main application state and orchestration.
- `types.ts` & `constants.ts`: Shared configuration and theme data.

## 📝 Notes
- Ensure you are running on `localhost` or `HTTPS` for camera access.
- For best performance, use a browser that supports WebGL 2.0.

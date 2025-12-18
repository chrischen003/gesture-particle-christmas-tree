
// 注意：由于环境限制，我们继续使用 CDN 加载以确保稳定性
const HANDS_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const CAMERA_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

let camera: any = null;
let hands: any = null;
let reconnectTimeout: any = null;

export const startHandTracking = async (
  videoElement: HTMLVideoElement,
  onResults: (results: any) => void,
  onError: (err: any) => void
) => {
  const loadScript = (src: string) => new Promise((res) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    document.head.appendChild(s);
  });

  let lastFrameTime = 0;
  const targetFPS = 20;
  const frameInterval = 1000 / targetFPS;

  const init = async () => {
    try {
      if (!(window as any).Hands) await loadScript(HANDS_JS);
      if (!(window as any).Camera) await loadScript(CAMERA_JS);

      // @ts-ignore
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7, // Milestone requirement
        minTrackingConfidence: 0.5  // Milestone requirement
      });

      hands.onResults(onResults);

      // @ts-ignore
      camera = new window.Camera(videoElement, {
        onFrame: async () => {
          const now = performance.now();
          if (now - lastFrameTime >= frameInterval) {
            lastFrameTime = now;
            try {
              await hands.send({ image: videoElement });
            } catch (e) {
              console.warn("Hand processing dropped a frame");
            }
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      return true;
    } catch (err) {
      console.error('Hand tracker initialization failed', err);
      onError(err);
      
      // Attempt reconnection once after 3 seconds if it fails initially
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          console.log("Attempting camera reconnection...");
          init();
        }, 3000);
      }
      return false;
    }
  };

  return await init();
};

export const stopHandTracking = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (camera) {
    try { camera.stop(); } catch (e) {}
    camera = null;
  }
  if (hands) {
    try { hands.close(); } catch (e) {}
    hands = null;
  }
};

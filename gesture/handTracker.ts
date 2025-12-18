
// 注意：由于环境限制，我们继续使用 CDN 加载以确保稳定性
const HANDS_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const CAMERA_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

let camera: any = null;
let hands: any = null;

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
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onResults);

    // @ts-ignore
    camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    await camera.start();
    return true;
  } catch (err) {
    console.error('Hand tracker initialization failed', err);
    onError(err);
    return false;
  }
};

export const stopHandTracking = () => {
  if (camera) camera.stop();
  if (hands) hands.close();
};

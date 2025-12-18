
export enum GestureType {
  OPEN_HAND = 'OPEN_HAND',
  FIST = 'FIST',
  OK_SIGN = 'OK_SIGN',
  NONE = 'NONE'
}

export interface GestureResult {
  type: GestureType;
  confidence: number;
}

/**
 * Utility to calculate Euclidean distance between two 3D points
 */
const getDist = (p1: any, p2: any) => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
};

/**
 * Optimized gesture detection with strict finger state and confidence scoring
 */
export const detectGesture = (landmarks: any[]): GestureResult => {
  if (!landmarks || landmarks.length === 0) return { type: GestureType.NONE, confidence: 0 };

  // Landmarks indices:
  // Thumb: 4(tip), 3(ip), 2(mcp)
  // Index: 8(tip), 7(pip), 6(dip), 5(mcp)
  // Middle: 12, 11, 10, 9
  // Ring: 16, 15, 14, 13
  // Pinky: 20, 19, 18, 17

  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [7, 11, 15, 19];
  const fingerMcps = [5, 9, 13, 17];

  const isFingerExtended = (idx: number) => {
    // A finger is extended if the tip is higher (lower Y) than the PIP and the PIP is higher than the MCP
    return landmarks[fingerTips[idx]].y < landmarks[fingerPips[idx]].y && 
           landmarks[fingerPips[idx]].y < landmarks[fingerMcps[idx]].y;
  };

  const isFingerFolded = (idx: number) => {
    // A finger is folded if the tip is lower (higher Y) than the PIP or very close to the MCP
    const tip = landmarks[fingerTips[idx]];
    const mcp = landmarks[fingerMcps[idx]];
    return tip.y > landmarks[fingerPips[idx]].y || getDist(tip, mcp) < 0.1;
  };

  const extendedStates = [0, 1, 2, 3].map(i => isFingerExtended(i));
  const foldedStates = [0, 1, 2, 3].map(i => isFingerFolded(i));

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const thumbIp = landmarks[3];
  const palmCenter = landmarks[9]; // Middle MCP as proxy for palm center

  // 1. OK SIGN DETECTION
  // - Thumb tip and Index tip meet in a circle
  // - Middle, Ring, Pinky are extended
  const okDist = getDist(thumbTip, indexTip);
  const otherThreeExtended = extendedStates[1] && extendedStates[2] && extendedStates[3];
  if (okDist < 0.05 && otherThreeExtended) {
    const confidence = Math.max(0, 1 - (okDist / 0.07));
    return { type: GestureType.OK_SIGN, confidence };
  }

  // 2. OPEN HAND DETECTION
  // - All four main fingers extended
  // - Fingers spread (distance between index and pinky tips)
  // - Thumb also relatively far from index
  const allFourExtended = extendedStates.every(s => s === true);
  if (allFourExtended) {
    const spread = getDist(landmarks[8], landmarks[20]);
    const thumbSpread = getDist(thumbTip, indexTip);
    if (spread > 0.18 && thumbSpread > 0.08) {
      const confidence = Math.min(1, (spread + thumbSpread) * 3);
      return { type: GestureType.OPEN_HAND, confidence };
    }
  }

  // 3. FIST DETECTION
  // - All fingers folded
  // - Tips are close to palm center
  const allFourFolded = foldedStates.every(s => s === true);
  if (allFourFolded) {
    const thumbFolded = thumbTip.y > thumbIp.y || getDist(thumbTip, palmCenter) < 0.15;
    if (thumbFolded) {
      const avgDistToPalm = (
        getDist(landmarks[8], palmCenter) + 
        getDist(landmarks[12], palmCenter) + 
        getDist(landmarks[16], palmCenter) + 
        getDist(landmarks[20], palmCenter)
      ) / 4;
      const confidence = Math.max(0, 1 - (avgDistToPalm / 0.2));
      return { type: GestureType.FIST, confidence };
    }
  }

  return { type: GestureType.NONE, confidence: 0 };
};


export enum GestureType {
  OPEN_HAND = 'OPEN_HAND',
  FIST = 'FIST',
  OK_SIGN = 'OK_SIGN',
  NONE = 'NONE'
}

/**
 * Detects common gestures based on MediaPipe hand landmarks.
 * Landmarks: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
export const detectGesture = (landmarks: any[]): GestureType => {
  if (!landmarks || landmarks.length === 0) return GestureType.NONE;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  // 1. OK Gesture Detection (Distance between thumb and index tips)
  const okDist = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) + 
    Math.pow(thumbTip.y - indexTip.y, 2)
  );
  
  // Also check if other fingers are extended to differentiate from a Fist or pinch
  const middleExtended = middleTip.y < middleMcp.y - 0.05;
  const ringExtended = ringTip.y < ringMcp.y - 0.05;
  
  if (okDist < 0.05 && middleExtended && ringExtended) {
    return GestureType.OK_SIGN;
  }

  // 2. Count Extended Fingers (excluding thumb for simplicity)
  // Fingers are considered extended if the tip is above the MCP joint in image space (y is smaller)
  const fingers = [
    indexTip.y < indexMcp.y - 0.04,
    middleTip.y < middleMcp.y - 0.04,
    ringTip.y < ringMcp.y - 0.04,
    pinkyTip.y < pinkyMcp.y - 0.04
  ];
  
  const extendedCount = fingers.filter(Boolean).length;

  if (extendedCount >= 3) {
    return GestureType.OPEN_HAND;
  }
  
  if (extendedCount === 0) {
    // Check thumb tip vs index MCP to confirm tight fist
    const thumbClose = Math.abs(thumbTip.x - indexMcp.x) < 0.1;
    if (thumbClose) return GestureType.FIST;
  }

  return GestureType.NONE;
};

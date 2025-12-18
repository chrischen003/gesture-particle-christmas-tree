
import React from 'react';

interface GestureOverlayProps {
  gesture: string;
}

const GestureOverlay: React.FC<GestureOverlayProps> = ({ gesture }) => {
  if (gesture === 'None') return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="text-8xl animate-ping opacity-20 text-white font-black">
        {gesture === 'OK' ? '👌' : gesture === 'Open' ? '✋' : '✊'}
      </div>
    </div>
  );
};

export default GestureOverlay;

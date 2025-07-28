import React from 'react';
import PrettyProgressbar from 'pretty-progressbar';

export default function BackgroundProgress({ progress }) {
  const barStyle = {
    position: 'absolute',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    background: 'transparent',
  };
  const progressStyle = {
    background: 'rgba(59, 130, 246, 0.2)',
    transition: 'transform 0.3s linear',
    backgroundSize: '200% 200%',
    animation: 'gradient-wave 6s ease-in-out infinite',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
  };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <PrettyProgressbar
        percentage={progress}
        label={false}
        type="square"
        progressbarStyle={barStyle}
        progressStyle={progressStyle}
      />
    </div>
  );
}

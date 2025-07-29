import React from 'react';
import PrettyProgressbar from 'pretty-progressbar';

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function mixColor(a, c, amount) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(c);
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function BackgroundProgress({ progress }) {
  const ratio = Math.max(0, Math.min(1, progress / 100));
  const start1 = '#f97316'; // orange
  const start2 = '#fde047'; // yellow
  const end1 = '#3b82f6'; // blue
  const end2 = '#9333ea'; // purple
  const color1 = mixColor(start1, end1, ratio);
  const color2 = mixColor(start2, end2, ratio);
  const barStyle = {
    position: 'absolute',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    background: 'transparent',
  };
  const progressStyle = {
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    transition: 'transform 0.3s linear',
    backgroundSize: '200% 200%',
    animation: 'aceternity-gradient 6s ease-in-out infinite',
    boxShadow: `0 0 20px ${color1}`,
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

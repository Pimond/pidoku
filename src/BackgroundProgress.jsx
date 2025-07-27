import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react-progressbar-fancy';

export default function BackgroundProgress({ progress }) {
  const [barWidth, setBarWidth] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    function update() {
      setBarWidth(window.innerHeight);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="fullscreen-progress" aria-hidden="true">
      <ProgressBar score={progress} hideText progressWidth={barWidth} />
    </div>
  );
}

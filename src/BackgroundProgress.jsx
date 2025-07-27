import React from 'react';
import { ProgressBar } from 'react-progressbar-fancy';

export default function BackgroundProgress({ progress }) {
  return (
    <div className="fullscreen-progress" aria-hidden="true">
      <ProgressBar
        score={progress}
        hideText
        progressWidth="100vh"
      />
    </div>
  );
}

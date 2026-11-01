import React from 'react';
import { AppearanceSettings } from '../../types/appearance';

interface CustomBackdropProps {
  settings: AppearanceSettings;
}

export const CustomBackdrop: React.FC<CustomBackdropProps> = ({ settings }) => {
  if (!settings.bgImage) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: `url(${settings.bgImage})`,
        backgroundSize: settings.bgImageFit === 'repeat' ? 'auto' : settings.bgImageFit,
        backgroundRepeat: settings.bgImageFit === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        opacity: settings.bgImageOpacity,
        filter: settings.bgImageBlur > 0 ? `blur(${settings.bgImageBlur}px)` : 'none',
        transform: settings.bgImageBlur > 0 ? 'scale(1.04)' : 'none', // prevent edge clipping with blur
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    />
  );
};

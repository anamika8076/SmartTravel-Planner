import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { gradientFor, photoFor, sized } from '../../utils/visuals';

/**
 * Destination photo that fills its (relative) parent. A colour gradient sits
 * underneath, so a slow or failed image still looks intentional.
 */
export default function Photo({ name, extra, src, width = 800, height, className = '', imgClassName = '', overlay = true, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const base = src || photoFor(name, extra);
  const url = base ? sized(base, width, height) : null;

  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${gradientFor(name)} ${className}`} aria-hidden="true">
      {/* No photo of this place: plain colour with a soft pattern, never an unrelated picture. */}
      {!url && (
        <>
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
          <MapPin className="absolute -right-6 -bottom-8 w-48 h-48 text-white/10" strokeWidth={1} />
        </>
      )}
      {url && !failed && (
        <img
          src={url}
          srcSet={`${url} 1x, ${sized(base, width * 2, height ? height * 2 : undefined)} 2x`}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />}
    </div>
  );
}

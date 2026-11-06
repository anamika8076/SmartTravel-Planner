import React, { useState } from 'react';
import { gradientFor, photoFor, sized } from '../../utils/visuals';

/**
 * Destination photo that fills its (relative) parent. A colour gradient sits
 * underneath, so a slow or failed image still looks intentional.
 */
export default function Photo({ name, extra, src, width = 800, height, className = '', imgClassName = '', overlay = true, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = sized(src || photoFor(name, extra), width, height);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${gradientFor(name)} ${className}`} aria-hidden="true">
      {!failed && (
        <img
          src={url}
          srcSet={`${url} 1x, ${sized(src || photoFor(name, extra), width * 2, height ? height * 2 : undefined)} 2x`}
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

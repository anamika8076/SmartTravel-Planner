import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { gradientFor, photoFor, sized } from '../../utils/visuals';
import { findCityPhoto } from '../../utils/cityPhotos';

/**
 * Photo that fills its (relative) parent.
 * - `src`: a fixed photo (page banners).
 * - `name` (+ optional `state`): a real photo of that city from its Wikipedia
 *   article; falls back to a curated regional photo, then to a plain colour.
 * Never shows an unrelated picture.
 */
export default function Photo({ name, state, src, width = 800, height, className = '', imgClassName = '', overlay = true, eager = false }) {
  const [cityUrl, setCityUrl] = useState(undefined); // undefined = still looking
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || !name) return undefined;
    let alive = true;
    setCityUrl(undefined);
    setLoaded(false);
    setFailed(false);
    findCityPhoto(name, state, Math.min(width * 2, 1600)).then((url) => alive && setCityUrl(url));
    return () => {
      alive = false;
    };
  }, [src, name, state, width]);

  let url = null;
  let srcSet;
  if (src) {
    url = sized(src, width, height);
    srcSet = `${url} 1x, ${sized(src, width * 2, height ? height * 2 : undefined)} 2x`;
  } else if (cityUrl) {
    url = cityUrl;
  } else if (cityUrl === null) {
    const regional = photoFor(name, state);
    if (regional) url = sized(regional, width, height);
  }

  const showPlain = !url || failed;

  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${gradientFor(name)} ${className}`} aria-hidden="true">
      {showPlain && cityUrl !== undefined && (
        <>
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
          <MapPin className="absolute -right-6 -bottom-8 w-48 h-48 text-white/10" strokeWidth={1} />
        </>
      )}
      {url && !failed && (
        <img
          key={url}
          src={url}
          srcSet={srcSet}
          alt=""
          referrerPolicy="no-referrer"
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

import React, { useState, useEffect } from 'react';

export default function SecureImage({ src, fallback = "/patient/default/photo", ...props }) {
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If src is a data URL or blob URL, just use it directly
    if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
      setImgSrc(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let objectUrl = null;

    const loadImage = async (urlToLoad) => {
      if (!urlToLoad) return false;
      try {
        const res = await fetch(urlToLoad);
        if (!res.ok) throw new Error("Fetch failed");
        const blob = await res.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
          setLoading(false);
          return true;
        }
      } catch (err) {
        return false;
      }
      return false;
    };

    const attemptLoad = async () => {
      setLoading(true);
      const success = await loadImage(src);
      if (!success && isMounted) {
        // Try to load the fallback if the main src fails
        const fallbackSuccess = await loadImage(fallback);
        if (!fallbackSuccess && isMounted) {
            setLoading(false);
        }
      }
    };

    attemptLoad();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, fallback]);

  if (loading && !imgSrc) {
    return <div className={`animate-pulse bg-slate-200 ${props.className || ''}`} style={props.style}></div>;
  }

  return (
    <img 
      src={imgSrc} 
      {...props} 
      onError={(e) => { 
        if (imgSrc !== fallback) {
            e.target.style.display = 'none';
        }
      }} 
    />
  );
}

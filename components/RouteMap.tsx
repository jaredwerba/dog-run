'use client';

import { useEffect, useRef } from 'react';

export interface RouteMeetup {
  position: [number, number];
  name: string;
  note: string;
}

/*
 * Reusable Leaflet route map — real OSM tiles, a traced path, and pinned
 * meetup spots. Generalized from the original Castle Island map so every
 * route page (Castle Island, Charles River, Boston Common, Jamaica Pond)
 * shares one implementation.
 */
export default function RouteMap({
  path,
  meetups,
  color = '#0071e3',
  className = '',
}: {
  path: [number, number][];
  meetups: RouteMeetup[];
  color?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;

      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.dataset.leaflet = 'true';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: true,
        attributionControl: false,
      });

      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      const polyline = L.polyline(path, {
        color,
        weight: 4,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

      const dotIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      meetups.forEach((m) => {
        L.marker(m.position, { icon: dotIcon })
          .addTo(map)
          .bindPopup(`<b>${m.name}</b><br/>${m.note}`);
      });

      L.control
        .attribution({ prefix: false })
        .addAttribution('© OpenStreetMap, CARTO')
        .addTo(map);
    }

    init();

    return () => {
      cancelled = true;
      const m = mapRef.current as { remove?: () => void } | null;
      m?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-moss/20 ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}

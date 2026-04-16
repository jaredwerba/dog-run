'use client';

import { useEffect, useRef } from 'react';

// Castle Island HarborWalk loop — real coordinates from OpenStreetMap.
// Traces the paved path around the Castle Island/Fort Independence perimeter (~0.8 mi).
const CASTLE_ISLAND_LOOP: [number, number][] = [
  [42.33504, -71.01232], [42.33512, -71.01225], [42.33522, -71.01217],
  [42.33535, -71.01207], [42.33547, -71.01198], [42.33576, -71.01181],
  [42.33584, -71.01177], [42.33590, -71.01172], [42.33597, -71.01166],
  [42.33605, -71.01157], [42.33612, -71.01148], [42.33629, -71.01118],
  [42.33635, -71.01106], [42.33671, -71.01024], [42.33676, -71.01013],
  [42.33675, -71.01007], [42.33675, -71.01001], [42.33674, -71.00995],
  [42.33675, -71.00988], [42.33677, -71.00980], [42.33680, -71.00971],
  [42.33683, -71.00965], [42.33685, -71.00962], [42.33690, -71.00957],
  [42.33694, -71.00955], [42.33698, -71.00953], [42.33702, -71.00952],
  [42.33707, -71.00951], [42.33712, -71.00950], [42.33715, -71.00950],
  [42.33717, -71.00950], [42.33721, -71.00950], [42.33724, -71.00949],
  [42.33727, -71.00950], [42.33731, -71.00950], [42.33734, -71.00950],
  [42.33735, -71.00951], [42.33767, -71.00957], [42.33806, -71.00967],
  [42.33824, -71.00971], [42.33829, -71.00972], [42.33836, -71.00973],
  [42.33844, -71.00974], [42.33847, -71.00974], [42.33849, -71.00975],
  [42.33853, -71.00977], [42.33898, -71.01007], [42.33904, -71.01012],
  [42.33910, -71.01017], [42.33914, -71.01023], [42.33917, -71.01029],
  [42.33918, -71.01037], [42.33919, -71.01047], [42.33921, -71.01106],
  [42.33922, -71.01111], [42.33921, -71.01116], [42.33920, -71.01132],
  [42.33919, -71.01141], [42.33917, -71.01150], [42.33915, -71.01166],
  [42.33901, -71.01244], [42.33898, -71.01254], [42.33896, -71.01263],
  [42.33872, -71.01328], [42.33870, -71.01327], [42.33859, -71.01321],
  [42.33828, -71.01304], [42.33827, -71.01304], [42.33778, -71.01277],
  [42.33775, -71.01275], [42.33772, -71.01270], [42.33766, -71.01263],
  [42.33757, -71.01252], [42.33750, -71.01243], [42.33735, -71.01226],
  [42.33726, -71.01215], [42.33720, -71.01208], [42.33717, -71.01205],
  [42.33713, -71.01203], [42.33700, -71.01197], [42.33691, -71.01193],
  [42.33685, -71.01190], [42.33668, -71.01188], [42.33655, -71.01187],
  [42.33646, -71.01187], [42.33639, -71.01188], [42.33625, -71.01192],
  [42.33612, -71.01198], [42.33584, -71.01211], [42.33557, -71.01226],
  [42.33552, -71.01228], [42.33547, -71.01230], [42.33543, -71.01232],
  [42.33539, -71.01232], [42.33531, -71.01234], [42.33520, -71.01234],
  [42.33504, -71.01232], // close loop
];

export default function CastleIslandMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;

      // Inject Leaflet CSS once
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

      // Apple-Maps-ish tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // The actual loop
      const polyline = L.polyline(CASTLE_ISLAND_LOOP, {
        color: '#0071e3',
        weight: 4,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      // Fit map to the polyline bounds with padding
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

      // Start/end marker
      const startIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#0071e3;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(CASTLE_ISLAND_LOOP[0], { icon: startIcon })
        .addTo(map)
        .bindPopup('<b>Castle Island</b><br/>Meeting point');

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
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-light-gray"
      style={{ zIndex: 0 }}
    />
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 90;

function Motes({ animate }: { animate: boolean }) {
  const points = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4; // z
      seeds[i * 2] = Math.random() * Math.PI * 2; // sway phase
      seeds[i * 2 + 1] = 0.15 + Math.random() * 0.35; // rise speed
    }
    return { positions, seeds };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!points.current || !animate) return;
    const pos = points.current.geometry.attributes.position;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + seeds[i * 2 + 1] * delta;
      if (y > 4.2) y = -4.2;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.6 + seeds[i * 2]) * delta * 0.18);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#e3a63c"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* Sunlit pollen drifting through the hero — pure atmosphere */
export default function PollenField({ className = '' }: { className?: string }) {
  const animate =
    typeof window === 'undefined' ||
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false }}
        style={{ background: 'transparent' }}
      >
        <Motes animate={animate} />
      </Canvas>
    </div>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* Classic tennis-ball seam: a closed curve on the sphere surface */
class SeamCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number): THREE.Vector3 {
    const th = t * Math.PI * 2;
    const a = 0.72;
    const b = 0.28;
    const c = 0.65;
    const p = new THREE.Vector3(
      a * Math.cos(th) + b * Math.cos(3 * th),
      a * Math.sin(th) - b * Math.sin(3 * th),
      c * Math.sin(2 * th)
    );
    return p.normalize().multiplyScalar(1.02);
  }
}

function Ball({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);

  const seamGeometry = useMemo(
    () => new THREE.TubeGeometry(new SeamCurve(), 220, 0.035, 10, true),
    []
  );

  useFrame(({ clock }, delta) => {
    if (!group.current || !animate) return;
    group.current.rotation.y += delta * 0.45;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.18;
    group.current.position.y = Math.sin(clock.elapsedTime * 1.1) * 0.09;
  });

  return (
    <group ref={group} rotation={[0.4, 0, 0.2]}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#c9d15f" roughness={0.92} />
      </mesh>
      <mesh geometry={seamGeometry}>
        <meshStandardMaterial color="#fbf6ea" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function TennisBall3D({ className = '' }: { className?: string }) {
  const animate =
    typeof window === 'undefined' ||
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.85} color="#fdf3da" />
        <directionalLight position={[3, 4, 5]} intensity={1.6} color="#e3a63c" />
        <directionalLight position={[-4, -2, 2]} intensity={0.4} color="#567c52" />
        <Ball animate={animate} />
      </Canvas>
    </div>
  );
}

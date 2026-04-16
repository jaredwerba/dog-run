'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface LiquidGlassConfig {
  blurAmount?: number;
  refraction?: number;
  chromAberration?: number;
  edgeHighlight?: number;
  specular?: number;
  fresnel?: number;
  distortion?: number;
  cornerRadius?: number;
  zRadius?: number;
  opacity?: number;
  saturation?: number;
  tintStrength?: number;
  brightness?: number;
  shadowOpacity?: number;
  shadowSpread?: number;
  shadowOffsetY?: number;
  floating?: boolean;
  button?: boolean;
}

interface Props {
  children: ReactNode;
  className?: string;
  defaults?: LiquidGlassConfig;
}

export default function LiquidGlassWrapper({ children, className = '', defaults }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!rootRef.current) return;

      const { LiquidGlass } = await import('@ybouane/liquidglass');

      if (cancelled || !rootRef.current) return;

      const glassElements = rootRef.current.querySelectorAll<HTMLElement>('[data-glass]');
      if (glassElements.length === 0) return;

      try {
        const instance = await LiquidGlass.init({
          root: rootRef.current,
          glassElements,
          defaults: defaults ?? {
            cornerRadius: 24,
            refraction: 0.015,
            blurAmount: 0.2,
            chromAberration: 0.01,
            edgeHighlight: 0.03,
            specular: 0.1,
            fresnel: 0.6,
            shadowOpacity: 0.15,
            shadowSpread: 8,
            tintStrength: 0.05,
            zRadius: 20,
          },
        });

        if (cancelled) {
          instance.destroy();
        } else {
          instanceRef.current = instance;
        }
      } catch {
        // WebGL not available or other init error — fail silently, content still renders
      }
    }

    setup();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [defaults]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}

export function GlassPanel({
  children,
  className = '',
  config,
  ...props
}: {
  children: ReactNode;
  className?: string;
  config?: LiquidGlassConfig;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-glass
      data-config={config ? JSON.stringify(config) : undefined}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

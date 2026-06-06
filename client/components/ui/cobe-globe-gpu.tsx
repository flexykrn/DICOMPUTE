"use client";

import * as React from "react";
import createGlobe from "cobe";

type GPUProviderNode = {
  id: string;
  location: [number, number];
  region: string;
  jobs: number;
};

const GPU_PROVIDER_NODES: GPUProviderNode[] = [
  { id: "gpu-us-east", location: [38.95, -77.45], region: "US-EAST", jobs: 12 },
  { id: "gpu-us-west", location: [37.62, -122.38], region: "US-WEST", jobs: 8 },
  { id: "gpu-eu", location: [49.01, 2.55], region: "EU-PARIS", jobs: 16 },
  { id: "gpu-japan", location: [35.55, 139.78], region: "JP-TOKYO", jobs: 10 },
  { id: "gpu-aus", location: [-33.95, 151.18], region: "AU-SYD", jobs: 6 },
  { id: "gpu-brazil", location: [-23.43, -46.47], region: "BR-SAO", jobs: 14 },
  { id: "gpu-sg", location: [1.36, 103.99], region: "SG", jobs: 9 },
  { id: "gpu-india", location: [19.09, 72.87], region: "IN-MUM", jobs: 11 },
];

type GlobeGpuProps = {
  className?: string;
  isDark?: boolean;
};

const MARKER_HIT_RADIUS = 16;

function locationToVector(location: [number, number]) {
  const latitude = (location[0] * Math.PI) / 180;
  const longitude = (location[1] * Math.PI) / 180 - Math.PI;
  const cosineLatitude = Math.cos(latitude);

  return [-cosineLatitude * Math.cos(longitude), Math.sin(latitude), cosineLatitude * Math.sin(longitude)] as const;
}

function projectVector(
  vector: readonly [number, number, number],
  width: number,
  height: number,
  phi: number,
  theta: number,
) {
  const cosineTheta = Math.cos(theta);
  const cosinePhi = Math.cos(phi);
  const sineTheta = Math.sin(theta);
  const sinePhi = Math.sin(phi);

  const projectedX = cosinePhi * vector[0] + sinePhi * vector[2];
  const projectedY = sinePhi * sineTheta * vector[0] + cosineTheta * vector[1] - cosinePhi * sineTheta * vector[2];
  const visible = -sinePhi * cosineTheta * vector[0] + sineTheta * vector[1] + cosinePhi * cosineTheta * vector[2] >= 0 || projectedX * projectedX + projectedY * projectedY >= 0.64;

  return {
    x: ((projectedX / (width / height)) + 1) / 2,
    y: ((-projectedY) + 1) / 2,
    visible,
  };
}

export function GlobeGpu({ className, isDark = false }: GlobeGpuProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [activeMarker, setActiveMarker] = React.useState<string | null>(null);
  const phiRef = React.useRef(0);
  const thetaRef = React.useRef(0.25);

  React.useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateSize = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let phi = 0;
    phiRef.current = phi;
    thetaRef.current = 0.25;

    const globe = createGlobe(canvas, {
      width: dimensions.width * pixelRatio,
      height: dimensions.height * pixelRatio,
      devicePixelRatio: pixelRatio,
      dark: isDark ? 1 : 0,
      phi: 0,
      theta: 0.25,
      diffuse: 1.5,
      mapSamples: 16000,
      mapBrightness: isDark ? 6 : 2.6,
      baseColor: isDark ? [0.1, 0.1, 0.1] : [0.96, 0.95, 0.94],
      markerColor: [0.96, 0.8, 0],
      glowColor: isDark ? [0.15, 0.15, 0.15] : [0.96, 0.95, 0.94],
      arcColor: isDark ? [0.8, 0.8, 0.8] : [0.1, 0.1, 0.1],
      opacity: 1,
      scale: 1,
      markerElevation: 0.12,
      markers: GPU_PROVIDER_NODES.map(({ id, location }) => ({
        id,
        location,
        size: 0.09,
        color: [0.96, 0.8, 0],
      })),
    });

    let animationFrame = window.requestAnimationFrame(function render() {
      phi += 0.004;
      phiRef.current = phi;
      globe.update({
        width: dimensions.width * pixelRatio,
        height: dimensions.height * pixelRatio,
        phi,
        theta: 0.25,
      });
      animationFrame = window.requestAnimationFrame(render);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      globe.destroy();
    };
  }, [dimensions.height, dimensions.width, isDark]);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      const clickX = event.clientX - canvasRect.left;
      const clickY = event.clientY - canvasRect.top;
      const currentPhi = phiRef.current;
      const currentTheta = thetaRef.current;

      let nextActiveMarker: string | null = null;

      for (const node of GPU_PROVIDER_NODES) {
        const projected = projectVector(
          locationToVector(node.location),
          canvasRect.width,
          canvasRect.height,
          currentPhi,
          currentTheta,
        );

        if (!projected.visible) {
          continue;
        }

        const markerX = projected.x * canvasRect.width;
        const markerY = projected.y * canvasRect.height;

        if (Math.hypot(clickX - markerX, clickY - markerY) <= MARKER_HIT_RADIUS) {
          nextActiveMarker = activeMarker === node.id ? null : node.id;
          break;
        }
      }

      setActiveMarker(nextActiveMarker);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeMarker]);

  const activeNode = activeMarker
    ? GPU_PROVIDER_NODES.find((node) => node.id === activeMarker) ?? null
    : null;

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ""}`.trim()}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {activeNode ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            positionAnchor: `--cobe-${activeNode.id}`,
            left: "anchor(center)",
            bottom: "anchor(top)",
            transform: "translate(-50%, -12px)",
          }}
        >
          <div className="relative bg-[var(--bg-card)] px-[12px] py-[8px] font-mono text-[var(--accent)]">
            <div className="text-xs uppercase tracking-[0.2em]">{activeNode.region}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em]">{activeNode.jobs} jobs</div>
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--bg-card)]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
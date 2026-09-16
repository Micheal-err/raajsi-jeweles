import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ambient Three.js particle field — slow drifting dots + connective lines
 * in a warm ink tone. Sits absolutely inside a `relative` parent.
 */
export function ParticleField({
  className = "",
  color = "#111111",
  accent = "#e40700",
  density = 140,
}: {
  className?: string;
  color?: string;
  accent?: string;
  density?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 200);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const isMobile = width < 768;
    const actualDensity = isMobile ? Math.min(density, 60) : density;

    // Particles
    const positions = new Float32Array(actualDensity * 3);
    const colors = new Float32Array(actualDensity * 3);
    const cInk = new THREE.Color(color);
    const cAcc = new THREE.Color(accent);
    for (let i = 0; i < actualDensity; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const mix = Math.random() < 0.08 ? cAcc : cInk;
      colors[i * 3 + 0] = mix.r;
      colors[i * 3 + 1] = mix.g;
      colors[i * 3 + 2] = mix.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Connective lines (subtle)
    const lineGeo = new THREE.BufferGeometry();
    const maxLinks = actualDensity * 3;
    const linkPositions = new Float32Array(maxLinks * 6);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.06,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    mount.addEventListener("mousemove", onMove);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) * 0.0002;
      points.rotation.y = t * 0.6 + mouse.x * 0.15;
      points.rotation.x = t * 0.3 + mouse.y * 0.1;

      // rebuild links for near neighbours (cheap, capped)
      const pos = geo.attributes.position.array as Float32Array;
      let li = 0;
      const threshold = 9;
      const cap = maxLinks * 6;
      for (let i = 0; i < actualDensity && li < cap; i++) {
        for (let j = i + 1; j < actualDensity && li < cap; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < threshold * threshold) {
            linkPositions[li++] = pos[i * 3];
            linkPositions[li++] = pos[i * 3 + 1];
            linkPositions[li++] = pos[i * 3 + 2];
            linkPositions[li++] = pos[j * 3];
            linkPositions[li++] = pos[j * 3 + 1];
            linkPositions[li++] = pos[j * 3 + 2];
          }
        }
      }
      for (let k = li; k < cap; k++) linkPositions[k] = 0;
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, li / 3);

      renderer.render(scene, camera);
      if (!prefersReduced) raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mousemove", onMove);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [color, accent, density]);

  return <div ref={mountRef} className={className} aria-hidden />;
}

export default ParticleField;

import { useEffect, useRef } from 'react';

/**
 * Full-screen animated 3D background: a wave of glowing particles (like an energy grid)
 * with slow camera parallax that follows the mouse. Three.js is loaded lazily so it does
 * not slow down the first paint. Respects "reduce motion" (renders one still frame).
 */
export default function Background3D({ dim = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed || !mount) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050a14, 0.045);
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 3.2, 10);

      // --- particle wave grid
      const COLS = 140;
      const ROWS = 70;
      const SPACING = 0.32;
      const count = COLS * ROWS;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const base = new Float32Array(count * 2);
      const cA = new THREE.Color('#10b981'); // emerald
      const cB = new THREE.Color('#22d3ee'); // cyan
      const tmp = new THREE.Color();
      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          const k = i * ROWS + j;
          const x = (i - COLS / 2) * SPACING;
          const z = (j - ROWS / 2) * SPACING - 4;
          base[k * 2] = x;
          base[k * 2 + 1] = z;
          positions[k * 3] = x;
          positions[k * 3 + 2] = z;
          tmp.copy(cA).lerp(cB, i / COLS);
          colors[k * 3] = tmp.r;
          colors[k * 3 + 1] = tmp.g;
          colors[k * 3 + 2] = tmp.b;
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // soft round sprite
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 64;
      const ctx = sprite.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(sprite);

      const material = new THREE.PointsMaterial({
        size: 0.09,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // --- a few floating "charge" rings for depth
      const rings = [];
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
      [[-6, 3.5, -6, 1.6], [7, 4.5, -9, 2.4], [2, 6, -14, 3.2]].forEach(([x, y, z, r]) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 96), ringMat);
        ring.position.set(x, y, z);
        ring.rotation.x = Math.PI / 2.6;
        scene.add(ring);
        rings.push(ring);
      });

      // --- interaction
      const mouse = { x: 0, y: 0 };
      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('resize', onResize);

      const clock = new THREE.Clock();
      let frame = 0;
      const update = (t) => {
        const pos = geometry.attributes.position.array;
        for (let k = 0; k < count; k++) {
          const x = base[k * 2];
          const z = base[k * 2 + 1];
          pos[k * 3 + 1] =
            Math.sin(x * 0.45 + t * 0.9) * 0.45 +
            Math.cos(z * 0.6 + t * 0.7) * 0.35 +
            Math.sin((x + z) * 0.25 + t * 0.5) * 0.25;
        }
        geometry.attributes.position.needsUpdate = true;
        rings.forEach((r, i) => { r.rotation.z = t * (0.08 + i * 0.03); });
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
        camera.position.y += (3.2 - mouse.y * 0.6 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, -4);
        renderer.render(scene, camera);
      };

      if (reduceMotion) {
        update(0);
      } else {
        const loop = () => {
          update(clock.getElapsedTime());
          frame = requestAnimationFrame(loop);
        };
        loop();
      }

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('resize', onResize);
        geometry.dispose();
        material.dispose();
        texture.dispose();
        ringMat.dispose();
        rings.forEach((r) => r.geometry.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => { /* WebGL/three unavailable: the CSS gradient below still shows */ });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      {/* colour glows */}
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-brand-500/20 blur-[120px]" />
      <div className="absolute -right-40 top-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-sky-600/10 blur-[120px]" />
      {/* 3D canvas */}
      <div ref={mountRef} className="absolute inset-0" />
      {/* vignette + optional dim for content-heavy pages */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,10,20,.55)_70%,rgba(5,10,20,.9)_100%)]" />
      <div className={`absolute inset-0 bg-ink-950 transition-opacity duration-700 ${dim ? 'opacity-60' : 'opacity-0'}`} />
    </div>
  );
}

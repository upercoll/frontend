import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export default function FloatingCrate({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(1.6, 1.4, 2.6);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(3, 4, 2);
    scene.add(key);
    const rim = new THREE.PointLight(0x6366f1, 8, 8);
    rim.position.set(-2, 1, -1);
    scene.add(rim);

    const group = new THREE.Group();
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.9, 1),
      new THREE.MeshStandardMaterial({ color: 0x312e80, roughness: 0.35, metalness: 0.2 })
    );
    group.add(crate);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xa5b4fc });
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.94, 1.04), ribbonMat);
    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.94, 0.16), ribbonMat);
    group.add(ribbonV, ribbonH);
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.6 })
    );
    star.position.y = 0.65;
    group.add(star);
    scene.add(group);

    function resize() {
      if (!container) return;
      const size = container.clientWidth || 120;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(size, size, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: reducedMotion });
    tl.to(group.position, { y: 0.18, duration: 2.2, ease: "sine.inOut" });
    const starTween = gsap.to(star.rotation, { y: Math.PI * 2, duration: 4, repeat: -1, ease: "none", paused: reducedMotion });

    function animate() {
      raf = requestAnimationFrame(animate);
      if (!reducedMotion) {
        group.rotation.y += 0.006;
        group.rotation.x = Math.sin(Date.now() * 0.0006) * 0.08;
      }
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
      starTween.kill();
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}

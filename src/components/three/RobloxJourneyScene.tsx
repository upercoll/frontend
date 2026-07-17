import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BRAND = {
  indigoDark: 0x1e1b4b,
  indigo: 0x312e80,
  indigoMid: 0x4338ca,
  lilac: 0xa5b4fc,
  glow: 0x6366f1,
  amber: 0xfbbf24,
};

type Stage = {
  label: string;
  color: number;
};

const STAGES: Stage[] = [
  { label: "Choose", color: BRAND.indigoMid },
  { label: "Claim", color: BRAND.glow },
  { label: "Receive", color: BRAND.amber },
];

function buildCharacter(): THREE.Group {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xffd8a8, roughness: 0.6 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x312e80, roughness: 0.5 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 });

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.58), skin);
  head.position.y = 1.62;
  group.add(head);

  // simple blocky face (two dark dots) via small planes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
  const eyeGeo = new THREE.BoxGeometry(0.07, 0.09, 0.02);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.14, 1.65, 0.3);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.14;
  group.add(eyeL, eyeR);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.44), shirt);
  torso.position.y = 0.95;
  group.add(torso);

  const legGeo = new THREE.BoxGeometry(0.3, 0.75, 0.34);
  legGeo.translate(0, 0.375, 0);
  const leftLeg = new THREE.Mesh(legGeo, pants);
  leftLeg.position.set(-0.19, 0.15, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.19;
  group.add(leftLeg, rightLeg);

  const armGeo = new THREE.BoxGeometry(0.26, 0.75, 0.3);
  armGeo.translate(0, -0.375, 0);
  const leftArm = new THREE.Mesh(armGeo, shirt);
  leftArm.position.set(-0.5, 1.3, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.5;
  group.add(leftArm, rightArm);

  group.userData.parts = { leftLeg, rightLeg, leftArm, rightArm, head };
  group.scale.setScalar(0.62);
  return group;
}

function buildPlatform(color: number): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.24, 6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.15 })
  );
  group.add(base);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.03, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.13;
  group.add(ring);
  return group;
}

function buildIcon(stageIndex: number): THREE.Group {
  // small floating glyph above each platform hinting at the step
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: STAGES[stageIndex].color,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  if (stageIndex === 0) {
    // browse: small stacked cards
    for (let i = 0; i < 3; i++) {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.04), mat);
      card.position.set((i - 1) * 0.22, 0, i * 0.05);
      card.rotation.y = (i - 1) * 0.25;
      group.add(card);
    }
  } else if (stageIndex === 1) {
    // claim: chat bubble
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat);
    bubble.scale.set(1, 0.78, 0.6);
    group.add(bubble);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), mat);
    tail.position.set(-0.18, -0.28, 0);
    tail.rotation.z = Math.PI * 0.65;
    group.add(tail);
  } else {
    // receive: gift crate
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.46), mat);
    group.add(box);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.48), ribbonMat);
    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.08), ribbonMat);
    group.add(ribbonV, ribbonH);
  }

  group.position.y = 2.1;
  return group;
}

export default function RobloxJourneyScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL support — leave the panel background as a graceful gradient fallback
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 2.3, 8.5);
    camera.lookAt(0, 1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.PointLight(BRAND.glow, isMobile ? 6 : 10, 12);
    rim.position.set(-3, 3, -2);
    scene.add(rim);

    // platforms + icons laid out left -> right
    const spacing = 3.6;
    const platforms: THREE.Group[] = [];
    const idleTweens: gsap.core.Tween[] = [];
    STAGES.forEach((stage, i) => {
      const platform = buildPlatform(stage.color);
      platform.position.x = (i - 1) * spacing;
      scene.add(platform);
      platforms.push(platform);

      const icon = buildIcon(i);
      icon.position.x = (i - 1) * spacing;
      scene.add(icon);

      idleTweens.push(
        gsap.to(icon.rotation, { y: Math.PI * 2, duration: 6 + i, repeat: -1, ease: "none" }),
        gsap.to(icon.position, { y: icon.position.y + 0.18, duration: 1.6 + i * 0.2, yoyo: true, repeat: -1, ease: "sine.inOut" })
      );
    });

    // ground glow disc under whole scene
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 6),
      new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true, opacity: 0.12 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    scene.add(floor);

    // ambient particles
    const particleCount = isMobile ? 40 : 110;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({ color: BRAND.lilac, size: 0.045, transparent: true, opacity: 0.55 })
    );
    scene.add(particles);

    const character = buildCharacter();
    character.position.set((0 - 1) * spacing, 0.24, 0.4);
    scene.add(character);

    const parts = character.userData.parts as {
      leftLeg: THREE.Mesh; rightLeg: THREE.Mesh; leftArm: THREE.Mesh; rightArm: THREE.Mesh; head: THREE.Mesh;
    };

    // resize handling
    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // scroll-scrubbed journey: 0 -> 1 walks the character across all three platforms
    const progress = { t: 0 };
    const st = ScrollTrigger.create({
      trigger: container,
      start: "top 85%",
      end: "bottom 25%",
      scrub: 0.6,
      onUpdate: (self) => {
        progress.t = self.progress;
      },
    });

    let raf = 0;
    const clock = new THREE.Clock();
    let walking = true;

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const totalSpan = spacing * (STAGES.length - 1);
      const targetX = -spacing + progress.t * totalSpan;
      character.position.x += (targetX - character.position.x) * 0.08;

      const movingSpeed = Math.abs(targetX - character.position.x);
      walking = movingSpeed > 0.01 && !reducedMotion;

      if (walking) {
        const swing = Math.sin(t * 9) * 0.5;
        parts.leftLeg.rotation.x = swing;
        parts.rightLeg.rotation.x = -swing;
        parts.leftArm.rotation.x = -swing * 0.8;
        parts.rightArm.rotation.x = swing * 0.8;
        character.position.y = 0.24 + Math.abs(Math.sin(t * 9)) * 0.05;
      } else {
        parts.leftLeg.rotation.x *= 0.85;
        parts.rightLeg.rotation.x *= 0.85;
        parts.leftArm.rotation.x *= 0.85;
        parts.rightArm.rotation.x *= 0.85;
        character.position.y += (0.24 - character.position.y) * 0.1;
      }

      // face travel direction
      const dir = targetX - character.position.x > 0.01 ? 1 : targetX - character.position.x < -0.01 ? -1 : 0;
      const faceAngle = dir === 0 ? character.rotation.y : dir > 0 ? Math.PI * 0.15 : -Math.PI * 0.15 + Math.PI;
      character.rotation.y += (faceAngle - character.rotation.y) * 0.06;

      // subtle bob for platforms + slow particle drift
      platforms.forEach((p, i) => {
        p.position.y = Math.sin(t * 1.4 + i) * 0.04;
      });
      particles.rotation.y = t * 0.02;

      // gentle camera drift following character
      camera.position.x += (character.position.x * 0.35 - camera.position.x) * 0.04;
      camera.lookAt(character.position.x * 0.5, 1, 0);

      renderer.render(scene, camera);
    }

    if (reducedMotion) {
      // render a single static, still-impressive frame instead of a running loop
      resize();
      renderer.render(scene, camera);
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(raf);
      st.kill();
      idleTweens.forEach((tw) => tw.kill());
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
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

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#151233 0%,#1E1B4B 55%,#241f5c 100%)" }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {/* stage labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-6 sm:px-10 pb-4 pointer-events-none">
        {STAGES.map((s) => (
          <span
            key={s.label}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest"
            style={{ color: "#A5B4FC" }}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.35)" }} />
    </div>
  );
}

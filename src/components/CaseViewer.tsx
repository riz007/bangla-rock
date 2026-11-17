// Lazy-loaded WebGL jewel case. three.js only downloads when an album is opened.
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { drawCover } from "../cover";
import { corsSafe, coverUrls, type Album } from "../data/albums";

function JewelCase({
  album,
  motion,
  drag,
  real,
  live,
}: {
  album: Album;
  motion: boolean;
  drag: { x: number; y: number };
  real: boolean;
  live?: string;
}) {
  const group = useRef<THREE.Group>(null!);
  const disc = useRef<THREE.Mesh>(null!);
  const slide = useRef<THREE.Group>(null!);

  const art = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 512;
    drawCover(cv, album);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [album]);
  const [tex, setTex] = useState<THREE.Texture>(art);
  useEffect(() => {
    setTex(art);
    let photo: THREE.Texture | undefined;
    let alive = true;
    // try each scan through the CORS-enabled image proxy; keep the generated art if none load
    const queue = real ? coverUrls(album, 800, live).map(corsSafe) : [];
    const loader = new THREE.TextureLoader().setCrossOrigin("anonymous");
    const next = () => {
      const url = queue.shift();
      if (!url || !alive) return;
      loader.load(
        url,
        (t) => {
          if (!alive) return t.dispose();
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          photo = t;
          setTex(t);
        },
        undefined,
        next,
      );
    };
    next();
    return () => {
      alive = false;
      art.dispose();
      photo?.dispose();
    };
  }, [art, album, real, live]);

  useFrame((s, dt) => {
    const k = Math.min(1, dt * 6),
      t = s.clock.elapsedTime;
    const sway = motion ? Math.sin(t * 0.6) * 0.22 : 0;
    group.current.rotation.y +=
      (drag.y - 0.35 + sway - group.current.rotation.y) * k;
    group.current.rotation.x += (drag.x + 0.08 - group.current.rotation.x) * k;
    slide.current.position.x +=
      (0.62 - slide.current.position.x) * Math.min(1, dt * 2.5);
    if (motion) disc.current.rotation.y -= dt * 2.4;
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[1.42, 1.25, 0.1]} />
        {[0, 1, 2, 3].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color="#17171c"
            roughness={0.3}
            metalness={0.2}
          />
        ))}
        <meshStandardMaterial
          key={tex.uuid}
          attach="material-4"
          map={tex}
          roughness={0.32}
        />
        <meshStandardMaterial
          attach="material-5"
          color="#101014"
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-0.76, 0, 0]}>
        <boxGeometry args={[0.1, 1.25, 0.11]} />
        <meshStandardMaterial
          color="#0a0a0c"
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>
      <group
        ref={slide}
        position={[0, 0, -0.075]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <mesh ref={disc}>
          <cylinderGeometry args={[0.58, 0.58, 0.012, 72]} />
          <meshPhysicalMaterial
            attach="material-0"
            color="#cfd4da"
            metalness={1}
            roughness={0.2}
          />
          <meshPhysicalMaterial
            key={tex.uuid}
            attach="material-1"
            map={tex}
            metalness={0.55}
            roughness={0.28}
            iridescence={1}
            iridescenceIOR={1.9}
          />
          <meshPhysicalMaterial
            attach="material-2"
            color="#dfe3ea"
            metalness={1}
            roughness={0.16}
            iridescence={1}
            iridescenceIOR={2.1}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.016, 32]} />
          <meshStandardMaterial color="#0a0a0c" />
        </mesh>
      </group>
    </group>
  );
}

export default function CaseViewer({
  album,
  motion,
  accent,
  real,
  live,
}: {
  album: Album;
  motion: boolean;
  accent: string;
  real: boolean;
  live?: string;
}) {
  const drag = useRef({ x: 0, y: 0 }).current;
  useEffect(() => {
    drag.x = 0;
    drag.y = 0;
  }, [album, drag]);
  return (
    <div
      className="viewer"
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={(e) => {
        if (!e.buttons) return;
        drag.y += e.movementX * 0.012;
        drag.x = Math.max(-0.7, Math.min(0.7, drag.x + e.movementY * 0.008));
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [0.25, 0, 4.3] }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 4]} intensity={2.4} />
        <pointLight position={[-3, -1, 2]} intensity={14} color={accent} />
        <JewelCase
          album={album}
          motion={motion}
          drag={drag}
          real={real}
          live={live}
        />
      </Canvas>
      <span className="viewer-hint">drag to turn the case</span>
    </div>
  );
}

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA_PRESETS } from '../cube/constants.js';
import {
  selectDisplayFacelets,
  useStore,
} from '../store/useStore.js';
import {
  applyFacelets,
  beginMove,
  createCubeRig,
  dragToMove,
  highlightFace,
  isBusy,
  pickSticker,
  tickRig,
} from './cubeMesh.js';

function Lights() {
  return (
    <>
      <ambientLight intensity={0.42} color="#f4efe6" />
      <spotLight
        position={[6.5, 10, 5]}
        intensity={120}
        angle={0.42}
        penumbra={0.85}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 3.2, -3]} intensity={18} color="#6f86ff" />
      <pointLight position={[3.4, -2.2, 4.2]} intensity={12} color="#ffb078" />
      <directionalLight position={[-2, 4, 6]} intensity={0.55} color="#d7ff3c" />
    </>
  );
}

function CameraRig() {
  const preset = useStore((s) => s.cameraPreset);
  const inspect = useStore((s) => s.inspectFace);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const blend = useRef(1);

  useEffect(() => {
    blend.current = 1;
  }, [preset]);

  useFrame((_, dt) => {
    if (!inspect && blend.current <= 0) return;
    const goal = CAMERA_PRESETS[preset] || CAMERA_PRESETS.play;
    const k = inspect ? 1 - Math.pow(0.0008, dt) : 1 - Math.pow(0.0003, dt);
    camera.position.lerp(new THREE.Vector3(...goal), k);
    camera.lookAt(target);
    if (!inspect) blend.current -= dt;
  });
  return null;
}

function RubiksView() {
  const group = useRef();
  const rigRef = useRef(null);
  const facelets = useStore(selectDisplayFacelets);
  const inspectFace = useStore((s) => s.inspectFace);
  const shiftQueue = useStore((s) => s.shiftQueue);
  const finishMove = useStore((s) => s.finishMove);
  const mode = useStore((s) => s.mode);
  const solverStage = useStore((s) => s.solverStage);
  const controls = useRef();
  const { camera, gl } = useThree();
  const drag = useRef(null);
  const pointer = useRef(new THREE.Vector2());
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const rig = createCubeRig();
    rigRef.current = rig;
    group.current.add(rig.root);
    applyFacelets(rig, facelets);
    return () => {
      group.current?.remove(rig.root);
    };
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig || isBusy(rig)) return;
    applyFacelets(rig, facelets);
  }, [facelets]);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    highlightFace(rig, 'U', false);
    highlightFace(rig, 'R', false);
    highlightFace(rig, 'F', false);
    highlightFace(rig, 'D', false);
    highlightFace(rig, 'L', false);
    highlightFace(rig, 'B', false);
    if (inspectFace) highlightFace(rig, inspectFace, true);
  }, [inspectFace, facelets]);

  useFrame((_, dt) => {
    const rig = rigRef.current;
    if (!rig || !group.current) return;
    const capped = Math.min(dt, 0.05);
    const state = useStore.getState();
    const wide = typeof window === 'undefined' || window.innerWidth > 860;
    const targetX = state.mode === 'solver' && wide ? -1.25 : 0;
    const targetY = state.mode === 'solver' && !wide ? 0.55 : 0;
    group.current.position.x += (targetX - group.current.position.x) * 0.08;
    group.current.position.y += (targetY - group.current.position.y) * 0.08;
    const done = tickRig(rig, capped);
    if (done) {
      finishMove(done);
      applyFacelets(rig, useStore.getState().facelets);
    }
    if (!isBusy(rig) && useStore.getState().queue.length) {
      const item = shiftQueue();
      if (item) beginMove(rig, item.move, item.fast ? 0.1 : 0.22);
    }
  });

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (event) => {
      if (mode === 'solver' && solverStage === 'paint') return;
      if (useStore.getState().animating || useStore.getState().queue.length) return;
      const rig = rigRef.current;
      if (!rig) return;
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer.current, camera);
      const hit = pickSticker(rig, raycaster);
      if (!hit) return;
      if (controls.current) controls.current.enabled = false;
      drag.current = {
        start: new THREE.Vector2(event.clientX, event.clientY),
        normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld),
        pos: hit.object.userData.cubie.position.clone(),
        committed: false,
      };
    };
    const onMove = (event) => {
      const d = drag.current;
      if (!d || d.committed) return;
      const dx = event.clientX - d.start.x;
      const dy = event.clientY - d.start.y;
      if (Math.hypot(dx, dy) < 14) return;
      const camRight = new THREE.Vector3();
      const camUp = new THREE.Vector3();
      camera.matrixWorld.extractBasis(camRight, camUp, new THREE.Vector3());
      const worldDrag = camRight.multiplyScalar(dx).add(camUp.multiplyScalar(-dy));
      const move = dragToMove(d.normal, worldDrag, d.pos);
      if (!move) return;
      d.committed = true;
      useStore.getState().enqueue([move]);
    };
    const onUp = () => {
      drag.current = null;
      if (controls.current) controls.current.enabled = true;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [camera, gl, mode, raycaster, solverStage]);

  return (
    <>
      <group ref={group} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={5.2}
        maxDistance={12}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        enabled={!(mode === 'solver' && solverStage === 'paint')}
      />
    </>
  );
}

export default function CanvasRoot() {
  return (
    <div className="stage">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: CAMERA_PRESETS.play, fov: 34, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#00000000']} />
        <Lights />
        <CameraRig />
        <RubiksView />
        <ContactShadows
          position={[0, -2.15, 0]}
          opacity={0.42}
          scale={12}
          blur={2.6}
          far={4.5}
          color="#000000"
        />
      </Canvas>
    </div>
  );
}

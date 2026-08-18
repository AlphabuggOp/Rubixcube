import * as THREE from 'three';
import { COLOR_META, FACE_AXIS, FACE_NORMAL } from '../cube/constants.js';
import { parseMove } from '../cube/engine.js';

const STEP = 1.05;
const CORE = 0.96;
const STICKER = 0.78;
const STICKER_Z = 0.49;

const FACE_DIR = {
  U: '+y',
  D: '-y',
  R: '+x',
  L: '-x',
  F: '+z',
  B: '-z',
};

function faceletIndex(face, x, y, z) {
  if (face === 'U') return (z + 1) * 3 + (x + 1);
  if (face === 'D') return (1 - z) * 3 + (x + 1);
  if (face === 'R') return (1 - y) * 3 + (1 - z);
  if (face === 'L') return (1 - y) * 3 + (z + 1);
  if (face === 'F') return (1 - y) * 3 + (x + 1);
  return (1 - y) * 3 + (1 - x);
}

function stickerColor(ch) {
  if (!ch || ch === '?') return '#16161b';
  return COLOR_META[ch]?.sticker || '#16161b';
}

function makeStickerMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    sheen: 0.12,
    sheenColor: new THREE.Color('#ffffff'),
  });
}

const AXIS_VEC = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export function createCubeRig() {
  const root = new THREE.Group();
  const cubies = [];
  const stickerMeshes = [];

  const coreGeo = new THREE.BoxGeometry(CORE, CORE, CORE);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: '#0c0c10',
    roughness: 0.48,
    metalness: 0.08,
  });
  const plateGeo = new THREE.BoxGeometry(STICKER + 0.06, STICKER + 0.06, 0.03);
  const plateMat = new THREE.MeshStandardMaterial({ color: '#070709', roughness: 0.6 });
  const stickerGeo = new THREE.BoxGeometry(STICKER, STICKER, 0.035);

  const stickerFace = {
    U: { pos: [0, STICKER_Z, 0], rot: [-Math.PI / 2, 0, 0] },
    D: { pos: [0, -STICKER_Z, 0], rot: [Math.PI / 2, 0, 0] },
    R: { pos: [STICKER_Z, 0, 0], rot: [0, Math.PI / 2, 0] },
    L: { pos: [-STICKER_Z, 0, 0], rot: [0, -Math.PI / 2, 0] },
    F: { pos: [0, 0, STICKER_Z], rot: [0, 0, 0] },
    B: { pos: [0, 0, -STICKER_Z], rot: [0, Math.PI, 0] },
  };

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        const group = new THREE.Group();
        group.position.set(x * STEP, y * STEP, z * STEP);
        group.userData = { x, y, z };

        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);

        const stickers = {};
        const faces = [];
        if (y === 1) faces.push('U');
        if (y === -1) faces.push('D');
        if (x === 1) faces.push('R');
        if (x === -1) faces.push('L');
        if (z === 1) faces.push('F');
        if (z === -1) faces.push('B');

        for (const face of faces) {
          const layout = stickerFace[face];
          const plate = new THREE.Mesh(plateGeo, plateMat);
          plate.position.set(...layout.pos);
          plate.rotation.set(...layout.rot);
          group.add(plate);

          const mat = makeStickerMaterial('#16161b');
          const sticker = new THREE.Mesh(stickerGeo, mat);
          const outward = FACE_NORMAL[face];
          sticker.position.set(
            layout.pos[0] + outward[0] * 0.012,
            layout.pos[1] + outward[1] * 0.012,
            layout.pos[2] + outward[2] * 0.012,
          );
          sticker.rotation.set(...layout.rot);
          sticker.userData = { face, x, y, z, cubie: group };
          sticker.castShadow = true;
          group.add(sticker);
          stickers[face] = mat;
          stickerMeshes.push(sticker);
        }

        root.add(group);
        cubies.push({ group, x, y, z, stickers });
      }
    }
  }

  const pivot = new THREE.Group();
  root.add(pivot);

  return {
    root,
    cubies,
    stickerMeshes,
    pivot,
    anim: null,
    dragging: false,
  };
}

export function applyFacelets(rig, facelets) {
  const str = facelets || '';
  for (const cubie of rig.cubies) {
    for (const face of Object.keys(cubie.stickers)) {
      const idx = faceletIndex(face, cubie.x, cubie.y, cubie.z);
      const base = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 }[face];
      const ch = str[base + idx];
      cubie.stickers[face].color.set(stickerColor(ch));
      cubie.stickers[face].emissive.set(ch && ch !== '?' ? '#000000' : '#050506');
    }
  }
}

function layerCubies(rig, face) {
  const { axis, sign } = FACE_AXIS[face];
  return rig.cubies.filter((c) => c[axis] === sign);
}

function resetPivots(rig) {
  for (const cubie of rig.cubies) {
    if (cubie.group.parent !== rig.root) {
      rig.root.attach(cubie.group);
    }
    cubie.group.position.set(cubie.x * STEP, cubie.y * STEP, cubie.z * STEP);
    cubie.group.rotation.set(0, 0, 0);
    cubie.group.quaternion.identity();
  }
  rig.pivot.rotation.set(0, 0, 0);
  rig.pivot.quaternion.identity();
}

export function beginMove(rig, move, duration = 0.22) {
  const { face, times } = parseMove(move);
  resetPivots(rig);
  const layer = layerCubies(rig, face);
  for (const cubie of layer) {
    rig.pivot.attach(cubie.group);
  }
  const signed = times === 3 ? -1 : times === 2 ? 2 : 1;
  const { axis, sign } = FACE_AXIS[face];
  // +faces CW is negative right-hand; -faces CW is positive right-hand
  const rh = sign === 1 ? -signed : signed;
  rig.anim = {
    move,
    axis,
    target: rh * (Math.PI / 2),
    t: 0,
    duration: times === 2 ? duration * 1.15 : duration,
  };
}

export function tickRig(rig, dt) {
  if (!rig.anim) return null;
  rig.anim.t += dt;
  const u = Math.min(1, rig.anim.t / rig.anim.duration);
  const e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const angle = rig.anim.target * e;
  rig.pivot.rotation.set(0, 0, 0);
  rig.pivot.rotation[rig.anim.axis] = angle;
  if (u >= 1) {
    const move = rig.anim.move;
    rig.anim = null;
    resetPivots(rig);
    return move;
  }
  return null;
}

export function isBusy(rig) {
  return Boolean(rig.anim);
}

function snapAxis(v) {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax > ay && ax > az) return { axis: 'x', vec: new THREE.Vector3(Math.sign(v.x), 0, 0) };
  if (ay > az) return { axis: 'y', vec: new THREE.Vector3(0, Math.sign(v.y), 0) };
  return { axis: 'z', vec: new THREE.Vector3(0, 0, Math.sign(v.z)) };
}

export function pickSticker(rig, raycaster) {
  const hits = raycaster.intersectObjects(rig.stickerMeshes, false);
  return hits[0] || null;
}

export function dragToMove(normal, drag, cubiePos) {
  const n = normal.clone().normalize();
  const d = drag.clone();
  d.sub(n.clone().multiplyScalar(d.dot(n)));
  if (d.length() < 1e-6) return null;
  const raw = new THREE.Vector3().crossVectors(n, d);
  const snapped = snapAxis(raw);
  const layerSign = Math.round(cubiePos[snapped.axis] / STEP);
  if (layerSign === 0) return null;
  const face =
    snapped.axis === 'x'
      ? layerSign === 1
        ? 'R'
        : 'L'
      : snapped.axis === 'y'
        ? layerSign === 1
          ? 'U'
          : 'D'
        : layerSign === 1
          ? 'F'
          : 'B';
  const rhPositive = raw.dot(AXIS_VEC[snapped.axis]) > 0;
  const plusFace = layerSign === 1;
  const cw = plusFace ? !rhPositive : rhPositive;
  return cw ? face : `${face}'`;
}

export function highlightFace(rig, face, on) {
  for (const cubie of rig.cubies) {
    const mat = cubie.stickers[face];
    if (!mat) continue;
    mat.emissive.set(on ? '#2a2810' : '#000000');
    mat.emissiveIntensity = on ? 0.35 : 0;
  }
}

export { FACE_DIR, STEP };

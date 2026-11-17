import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

const R = 2.24;
const LIFT = 0.018;

export function initGlobe(stage, options = {}) {
  const {
    interactive = true,
    labels = true,
    autoRotate = true,
    autoRotateSpeed = 0.28,
    cameraPosition = [-1.05, 0.48, 9.45],
    fov = 32,
    exposure = 1.05,
    cloudSpeed = 0.012,
    beadBoost = 1,
    pulseBoost = 1,
    dashBoost = 1,
    globeOffset = [0, 0, 0],
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  stage.appendChild(renderer.domElement);

  let labelRenderer = null;
  if (labels) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "globe-labels";
    stage.appendChild(labelRenderer.domElement);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

  let controls = null;
  if (interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 7.8;
    controls.maxDistance = 15;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.rotateSpeed = 0.45;
    renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; });
  } else {
    renderer.domElement.style.pointerEvents = "none";
  }

  const globeGroup = new THREE.Group();
  globeGroup.rotation.z = -0.12;
  globeGroup.position.set(globeOffset[0], globeOffset[1], globeOffset[2]);
  scene.add(globeGroup);

  const loader = new THREE.TextureLoader();
  const earthMap = loader.load("./earth/earth-day.jpg", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }, undefined, (err) => {
    console.error(err);
  });
  earthMap.colorSpace = THREE.SRGBColorSpace;
  const earthSpecular = loader.load("./earth/earth-water.png");
  const cloudMap = loader.load("./earth/earth-clouds.png");

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 128, 128),
    new THREE.MeshPhongMaterial({
      map: earthMap,
      specularMap: earthSpecular,
      specular: new THREE.Color(0x6d8498),
      shininess: 14,
    }),
  );
  globeGroup.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.025, 128, 128),
    new THREE.MeshPhongMaterial({ map: cloudMap, color: 0xf7f4ee, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  earth.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.035, 128, 128),
    new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
        void main(){ vNormal=normalize(normalMatrix*normal); vec4 wp=modelMatrix*vec4(position,1.0); vWorldPosition=wp.xyz; vWorldNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      uniforms: { sunDirection: { value: new THREE.Vector3(-0.72, 0.42, 0.55).normalize() } },
      fragmentShader: `uniform vec3 sunDirection; varying vec3 vNormal; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
        void main(){ vec3 viewDirection=normalize(cameraPosition-vWorldPosition);
          float fresnel=pow(1.0-max(dot(vNormal,viewDirection),0.0),5.4); float sunlight=smoothstep(-0.35,0.72,dot(vWorldNormal,sunDirection));
          float alpha=fresnel*mix(0.05,0.22,sunlight); vec3 color=mix(vec3(0.35,0.48,0.62),vec3(0.72,0.84,0.95),sunlight); gl_FragColor=vec4(color,alpha); }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false,
    }),
  );
  globeGroup.add(atmosphere);

  scene.add(new THREE.HemisphereLight(0xf4efe4, 0xb7c3d0, 0.42));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd7e4f2, 0.45);
  scene.add(fill);
  const keyLocal = new THREE.Vector3(-5.5, 3.2, 5.2);
  const fillLocal = new THREE.Vector3(4, -1, 2);
  if (controls) controls.update();
  else camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.worldToLocal(keyLocal);
  camera.worldToLocal(fillLocal);
  const _lightWorld = new THREE.Vector3();
  function lightFollowFront() {
    camera.updateMatrixWorld();
    camera.localToWorld(_lightWorld.copy(keyLocal));
    key.position.copy(_lightWorld);
    camera.localToWorld(_lightWorld.copy(fillLocal));
    fill.position.copy(_lightWorld);
    atmosphere.material.uniforms.sunDirection.value.copy(key.position).normalize();
  }
  lightFollowFront();

  function latLonToLocal(lat, lon, radius = R + LIFT) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.cos(phi),
      radius * Math.sin(theta) * Math.sin(phi),
    );
  }
  function greatCircle(a, b, steps = 72) {
    const va = latLonToLocal(a.lat, a.lon, 1);
    const vb = latLonToLocal(b.lat, b.lon, 1);
    const omega = Math.acos(Math.min(1, Math.max(-1, va.dot(vb))));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = omega < 1e-5
        ? va.clone()
        : va.clone().multiplyScalar(Math.sin((1 - t) * omega) / Math.sin(omega))
            .add(vb.clone().multiplyScalar(Math.sin(t * omega) / Math.sin(omega)));
      pts.push(p.normalize().multiplyScalar(R + LIFT + 0.006));
    }
    return pts;
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lineMats = [];
  const dashMats = [];
  const beads = [];
  const pulses = [];
  const rainMats = [];

  function samplePath(points, t) {
    const n = points.length - 1;
    const x = THREE.MathUtils.clamp(t, 0, 0.9999) * n;
    const i = Math.floor(x);
    return points[i].clone().lerp(points[i + 1], x - i);
  }

  function fatLine(points, { color, width = 2.4, opacity = 0.92, dashed = false, dashSize = 0.09, gapSize = 0.07 }) {
    const geo = new LineGeometry();
    geo.setFromPoints(points);
    const mat = new LineMaterial({
      color,
      linewidth: width,
      transparent: true,
      opacity,
      dashed,
      dashSize,
      gapSize,
      depthWrite: false,
      toneMapped: false,
    });
    mat.resolution.set(1, 1);
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    lineMats.push(mat);
    if (dashed) dashMats.push({ mat, speed: width > 3 ? 0.22 : 0.14 });
    return line;
  }

  function addBead(group, points, { color, size = 0.02, speed = 0.07, phase = 0 }) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(size, 14, 14),
      new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 1 }),
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(size * 2.2, 12, 12),
      new THREE.MeshBasicMaterial({
        color, toneMapped: false, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    core.add(halo);
    core.position.copy(samplePath(points, phase));
    group.add(core);
    beads.push({ mesh: core, points, speed, t: phase });
  }

  function addPulse(group, pos, color, scale = 1) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.018 * scale, 0.026 * scale, 40),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
      }),
    );
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    group.add(ring);
    pulses.push({ ring, base: 0.018 * scale, phase: Math.random() * Math.PI * 2, color });
  }

  const layers = { currents: new THREE.Group(), state: new THREE.Group(), pins: new THREE.Group(), routes: new THREE.Group() };
  Object.values(layers).forEach((g) => earth.add(g));

  function addCurrent(path, color) {
    const pts = path.map(([lon, lat]) => latLonToLocal(lat, lon, R + 0.028));
    layers.currents.add(fatLine(pts, { color, width: 6.5, opacity: 0.18 }));
    layers.currents.add(fatLine(pts, { color, width: 2.2, opacity: 0.95, dashed: true, dashSize: 0.08, gapSize: 0.045 }));
    addBead(layers.currents, pts, { color, size: 0.022, speed: 0.09, phase: 0.08 });
    addBead(layers.currents, pts, { color, size: 0.016, speed: 0.09, phase: 0.42 });
    addBead(layers.currents, pts, { color, size: 0.018, speed: 0.09, phase: 0.76 });
  }
  addCurrent(
    [[-80.1, 25.2], [-79.4, 27.4], [-77.2, 31.8], [-74.6, 34.8], [-70.8, 37.6], [-65.5, 39.8], [-58.0, 42.2], [-48.0, 46.5], [-38.0, 51.0], [-28.0, 55.4], [-18.0, 58.2]],
    0x3d9ad4,
  );
  addCurrent(
    [[-34.8, -8.2], [-36.6, -13.5], [-38.4, -18.8], [-41.2, -23.5], [-45.5, -28.4], [-48.8, -33.6], [-52.2, -38.5]],
    0x2db89a,
  );
  addCurrent(
    [[130.5, 30.5], [135.0, 32.8], [140.2, 35.0], [144.8, 37.6], [150.0, 40.2], [157.0, 42.8], [165.0, 44.5]],
    0x4aa3d8,
  );

  const iowa = [[-91.368,43.501],[-91.215,43.501],[-91.204,43.354],[-91.056,43.255],[-91.177,43.134],[-91.144,42.91],[-91.067,42.751],[-90.711,42.636],[-90.64,42.51],[-90.421,42.329],[-90.394,42.225],[-90.169,42.127],[-90.142,42.001],[-90.18,41.809],[-90.311,41.743],[-90.344,41.59],[-90.656,41.464],[-91.045,41.415],[-91.111,41.239],[-90.947,41.097],[-90.963,40.922],[-91.095,40.823],[-91.122,40.67],[-91.401,40.56],[-91.418,40.38],[-91.527,40.412],[-91.73,40.615],[-91.834,40.61],[-93.258,40.582],[-94.633,40.571],[-95.766,40.588],[-95.881,40.719],[-95.827,40.977],[-95.925,41.201],[-95.92,41.453],[-96.095,41.541],[-96.122,41.678],[-96.062,41.798],[-96.128,41.973],[-96.265,42.039],[-96.446,42.488],[-96.632,42.707],[-96.544,42.855],[-96.511,43.052],[-96.435,43.123],[-96.561,43.222],[-96.528,43.397],[-96.582,43.479],[-96.451,43.501],[-91.368,43.501]];
  const iowaPts = iowa.map(([lon, lat]) => latLonToLocal(lat, lon, R + 0.012));
  const iowaCenter = iowaPts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / iowaPts.length).normalize().multiplyScalar(R + 0.012);
  const fillPos = [];
  for (let i = 0; i < iowaPts.length - 1; i++) {
    fillPos.push(iowaCenter.x, iowaCenter.y, iowaCenter.z, iowaPts[i].x, iowaPts[i].y, iowaPts[i].z, iowaPts[i + 1].x, iowaPts[i + 1].y, iowaPts[i + 1].z);
  }
  const fillGeo = new THREE.BufferGeometry();
  fillGeo.setAttribute("position", new THREE.Float32BufferAttribute(fillPos, 3));
  fillGeo.computeVertexNormals();
  const rainMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x1f8a72) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vPos;
      void main(){
        float wave=0.5+0.5*sin(vPos.x*42.0+vPos.z*30.0-uTime*2.6);
        float pulse=0.46+0.22*sin(uTime*1.5);
        gl_FragColor=vec4(uColor, pulse*0.42+wave*0.28);
      }`,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  rainMats.push(rainMat);
  layers.state.add(new THREE.Mesh(fillGeo, rainMat));
  layers.state.add(fatLine(iowaPts.concat(iowaPts[0]), { color: 0x2db89a, width: 1.8, opacity: 0.85, dashed: true, dashSize: 0.04, gapSize: 0.03 }));
  addPulse(layers.state, iowaCenter.clone().normalize().multiplyScalar(R + 0.02), 0x2db89a, 1.6);
  addPulse(layers.state, iowaCenter.clone().normalize().multiplyScalar(R + 0.02), 0x7ee0c8, 2.4);

  const nodes = {
    iowa: { lat: 42.03, lon: -93.5, title: "爱荷华", note: "本周降水偏多", color: 0xd97706 },
    nola: { lat: 29.95, lon: -90.07, title: "新奥尔良", note: "美湾出口", color: 0xd97706 },
    santos: { lat: -23.96, lon: -46.33, title: "桑托斯", note: "巴西装船港", color: 0xd97706 },
    qingdao: { lat: 36.07, lon: 120.38, title: "青岛", note: "对华卸货", color: 0xd97706 },
  };
  Object.entries(nodes).forEach(([key, n]) => {
    const pos = latLonToLocal(n.lat, n.lon, R + 0.032);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 16, 16),
      new THREE.MeshBasicMaterial({ color: n.color, toneMapped: false }),
    );
    core.position.copy(pos);
    layers.pins.add(core);
    addPulse(layers.pins, pos, n.color, 1);
    addPulse(layers.pins, pos, 0xffc46a, 1.7);
    if (labels) {
      const el = document.createElement("div");
      el.className = `port-tag tag-${key}`;
      el.innerHTML = `<b>${n.title}</b><span>${n.note}</span>`;
      const obj = new CSS2DObject(el);
      obj.position.copy(latLonToLocal(n.lat, n.lon, R + 0.05));
      layers.pins.add(obj);
    }
  });

  function addRoute(a, b, color, steps = 96) {
    const pts = greatCircle(a, b, steps);
    layers.routes.add(fatLine(pts, { color, width: 7, opacity: 0.16 }));
    layers.routes.add(fatLine(pts, { color, width: 2.4, opacity: 0.95, dashed: true, dashSize: 0.11, gapSize: 0.07 }));
    addBead(layers.routes, pts, { color, size: 0.024, speed: 0.055, phase: 0.12 });
    addBead(layers.routes, pts, { color, size: 0.018, speed: 0.055, phase: 0.62 });
  }
  addRoute(nodes.nola, nodes.qingdao, 0xe11d48);
  addRoute(nodes.santos, nodes.qingdao, 0xf43f5e);
  addRoute(nodes.iowa, nodes.nola, 0xf59e0b, 36);

  document.querySelectorAll("[data-layer]").forEach((input) => {
    const apply = () => { layers[input.dataset.layer].visible = input.checked; };
    input.addEventListener("change", apply);
    apply();
  });

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    if (labelRenderer) labelRenderer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    lineMats.forEach((mat) => mat.resolution.set(width, height));
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clouds.rotation.y += dt * cloudSpeed;
    if (!reduceMotion) {
      dashMats.forEach((item) => { item.mat.dashOffset -= dt * item.speed * dashBoost; });
      beads.forEach((bead) => {
        bead.t = (bead.t + dt * bead.speed * beadBoost) % 1;
        bead.mesh.position.copy(samplePath(bead.points, bead.t));
      });
      pulses.forEach((pulse) => {
        pulse.phase += dt * 1.35 * pulseBoost;
        const k = (Math.sin(pulse.phase) + 1) * 0.5;
        const s = 1 + k * 2.1;
        pulse.ring.scale.setScalar(s);
        pulse.ring.material.opacity = 0.55 * (1 - k);
      });
      rainMats.forEach((mat) => { mat.uniforms.uTime.value += dt; });
    }
    if (controls) {
      controls.update();
    } else if (autoRotate && !reduceMotion) {
      globeGroup.rotation.y += dt * autoRotateSpeed * 0.1047;
    }
    lightFollowFront();
    if (labelRenderer) {
      const earthCenter = new THREE.Vector3();
      earth.getWorldPosition(earthCenter);
      const world = new THREE.Vector3();
      layers.pins.children.forEach((obj) => {
        if (!obj.element) return;
        obj.getWorldPosition(world);
        const toCam = camera.position.clone().sub(world).normalize();
        const normal = world.clone().sub(earthCenter).normalize();
        obj.element.style.opacity = toCam.dot(normal) > 0.12 ? "1" : "0";
      });
    }
    renderer.render(scene, camera);
    if (labelRenderer) labelRenderer.render(scene, camera);
  }
  requestAnimationFrame(function loop(now) { animate(now); requestAnimationFrame(loop); });

  return { globeGroup, camera, controls, scene };
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VIEWS, POINTS } from './views.js';
import { MarketState } from './simulation.js';
import { MarketScreens } from './screens.js';
import { Occupants } from './occupants.js';
import { Ceremony } from './ceremony.js';

// Transparent glazing should not occlude furniture in the ambient-occlusion pass.
class InteriorAOPass extends GTAOPass {
  render(...args) {
    const hidden = [];
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj.visible && obj.material.transparent) { hidden.push(obj); obj.visible = false; }
    });
    try { super.render(...args); } finally { hidden.forEach((obj) => { obj.visible = true; }); }
  }
}

/** Owns the actual Blender GLB, camera, lighting and the animated ticker UVs. */
export class InteriorViewer {
  constructor(canvas, { onProgress, onInteraction, onError, onCeremony, onDrone }) {
    this.canvas = canvas;
    this.onProgress = onProgress;
    this.onInteraction = onInteraction;
    this.onError = onError;
    this.onCeremony = onCeremony;
    this.onDrone = onDrone;
    this.market = new MarketState();
    this.sound = true;
    this.drone = false;
    this.droneTime = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tickerPlaying = !this.reducedMotion;
    this.peoplePlaying = !this.reducedMotion;
    this.annotations = true;
    this.currentView = 'atrium';
    this.roofObjects = [];
    this.tickerTextures = new Set();
    this.meshes = [];
    this.pointElements = [...document.querySelectorAll('[data-point]')];
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#dce6e8');
    this.scene.fog = new THREE.Fog('#dce6e8', 58, 105);
    this.ceremony = new Ceremony(this.scene);
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.06, 150);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = pmrem.fromScene(environment, 0.06);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.55;
    environment.dispose();
    pmrem.dispose();

    this.hemi = new THREE.HemisphereLight('#d7edf9', '#b4aa8d', 2.3);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff2da', 3.0);
    this.sun.position.set(4, 39, 8);
    this.sun.target.position.set(-2, 0, -4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -20, right: 20, top: 24, bottom: -24, near: 1, far: 70 });
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun, this.sun.target);
    this.fill = new THREE.DirectionalLight('#cadde7', 1.15);
    this.fill.position.set(-3, 8, -11);
    this.scene.add(this.fill);
    this.composer = new EffectComposer(this.renderer);
    this.composer.renderTarget1.samples = 4;
    this.composer.renderTarget2.samples = 4;
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = new InteriorAOPass(this.scene, this.camera, 512, 512);
    this.ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1, scale: 1 });
    this.ao.blendIntensity = 0.65;
    this.composer.addPass(this.ao);
    this.composer.addPass(new OutputPass());
    this.warmLights = [];
    for (const pos of [[-7, 3, 6], [7, 3, -5], [0, 7, 15], [0, 5.5, 22]]) {
      const light = new THREE.PointLight('#ffe3ad', 65, 16, 2);
      light.position.fromArray(pos);
      this.scene.add(light);
      this.warmLights.push(light);
    }

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 48;
    this.controls.maxPolarAngle = Math.PI * 0.91;
    this.controls.minPolarAngle = 0.08;
    this.controls.panSpeed = 0.5;
    this.controls.zoomSpeed = 0.55;
    this.controls.rotateSpeed = 0.48;
    this.controls.addEventListener('start', () => {
      this.transition = null;
      this.drone = false;
      this.onDrone?.(false);
      this.onInteraction?.();
    });
    this.controls.listenToKeyEvents(canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.raycaster = new THREE.Raycaster();
    canvas.addEventListener('pointerdown', (event) => { this.pointerDown = [event.clientX, event.clientY]; });
    canvas.addEventListener('pointerup', (event) => {
      if (!this.ready || !this.pointerDown || event.button !== 0) return;
      if (Math.hypot(event.clientX - this.pointerDown[0], event.clientY - this.pointerDown[1]) > 6) return;
      const rect = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), this.camera);
      const hit = ray.intersectObjects(this.meshes, false).find((h) => h.object.visible);
      if (hit && /^(LaunchButton|LaunchConsole)/.test(hit.object.userData.component)) this.toggleMarket();
    });
    this._projected = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._lastTime = 0;
    this._frameCount = 0;
    this.setView('atrium', false);
    this.setDaylight(78);
    this.resize();
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.renderer.setAnimationLoop(null);
      this.onError?.(new Error('The graphics connection was interrupted. Reload the viewer to reconnect.'));
    });
    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  async load() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/paternoster.glb`, (event) => {
      this.onProgress?.(event.total ? event.loaded / event.total : 0.5);
    });
    this.model = gltf.scene;
    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      const type = obj.userData.material_class ?? '';
      const component = obj.userData.component ?? '';
      obj.castShadow = !type.includes('Glass') && !type.includes('Display');
      obj.receiveShadow = !type.includes('Glass');
      obj.material.envMapIntensity = type === 'Steel' ? 0.9 : 0.35;
      if (type.includes('Glass')) {
        obj.material.transparent = true;
        obj.material.opacity = type === 'RoofGlass' ? 0.12 : 0.11;
        obj.material.depthWrite = false;
        obj.material.side = THREE.DoubleSide;
        obj.renderOrder = 2;
      } else {
        this.meshes.push(obj);
      }
      if (component.startsWith('Roof')) this.roofObjects.push(obj);
      if (component === 'TickerBands') {
        for (const key of ['map', 'emissiveMap']) {
          const texture = obj.material[key];
          if (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
            texture.needsUpdate = true;
            this.tickerTextures.add(texture);
          }
        }
      }
      if (obj.material.map) obj.material.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    });
    this.scene.add(this.model);
    this.screens = new MarketScreens(this.model);
    const [worker, chair, seatsResponse] = await Promise.all([
      loader.loadAsync(`${import.meta.env.BASE_URL}models/worker.glb`),
      loader.loadAsync(`${import.meta.env.BASE_URL}models/chair.glb`),
      fetch(`${import.meta.env.BASE_URL}models/seating.json`),
    ]);
    if (!seatsResponse.ok) throw new Error('Could not load workstation layout');
    this.occupants = new Occupants(this.scene, worker, chair, await seatsResponse.json());
    this.screens.update(0, this.market, false, this.reducedMotion);
    this.ready = true;
    this.canvas.dataset.loaded = 'true';
    this.onProgress?.(1);
    this.renderer.compile(this.scene, this.camera);
    this.updatePoints();
  }

  resize() {
    const { width, height } = this.canvas.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setView(name, animate = true) {
    const view = VIEWS[name];
    if (!view) return;
    this.drone = false;
    this.onDrone?.(false);
    this.currentView = name;
    this.canvas.dataset.view = name;
    const nextPosition = new THREE.Vector3().fromArray(view.position);
    const nextTarget = new THREE.Vector3().fromArray(view.target);
    // Flush any residual orbit/pan inertia before a preset transition.
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
    if (!animate || this.reducedMotion) {
      this.camera.position.copy(nextPosition);
      this.controls.target.copy(nextTarget);
      this.camera.fov = view.fov;
      this.camera.updateProjectionMatrix();
      this.transition = null;
    } else {
      this.transition = { start: performance.now(), from: this.camera.position.clone(), fromTarget: this.controls.target.clone(), to: nextPosition, target: nextTarget, fromFov: this.camera.fov, fov: view.fov };
    }
    this.controls.update();
  }

  setDaylight(value) {
    const t = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
    this.hemi.intensity = 0.25 + t * 1.05;
    this.sun.intensity = t * 2.9;
    this.fill.intensity = 0.18 + t * 0.55;
    this.scene.environmentIntensity = 0.22 + t * 0.22;
    this.renderer.toneMappingExposure = 0.9 + t * 0.1;
    this.scene.background.lerpColors(new THREE.Color('#253347'), new THREE.Color('#dce7e8'), t);
    this.scene.fog.color.copy(this.scene.background);
    this.warmLights.forEach((light) => { light.intensity = 55 + (1 - t) * 80; });
  }

  setRoof(visible) {
    this.roofObjects.forEach((obj) => { obj.visible = visible; });
    this.canvas.dataset.roof = String(visible);
  }

  setDrone(active) {
    if (active) {
      this.setView('drone');
      this.droneTime = 0;
    }
    this.drone = active;
    this.onDrone?.(active);
  }

  toggleMarket() {
    if (!this.ready) return;
    const open = this.market.toggle();
    this.ceremony.trigger(open, this.reducedMotion, this.sound);
    this.onCeremony?.(open);
  }

  getLaunchScreenPosition() {
    const p = new THREE.Vector3(0, 5.245, 14.41).project(this.camera);
    return [(p.x * .5 + .5) * this.width, (-p.y * .5 + .5) * this.height];
  }

  setAnnotations(visible) {
    this.annotations = visible;
    document.querySelector('#hotspots').hidden = !visible;
    this.updatePoints();
  }

  updatePoints() {
    if (!this.ready || !this.annotations) return;
    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld();
    this.pointElements.forEach((element) => {
      const point = POINTS[element.dataset.point];
      if (!point) return;
      const world = new THREE.Vector3().fromArray(point.position);
      this._projected.copy(world).project(this.camera);
      const x = (this._projected.x * 0.5 + 0.5) * this.width;
      const y = (-this._projected.y * 0.5 + 0.5) * this.height;
      let visible = this._projected.z > -1 && this._projected.z < 1 && x > 30 && x < this.width - 95 && y > 80 && y < this.height - 160;
      if (visible) {
        this._direction.subVectors(world, this.camera.position);
        const distance = this._direction.length();
        this.raycaster.set(this.camera.position, this._direction.normalize());
        this.raycaster.far = distance - 0.6;
        visible = !this.raycaster.intersectObjects(this.meshes, false).some((hit) => hit.object.visible);
      }
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.opacity = visible ? '1' : '0';
      element.style.visibility = visible ? 'visible' : 'hidden';
      element.tabIndex = visible ? 0 : -1;
    });
  }

  render(time) {
    const dt = Math.min((time - this._lastTime) / 1000 || 0, 0.05);
    this._lastTime = time;
    if (document.hidden) return;
    if (this.transition) {
      const tr = this.transition;
      const progress = Math.min((time - tr.start) / 1700, 1);
      const t = progress * progress * (3 - 2 * progress);
      this.camera.position.lerpVectors(tr.from, tr.to, t);
      this.controls.target.lerpVectors(tr.fromTarget, tr.target, t);
      this.camera.fov = THREE.MathUtils.lerp(tr.fromFov, tr.fov, t);
      this.camera.updateProjectionMatrix();
      if (progress >= 1) this.transition = null;
    } else if (this.drone) {
      this.droneTime += dt;
      const a = this.droneTime * Math.PI * 2 / 90;
      this.camera.position.set(2.8 * Math.cos(a), 8 + 15 * (.5 - .5 * Math.cos(a)), 11 * Math.cos(a) + 1.5 * Math.sin(a));
      this.controls.target.set(-.4 * Math.sin(a), 5.1 + 5 * (.5 - .5 * Math.cos(a)), -1.5);
    }
    this.controls.update();
    if (this.tickerPlaying) this.tickerTextures.forEach((texture) => { texture.offset.x = (texture.offset.x + dt * 0.018) % 1; });
    this.market.update(dt);
    this.screens?.update(dt, this.market, this.tickerPlaying, this.reducedMotion);
    this.occupants?.update(dt, this.peoplePlaying, this.market.celebrating);
    this.ceremony.update(dt);
    this.composer.render();
    if (++this._frameCount % 6 === 0) this.updatePoints();
  }

  async snapshot() {
    this.composer.render();
    const blob = await new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not capture the image.');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paternoster-square-${this.currentView}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  dispose() {
    this.ceremony.dispose();
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.scene.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) {
        for (const value of Object.values(obj.material)) if (value?.isTexture) value.dispose();
        obj.material.dispose();
      }
    });
    this.environmentTarget.dispose();
    this.composer.passes.forEach((pass) => pass.dispose?.());
    this.composer.dispose();
    this.renderer.dispose();
  }
}

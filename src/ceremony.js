import * as THREE from 'three';
import { seededRandom } from './simulation.js';

/** Reusable instanced confetti and theatrical balcony lighting. */
export class Ceremony {
  constructor(scene) {
    this.elapsed = 100; this.random = seededRandom(731); this.particles = [];
    this.dummy = new THREE.Object3D();
    this.confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(.065, .12), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .35, metalness: .35 }), 650);
    this.confetti.frustumCulled = false; this.confetti.visible = false;
    const colors = ['#e6c563', '#e9f7ff', '#8f92ff', '#79e5c9', '#f49fb6'];
    for (let i = 0; i < 650; i++) this.confetti.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    scene.add(this.confetti);
    this.lights = [];
    for (const x of [-4, 4]) {
      const light = new THREE.PointLight('#718dff', 0, 28, 2);
      light.position.set(x, 6.5, 11); this.lights.push(light); scene.add(light);
    }
  }

  trigger(open, reducedMotion, sound) {
    this.elapsed = 0; this.reducedMotion = reducedMotion;
    this.confetti.visible = !reducedMotion;
    this.lights.forEach((l) => l.color.set(open ? '#62ffce' : '#a392ff'));
    this.particles = Array.from({ length: 650 }, (_, i) => {
      const r = this.random;
      return { x: (i % 2 ? 1 : -1) * (3.8 + r()), y: 8 + r() * 8, z: 10 + r() * 4,
        vx: (i % 2 ? -1 : 1) * (.35 + r()), vy: 1 + r() * 2, vz: -1 - r() * 1.7,
        spin: r() * 6.28, flutter: 1 + r() * 3 };
    });
    if (sound) this.playCheer();
  }

  update(dt) {
    this.elapsed += dt;
    const active = this.elapsed < 8;
    this.lights.forEach((l) => { l.intensity = active ? 120 * Math.sin(Math.min(this.elapsed / 8, 1) * Math.PI) : 0; });
    if (!active || this.reducedMotion) { this.confetti.visible = false; return; }
    this.particles.forEach((p, i) => {
      p.vy = Math.max(p.vy - dt * 1.7, -1.6);
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      this.dummy.position.set(p.x + Math.sin(this.elapsed * p.flutter) * .15, Math.max(.04, p.y), p.z);
      this.dummy.rotation.set(p.spin + this.elapsed * 2, p.spin + this.elapsed * p.flutter, p.spin);
      this.dummy.scale.setScalar(Math.min(1, (8 - this.elapsed) / 1.3));
      this.dummy.updateMatrix(); this.confetti.setMatrixAt(i, this.dummy.matrix);
    });
    this.confetti.instanceMatrix.needsUpdate = true;
  }

  async playCheer() {
    // Self-contained synthesized applause and voiced crowd whoops. No remote audio.
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      this.audio ??= new Audio(); await this.audio.resume();
      const ctx = this.audio, length = 5, rate = ctx.sampleRate;
      const buffer = ctx.createBuffer(2, rate * length, rate);
      const random = seededRandom(371 + Math.floor(this.random() * 1000));
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        // Many overlapping claps with sharp attacks and short decays.
        for (let clap = 0; clap < 170; clap++) {
          const start = Math.floor(random() * (length - .2) * rate);
          const gain = .07 * (1 - start / data.length) * (.4 + random());
          for (let j = 0; j < rate * .075; j++) data[start + j] += (random() * 2 - 1) * gain * Math.exp(-j / (rate * .014));
        }
        // A layered, vowel-like "woo" using harmonics around vocal formants.
        for (let voice = 0; voice < 14; voice++) {
          const start = random() * 1.8, duration = 1.2 + random() * 1.5, pitch = 130 + random() * 170;
          let phase = 0;
          for (let j = 0; j < rate * duration; j++) {
            const n = Math.floor(start * rate) + j; if (n >= data.length) break;
            const t = j / rate, env = Math.sin(Math.PI * t / duration) ** 2;
            phase += 2 * Math.PI * (pitch + 65 * Math.sin(t / duration * Math.PI)) / rate;
            data[n] += .007 * env * (Math.sin(phase) + .45 * Math.sin(phase * 2) + .22 * Math.sin(phase * 4));
          }
        }
      }
      this.source?.stop();
      this.source = ctx.createBufferSource(); this.source.buffer = buffer;
      this.source.connect(ctx.destination); this.source.start();
    } catch { /* Audio may be unavailable; the visual ceremony remains usable. */ }
  }

  mute() { this.audio?.suspend(); }
  dispose() { this.audio?.close(); }
}

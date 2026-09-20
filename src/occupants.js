import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { seededRandom, walkingPosition } from './simulation.js';

/** Blender-imported CC0 character clips; shared meshes, independent skeletons. */
export class Occupants {
  constructor(scene, worker, chair, seats) {
    this.people = []; this.time = 0; this.cheering = false;
    const random = seededRandom(731);
    const clips = Object.fromEntries(['Idle', 'Walk', 'Sitting', 'Clapping'].map((name) => [name, worker.animations.find((a) => a.name.endsWith(`_${name}`))]));
    for (const [name, clip] of Object.entries(clips)) if (!clip) throw new Error(`Missing worker animation: ${name}`);
    chair.scene.updateMatrixWorld(true);
    chair.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      const instances = new THREE.InstancedMesh(geometry, obj.material, seats.length);
      const dummy = new THREE.Object3D();
      seats.forEach((seat, i) => {
        dummy.position.fromArray(seat.position); dummy.rotation.y = Math.PI;
        dummy.updateMatrix(); instances.setMatrixAt(i, dummy.matrix);
      });
      instances.castShadow = true; instances.receiveShadow = true; scene.add(instances);
    });
    const add = (position, kind, floor = 0, phase = 0) => {
      const root = clone(worker.scene);
      root.position.fromArray(position);
      root.rotation.y = Math.PI;
      root.userData.kind = kind;
      const shirt = ['#c9d9e6', '#506c8a', '#d6d0c1', '#76677b', '#465f65'][this.people.length % 5];
      const skin = ['#b78357', '#e4bc94', '#795032', '#cf9a73'][this.people.length % 4];
      root.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.castShadow = true; obj.receiveShadow = true;
        // Slight clothing variation without duplicating skinning geometry.
        obj.material = obj.material.clone();
        if (/shirt/i.test(obj.material.name)) { obj.material.color.set(shirt); obj.material.vertexColors = false; }
        if (/skin/i.test(obj.material.name)) obj.material.color.set(skin);
        if (/pants/i.test(obj.material.name)) obj.material.color.set(this.people.length % 2 ? '#252d40' : '#44454b');
      });
      const mixer = new THREE.AnimationMixer(root);
      const actions = Object.fromEntries(Object.entries(clips).map(([name, clip]) => [name, mixer.clipAction(clip)]));
      const base = kind === 'seated' ? 'Sitting' : kind === 'walker' ? 'Walk' : 'Idle';
      actions[base].play(); mixer.update(random() * 3);
      const person = { root, mixer, actions, base, kind, floor, phase, speed: .045 + random() * .014 };
      this.people.push(person); scene.add(root);
      return person;
    };
    // Occupied desks on every office floor, with clear empty seats between groups.
    seats.forEach((seat, i) => { if (i % 3 === 0) add(seat.position, 'seated', seat.floor); });
    for (let floor = 1; floor <= 7; floor++) {
      for (let i = 0; i < 5; i++) {
        const x = [-4.3, -3.1, 2.5, 3.9, 5.3][i];
        add([x, floor * 4.1, 14.65 + random() * .45], 'observer', floor);
      }
      // A colleague moving in each lift lobby, behind the spectators.
      add([0, floor * 4.1, 21], 'liftWalker', floor, random() * Math.PI * 2);
    }
    for (let i = 0; i < 12; i++) {
      const phase = i / 12 * Math.PI * 2;
      add(walkingPosition(phase, i % 3), 'walker', 0, phase);
    }
    for (let i = 0; i < 4; i++) add([-1.8 + i * 1.1, 0, 15.5], 'observer');
    for (const p of this.people.filter((p) => p.kind === 'liftWalker')) { p.actions.Idle.stop(); p.actions.Walk.play(); p.base = 'Walk'; }
  }

  update(dt, animate, celebrating) {
    if (celebrating !== this.cheering) {
      this.cheering = celebrating;
      for (const p of this.people) {
        if (p.kind === 'seated') continue;
        const from = p.actions[celebrating ? p.base : 'Clapping'];
        const to = p.actions[celebrating ? 'Clapping' : p.base];
        from.fadeOut(.4); to.reset().setEffectiveWeight(1).fadeIn(.4).play();
      }
    }
    if (animate) this.time += dt;
    for (const p of this.people) {
      if (animate) p.mixer.update(dt);
      if (!animate || celebrating) continue;
      if (p.kind === 'walker') {
        const phase = p.phase + this.time * p.speed;
        const position = walkingPosition(phase, this.people.indexOf(p) % 3);
        const next = walkingPosition(phase + .01, this.people.indexOf(p) % 3);
        p.root.position.fromArray(position);
        p.root.rotation.y = Math.atan2(next[0] - position[0], next[2] - position[2]);
      } else if (p.kind === 'liftWalker') {
        const phase = p.phase + this.time * .18;
        p.root.position.set(.55 * Math.cos(phase), p.floor * 4.1, 20.8 + 3.4 * Math.sin(phase));
        p.root.rotation.y = Math.atan2(-.55 * Math.sin(phase), 3.4 * Math.cos(phase));
      }
    }
  }

  get counts() {
    return Object.fromEntries(['seated', 'observer', 'walker', 'liftWalker'].map((kind) => [kind, this.people.filter((p) => p.kind === kind).length]));
  }
}

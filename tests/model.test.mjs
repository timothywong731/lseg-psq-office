import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIEWS } from '../src/views.js';
import { MarketState, seededRandom, walkingPosition } from '../src/simulation.js';

const file = readFileSync(new URL('../public/models/paternoster.glb', import.meta.url));
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength + 8;
const component = (name) => gltf.nodes.find((node) => node.extras?.component === name);

function positions(name) {
  const node = component(name);
  assert.ok(node, `Missing ${name}`);
  const accessor = gltf.accessors[gltf.meshes[node.mesh].primitives[0].attributes.POSITION];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const offset = binStart + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count }, (_, i) => [0, 1, 2].map((axis) => file.readFloatLE(offset + i * (bufferView.byteStride ?? 12) + axis * 4)));
}

test('the exported Blender model is a complete, self-contained GLB', () => {
  assert.equal(file.toString('ascii', 0, 4), 'glTF');
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length);
  assert.match(gltf.asset.generator, /Blender/);
  assert.ok(gltf.meshes.length >= 70);
  assert.ok(gltf.images.length >= 3);
  assert.ok(gltf.images.every((image) => image.bufferView !== undefined && !image.uri));
  assert.ok(file.length < 5_000_000, 'Model must stay suitable for mobile downloads');
});

test('the actual glass-wall geometry forms a trapezium, not a rectangle', () => {
  const vertices = positions('GlassWalls');
  const far = vertices.filter((p) => p[2] < -13.9);
  const near = vertices.filter((p) => p[2] > 13.9);
  const width = (items) => Math.max(...items.map((p) => p[0])) - Math.min(...items.map((p) => p[0]));
  assert.ok(width(near) > width(far) * 1.5, 'Launch end should be materially wider than entrance end');
});

test('the stair rises toward the launch balcony on the left side', () => {
  const vertices = positions('StairTreads');
  assert.ok(vertices.every((p) => p[0] < 0));
  const near = vertices.filter((p) => p[2] > 12);
  const far = vertices.filter((p) => p[2] < -4);
  assert.ok(Math.max(...near.map((p) => p[1])) > 3.8);
  assert.ok(Math.max(...far.map((p) => p[1])) < .6);
});

test('1F market-launch button sits between the atrium and the lift lobby', () => {
  const button = positions('LaunchButton');
  const lifts = positions('LiftDoors');
  assert.ok(button.every((p) => p[1] > 5 && p[1] < 5.5));
  assert.ok(button.every((p) => p[2] > 14 && p[2] < 15));
  assert.ok(lifts.every((p) => p[2] > 17));
  assert.ok(component('LaunchParapetSteel'));
});

test('viewpoints and ticker texture coordinates are available', () => {
  for (const name of ['atrium', 'entrance', 'balcony', 'launch']) {
    assert.equal(VIEWS[name].position.length, 3);
    assert.ok(VIEWS[name].position.every(Number.isFinite));
  }
  const node = component('TickerBands');
  const primitive = gltf.meshes[node.mesh].primitives[0];
  assert.ok(primitive.attributes.TEXCOORD_0 !== undefined);
  assert.ok(gltf.materials[primitive.material].pbrMetallicRoughness.baseColorTexture);
});

test('six lift doorways exist on every floor from ground through 7F', () => {
  const doors = positions('LiftDoors');
  for (let floor = 0; floor <= 7; floor++) {
    const level = doors.filter((p) => p[1] >= floor * 4.1 - .01 && p[1] < floor * 4.1 + 2.6);
    assert.ok(level.length > 0, `Missing lift bank on floor ${floor}`);
    for (const side of [-1, 1]) for (const z of [18.8, 22, 25]) {
      const leaf = level.filter((p) => Math.sign(p[0]) === side && Math.abs(p[2] - z) < 1);
      assert.ok(leaf.length >= 16, `Missing doorway at ${floor}, ${side}, ${z}`);
    }
  }
  const openings = positions('LiftLobbyWall');
  assert.ok(openings.filter((p) => p[1] < 30 && p[1] > 6).length > 0);
});

test('reception is on one side and staircase separates glass from solid wall', () => {
  assert.ok(positions('ReceptionDesk').every((p) => p[0] > 0));
  assert.ok(component('ReceptionVideoWall'));
  assert.ok(component('StairSolidWall'));
  assert.ok(component('StairSeparator'));
  const glass = positions('StairGlass');
  const wall = positions('StairSolidWall');
  assert.ok(Math.min(...glass.map((p) => p[0])) > Math.max(...wall.map((p) => p[0])));
  const seats = JSON.parse(readFileSync(new URL('../public/models/seating.json', import.meta.url)));
  assert.equal(seats.length, 98);
  for (let f = 1; f <= 7; f++) assert.equal(seats.filter((s) => s.floor === f).length, 14);
});

test('worker GLB contains actual walking, sitting and clapping animation channels', () => {
  const b = readFileSync(new URL('../public/models/worker.glb', import.meta.url));
  const g = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
  for (const name of ['Walk', 'Sitting', 'Clapping']) {
    const animation = g.animations.find((a) => a.name.endsWith(`_${name}`));
    assert.ok(animation?.channels.length > 10, `${name} must animate the skeleton`);
  }
  assert.ok(g.skins.length > 0);
});

test('market state toggles both ways and celebration expires without changing state', () => {
  const state = new MarketState();
  assert.equal(state.open, false); assert.equal(state.celebrating, false);
  assert.equal(state.toggle(), true); assert.equal(state.celebrating, true);
  state.update(8.1); assert.equal(state.celebrating, false); assert.equal(state.open, true);
  assert.equal(state.toggle(), false); assert.equal(state.celebrating, true);
  assert.equal(state.count, 2);
  const a = seededRandom(), b = seededRandom();
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  for (let i = 0; i < 100; i++) {
    const [x, y, z] = walkingPosition(i / 100 * Math.PI * 2, 2);
    assert.equal(y, 0); assert.ok(x > -1 && x < 4 && z > -10 && z < 12);
    assert.ok(Math.hypot(x, z + 2.5) > 1.5, 'Walkers avoid the market cube');
  }
});

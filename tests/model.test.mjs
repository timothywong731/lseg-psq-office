import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIEWS } from '../src/views.js';

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

import { InteriorViewer } from './viewer.js';
import { VIEWS, POINTS } from './views.js';

const $ = (selector) => document.querySelector(selector);
let viewer;
let currentView = Object.hasOwn(VIEWS, location.hash.slice(1)) ? location.hash.slice(1) : 'atrium';
let tourTimer;
let tourActive = false;
let toastTimer;

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}

function stopTour() {
  clearTimeout(tourTimer);
  tourActive = false;
  $('#tour').setAttribute('aria-pressed', 'false');
  $('#tour-label').textContent = 'Take a guided tour';
  $('.play-icon').textContent = '\u25b7';
}

function showView(name, { fromTour = false, animate = true } = {}) {
  if (!Object.hasOwn(VIEWS, name)) return;
  if (!fromTour) stopTour();
  currentView = name;
  viewer?.setView(name, animate);
  const view = VIEWS[name];
  $('#view-kicker').textContent = view.kicker;
  $('#view-title').textContent = view.title;
  $('#view-description').textContent = view.description;
  $('#level-label').textContent = view.level;
  $('#plan-marker').setAttribute('transform', view.plan);
  document.querySelectorAll('button[data-view]').forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#annotation-card').hidden = true;
  history.replaceState(null, '', `#${name}`);
}

function setControlsEnabled(enabled) {
  document.querySelectorAll('.view-button, #tour, #reset, #snapshot, #daylight, #roof, #annotations, #ticker, #launch-view').forEach((el) => { el.disabled = !enabled; });
}

function showError(error) {
  console.error(error);
  stopTour();
  $('#loading').hidden = true;
  $('#error').hidden = false;
  $('#error-message').textContent = /WebGL|graphics|context/i.test(error.message)
    ? 'Your browser could not start the 3D view. Enable hardware acceleration or try a current desktop browser.'
    : 'The model could not be downloaded. Check your connection and try again.';
  $('#status-text').textContent = 'View unavailable';
  $('.model-status').classList.remove('ready');
  setControlsEnabled(false);
}

async function boot() {
  setControlsEnabled(false);
  try {
    viewer = new InteriorViewer($('#scene'), {
      onProgress: (progress) => { $('#load-progress').style.width = `${Math.round(progress * 100)}%`; },
      onInteraction: stopTour,
      onError: showError,
    });
    showView(currentView, { animate: false });
    await viewer.load();
    viewer.setRoof($('#roof').checked);
    viewer.setAnnotations($('#annotations').checked);
    $('#ticker').checked = viewer.tickerPlaying;
    $('#loading').classList.add('done');
    setTimeout(() => { $('#loading').hidden = true; }, 550);
    $('#status-text').textContent = 'Interactive model';
    $('.model-status').classList.add('ready');
    setControlsEnabled(true);
    // A read-only diagnostics snapshot allows browser tests to check real rendering state.
    window.getViewerState = () => ({ ready: viewer.ready, view: viewer.currentView, position: viewer.camera.position.toArray(), target: viewer.controls.target.toArray(), roof: viewer.roofObjects.every((o) => o.visible), tickerPlaying: viewer.tickerPlaying, tickerOffset: [...viewer.tickerTextures][0]?.offset.x, meshCount: viewer.meshes.length, renderCalls: viewer.renderer.info.render.calls });
  } catch (error) { showError(error); }
}

document.querySelectorAll('button[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('.brand').addEventListener('click', (event) => { event.preventDefault(); showView('atrium'); });
$('#daylight').addEventListener('input', (event) => {
  viewer?.setDaylight(event.target.value);
  $('#daylight-value').textContent = event.target.value < 25 ? 'Evening' : event.target.value < 60 ? 'Soft light' : 'Daylight';
});
$('#roof').addEventListener('change', (event) => viewer?.setRoof(event.target.checked));
$('#annotations').addEventListener('change', (event) => {
  viewer?.setAnnotations(event.target.checked);
  if (!event.target.checked) $('#annotation-card').hidden = true;
});
$('#ticker').addEventListener('change', (event) => { if (viewer) viewer.tickerPlaying = event.target.checked; });
$('#launch-view').addEventListener('click', () => showView('launch'));
$('#reset').addEventListener('click', () => { showView(currentView); toast('Camera reset'); });
$('#snapshot').addEventListener('click', async () => {
  try { await viewer.snapshot(); toast('View saved as PNG'); } catch { toast('The image could not be saved. Please try again.'); }
});
$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($('#viewport').requestFullscreen) await $('#viewport').requestFullscreen();
    else toast('Fullscreen is not supported by this browser.');
  } catch { toast('Fullscreen is not available in this browser.'); }
});
document.addEventListener('fullscreenchange', () => {
  $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
});
$('#tour').addEventListener('click', () => {
  if (tourActive) { stopTour(); return; }
  tourActive = true;
  $('#tour').setAttribute('aria-pressed', 'true');
  $('#tour-label').textContent = 'Pause tour';
  $('.play-icon').textContent = '\u2161';
  const sequence = ['atrium', 'entrance', 'balcony', 'launch'];
  let i = 0;
  function next() {
    if (!tourActive) return;
    showView(sequence[i], { fromTour: true });
    i++;
    tourTimer = setTimeout(i < sequence.length ? next : stopTour, 8000);
  }
  next();
});
document.querySelectorAll('[data-point]').forEach((button) => button.addEventListener('click', () => {
  const point = POINTS[button.dataset.point];
  $('#annotation-kicker').textContent = point.kicker;
  $('#annotation-title').textContent = point.title;
  $('#annotation-copy').textContent = point.copy;
  $('#annotation-card').hidden = false;
  $('#close-annotation').focus({ preventScroll: true });
}));
$('#close-annotation').addEventListener('click', () => { $('#annotation-card').hidden = true; });
$('#about-button').addEventListener('click', () => { stopTour(); $('#about-dialog').showModal(); });
$('#close-about').addEventListener('click', () => $('#about-dialog').close());
$('#about-dialog').addEventListener('click', (event) => { if (event.target === $('#about-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
$('#retry').addEventListener('click', () => location.reload());
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || $('#about-dialog').open || !viewer?.ready) return;
  const name = { 1: 'atrium', 2: 'entrance', 3: 'balcony', 4: 'launch' }[event.key];
  if (name) { event.preventDefault(); showView(name); }
  if (event.key.toLowerCase() === 'r') showView(currentView);
  if (event.key === 'Escape') { stopTour(); $('#annotation-card').hidden = true; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopTour(); });
boot();


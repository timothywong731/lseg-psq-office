import * as THREE from 'three';

function surface(width, height) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false;
  return { canvas, ctx: canvas.getContext('2d'), texture };
}

/** Canvas video walls retain UVs and physical sizes from the Blender model. */
export class MarketScreens {
  constructor(model) {
    this.time = 0; this.frame = 0; this.last = -1;
    this.board = surface(1024, 768); this.banner = surface(1536, 160);
    this.cube = surface(512, 512); this.reception = surface(1024, 384);
    this.desktop = surface(512, 288); this.news = surface(4096, 128);
    this.materials = [];
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      const display = ({ MarketBoards: this.board, LobbyMarketScreen: this.board,
        LaunchBanner: this.banner, MarketCubeScreens: this.cube,
        ReceptionVideoWall: this.reception, DesktopScreens: this.desktop, NewsBands: this.news })[obj.userData.component];
      if (!display) return;
      obj.material = new THREE.MeshBasicMaterial({ map: display.texture, side: THREE.DoubleSide, toneMapped: false });
      this.materials.push(obj.material);
    });
    this.news.texture.wrapS = THREE.RepeatWrapping;
    const c = this.news.ctx;
    c.fillStyle = '#11151c'; c.fillRect(0, 0, 4096, 128);
    c.fillStyle = '#f1f2ff'; c.font = '32px Arial';
    c.fillText('LSEG   •   Paternoster Square   /   Connecting the world’s markets   •   Welcome to the market ceremony   •   Illustrative market news', 35, 76);
    this.news.texture.needsUpdate = true;
  }

  update(dt, market, animate, reducedMotion) {
    if (animate) this.time += dt;
    if (animate) this.news.texture.offset.x = (this.news.texture.offset.x + dt * .013) % 1;
    const tick = Math.floor(this.time * 10);
    const key = `${tick}:${market.count}:${market.celebrating}`;
    if (key === this.last) return;
    this.last = key; this.frame++;
    const t = this.time, green = '#9fe94a', red = '#ff5f75';
    const accent = market.open ? '#74e7ba' : '#a9b9ff';
    const c = this.board.ctx;
    c.fillStyle = '#080b13'; c.fillRect(0, 0, 1024, 768);
    c.fillStyle = '#eff4ff'; c.font = 'bold 62px Arial'; c.fillText('LSEG', 40, 83);
    c.font = '24px Arial'; c.fillStyle = accent; c.fillText(market.label.toUpperCase(), 620, 73);
    c.fillStyle = '#afb6cc'; c.font = '17px Arial'; c.fillText('WORLD MARKETS  /  PATERNOSTER SQUARE', 44, 124);
    c.strokeStyle = '#303848'; c.beginPath(); c.moveTo(40, 147); c.lineTo(984, 147); c.stroke();
    const names = ['FTSE 100', 'FTSE 250', 'FTSE ALL', 'LSEG.L', 'SHEL.L', 'AZN.L', 'HSBA.L', 'ULVR.L', 'RIO.L', 'BP.L', 'VOD.L', 'NG.L'];
    names.forEach((name, i) => {
      const y = 201 + i * 39, up = i % 3 !== 1;
      c.font = 'bold 19px Arial'; c.fillStyle = '#d7deeb'; c.fillText(name, 44, y);
      c.fillStyle = up ? green : red;
      c.font = '18px monospace'; c.fillText((1042 + i * 821 + (market.open ? Math.sin(t * .3 + i) * 3 : 0)).toFixed(2), 207, y);
      c.fillText(`${up ? '+' : '-'}${(.13 + i * .07).toFixed(2)}%`, 328, y);
    });
    // Orbiting price trails echo the distinctive red/green market visualization.
    for (let k = 0; k < 24; k++) {
      const cy = 370 + Math.sin(k * .4 + t * .13) * 70;
      c.strokeStyle = k < 12 ? '#77b732aa' : '#c94355aa'; c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(731, cy + (k - 12) * 12, 65 + k * 7, 19 + k * 2, Math.sin(t * .15 + k) * .13, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = '#929fb8'; c.font = '16px Arial'; c.fillText('ILLUSTRATIVE PRICES • INTERACTIVE SPATIAL STUDY', 42, 732);
    if (market.celebrating) {
      const opacity = reducedMotion ? .95 : .72 + Math.sin(market.elapsed * Math.PI) * .20;
      c.fillStyle = `rgba(19,30,61,${opacity})`; c.fillRect(425, 570, 574, 116);
      c.fillStyle = accent; c.font = 'bold 45px Arial'; c.fillText(market.label.toUpperCase(), 446, 642);
    }
    const b = this.banner.ctx;
    b.fillStyle = '#151c45'; b.fillRect(0, 0, 1536, 160);
    b.fillStyle = '#fff'; b.font = 'bold 54px Arial'; b.fillText('LONDON STOCK EXCHANGE', 35, 101);
    b.fillStyle = accent; b.font = 'bold 46px Arial'; b.fillText(market.label.toUpperCase(), 1070, 101);
    const q = this.cube.ctx;
    q.fillStyle = '#0b1022'; q.fillRect(0, 0, 512, 512);
    q.fillStyle = market.open ? '#08786f' : '#862943';
    q.beginPath(); q.moveTo(0, 420); q.lineTo(512, 330); q.lineTo(512, 512); q.lineTo(0, 512); q.fill();
    q.fillStyle = '#fff'; q.font = 'bold 53px Arial'; q.fillText('LSEG', 55, 122);
    q.font = '24px Arial'; q.fillText('LONDON STOCK EXCHANGE', 55, 177);
    q.fillStyle = accent; q.font = 'bold 38px Arial'; q.fillText(market.label.toUpperCase(), 55, 260);
    q.font = '30px monospace'; q.fillText('10,642.31', 55, 315);
    const r = this.reception.ctx;
    r.fillStyle = '#eff1f6'; r.fillRect(0, 0, 1024, 384);
    r.fillStyle = '#202959'; r.font = 'bold 80px Arial'; r.fillText('LSEG', 48, 115);
    r.font = '40px Arial'; r.fillText('A world of possibilities.', 48, 201);
    r.font = '24px Arial'; r.fillText('Welcome to Paternoster Square', 48, 272);
    r.strokeStyle = '#839cd1';
    for (let i = 0; i < 12; i++) { r.beginPath(); r.arc(1000, 210, 80 + i * 17, 0, Math.PI * 2); r.stroke(); }
    const d = this.desktop.ctx;
    d.fillStyle = '#101726'; d.fillRect(0, 0, 512, 288);
    d.fillStyle = '#273550'; d.fillRect(0, 0, 512, 28);
    d.fillStyle = '#dce7ff'; d.font = '15px Arial'; d.fillText('WORKSPACE  /  MARKET OVERVIEW', 16, 20);
    for (let i = 0; i < 11; i++) {
      d.fillStyle = i % 3 ? '#7bcdab' : '#d78798'; d.fillRect(17, 50 + i * 18, 40 + (i * 29) % 125, 5);
      d.fillStyle = '#425773'; d.fillRect(250, 50 + i * 18, 225, 2);
    }
    d.strokeStyle = '#75bded'; d.beginPath();
    for (let i = 0; i < 45; i++) { const x = 250 + i * 5, y = 220 - i * 2 - Math.sin(i * .7 + t * .2) * 12; if (!i) d.moveTo(x, y); else d.lineTo(x, y); } d.stroke();
    for (const s of [this.board, this.banner, this.cube, this.reception, this.desktop]) s.texture.needsUpdate = true;
  }
}

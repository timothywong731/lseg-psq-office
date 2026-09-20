export const VIEWS = {
  atrium: {
    position: [3.8, 2.35, 10.8], target: [-0.8, 13.0, -5.5], fov: 70,
    kicker: '01 / THE CENTRAL SPACE', title: 'Looking up. Looking in.',
    description: 'Seven layers of glass frame a shared, light-filled heart.',
    level: 'GROUND LEVEL', plan: 'translate(82 45)',
  },
  entrance: {
    position: [3.3, 1.75, -10.5], target: [-0.3, 3.8, 7], fov: 69,
    kicker: '02 / A SENSE OF ARRIVAL', title: 'Where the city comes in.',
    description: 'Stone, steel and the market cube mark the threshold.',
    level: 'GROUND LEVEL', plan: 'translate(183 60) rotate(180)',
  },
  balcony: {
    position: [4.0, 10.15, 12.5], target: [-0.7, 4.1, -3.8], fov: 67,
    kicker: '03 / A DIFFERENT PERSPECTIVE', title: 'Above the everyday.',
    description: 'The galleries reveal the rhythm and scale of the atrium.',
    level: 'UPPER GALLERY', plan: 'translate(86 30) rotate(35)',
  },
  launch: {
    position: [1.55, 5.8, 16.35], target: [0, 5.0, 11.8], fov: 72,
    kicker: '04 / THE MARKET LAUNCH', title: 'A moment at the centre.',
    description: 'The 1F launch button sits above the atrium, in front of the lift lobby.',
    level: '1F · LAUNCH BALCONY', plan: 'translate(69 60)',
  },
};

export const POINTS = {
  cube: { position: [0, 3.4, -2.5], kicker: '01 / THE FOCAL POINT', title: 'The market cube', copy: 'A tilted display cube sits on a perforated steel pedestal. Its angular silhouette anchors the open floor. The display graphics here are illustrative.' },
  gallery: { position: [-5.5, 9.4, -1.8], kicker: '02 / THE ARCHITECTURE', title: 'Layered galleries', copy: 'Glass office fronts, slender mullions and metal fascia frame a tapered, trapezium-shaped void. The stair descends from the launch balcony along the left side when facing the far market screen.' },
  roof: { position: [0, 31.9, -2], kicker: '03 / THE DAYLIGHT', title: 'A canopy of light', copy: 'A fine steel grid supports the glazed roof. Daylight filters down through the full height of the building, giving each gallery a connection to the sky.' },
  launch: { position: [0, 5.35, 14.4], kicker: '04 / THE MARKET LAUNCH', title: 'The launch button', copy: 'The square engraved market-launch control is set into an angled brushed-metal console at the centre of the 1F balcony parapet, directly in front of the lift lobby.' },
};

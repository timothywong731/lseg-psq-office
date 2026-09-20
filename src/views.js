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
    position: [.9, 5.8, 16.35], target: [0, 5.0, 11.8], fov: 72,
    kicker: '04 / THE MARKET LAUNCH', title: 'A moment at the centre.',
    description: 'The 1F launch button sits above the atrium, in front of the lift lobby.',
    level: '1F · LAUNCH BALCONY', plan: 'translate(69 60)',
  },
  third: {
    position: [1.6, 14.0, 13.55], target: [-.4, 4.4, -3.0], fov: 68,
    kicker: '05 / THE THIRD FLOOR', title: 'The ceremony, from above.',
    description: 'The 3F gallery looks over the launch balcony, stair and market cube.',
    level: '3F · ATRIUM OVERLOOK', plan: 'translate(73 30) rotate(25)',
  },
  reception: {
    position: [3.4, 1.72, -3.1], target: [7.4, 1.4, -7], fov: 75,
    kicker: '06 / THE RECEPTION', title: 'A place to arrive.',
    description: 'A pale counter, navy frontage and a luminous video wall welcome visitors.',
    level: 'G/F · RECEPTION', plan: 'translate(150 76) rotate(-90)',
  },
  lifts: {
    position: [0, 5.75, 16.25], target: [0, 5.65, 25.4], fov: 78,
    kicker: '07 / BEHIND THE CEREMONY', title: 'Six lifts. Every floor.',
    description: 'Directly behind the launch button, three lifts line each side of the lobby.',
    level: '1F · LIFT LOBBY', plan: 'translate(49 60) rotate(180)',
  },
  office: {
    position: [9.3, 9.9, 3.2], target: [7.9, 9.2, .1], fov: 66,
    kicker: '08 / THE WORKING FLOOR', title: 'Life behind the glass.',
    description: 'Dual monitors, keyboards and animated colleagues fill the working floors.',
    level: '2F · WORKSPACE', plan: 'translate(116 97) rotate(-50)',
  },
  drone: {
    position: [2.8, 8, 11], target: [0, 5.1, -1.5], fov: 72,
    kicker: '09 / CONTINUOUS FLIGHT', title: 'A slow journey through light.',
    description: 'A continuous 90-second flight rises through the atrium. Drag to take control.',
    level: 'ATRIUM · DRONE VIEW', plan: 'translate(105 60)',
  },
};

export const POINTS = {
  cube: { position: [0, 3.4, -2.5], kicker: '01 / THE FOCAL POINT', title: 'The market cube', copy: 'A tilted display cube sits on a perforated steel pedestal. Its angular silhouette anchors the open floor. The display graphics here are illustrative.' },
  gallery: { position: [-5.5, 9.4, -1.8], kicker: '02 / THE ARCHITECTURE', title: 'Layered galleries', copy: 'Glass office fronts, slender mullions and metal fascia frame a tapered, trapezium-shaped void. The stair descends from the launch balcony along the left side when facing the far market screen.' },
  roof: { position: [0, 31.9, -2], kicker: '03 / THE DAYLIGHT', title: 'A canopy of light', copy: 'A fine steel grid supports the glazed roof. Daylight filters down through the full height of the building, giving each gallery a connection to the sky.' },
  launch: { position: [0, 5.35, 14.4], kicker: '04 / THE MARKET LAUNCH', title: 'The launch button', copy: 'The square engraved market-launch control is set into an angled brushed-metal console at the centre of the 1F balcony parapet, directly in front of the lift lobby.' },
};

// This file contains vanilla javascript code based on the predator-prey simulation 
// but adapted to a carrying capacity mode.

// I made the Tule Elk using Gemini Pro
const elkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="42 17 261 266" width="100%" height="100%">
  <title>California Tule Elk Outline - Full Space</title>
  
  <polygon points="
      300,90 
      285,80 
      265,75 
      255,70 
      265,40 
      252,52 
      240,20 
      232,48 
      205,25 
      220,60 
      195,60 
      235,75 
      220,80 
      230,88 
      200,110 
      170,105 
      110,110 
      60,125 
      45,140 
      55,150 
      50,175 
      60,230 
      55,280 
      70,280 
      80,220 
      85,175 
      140,180 
      160,220 
      155,280 
      170,280 
      175,210 
      190,165 
      230,140 
      260,115 
      290,100" 
    fill="#e8caa2" 
    stroke="#e8caa2" 
    stroke-width="4" 
    stroke-linejoin="round" 
  />
</svg>
`;

const encodeSvg = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const elkImage = encodeSvg(elkSvg);

const elkEnergy = 10;
const elkReproduceChance = 0.001;
const elkEnergyLoss = 0.02;

const maxHydration = 10; // Maximum water a grid square can hold
const minHydration = 0;   // Minimum water

globals.set("elkCount", 0);

// Create widgets
addWidget({
  data: {
    label: "Elk Energy from Grass",
    min: 1,
    max: 20
  },
  defaultValue: 3,
  globalKey: "elkEnergyFromGrass",
  type: "slider"
});
addWidget({
  data: {
    label: "Elk Energy from Grass"
  },
  globalKey: "elkEnergyFromGrass",
  type: "readout"
});
addWidget({
  data: {
    label: "Elk"
  },
  defaultValue: 0,
  globalKey: "elkCount",
  type: "readout"
});

function setup() {
}

sim.beforeTick = () => {
  // Execute queued onClick actions. We handle mouse clicks here because
  // Atomic Agents Vis can't handle adding/removing agents outside of a tick function.
  if (onClickPendingEvent) {
    onClick(onClickPendingEvent);
    onClickPendingEvent = undefined;
  }
}

sim.afterTick = () => {
};

// set up squares (patches)
for (let x = 0; x < sim.width / sim.gridStep; x++) {
  for (let y = 0; y < sim.height / sim.gridStep; y++) {
    const square = sim.squareAt(x, y);
    square.zIndex = -Infinity;

    // Set initial grass level
    const grassLevel = Math.random() > .75 ? 1 : 0;
    const hydration = Math.random() * maxHydration; // Random starting water level
    
    square.state = { grassLevel, hydration };

    // Color squares based on grass level
    square.vis({ tint: s => s.state.grassLevel === 1 ? "0x00cc00" : "0x996600" });
  }
}

// elk
function create_a_elk(props) {
  const { color, energy, x, y } = props ?? {};
  const agent = new AA.Actor();
  agent.radius = 10;
  agent.vel = AA.Vector.randomAngle(1);
  agent.vis({ image: elkImage, tint: color });
  agent.label("elk", true);
  agent.state = { energy: energy ?? elkEnergy };
  agent.x = x ?? globals.get("mouseX") ?? Math.random() * sim.width;
  agent.y = y ?? globals.get("mouseY") ?? Math.random() * sim.height;

  agent.addTo(sim);
  globals.set("elkCount", globals.get("elkCount") + 1);
  return agent;
}
function create_elk(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_elk();
    if (callback) callback(agent);
  }
}

// actors bounce off the simulation boundary
sim.interaction.set("boundary-bounce", {
  group1: sim,
  group2: sim.actors,
  behavior: "bounce"
});

setup();

// Store onClick actions to be executed during the next tick
let onClickPendingEvent = undefined;

function _onClick(event) {
  globals.set("mouseX", event.data.global.x);
  globals.set("mouseY", event.data.global.y);
  onClickPendingEvent = event;
}

sim.vis({
  background: true,
  click: _onClick
});
// This file contains vanilla javascript code that runs the predator-prey simulation when it is copied and pasted
// into the simulation code area for the blockly or agent simulation interactives.

const sheepSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Circles (color -1 -> #FFFFFF) -->
  <circle cx="247" cy="109" r="44" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="151" cy="146" r="81" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="210" cy="165" r="60" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygon (color -7500403 -> #8D8D8D), filled no stroke -->
  <polygon
    points="218,120 240,165 255,165 278,120"
    fill="#8D8D8D" stroke="none"
  />

  <!-- Circle (ear) -->
  <circle cx="247.5" cy="105.5" r="33.5" fill="#8D8D8D" stroke="none" />

  <!-- Rectangles (legs) -->
  <rect x="164" y="223" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />
  <rect x="65"  y="221" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygons (legs) -->
  <polygon
    points="45,285 30,285 30,240 15,195 45,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />
  <polygon
    points="195,285 210,285 210,240 240,210 195,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />

  <!-- Large body circle -->
  <circle cx="78" cy="158" r="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Small head/ear polygons -->
  <polygon
    points="276,85 285,105 302,99 294,83"
    fill="#8D8D8D" stroke="none"
  />
  <polygon
    points="219,85 210,105 193,99 201,83"
    fill="#8D8D8D" stroke="none"
  />
</svg>
`;

// I made the Tule Elk using Gemini Pro
const elkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="42 17 261 266" width="100%" height="100%">
  <title>California Tule Elk Outline - Full Space</title>
  
  <polygon 
    points="
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
      290,100
    " 
    fill="#e8caa2" 
    stroke="#e8caa2" 
    stroke-width="4" 
    stroke-linejoin="round" 
  />
</svg>
`;

const wolfSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Polygon -16777216 true false -->
  <!-- color = #000000 (black), filled, no stroke -->
  <polygon
    points="253,133 245,131 245,133"
    fill="#000000"
    stroke="none"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="2,194 13,197 30,191 38,193 38,205 20,226 20,257 27,265 38,266 40,260 31,253 31,230 60,206 68,198 75,209 66,228 65,243 82,261 84,268 100,267 103,261 77,239 79,231 100,207 98,196 119,201 143,202 160,195 166,210 172,213 173,238 167,251 160,248 154,265 169,264 178,247 186,240 198,260 200,271 217,271 219,262 207,258 195,230 192,198 210,184 227,164 242,144 259,145 284,151 277,141 293,140 299,134 297,127 273,119 270,105"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
    stroke-linejoin="round"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="-1,195 14,180 36,166 40,153 53,140 82,131 134,133 159,126 188,115 227,108 236,102 238,98 268,86 269,92 281,87 269,103 269,113"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
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
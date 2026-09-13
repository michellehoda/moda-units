

addWidget({
  type: "readout",
  globalKey: "liquidLevel",
  defaultValue: 0,
  data: {
    label: "Liquid Level [ADT]"
  }
});

addWidget({
  type: "readout",
  globalKey: "avgEnergy",
  defaultValue: 0,
  data: {
    label: "Average Energy [SST]"
  }
});

addWidget({
  type: "readout",
  globalKey: "moleculeCount",
  defaultValue: 0,
  data: {
    label: "Molecule Count"
  }
});

addWidget({
  data: {
    label: "tick"
  },
  defaultValue: 0,
  globalKey: "tickValue",
  type: "readout"
});

/*
 * Solar energy intensity.
 * Controls how much energy is added
 * to molecules near the ocean surface.
 */
addWidget({
  type: "slider",
  globalKey: "solarEnergy",
  defaultValue: 0,
  data: {
    label: "Solar Energy",
    min: 0,
    max: 20,
    step: 5,
    showReadout: true
  }
});

addWidget({
  type: "slider",
  globalKey: "showHeatMap",
  defaultValue: 0,
  data: {
    label: "Show Heat Map",
    min: 0,
    max: 1,
    step: 1
  }
});

let surfaceLevel;
let solarEnergy;
const SOLAR_LAYER_DEPTH = 30;

/*
 * Visual solar energy source.
 * Represents uniform solar radiation
 * reaching the entire ocean surface.
 */
const solarZone = new AA.Zone({
  indexLimits: [
    sim.xMinIndex,
    sim.xMaxIndex,
    0,
    1
  ]
});

solarZone.vis({
  tint: 0xffcc33
});
solarZone.addTo(sim);

/*
* Ocean geometry.
* The liquid occupies the full horizontal width
* of the simulation.
* Horizontal movement is periodic through wrapX.
* Only the ocean floor remains as a rigid boundary.
*/
const OCEAN = {
  top: 40,
  bottom: 540
};

/*

* Convert the bottom position into a grid index.
* Used only for visual rendering of the ocean floor.
*/
const bottomIndex =
  Math.floor(OCEAN.bottom / sim.gridStep);

/*
* Visual ocean floor.
*/
const bottomWall = new AA.Zone({
  indexLimits: [
    sim.xMinIndex,
    sim.xMaxIndex,
    bottomIndex,
    bottomIndex + 1
  ]
});

bottomWall.vis({ tint: 0x666666 });
bottomWall.addTo(sim);

/*
* Maps molecular energy to a color.
*/
function energyColor(energy) {

  if (energy <= 2) return 0x3399FF; // Blue
  if (energy <= 4) return 0x00FFFF; // Cyan
  if (energy <= 6) return 0x00FF00; // Green
  if (energy <= 8) return 0xFFFF00; // Yellow

  return 0xFF0000; // Red
}

/*
* Creates a single liquid molecule.
*/
function createMolecule(x, y) {

  const m = new AA.Actor({
    x,
    y,
    radius: 3,
    mass: 1,
    maxSpeed: 1.5,
    wrapX: true
  });

  m.label("molecule", true);

  /*
  * Energy represents molecular energy.
  */
  m.state = {
    energy: 1
  };

  m.vis({
    tint: () => {
      const showHeatMap =
        globals.get("showHeatMap") ?? 0;

      return showHeatMap
        ? energyColor(m.state.energy)
        : 0x3399FF;
    }
  });

  m.addTo(sim);

  return m;
}

/*
* Cohesion force.
* Keeps molecules weakly connected.
*/
sim.interaction.set("liquid-attract", {
  group1: () => sim.withLabel("molecule"),
  behavior: "attract",
  strength: 0.01,
  off: 8
});

/*
* Short-range repulsion.
* Prevents excessive overlap.
*/
sim.interaction.set("liquid-repel", {
  group1: () => sim.withLabel("molecule"),
  behavior: "repel",
  strength: 0.1,
  off: 8
});

sim.beforeTick = () => {

  const molecules =
    [...sim.withLabel("molecule")];

  if (molecules.length === 0) {
    return;
  }

  /*
  * Estimate liquid level using the
  * highest 5% of molecules.
  */
  const ys =
    molecules.map(m => m.y);

  ys.sort((a, b) => a - b);

  const index =
    Math.floor(ys.length * 0.05);

  surfaceLevel = ys[index];

  /*
  * Liquid height measured from
  * the ocean floor.
  */
  const level =
    OCEAN.bottom - surfaceLevel;

  /*
  * Average molecular energy.
  */
  const avgEnergy =
    molecules.reduce(
      (sum, m) => sum + m.state.energy,
      0
    ) / molecules.length;

  /*
  * Update UI widgets.
  */
  globals.set(
    "liquidLevel",
    Math.round(level)
  );

  globals.set(
    "avgEnergy",
    avgEnergy.toFixed(2)
  );

  globals.set(
    "tickValue",
    sim.tickIndex
  );

  globals.set(
    "moleculeCount",
    molecules.length
  );

  solarEnergy =
    globals.get("solarEnergy") ?? 0;

  sim.withLabel("molecule").forEach(m => {

    /*
     * Gravity.
     */
    m.vel.y += 0.001;

    /*
     * Global damping.
     */
    m.vel.mult(0.98);

    /*
     * Safety clamp.
     */
    m.state.energy =
      Math.max(
        0.1,
        Math.min(
          m.state.energy,
          20
        )
      );

    /*
     * Simple surface tension.
     * Molecules that move too far above
     * the liquid surface are gently pulled
     * back toward the main liquid body.
     */
    if (
      surfaceLevel !== undefined &&
      m.y < surfaceLevel - 30
    ) {
      m.vel.y += 0.02;
    }

    /*
     * Ocean floor boundary.
     *
     * Horizontal boundaries are not needed
     * because molecules use wrapX.
     */
    if (m.y > OCEAN.bottom - m.radius) {
      m.y = OCEAN.bottom - m.radius;
      m.vel.y = -Math.abs(m.vel.y);
    }
  });
};

sim.vis({
  background: true,
  tint: 0xffffff
});

setup();

//* here is the decomposed code for Blockly action blocks

// block name: get-heat-from-source
// Solar heating. Molecules in the upper layer of the ocean receive energy directly from solar radiation.
if (
  solarEnergy > 0 &&
  surfaceLevel !== undefined &&
  agent.y <= surfaceLevel + SOLAR_LAYER_DEPTH
) {
  agent.state.energy += solarEnergy * 0.005;;
}

// block name: move
// Thermal agitation. Higher energy produces stronger random molecular motion.
agent.vel.add(
  AA.Vector.randomAngle(
    0.03 * Math.sqrt(agent.state.energy)
  )
);

// block name: transfer heat
// Heat transfer between neighboring molecules.
agent.neighbors(12, "actor").forEach(n => {

  if (!n.label("molecule")) return;

  const delta =
    agent.state.energy -
    n.state.energy;

  const transfer =
    delta * 0.1;

  agent.state.energy -= transfer;
  n.state.energy += transfer;
});

// block name: cool down
// Passive cooling toward ambient energy.
agent.state.energy +=
  (1 - agent.state.energy) * 0.0005;

// block name: send energy
{
  let amount =
    Math.abs(agent.state.energy - n.state.energy) * 0.1;

  agent.state.energy -= amount;
  n.state.energy += amount;
}

// block name: recieve energy
{
  let amount =
    Math.abs(agent.state.energy - n.state.energy) * 0.1;

  agent.state.energy += amount;
  n.state.energy -= amount;
}

// block name: transfer heat unpackable 1
agent.neighbors(12, "actor").forEach(n => {

  if (!n.label("molecule")) return;

  ${ CHILDBLOCKS }
});

// block name: transfer heat unpackable 2
agent.neighbors(12, "actor").forEach(n => {

  if (!n.label("molecule")) return;

  ${ CHILDBLOCKS }
});

// block name: recieve energy from source
if (solarEnergy > 0) {
  agent.state.energy += solarEnergy * 0.005;
}

// block name: create-water-particles
// Initial ocean volume. Molecules occupy the entire horizontal width and the lower 200 pixels of the simulation.
for (
  let x = 7;
  x < sim.width;
  x += 14
) {
  for (
    let y = OCEAN.bottom - 200;
    y < OCEAN.bottom;
    y += 14
  ) {
    createMolecule(x, y);
  }
}

// block name: send energy by
{
  let amount =
    Math.abs(agent.state.energy - n.state.energy) * ${ RATE } / 100;

  agent.state.energy -= amount;
  n.state.energy += amount;
}

// block name: recieve energy by
{
  let amount =
    Math.abs(agent.state.energy - n.state.energy) * ${ RATE } / 100;

  agent.state.energy += amount;
  n.state.energy -= amount;
}
// This file contains the predator prey simulation, broken into parts that can be entered into different parts
// of the blockly interactive interface.

/*** Grow grass */
sim.squares.forEach(square => {
  if (square.state.hydration > 10) {
    square.state.grassLevel = 1;
  }
    if (square.state.hydration == 0) {
    square.state.grassLevel = 0;
  }
});
/*** End grow grass */

/*** Reduce energy */
agent.state.energy = agent.state.energy - ${amount};
/*** End reduce energy */

/*** No more energy */
agent.state.energy <= 0
/*** End no more energy */

/*** Die */
const globalKey = "elkCount";
globals.set(globalKey, globals.get(globalKey) - 1);
agent.remove();
/*** End die */

/*** Move */
agent.vel.turn(Math.random() * Math.PI / 4 - Math.PI / 8);
/*** End move */

/*** Reproduce */
if (agent.state.energy > ${amount}) {
  create_a_elk({ energy: agent.state.energy / 2, x: agent.x, y: agent.y });
  agent.state.energy = agent.state.energy / 2;
}
/*** End reproduce */

/*** Eat grass */
const sq = agent.squareOfCentroid();
if (sq.state.grassLevel == 1) {
  agent.state.energy = agent.state.energy + globals.get("elkEnergyFromGrass");
  sq.state.grassLevel = 0;
}
/*** End eat grass */

/*** Hydrate grass */
sim.squares.forEach(square => {
  square.state.hydration = Math.min(maxHydration, 
    square.state.hydration + Math.random() * ${amount});
});
/*** End hydrate grass */

/*** Dry out grass */
sim.squares.forEach(square => {
  square.state.hydration = Math.max(minHydration, 
    square.state.hydration - Math.random() * ${amount});
});
/*** End dry out grass */
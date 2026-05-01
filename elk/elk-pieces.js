// This file contains the predator prey simulation, broken into parts that can be entered into different parts
// of the blockly interactive interface.

/*** Grow grass */
sim.squares.forEach(square => {
  if (square.state.grassLevel < maxGrassLevel && square.state.hydration > 0) {
    square.state.grassLevel = Math.min(maxGrassLevel, square.state.grassLevel + grassGrowthRate);
  }
});
/*** End grow grass */

/*** Hydrate grass */
sim.squares.forEach(square => {
  square.state.hydration = Math.min(maxHydration, square.state.hydration + amount);
});
/*** End hydrate grass */

/*** Dry out grass */
sim.squares.forEach(square => {
  square.state.hydration = Math.max(minHydration, square.state.hydration - amount);
});
/*** End dry out grass */

/*** Reduce energy */
const energyLoss = agent.label("sheep") ? sheepEnergyLoss : wolfEnergyLoss;
agent.state.energy = agent.state.energy - energyLoss;
/*** End reduce energy */

/*** No more energy */
agent.state.energy <= 0
/*** End no more energy */

/*** Die */
const globalKey = agent.label("sheep") ? "sheepCount" : "wolfCount";
globals.set(globalKey, globals.get(globalKey) - 1);
agent.remove();
return;
/*** End die */

/*** Move */
agent.vel.turn(Math.random() * Math.PI / 4 - Math.PI / 8);
/*** End move */

/*** Reproduce */
const reproduceChance = agent.label("sheep") ? sheepReproduceChance : wolfReproduceChance;
if (Math.random() < reproduceChance) {
  const addFunction = agent.label("sheep") ? create_a_sheep : create_a_wolf;
  addFunction({ energy: agent.state.energy / 2, x: agent.x, y: agent.y });
  agent.state.energy = agent.state.energy / 2;
}
/*** End reproduce */

/*** Eat grass */
const sq = agent.squareOfCentroid();
if (sq.state.grassLevel >= maxGrassLevel) {
  agent.state.energy = agent.state.energy + globals.get("sheepEnergyFromGrass");
  sq.state.grassLevel = 0;
}
/*** End eat grass */

/*** Rain */
sim.squares.forEach(square => {
  hydrate(square, intensity);
});
/*** End rain */

/*** Drought */
sim.squares.forEach(square => {
  dryOut(square, intensity);
});
/*** End drought */
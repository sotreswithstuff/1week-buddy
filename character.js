// Create the canvas element where the character will appear
const canvas = document.createElement('canvas');
canvas.id = 'characterCanvas';  // Add the ID so we can control the canvas with CSS
document.body.appendChild(canvas);

// Set up the Matter.js engine and world
const engine = Matter.Engine.create();
const world = engine.world;

// Create a render object
const render = Matter.Render.create({
  element: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,  // No wireframes for a smoother look
  }
});

// Character body (circle for the head and body, legs, arms, etc.)
const body = Matter.Bodies.circle(200, 200, 30, { 
  render: {
    fillStyle: 'white'
  }
});

// Joints (add the limbs here using similar code for the arms, legs, etc.)
const armLeft = Matter.Bodies.rectangle(160, 190, 40, 10, { 
  render: { fillStyle: 'white' } 
});
const armRight = Matter.Bodies.rectangle(240, 190, 40, 10, { 
  render: { fillStyle: 'white' } 
});
const legLeft = Matter.Bodies.rectangle(170, 240, 40, 10, { 
  render: { fillStyle: 'white' } 
});
const legRight = Matter.Bodies.rectangle(230, 240, 40, 10, { 
  render: { fillStyle: 'white' } 
});

// Create the joints for the limbs
const jointOptions = {
  stiffness: 0.9,
  length: 30,
  render: { type: 'line' }
};
const armJointLeft = Matter.Constraint.create({ bodyA: body, bodyB: armLeft, pointA: { x: -30, y: -10 }, pointB: { x: 0, y: 0 }, ...jointOptions });
const armJointRight = Matter.Constraint.create({ bodyA: body, bodyB: armRight, pointA: { x: 30, y: -10 }, pointB: { x: 0, y: 0 }, ...jointOptions });
const legJointLeft = Matter.Constraint.create({ bodyA: body, bodyB: legLeft, pointA: { x: -15, y: 20 }, pointB: { x: 0, y: 0 }, ...jointOptions });
const legJointRight = Matter.Constraint.create({ bodyA: body, bodyB: legRight, pointA: { x: 15, y: 20 }, pointB: { x: 0, y: 0 }, ...jointOptions });

// Add all the bodies and constraints to the world
Matter.World.add(world, [body, armLeft, armRight, legLeft, legRight, armJointLeft, armJointRight, legJointLeft, legJointRight]);

// Update the engine continuously
Matter.Engine.run(engine);
Matter.Render.run(render);

// Make the character freeze until touched
let isFrozen = true;

canvas.addEventListener('mousedown', () => {
  if (isFrozen) {
    // Ragdoll for a tiny moment before freezing
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setPosition(body, { x: 200, y: 200 });
    isFrozen = false;
  }
});

// Add physics interactions with the screen edges (bouncing off walls)
Matter.Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;
  pairs.forEach(pair => {
    if (pair.bodyA === body || pair.bodyB === body) {
      if (!isFrozen) {
        // Trigger explosion if velocity is high
        const velocity = Matter.Vector.magnitude(body.velocity);
        if (velocity > 10) {
          // Explosion effect (delete joints and body parts)
          Matter.World.remove(world, [armLeft, armRight, legLeft, legRight, armJointLeft, armJointRight, legJointLeft, legJointRight]);
        }
      }
    }
  });
});

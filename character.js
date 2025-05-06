(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';
  script.onload = () => {
    const {
      Engine, Render, Runner, World, Bodies, Body, Constraint,
      Mouse, MouseConstraint, Events
    } = Matter;

    const engine = Engine.create();
    const world = engine.world;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: document.body,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false
      }
    });

    Render.run(render);
    Runner.run(Runner.create(), engine);

    // Create invisible walls at page edges
    const wallThickness = 40;
    const walls = [
      Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true, render: { visible: false } }),
      Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true, render: { visible: false } }),
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true, render: { visible: false } }),
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true, render: { visible: false } }),
    ];
    World.add(world, walls);

    // Cute tiny character
    const offsetX = 80;
    const offsetY = height - 80;

    const head = Bodies.circle(offsetX, offsetY, 10, {
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const torso = Bodies.rectangle(offsetX, offsetY + 15, 20, 30, {
      chamfer: { radius: 6 },
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const leftArm = Bodies.rectangle(offsetX - 15, offsetY + 10, 10, 20, {
      chamfer: { radius: 5 },
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const rightArm = Bodies.rectangle(offsetX + 15, offsetY + 10, 10, 20, {
      chamfer: { radius: 5 },
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const leftLeg = Bodies.rectangle(offsetX - 6, offsetY + 35, 6, 15, {
      chamfer: { radius: 3 },
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const rightLeg = Bodies.rectangle(offsetX + 6, offsetY + 35, 6, 15, {
      chamfer: { radius: 3 },
      render: { fillStyle: 'white', strokeStyle: 'black', lineWidth: 2 },
      isStatic: true
    });

    const parts = [head, torso, leftArm, rightArm, leftLeg, rightLeg];

    const constraints = [
      Constraint.create({ bodyA: head, bodyB: torso, pointA: { x: 0, y: 10 }, pointB: { x: 0, y: -15 }, stiffness: 0.8, render: { visible: false } }),
      Constraint.create({ bodyA: torso, bodyB: leftArm, pointA: { x: -10, y: -5 }, pointB: { x: 0, y: -10 }, stiffness: 0.8, render: { visible: false } }),
      Constraint.create({ bodyA: torso, bodyB: rightArm, pointA: { x: 10, y: -5 }, pointB: { x: 0, y: -10 }, stiffness: 0.8, render: { visible: false } }),
      Constraint.create({ bodyA: torso, bodyB: leftLeg, pointA: { x: -5, y: 15 }, pointB: { x: 0, y: -10 }, stiffness: 0.8, render: { visible: false } }),
      Constraint.create({ bodyA: torso, bodyB: rightLeg, pointA: { x: 5, y: 15 }, pointB: { x: 0, y: -10 }, stiffness: 0.8, render: { visible: false } }),
    ];

    World.add(world, [...parts, ...constraints]);

    // Ragdoll for 0.1 sec on load
    function ragdollThenFreeze() {
      parts.forEach(p => Body.setStatic(p, false));
      setTimeout(() => {
        parts.forEach(p => Body.setStatic(p, true));
      }, 100);
    }

    ragdollThenFreeze();

    // Explode if thrown hard and not held
    function checkVelocity() {
      const threshold = 200;
      if (!mouseConstraint.body) {
        parts.forEach(p => {
          const speed = Math.hypot(p.velocity.x, p.velocity.y);
          if (speed > threshold) {
            constraints.forEach(c => World.remove(world, c));
            parts.forEach(p => Body.setStatic(p, false));
          }
        });
      }
    }

    Events.on(engine, 'afterUpdate', checkVelocity);

    // Prevent from leaving the screen
    Events.on(engine, 'beforeUpdate', () => {
      parts.forEach(p => {
        const clampedX = Math.min(Math.max(p.position.x, 0), width);
        const clampedY = Math.min(Math.max(p.position.y, 0), height);
        Body.setPosition(p, { x: clampedX, y: clampedY });
      });
    });

    // Mouse controls
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });

    World.add(world, mouseConstraint);
    render.mouse = mouse;

    // Make parts dynamic when dragged
    Events.on(mouseConstraint, 'startdrag', () => {
      parts.forEach(p => Body.setStatic(p, false));
    });

  };
  document.head.appendChild(script);
})();

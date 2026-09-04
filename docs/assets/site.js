(() => {
  const canvas = document.getElementById("math-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let scale = 1;
  let frame = 0;

  const particles = Array.from({ length: 38 }, (_, index) => ({
    phase: (Math.PI * 2 * index) / 38,
    speed: 0.35 + (index % 7) * 0.025,
    radius: 1.2 + (index % 4) * 0.45,
    offset: ((index * 17) % 29) / 29,
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    scale = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function pointOnOrbit(particle, time) {
    const cx = width * 0.52;
    const cy = height * 0.49;
    const base = Math.min(width, height);
    const t = particle.phase + time * particle.speed;
    const wobble = 1 + 0.11 * Math.sin(t * 3 + particle.offset * 8);
    const rx = base * (0.24 + particle.offset * 0.08) * wobble;
    const ry = base * (0.18 + particle.offset * 0.06);
    const px = pointer.active ? (pointer.x - width / 2) * 0.035 : 0;
    const py = pointer.active ? (pointer.y - height / 2) * 0.035 : 0;

    return {
      x: cx + Math.cos(t) * rx + Math.sin(t * 2.2) * base * 0.055 + px,
      y: cy + Math.sin(t * 1.35) * ry + Math.cos(t * 2.7) * base * 0.04 + py,
    };
  }

  function drawGrid() {
    context.save();
    context.strokeStyle = "rgba(223, 232, 226, 0.075)";
    context.lineWidth = 1;
    const gap = Math.max(32, Math.min(width, height) / 10);
    for (let x = gap; x < width; x += gap) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = gap; y < height; y += gap) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();
  }

  function drawOrbit(time) {
    const base = Math.min(width, height);
    const cx = width * 0.52;
    const cy = height * 0.49;

    context.save();
    context.translate(cx, cy);
    context.rotate(-0.23);
    context.strokeStyle = "rgba(119, 215, 198, 0.20)";
    context.lineWidth = 1.2;
    for (let ring = 0; ring < 3; ring += 1) {
      context.beginPath();
      context.ellipse(0, 0, base * (0.19 + ring * 0.065), base * (0.13 + ring * 0.046), 0, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();

    const curvePoints = [];
    for (let i = 0; i <= 180; i += 1) {
      const t = (i / 180) * Math.PI * 2 + time * 0.08;
      curvePoints.push({
        x: cx + Math.sin(t * 2) * base * 0.255,
        y: cy + Math.sin(t * 3 + 0.55) * base * 0.185,
      });
    }

    context.beginPath();
    curvePoints.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.strokeStyle = "rgba(234, 132, 90, 0.40)";
    context.lineWidth = 1.5;
    context.stroke();
  }

  function drawParticles(time) {
    const positions = particles.map((particle) => pointOnOrbit(particle, time));

    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < 82) {
          context.beginPath();
          context.moveTo(positions[i].x, positions[i].y);
          context.lineTo(positions[j].x, positions[j].y);
          context.strokeStyle = `rgba(202, 224, 216, ${0.16 * (1 - distance / 82)})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }
    }

    positions.forEach((position, index) => {
      const particle = particles[index];
      const accent = index % 6 === 0;
      context.beginPath();
      context.arc(position.x, position.y, accent ? particle.radius * 1.5 : particle.radius, 0, Math.PI * 2);
      context.fillStyle = accent ? "rgba(238, 144, 101, 0.95)" : "rgba(151, 226, 210, 0.88)";
      context.fill();
    });
  }

  function draw(timestamp = 0) {
    const time = timestamp * 0.001;
    context.clearRect(0, 0, width, height);
    drawGrid();
    drawOrbit(time);
    drawParticles(time);
    frame += 1;
    if (!reduceMotion) window.requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  draw();
})();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const lapsP1 = document.getElementById("laps-p1");
const lapsP2 = document.getElementById("laps-p2");
const totalLapsEl = document.getElementById("total-laps");
const totalLapsEl2 = document.getElementById("total-laps-2");
const statusText = document.getElementById("status-text");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");

const TOTAL_LAPS = 3;
const track = {
  outer: { x: 60, y: 60, w: 780, h: 400 },
  inner: { x: 240, y: 160, w: 420, h: 200 },
  startLineX: 120,
  startLineTop: 80,
  startLineBottom: 200,
};

const keys = new Set();
let gameRunning = false;
let winner = null;

const createCar = ({ x, y, color, controls, name }) => ({
  x,
  y,
  prevX: x,
  prevY: y,
  angle: Math.PI * 1.5,
  speed: 0,
  color,
  name,
  controls,
  laps: 0,
  lastLapTime: 0,
  offTrack: false,
});

const cars = [
  createCar({
    x: 160,
    y: 130,
    color: "#4fc3f7",
    name: "اللاعب 1",
    controls: { up: "w", down: "s", left: "a", right: "d" },
  }),
  createCar({
    x: 160,
    y: 190,
    color: "#facc15",
    name: "اللاعب 2",
    controls: {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
    },
  }),
];

totalLapsEl.textContent = TOTAL_LAPS;

totalLapsEl2.textContent = TOTAL_LAPS;

const updateHud = () => {
  lapsP1.textContent = cars[0].laps;
  lapsP2.textContent = cars[1].laps;
};

const resetGame = () => {
  winner = null;
  gameRunning = false;
  cars[0].x = 160;
  cars[0].y = 130;
  cars[0].angle = Math.PI * 1.5;
  cars[0].speed = 0;
  cars[0].laps = 0;
  cars[0].lastLapTime = 0;

  cars[1].x = 160;
  cars[1].y = 190;
  cars[1].angle = Math.PI * 1.5;
  cars[1].speed = 0;
  cars[1].laps = 0;
  cars[1].lastLapTime = 0;

  updateHud();
  statusText.textContent = "اضغط ابدأ للانطلاق!";
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isOnTrack = (x, y) => {
  const inOuter =
    x > track.outer.x &&
    x < track.outer.x + track.outer.w &&
    y > track.outer.y &&
    y < track.outer.y + track.outer.h;

  const inInner =
    x > track.inner.x &&
    x < track.inner.x + track.inner.w &&
    y > track.inner.y &&
    y < track.inner.y + track.inner.h;

  return inOuter && !inInner;
};

const updateCar = (car, delta) => {
  const accel = 0.12;
  const brake = 0.15;
  const maxSpeed = 4.8;
  const minSpeed = -2.4;

  if (keys.has(car.controls.up)) {
    car.speed += accel;
  }
  if (keys.has(car.controls.down)) {
    car.speed -= brake;
  }

  car.speed *= 0.98;
  car.speed = clamp(car.speed, minSpeed, maxSpeed);

  const turnRate = 0.045 + Math.abs(car.speed) * 0.02;
  if (keys.has(car.controls.left)) {
    car.angle -= turnRate;
  }
  if (keys.has(car.controls.right)) {
    car.angle += turnRate;
  }

  car.prevX = car.x;
  car.prevY = car.y;
  car.x += Math.cos(car.angle) * car.speed * delta;
  car.y += Math.sin(car.angle) * car.speed * delta;

  if (!isOnTrack(car.x, car.y)) {
    car.offTrack = true;
    car.speed *= 0.6;
    car.x = clamp(car.x, track.outer.x + 10, track.outer.x + track.outer.w - 10);
    car.y = clamp(car.y, track.outer.y + 10, track.outer.y + track.outer.h - 10);
  } else {
    car.offTrack = false;
  }

  if (
    car.prevX > track.startLineX &&
    car.x <= track.startLineX &&
    car.y > track.startLineTop &&
    car.y < track.startLineBottom &&
    car.speed > 0.5 &&
    performance.now() - car.lastLapTime > 1200
  ) {
    car.laps += 1;
    car.lastLapTime = performance.now();
    updateHud();
    if (car.laps >= TOTAL_LAPS && !winner) {
      winner = car;
      gameRunning = false;
      statusText.textContent = `فاز ${car.name}! اضغط إعادة للعب من جديد.`;
    }
  }
};

const drawTrack = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111a33";
  ctx.fillRect(track.outer.x, track.outer.y, track.outer.w, track.outer.h);

  ctx.fillStyle = "#0c1325";
  ctx.fillRect(track.inner.x, track.inner.y, track.inner.w, track.inner.h);

  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 4;
  ctx.strokeRect(track.outer.x, track.outer.y, track.outer.w, track.outer.h);
  ctx.strokeRect(track.inner.x, track.inner.y, track.inner.w, track.inner.h);

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(track.startLineX, track.startLineTop);
  ctx.lineTo(track.startLineX, track.startLineBottom);
  ctx.stroke();
};

const drawCar = (car) => {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  ctx.fillStyle = car.color;
  ctx.fillRect(-12, -8, 24, 16);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(2, -5, 8, 10);

  if (car.offTrack) {
    ctx.strokeStyle = "rgba(248,113,113,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -10, 28, 20);
  }

  ctx.restore();
};

let lastFrame = performance.now();

const loop = (time) => {
  const delta = (time - lastFrame) / 16.67;
  lastFrame = time;

  drawTrack();

  cars.forEach((car) => {
    if (gameRunning && !winner) {
      updateCar(car, delta);
    }
    drawCar(car);
  });

  if (!gameRunning && !winner) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 24px Tajawal, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("اضغط ابدأ لبدء السباق", canvas.width / 2, canvas.height / 2);
  }

  requestAnimationFrame(loop);
};

startBtn.addEventListener("click", () => {
  if (!gameRunning && !winner) {
    gameRunning = true;
    statusText.textContent = "السباق مشتعل!";
  }
});

resetBtn.addEventListener("click", () => {
  resetGame();
});

window.addEventListener("keydown", (event) => {
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

resetGame();
requestAnimationFrame(loop);

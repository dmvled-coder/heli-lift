const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

let x = 100;
let y = 100;

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(x, y, 50, 30);

  requestAnimationFrame(draw);
}

draw();

// Điều khiển đơn giản
window.addEventListener("touchstart", () => {
  y -= 50;
});
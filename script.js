"use strict";
// Navegación móvil
const menuToggle = document.getElementById("menuToggle"),
  mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
mainNav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }),
);
document.getElementById("year").textContent = new Date().getFullYear();
// Los navegadores no permiten reproducir sonido automáticamente sin una interacción.
const heroAudio = document.getElementById("heroAudio"),
  soundToggle = document.getElementById("soundToggle");
soundToggle.addEventListener("click", async () => {
  if (heroAudio.paused) {
    try {
      await heroAudio.play();
      soundToggle.textContent = "♫ Silenciar el campo";
    } catch (e) {
      soundToggle.textContent = "No se pudo reproducir el audio";
    }
  } else {
    heroAudio.pause();
    soundToggle.textContent = "♫ Escuchar el campo";
  }
});
// Opiniones: aún NO hay almacenamiento en servidor. No se afirma un envío inexistente.
document.getElementById("reviewForm").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("reviewMessage").textContent =
    "El formulario está en demostración. Tu opinión NO se ha enviado ni guardado. Pronto habilitaremos el envío.";
});
// Minijuego. La posición del frasco real cambia al iniciar cada ronda.
const shelf = document.getElementById("shelf"),
  overlay = document.getElementById("gameOverlay"),
  status = document.getElementById("gameStatus"),
  timerEl = document.getElementById("timer"),
  hitsEl = document.getElementById("hits"),
  crosshair = document.getElementById("crosshair"),
  stage = document.getElementById("gameStage"),
  stone = document.getElementById("stone"),
  joystick = document.getElementById("joystick"),
  stick = document.getElementById("stick");
let jars = [],
  realId = 0,
  selected = 4,
  hits = 0,
  seconds = 12,
  playing = false,
  clock = null,
  shuffleClock = null,
  busy = false;
const facts = [
  "El Ghee aporta un toque especial a tus huevos revueltos.",
  "Prueba un poco de Ghee al saltear vegetales.",
  "Una cucharadita de Ghee puede dar sabor al arroz.",
  "El Ghee se obtiene mediante la clarificación de mantequilla.",
  "Úsalo para dorar papas y acompañar tus recetas favoritas.",
];
function rand(n) {
  return Math.floor(Math.random() * n);
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = rand(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function draw() {
  shelf.replaceChildren();
  jars.forEach((jar, i) => {
    const slot = document.createElement("div");
    slot.className = "jar-slot";
    const el = document.createElement("button");
    el.type = "button";
    el.className =
      "jar" + (jar.real ? " real" : "") + (jar.down ? " down" : "");
    el.setAttribute(
      "aria-label",
      jar.real ? "Frasco auténtico La Roca Dorada" : "Frasco falso",
    );
    el.addEventListener("click", () => {
      selected = i;
      aim();
    });
    slot.append(el);
    shelf.append(slot);
  });
  aim();
}
function aim() {
  const slot = shelf.children[selected];
  if (!slot) return;
  const a = slot.getBoundingClientRect(),
    b = stage.getBoundingClientRect();
  crosshair.style.left = a.left + a.width / 2 - b.left + "px";
  crosshair.style.top = a.top + a.height * 0.62 - b.top + "px";
}
function end(win) {
  playing = false;
  clearInterval(clock);
  clearInterval(shuffleClock);
  overlay.classList.remove("hidden");
  overlay.querySelector("h3").textContent = win
    ? "¡Felicitaciones!"
    : "¡Tiempo terminado!";
  overlay.querySelector("p").textContent = win
    ? facts[rand(facts.length)]
    : "El tesoro sigue esperando. ¡Inténtalo de nuevo!";
  document.getElementById("startGame").textContent = "Jugar de nuevo";
  status.textContent = win
    ? "¡Salvaste el verdadero Ghee!"
    : "Puedes volver a intentarlo";
}
function mix() {
  if (!playing || busy) return;
  jars = shuffle(jars);
  draw();
}
function start() {
  clearInterval(clock);
  clearInterval(shuffleClock);
  hits = 0;
  seconds = 12;
  busy = false;
  playing = true;
  realId = rand(9);
  jars = shuffle(
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      real: i === realId,
      down: false,
    })),
  );
  hitsEl.textContent = "0";
  timerEl.textContent = "12";
  status.textContent = "¡Derriba los frascos falsos!";
  overlay.classList.add("hidden");
  draw();
  clock = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds;
    if (seconds <= 0) end(false);
  }, 1000);
  shuffleClock = setInterval(mix, 2000);
}
function fire() {
  if (!playing || busy) return;
  const jar = jars[selected];
  if (!jar || jar.down) return;
  busy = true;
  const target = crosshair.getBoundingClientRect(),
    base = stage.getBoundingClientRect();
  const tx = target.left + target.width / 2 - base.left,
    ty = target.top + target.height / 2 - base.top;
  stone.style.display = "block";
  stone.style.left = "50%";
  stone.style.top = "95%";
  stone
    .animate(
      [
        { left: "50%", top: "95%", transform: "scale(.7)" },
        {
          left: (tx + stage.clientWidth / 2) / 2 + "px",
          top: Math.max(0, ty - 70) + "px",
          transform: "scale(1.3)",
        },
        { left: tx + "px", top: ty + "px", transform: "scale(.65)" },
      ],
      { duration: 360, easing: "ease-in-out" },
    )
    .finished.then(() => {
      stone.style.display = "none";
      if (!playing) {
        busy = false;
        return;
      }
      if (jar.real) {
        status.textContent = "¡Cuidado! Ese es el Ghee verdadero.";
      } else {
        jar.down = true;
        hits++;
        hitsEl.textContent = hits;
        status.textContent = "¡Buen tiro!";
        draw();
        if (hits === 8) {
          end(true);
        }
      }
      busy = false;
    })
    .catch(() => {
      busy = false;
      stone.style.display = "none";
    });
}
document.getElementById("startGame").addEventListener("click", start);
document.getElementById("fireBtn").addEventListener("click", fire);
// Palanca: selección de uno de los nueve objetivos. Compatible con mouse y tacto.
function moveStick(e) {
  const rect = joystick.getBoundingClientRect(),
    cx = rect.left + rect.width / 2,
    cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx,
    dy = e.clientY - cy;
  const r = Math.min(33, Math.hypot(dx, dy)),
    a = Math.atan2(dy, dx);
  dx = Math.cos(a) * r;
  dy = Math.sin(a) * r;
  stick.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  const col = Math.max(0, Math.min(2, Math.round(dx / 33 + 1)));
  const row = Math.max(0, Math.min(2, Math.round(dy / 33 + 1)));
  selected = row * 3 + col;
  aim();
}
joystick.addEventListener("pointerdown", (e) => {
  joystick.setPointerCapture(e.pointerId);
  moveStick(e);
});
joystick.addEventListener("pointermove", (e) => {
  if (joystick.hasPointerCapture(e.pointerId)) moveStick(e);
});
joystick.addEventListener("pointerup", () => {
  stick.style.transform = "translate(-50%,-50%)";
});
window.addEventListener("resize", aim);
jars = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  real: i === 4,
  down: false,
}));
draw();

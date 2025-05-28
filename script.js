// Actualización de reloj en la barra de tareas
function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';

  hours = hours % 12 || 12; // 0 => 12
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  const timeEl = document.getElementById("taskbar-time");
  if (timeEl) {
    timeEl.innerHTML = `
      <div>${formattedTime}</div>
      <div>${formattedDate}</div>
    `;
  }
}

// Inicializar reloj y mantenerlo actualizado
document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);

  // Asegurar que las ventanas se traen al frente cuando se hace clic
  document.querySelectorAll(".window").forEach(win => {
    win.addEventListener("mousedown", () => bringToFront(win));
  });

  // Activar tabs al estilo 7.css
  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      const tablist = tab.closest('[role="tablist"]');
      const tabs = tablist.querySelectorAll('[role="tab"]');
      const panels = tablist.parentElement.querySelectorAll('[role="tabpanel"]');

      tabs.forEach(t => t.setAttribute("aria-selected", "false"));
      panels.forEach(p => p.hidden = true);

      tab.setAttribute("aria-selected", "true");
      document.getElementById(tab.getAttribute("aria-controls")).hidden = false;
    });
  });

  // Botón de simulación de interrupción
  const btn = document.getElementById("simulate-interrupt-btn");
  if (btn) btn.addEventListener("click", simulateInterrupt);

  // Selector de ciclo de vida
  const pidSelect = document.getElementById("lifecycle-pid");
  if (pidSelect) pidSelect.addEventListener("change", renderProcessList);
});

// 🪟 Manejo de ventanas (posición, z-index y apertura múltiple ordenada)
let windowCount = 0;
let zCounter = 10;

function openWindow(id) {
  const win = document.getElementById(`window-${id}`);
  if (!win) return;

  if (!win.classList.contains("hidden")) {
    bringToFront(win);
    return;
  }

  // Forzar renderizado antes de calcular dimensiones
  win.style.visibility = "hidden";
  win.classList.remove("hidden");

  // Calcula dimensiones del modal y viewport
  const winWidth = win.offsetWidth;
  const winHeight = win.offsetHeight;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const left = (screenWidth - winWidth) / 2;
  const top = (screenHeight - winHeight) / 2;

  // Establecer posición centrada
  win.style.position = "fixed";
  win.style.left = `${Math.max(0, left)}px`;
  win.style.top = `${Math.max(0, top)}px`;

  win.style.visibility = "visible"; // Mostrar ahora sí
  bringToFront(win);
}

function bringToFront(win) {
  zCounter += 1;
  win.style.zIndex = zCounter;
}

function closeWindow(id) {
  const win = document.getElementById(`window-${id}`);
  if (win) {
    win.classList.add("hidden");
  }
}

// --- Simulación de procesos e interrupciones ---

const PROCESS_STATES = ["Nuevo", "Listo", "Ejecutando", "Bloqueado", "Terminado"];

const processes = [
  { pid: 1, nombre: "Bloc de notas", estado: "Nuevo" },
  { pid: 2, nombre: "Calculadora", estado: "Nuevo" },
  { pid: 3, nombre: "Paint", estado: "Nuevo" },
  { pid: 4, nombre: "Explorador", estado: "Nuevo" }
];

function createPCB(proc) {
  return {
    PID: proc.pid,
    Nombre: proc.nombre,
    Estado: proc.estado,
    PC: "0x" + (Math.random()*0xFFF0|0).toString(16),
    AX: Math.floor(Math.random()*1000),
    BX: Math.floor(Math.random()*1000),
    CX: Math.floor(Math.random()*1000),
    DX: Math.floor(Math.random()*1000),
    Flags: "0b" + (Math.random()*0b111111|0).toString(2).padStart(6,"0")
  };
}

let currentIdx = 0;

function renderProcessList() {
  const list = document.getElementById("process-list");
  if (!list) return;
  const selectedPid = parseInt(document.getElementById("lifecycle-pid")?.value, 10);
  list.innerHTML = "";
  processes.forEach((proc, i) => {
    const highlight = proc.pid === selectedPid ? 'background:#e3f2fd;font-weight:bold;' : '';
    const icon = i === currentIdx && proc.estado !== "Terminado"
      ? "🟢" : proc.estado === "Terminado"
      ? "✅" : "🗂️";
    list.innerHTML += `
      <tr style="${highlight}">
        <td>${proc.pid}</td>
        <td>${proc.nombre}</td>
        <td><span class="process-state state-${proc.estado}">${proc.estado}</span></td>
        <td>
          <button class="button" style="padding:2px 8px;font-size:12px;" onclick="showPCBPopup(createPCB(processes[${i}]), false)">Ver PCB</button>
        </td>
      </tr>
    `;
  });
}

// Cambia el estado de procesos según ciclo FIFO
function nextProcess() {
  if (processes[currentIdx].estado !== "Terminado") {
    processes[currentIdx].estado = "Listo";
  }
  let next = (currentIdx + 1) % processes.length;
  let found = false;
  for (let i = 0; i < processes.length; i++) {
    if (processes[next].estado !== "Terminado") {
      found = true;
      break;
    }
    next = (next + 1) % processes.length;
  }
  if (!found) return;
  processes[next].estado = "Ejecutando";
  currentIdx = next;
}

// Simula la interrupción y muestra PCB
function simulateInterrupt() {
  const proc = processes[currentIdx];
  if (proc.estado === "Terminado") return;

  proc.estado = "Bloqueado";
  const pcb = createPCB(proc);

  showPCBPopup(pcb, true);
  playWinSound();

  setTimeout(() => {
    proc.estado = "Listo";
    nextProcess();
    renderProcessList();
    hidePCBPopup();
  }, 2200);
  renderProcessList();
}

// Cambia la función showPCBPopup para aceptar autocierre opcional
function showPCBPopup(pcb, autoClose = false) {
  const popup = document.getElementById("pcb-popup");
  const content = document.getElementById("pcb-content");
  if (!popup || !content) return;
  content.innerHTML = `
    <b>PID:</b> ${pcb.PID}<br>
    <b>Nombre:</b> ${pcb.Nombre}<br>
    <b>Estado:</b> ${pcb.Estado}<br>
    <b>PC:</b> ${pcb.PC}<br>
    <b>AX:</b> ${pcb.AX} &nbsp; <b>BX:</b> ${pcb.BX}<br>
    <b>CX:</b> ${pcb.CX} &nbsp; <b>DX:</b> ${pcb.DX}<br>
    <b>Flags:</b> ${pcb.Flags}
  `;
  popup.classList.remove("hidden");
  popup.style.left = (window.innerWidth/2 - popup.offsetWidth/2) + "px";
  popup.style.top = (window.innerHeight/2 - popup.offsetHeight/2) + "px";

  // SIEMPRE autocerrar y cerrar al hacer click fuera
  setTimeout(hidePCBPopup, 2200);
  function outsideClick(e) {
    if (!popup.contains(e.target)) {
      hidePCBPopup();
      document.removeEventListener('mousedown', outsideClick);
    }
  }
  document.addEventListener('mousedown', outsideClick);
}

function hidePCBPopup() {
  const popup = document.getElementById("pcb-popup");
  if (popup) popup.classList.add("hidden");
}

function playWinSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = 880;
  g.gain.value = 0.08;
  o.connect(g).connect(ctx.destination);
  o.start();
  setTimeout(() => { o.stop(); ctx.close(); }, 180);
}

// Ciclo de vida de proceso: integración con botones
const lifecycleDescriptions = {
  "Nuevo": "El proceso ha sido creado y está esperando ser admitido en la memoria principal.",
  "Listo": "El proceso está en memoria principal esperando asignación de CPU.",
  "Ejecutando": "El proceso está siendo ejecutado activamente por la CPU.",
  "Bloqueado": "El proceso espera un evento externo (como E/S).",
  "Terminado": "El proceso ha finalizado su ejecución."
};

function lifecycleStep(estado) {
  const pid = parseInt(document.getElementById("lifecycle-pid").value, 10);
  const proc = processes.find(p => p.pid === pid);
  if (!proc) return;

  if (estado === "Nuevo") {
    proc.estado = "Nuevo";
  } else if (estado === "Listo") {
    if (proc.estado === "Nuevo" || proc.estado === "Bloqueado") {
      proc.estado = "Listo";
    }
  } else if (estado === "Ejecutando" || estado === "En ejecución") {
    if (proc.estado === "Listo") {
      processes.forEach(p => { if (p.estado === "Ejecutando") p.estado = "Listo"; });
      proc.estado = "Ejecutando";
      currentIdx = processes.indexOf(proc);
    }
  } else if (estado === "Bloqueado") {
    if (proc.estado === "Ejecutando") {
      proc.estado = "Bloqueado";
      showPCBPopup(createPCB(proc));
      playWinSound();
      setTimeout(hidePCBPopup, 1800);
      nextProcess();
    }
  } else if (estado === "Terminado") {
    proc.estado = "Terminado";
    showPCBPopup(createPCB(proc));
    setTimeout(hidePCBPopup, 1200);
    nextProcess();
  }

  document.getElementById("lifecycle-desc").textContent = lifecycleDescriptions[estado] || "";
  renderProcessList();
}

// Abre la ventana de simulación de procesos
function openProcessSim() {
  openWindow('process-sim');
  if (processes.every(p => p.estado === "Nuevo")) {
    processes[0].estado = "Ejecutando";
  }
  renderProcessList();
}

// --- Hacer ventanas arrastrables ---
document.querySelectorAll('.window').forEach(win => makeWindowDraggable(win));

function makeWindowDraggable(win) {
  const header = win.querySelector('.window-header');
  if (!header) return;
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.style.cursor = "move";
  header.onmousedown = function(e) {
    isDragging = true;
    bringToFront(win);
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    document.onmousemove = function(e) {
      if (!isDragging) return;
      win.style.left = (e.clientX - offsetX) + "px";
      win.style.top = (e.clientY - offsetY) + "px";
    };
    document.onmouseup = function() {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

// Al cargar la página, haz arrastrables todas las ventanas existentes
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.window').forEach(win => makeWindowDraggable(win));
});

// --- Sistema de diapositivas para Interrupciones y Cambio de Contexto ---

const pptSlides = [
  {
    html: `<h2>¿Qué es una <span style="color:#e67e22;">interrupción</span>?</h2>
    <p>Una interrupción es una señal que indica a la CPU que debe pausar lo que está haciendo para atender un evento importante.<br>
    <img src="https://img.icons8.com/color/96/000000/alarm.png" style="margin-top:12px;"></p>`
  },
  {
    html: `<h2>¿Por qué ocurren?</h2>
    <p>Pueden ser causadas por hardware (teclado, mouse, disco) o software (errores, llamadas al sistema).<br>
    <img src="https://img.icons8.com/color/96/000000/keyboard.png" style="margin:8px;">
    <img src="https://img.icons8.com/color/96/000000/computer-support.png" style="margin:8px;">
    <img src="https://img.icons8.com/color/96/000000/hdd.png" style="margin:8px;"></p>`
  },
  {
    html: `<h2>¿Qué es un <span style="color:#2980b9;">cambio de contexto</span>?</h2>
    <p>Cuando ocurre una interrupción, el sistema operativo guarda el estado del proceso actual y carga el de otro proceso.<br>
    <img src="https://img.icons8.com/color/96/000000/swap.png" style="margin-top:12px;"></p>`
  },
  {
    html: `<h2>¿Por qué es importante?</h2>
    <p>Permite la multitarea y que el sistema responda rápido a eventos.<br>
    <img src="https://img.icons8.com/color/96/000000/multiple-devices.png" style="margin-top:12px;"></p>`
  },
  {
    html: `<h2 style="color:#c0392b;">¡Interrupción inesperada!</h2>
    <p style="font-size:20px;">Error: El PowerPoint fue interrumpido por el sistema operativo 😅<br>
    <img src="https://img.icons8.com/color/96/000000/error--v1.png" style="margin-top:12px;"></p>
    <button class="button" onclick="pptRestart()" style="margin-top:18px;">Reiniciar presentación</button>`
  }
];

let pptCurrent = 0;

function showPptSlide(idx) {
  const slide = pptSlides[idx];
  document.getElementById('ppt-slide-content').innerHTML = slide.html;
  document.getElementById('ppt-slide-indicator').textContent = `Diapositiva ${Math.min(idx+1, pptSlides.length)}/${pptSlides.length}`;
  // Oculta botones en la última diapositiva
  document.getElementById('ppt-next-btn').style.display = idx === pptSlides.length-1 ? 'none' : '';
  document.getElementById('ppt-prev-btn').style.display = idx === 0 ? 'none' : '';
}

function pptRestart() {
  pptCurrent = 0;
  showPptSlide(pptCurrent);
}

document.addEventListener('DOMContentLoaded', () => {
  // Botones de navegación
  document.getElementById('ppt-prev-btn').onclick = () => {
    if (pptCurrent > 0) {
      pptCurrent--;
      showPptSlide(pptCurrent);
    }
  };
  document.getElementById('ppt-next-btn').onclick = () => {
    if (pptCurrent < pptSlides.length-1) {
      pptCurrent++;
      showPptSlide(pptCurrent);
    }
  };
  // Al abrir la ventana, inicia en la primera diapositiva
  window.openWindow = (function(orig){
    return function(name) {
      orig(name);
      if(name === 'ppt-interrupciones') {
        pptCurrent = 0;
        showPptSlide(pptCurrent);
      }
    }
  })(window.openWindow || function(name){document.getElementById('window-'+name).classList.remove('hidden');});
});
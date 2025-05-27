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




// Cambiar pestañas específicas (por ejemplo, dentro de configuración)
function showSettingsTab(tabId) {
  const tabs = document.querySelectorAll('.settings-tab');
  tabs.forEach(tab => tab.classList.add('hidden'));
  const active = document.getElementById('settings-' + tabId);
  if (active) active.classList.remove('hidden');
}
let highestZ = 1000;
let draggedWindow = null;
let offsetX = 0;
let offsetY = 0;

// Hacer ventanas arrastrables y llevarlas al frente
document.querySelectorAll(".window").forEach(win => {
  const header = win.querySelector(".window-header");

  if (header) {
    header.addEventListener("mousedown", e => {
      if (e.target.closest(".no-drag")) return;

      draggedWindow = win;
      bringToFront(win); // traer al frente
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      document.addEventListener("mousemove", dragWindow);
      document.addEventListener("mouseup", stopDragging);
    });
  }

  // También al hacer clic en cualquier parte de la ventana
  win.addEventListener("mousedown", () => bringToFront(win));
});


function dragWindow(e) {
  if (!draggedWindow) return;

  // Solo quitar transform una vez
  if (draggedWindow.style.transform) {
    draggedWindow.style.transform = '';
  }

  draggedWindow.style.left = `${e.clientX - offsetX}px`;
  draggedWindow.style.top = `${e.clientY - offsetY}px`;
}

function stopDragging() {
  draggedWindow = null;
  document.removeEventListener("mousemove", dragWindow);
  document.removeEventListener("mouseup", stopDragging);
}

function bringToFront(win) {
  highestZ += 1;
  win.style.zIndex = highestZ;
}


function closeWindow(id) {
  console.log("Cerrando ventana:", id);
  const win = document.getElementById(`window-${id}`);
  if (win) {
    win.classList.add("hidden");
  }
}
// ...existing code...

// --- Simulación de procesos e interrupciones ---

// Estados posibles
const PROCESS_STATES = ["Nuevo", "Listo", "Ejecutando", "Bloqueado", "Terminado"];

// Procesos simulados
const processes = [
  { pid: 1, nombre: "Bloc de notas", estado: "Nuevo" },
  { pid: 2, nombre: "Calculadora", estado: "Nuevo" },
  { pid: 3, nombre: "Paint", estado: "Nuevo" },
  { pid: 4, nombre: "Explorador", estado: "Nuevo" }
];

// PCB simulado (registros y contexto)
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

// Inicializa la ventana de procesos
function renderProcessList() {
  const list = document.getElementById("process-list");
  if (!list) return;
  list.innerHTML = "";
  processes.forEach((proc, i) => {
    const icon = i === currentIdx && proc.estado !== "Terminado"
      ? "🟢" : proc.estado === "Terminado"
      ? "✅" : "🗂️";
    list.innerHTML += `
      <div class="process-row">
        <span>${icon}</span>
        <span><b>${proc.nombre}</b></span>
        <span>PID: ${proc.pid}</span>
        <span class="process-state state-${proc.estado}">${proc.estado}</span>
      </div>
    `;
  });
}

// Cambia el estado de procesos según ciclo FIFO
function nextProcess() {
  // Termina el actual si no está terminado
  if (processes[currentIdx].estado !== "Terminado") {
    processes[currentIdx].estado = "Listo";
  }
  // Busca el siguiente proceso no terminado
  let next = (currentIdx + 1) % processes.length;
  let found = false;
  for (let i = 0; i < processes.length; i++) {
    if (processes[next].estado !== "Terminado") {
      found = true;
      break;
    }
    next = (next + 1) % processes.length;
  }
  if (!found) return; // Todos terminados

  // Cambia el estado
  processes[next].estado = "Ejecutando";
  currentIdx = next;
}

// Simula la interrupción y muestra PCB
function simulateInterrupt() {
  const proc = processes[currentIdx];
  if (proc.estado === "Terminado") return;

  // Cambia estado a Bloqueado y guarda PCB
  proc.estado = "Bloqueado";
  const pcb = createPCB(proc);

  // Muestra PCB flotante
  showPCBPopup(pcb);

  // Sonido leve tipo Windows
  playWinSound();

  setTimeout(() => {
    // Cambia proceso y oculta PCB
    proc.estado = "Listo";
    nextProcess();
    renderProcessList();
    hidePCBPopup();
  }, 2200);
  renderProcessList();
}

// Muestra ventana PCB
function showPCBPopup(pcb) {
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
  // Centrar en pantalla
  popup.style.left = (window.innerWidth/2 - popup.offsetWidth/2) + "px";
  popup.style.top = (window.innerHeight/2 - popup.offsetHeight/2) + "px";
}

// Oculta PCB
function hidePCBPopup() {
  const popup = document.getElementById("pcb-popup");
  if (popup) popup.classList.add("hidden");
}

// Sonido leve tipo Windows
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

// Abre la ventana de simulación de procesos
function openProcessSim() {
  openWindow('process-sim');
  // Primer proceso pasa a Ejecutando si todos están en Nuevo
  if (processes.every(p => p.estado === "Nuevo")) {
    processes[0].estado = "Ejecutando";
  }
  renderProcessList();
}

// Botón de simulación de interrupción
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("simulate-interrupt-btn");
  if (btn) btn.addEventListener("click", simulateInterrupt);

  // Puedes agregar un acceso desde el menú principal o taskbar:
  // Ejemplo: document.getElementById("abrir-procesos-btn").onclick = openProcessSim;
});

// Opcional: abre la ventana de procesos al cargar para pruebas
// setTimeout(openProcessSim, 1200);
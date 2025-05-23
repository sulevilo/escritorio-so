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

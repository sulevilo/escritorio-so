// Funciones para modales
function openModal(id) {
  document.getElementById(`modal-${id}`).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(`modal-${id}`).classList.add("hidden");
}

// Funciones para ventanas
function openWindow(id) {
  document.getElementById(`window-${id}`).classList.remove("hidden");
}

function closeWindow(id) {
  document.getElementById(`window-${id}`).classList.add("hidden");
}

// Tabs en administrador de tareas
function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => tab.classList.add("hidden"));
  document.getElementById(`tab-${tabId}`).classList.remove("hidden");
} 

// Puedes agregar reloj si quieres que sea dinámico
setInterval(() => {
  const timeEl = document.querySelector('.barra-hora');
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString();
}, 1000);

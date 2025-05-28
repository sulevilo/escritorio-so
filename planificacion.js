// --- NUEVAS FUNCIONALIDADES: Simulación de algoritmos de planificación ---

// Datos para la simulación de planificación
let planProcesses = [];
let planAlgorithm = "FIFO";
let planQuantum = 2;
let planGantt = [];
let planColors = ["#0078d7", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#17a2b8", "#fd7e14", "#20c997"];
let planSimStarted = false;

// Crear ventana de planificación si no existe
function createPlanWindow() {
  if (document.getElementById("window-plan")) return;
  const win = document.createElement("div");
  win.id = "window-plan";
  win.className = "window";
  win.style = "width: 900px; min-height: 420px; z-index: 30; left: 80px; top: 80px; position:fixed;"; // <-- Cambiado a 900px
  win.innerHTML = `
    <div class="window-header">
      Simulación de Planificación de Procesos
      <button class="btn-close" onclick="closeWindow('plan')">✖</button>
    </div>
    <div class="window-body bg-white text-black font-sans" style="padding: 14px; min-height: 340px;">
      <fieldset style="border: 1px solid #0078d7; margin-bottom: 10px;">
        <legend style="color:#0078d7;"><b>Agregar proceso</b></legend>
        <form id="plan-form" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <input class="input" style="width:110px;" id="plan-nombre" placeholder="Nombre" required>
          <input class="input" style="width:70px;display:none;" id="plan-llegada" type="number" min="1" placeholder="Llegada" readonly>
          <input class="input" style="width:70px;" id="plan-duracion" type="number" min="1" placeholder="Duración" required>
          <input class="input" style="width:70px;" id="plan-prioridad" type="number" min="1" placeholder="Prioridad" required>
          <button class="button" type="submit" style="padding:2px 12px;">Agregar</button>
          <button class="button" type="button" onclick="planReset()" style="padding:2px 12px;">Reiniciar</button>
        </form>
      </fieldset>
      <div style="margin-bottom:10px;">
        <b>Procesos:</b>
        <table class="table is-bordered" style="width:100%;margin-top:4px;font-size:14px;">
          <thead>
            <tr>
              <th>Nombre</th><th>Llegada</th><th>Duración</th><th>Prioridad</th><th>Acción</th>
            </tr>
          </thead>
          <tbody id="plan-proc-list"></tbody>
        </table>
      </div>
      <div style="margin-bottom:10px;">
        <label><b>Algoritmo:</b></label>
        <select id="plan-alg" class="button" style="margin-left:8px;">
          <option value="FIFO">FIFO</option>
          <option value="RR">Round Robin</option>
          <option value="SJF">SJF</option>
          <option value="PRIORIDAD">Prioridad</option>
        </select>
        <span id="plan-quantum-wrap" style="display:none;">
          <label style="margin-left:12px;">Quantum:</label>
          <input id="plan-quantum" type="number" min="1" value="2" style="width:50px;" class="input">
        </span>
        <button class="button" id="plan-sim-btn" style="margin-left:18px;">Simular planificación</button>
      </div>
      <div>
        <b>Diagrama de Gantt:</b>
        <div id="plan-gantt" style="margin-top:8px; min-height:38px; background:#f3f6fa; border-radius:6px; border:1px solid #e0e6ef; padding:8px 4px;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(win);
  makeWindowDraggable(win);
  renderPlanProcList();
  updatePlanLlegada();
}

// Mostrar ventana de planificación
function openPlanWindow() {
  createPlanWindow();
  openWindow('plan');
}

// Renderizar lista de procesos de planificación
function renderPlanProcList() {
  const tbody = document.getElementById("plan-proc-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  planProcesses.forEach((p, i) => {
    tbody.innerHTML += `
  <tr>
    <td>${p.nombre}</td>
    <td>${p.llegada}</td>
    <td>${p.duracion}</td>
    <td>${p.prioridad}</td>
    <td><button class="button" style="padding:2px 8px;font-size:12px;" onclick="planRemoveProc(${i})">Eliminar</button></td>
  </tr>
    `;
  });
  updatePlanLlegada();
}

// Eliminar proceso de la lista
function planRemoveProc(idx) {
  planProcesses.splice(idx, 1);
  renderPlanProcList();
  renderPlanGantt([]);
}

// Reiniciar simulación
function planReset() {
  planProcesses = [];
  planGantt = [];
  planSimStarted = false;
  renderPlanProcList();
  renderPlanGantt([]);
}

// Manejo de formulario de agregar proceso
document.addEventListener("DOMContentLoaded", () => {
  // Botón en la barra de tareas (puedes agregarlo donde quieras)
  if (!document.getElementById("plan-taskbar-btn")) {
    const btn = document.createElement("button");
    btn.className = "taskbar-button";
    btn.id = "plan-taskbar-btn";
    btn.title = "Planificación de procesos";
    btn.innerHTML = `<img src="https://img.icons8.com/color/32/flow-chart.png" alt="Planificación">`;
    btn.onclick = openPlanWindow;
    document.querySelector(".taskbar-left").appendChild(btn);
  }

  // Delegación de eventos para la ventana de planificación
  document.body.addEventListener("submit", function(e) {
    if (e.target && e.target.id === "plan-form") {
      e.preventDefault();
      const nombre = document.getElementById("plan-nombre").value.trim() || `P${planProcesses.length+1}`;
      const llegada = parseInt(document.getElementById("plan-llegada").value, 10) || (planProcesses.length + 1);
      const duracion = parseInt(document.getElementById("plan-duracion").value, 10) || 1;
      const prioridad = parseInt(document.getElementById("plan-prioridad").value, 10) || 1;
      planProcesses.push({ nombre, llegada, duracion, prioridad, restante: duracion });
      renderPlanProcList();
      renderPlanGantt([]);
      e.target.reset();
    }
  });

  // Algoritmo selector
  document.body.addEventListener("change", function(e) {
    if (e.target && e.target.id === "plan-alg") {
      planAlgorithm = e.target.value;
      document.getElementById("plan-quantum-wrap").style.display = planAlgorithm === "RR" ? "inline-block" : "none";
    }
    if (e.target && e.target.id === "plan-quantum") {
      planQuantum = parseInt(e.target.value, 10) || 2;
    }
  });

  // Simular planificación
  document.body.addEventListener("click", function(e) {
    if (e.target && e.target.id === "plan-sim-btn") {
      planSimular();
    }
  });
});

// --- Algoritmos de planificación y Gantt ---

function planSimular() {
  if (planProcesses.length === 0) return;
  let procs = planProcesses.map((p, i) => ({
    ...p,
    idx: i,
    restante: p.duracion,
    completado: false,
    inicio: null,
    fin: null
  }));
  let gantt = [];
  let tiempo = 0;
  let cola = [];
  let quantum = parseInt(document.getElementById("plan-quantum")?.value, 10) || 2;

  if (planAlgorithm === "FIFO") {
    procs.sort((a, b) => a.llegada - b.llegada);
    tiempo = procs[0].llegada;
    for (let p of procs) {
      if (tiempo < p.llegada) tiempo = p.llegada;
      gantt.push({ nombre: p.nombre, idx: p.idx, inicio: tiempo, fin: tiempo + p.duracion });
      tiempo += p.duracion;
    }
  }

  if (planAlgorithm === "SJF") {
    let completados = 0;
    tiempo = Math.min(...procs.map(p => p.llegada));
    let ready = [];
    while (completados < procs.length) {
      ready = procs.filter(p => !p.completado && p.llegada <= tiempo);
      if (ready.length === 0) {
        tiempo++;
        continue;
      }
      let sjf = ready.reduce((a, b) => a.duracion < b.duracion ? a : b);
      gantt.push({ nombre: sjf.nombre, idx: sjf.idx, inicio: tiempo, fin: tiempo + sjf.duracion });
      tiempo += sjf.duracion;
      sjf.completado = true;
      sjf.fin = tiempo;
      completados++;
    }
  }

  if (planAlgorithm === "RR") {
    let completados = 0;
    tiempo = Math.min(...procs.map(p => p.llegada));
    cola = procs.filter(p => p.llegada === tiempo);
    let enCola = new Set(cola.map(p => p.idx));
    let lastTiempo = tiempo;
    while (completados < procs.length) {
      if (cola.length === 0) {
        tiempo++;
        cola = procs.filter(p => !p.completado && p.llegada <= tiempo && !enCola.has(p.idx));
        cola.forEach(p => enCola.add(p.idx));
        continue;
      }
      let p = cola.shift();
      let ejec = Math.min(quantum, p.restante);
      gantt.push({ nombre: p.nombre, idx: p.idx, inicio: tiempo, fin: tiempo + ejec });
      p.restante -= ejec;
      tiempo += ejec;
      // Agregar nuevos procesos que llegan durante este quantum
      procs.forEach(q => {
        if (!q.completado && q.llegada > lastTiempo && q.llegada <= tiempo && !enCola.has(q.idx)) {
          cola.push(q);
          enCola.add(q.idx);
        }
      });
      lastTiempo = tiempo;
      if (p.restante > 0) {
        cola.push(p);
      } else {
        p.completado = true;
        p.fin = tiempo;
        completados++;
      }
    }
  }

  if (planAlgorithm === "PRIORIDAD") {
    let completados = 0;
    tiempo = Math.min(...procs.map(p => p.llegada));
    while (completados < procs.length) {
      // Procesos listos
      let ready = procs.filter(p => !p.completado && p.llegada <= tiempo);
      if (ready.length === 0) {
        tiempo++;
        continue;
      }
      // Menor valor = mayor prioridad (puedes invertir el signo si quieres al revés)
      let prio = ready.reduce((a, b) => a.prioridad < b.prioridad ? a : b);
      gantt.push({ nombre: prio.nombre, idx: prio.idx, inicio: tiempo, fin: tiempo + prio.duracion });
      tiempo += prio.duracion;
      prio.completado = true;
      prio.fin = tiempo;
      completados++;
    }
  }

  planGantt = gantt;
  planSimStarted = true;
  renderPlanGantt(gantt);
}

// Renderizar diagrama de Gantt clásico
function renderPlanGantt(gantt) {
  const div = document.getElementById("plan-gantt");
  if (!div) return;
  if (!gantt || gantt.length === 0) {
    div.innerHTML = `<span style="color:#888;">(Sin simulación)</span>`;
    return;
  }
  // Calcular escala
  let minT = Math.min(...gantt.map(g => g.inicio));
  let maxT = Math.max(...gantt.map(g => g.fin));
  let total = maxT - minT;
  let colorMap = {};
  planProcesses.forEach((p, i) => colorMap[p.nombre] = planColors[i % planColors.length]);

  // Obtener todos los nombres únicos de procesos
  let procesosUnicos = [...new Set(planProcesses.map(p => p.nombre))];

  // Construir filas por proceso
  let html = `<div style="overflow-x:auto;"><table style="border-collapse:separate;border-spacing:0 8px;width:100%;">`;
  html += `<tr><th style="width:90px;"></th><th style="text-align:left;">Línea de tiempo</th></tr>`;
  procesosUnicos.forEach(nombre => {
    html += `<tr><td style="font-weight:bold;color:#333;text-align:right;padding-right:8px;">${nombre}</td><td style="position:relative;">`;
    let t = minT;
    gantt.filter(g => g.nombre === nombre).forEach(g => {
      // Espacio antes del bloque si hay hueco
      if (g.inicio > t) {
        let w = ((g.inicio - t) / (total || 1)) * 600;
        html += `<span style="display:inline-block;width:${w}px;"></span>`;
      }
      // Bloque del proceso
      let w = Math.max(18, ((g.fin - g.inicio) / (total || 1)) * 600);
      html += `<span title="${g.nombre}: ${g.inicio}–${g.fin}" style="background:${colorMap[g.nombre]};color:#fff;border-radius:6px;padding:4px 0 2px 0;width:${w}px;display:inline-block;text-align:center;font-size:13px;box-shadow:0 1px 2px #bbb;outline:1px solid #fff;margin-right:2px;">
        ${g.inicio}–${g.fin}
      </span>`;
      t = g.fin;
    });
    html += `</td></tr>`;
  });
  html += `</table></div>`;
  // Línea de tiempo
  html += `<div style="display:flex;justify-content:space-between;font-size:12px;color:#0078d7;margin-top:2px;">
    <span>${minT}</span><span>${maxT}</span>
  </div>`;
  div.innerHTML = html;
}

function updatePlanLlegada() {
  const llegadaInput = document.getElementById("plan-llegada");
  if (llegadaInput) {
    llegadaInput.value = planProcesses.length + 1;
  }
}
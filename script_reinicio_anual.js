// --- CONFIGURACIÓN GLOBAL ---
const USAR_DRIVE = false; 
const APPS_SCRIPT_URL = "https://drive.google.com/drive/folders/17FmEuUuo2Dr7zzIraXoQNLo83htdqPcf?usp=drive_link"; 
const SECRET_KEY = "correo-123"; 

const evaluacionData = [
    { nombre: "Personal", subs: ["Dotación efectiva", "Capacitación", "Bienestar"] },
    { nombre: "Infraestructura", subs: ["Estado Cuartel", "Servicios Básicos", "Habitabilidad"] },
    { nombre: "Equipamiento", subs: ["Radios/Com.", "Generadores", "Mobiliario"] },
    { nombre: "Patrullajes", subs: ["Frecuencia", "Planificación", "Cobertura"] },
    { nombre: "Logística", subs: ["Vehículos", "Combustible", "Alimentación"] },
    { nombre: "Seguridad", subs: ["Armamento", "Munición", "Cámaras/Cercos"] }
];

let chart;
let contador = Number(localStorage.getItem("folioOS3") || 1);

// --- CONFIGURACIÓN DE FOLIO ANUAL ---
const FOLIO_KEY = "folioOS3";
const YEAR_KEY = "folioOS3_year";

function gestionarReinicioAnual() {
    const anioActual = new Date().getFullYear();
    const anioGuardado = localStorage.getItem(YEAR_KEY);

    // Si no hay año guardado o el año cambió (ej: de 2026 a 2027)
    if (!anioGuardado || parseInt(anioGuardado) !== anioActual) {
        console.log("Detectado cambio de año o primer inicio. Reiniciando folio a 001.");
        contador = 1;
        localStorage.setItem(FOLIO_KEY, contador);
        localStorage.setItem(YEAR_KEY, anioActual);
    } else {
        // Si es el mismo año, solo cargamos el número existente
        contador = Number(localStorage.getItem(FOLIO_KEY) || 1);
    }
    actualizarVisualizacionFolio();
}

// MODIFICA tu función generarPDFyGuardar para que guarde el año al incrementar
async function generarPDFyGuardar() {
    // ... (todo tu código anterior de generación de PDF)
    
    try {
        const worker = html2pdf().set(opt).from(element).toPdf();
        const pdf = await worker.get("pdf");
        // ... (código de guardado y visor)

        pdf.save(nombreArchivo);

        // --- ACTUALIZACIÓN DE FOLIO CON VALIDACIÓN DE AÑO ---
        contador++;
        localStorage.setItem(FOLIO_KEY, contador);
        localStorage.setItem(YEAR_KEY, new Date().getFullYear()); // Aseguramos el año actual
        
        actualizarVisualizacionFolio();

        estado.innerText = "Finalizado ✅";
        btn.disabled = false;
    } catch (e) {
        // ... (manejo de errores)
    }
}

// ACTUALIZA el inicio de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    gestionarReinicioAnual(); // <-- Esta función ahora maneja el contador inicial
    inicializarTabla();
    vincularEventos();
});

// --- SISTEMA DE AUTENTICACIÓN (LOGIN) ---

// Inicializa el administrador principal si no existe en la "base de datos" local
if (!localStorage.getItem("usuariosOS3")) {
    const usuariosIniciales = [{ user: "admin", pass: "1234" }]; 
    localStorage.setItem("usuariosOS3", JSON.stringify(usuariosIniciales));
}

function checkLogin() {
    const userInput = document.getElementById("username").value;
    const passInput = document.getElementById("password").value;
    const errorMsg = document.getElementById("login-error");
    
    // Obtener lista de usuarios de LocalStorage
    const usuarios = JSON.parse(localStorage.getItem("usuariosOS3"));

    // Buscar si el usuario y clave coinciden
    const usuarioEncontrado = usuarios.find(u => u.user === userInput && u.pass === passInput);

    if (usuarioEncontrado) {
        // Guardar sesión
        sessionStorage.setItem("authOS3", "true");
        sessionStorage.setItem("userRole", usuarioEncontrado.user);
        
        // Mostrar la interfaz y ocultar login
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-content").style.display = "block";

        // Si es el admin, mostrar panel de gestión de usuarios
        if (usuarioEncontrado.user === "admin") {
            document.getElementById("panel-administracion").style.display = "block";
            renderListaUsuarios();
        }
        
        updateAll(); // Cargar datos del sistema
    } else {
        errorMsg.style.display = "block";
        errorMsg.innerText = "Usuario o contraseña incorrectos";
    }
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

// Verificar sesión al cargar la página
window.addEventListener('load', () => {
    if (sessionStorage.getItem("authOS3") === "true") {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        
        if (sessionStorage.getItem("userRole") === "admin") {
            if(document.getElementById("panel-administracion")) {
                document.getElementById("panel-administracion").style.display = "block";
                renderListaUsuarios();
            }
        }
        updateAll();
    }
});

// --- GESTIÓN DE USUARIOS (SOLO ADMIN) ---

function registrarUsuario() {
    const user = document.getElementById("new-username").value;
    const pass = document.getElementById("new-password").value;
    
    if (!user || !pass) return alert("Complete ambos campos");

    let usuarios = JSON.parse(localStorage.getItem("usuariosOS3"));
    if (usuarios.some(u => u.user === user)) return alert("El usuario ya existe");

    usuarios.push({ user, pass });
    localStorage.setItem("usuariosOS3", JSON.stringify(usuarios));
    
    document.getElementById("new-username").value = "";
    document.getElementById("new-password").value = "";
    renderListaUsuarios();
    alert("Usuario creado exitosamente");
}

function renderListaUsuarios() {
    const body = document.getElementById("listaUsuariosBody");
    if(!body) return;
    const usuarios = JSON.parse(localStorage.getItem("usuariosOS3"));
    body.innerHTML = "";

    usuarios.forEach((u, index) => {
        const isAdmin = u.user === "admin";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${u.user}</strong></td>
            <td>${isAdmin ? '<span style="color:red">Administrador</span>' : 'Evaluador'}</td>
            <td>
                ${isAdmin ? '<em>Protegido</em>' : 
                `<button onclick="eliminarUsuario(${index})" style="background:var(--red); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar</button>`}
            </td>
        `;
        body.appendChild(tr);
    });
}

function eliminarUsuario(index) {
    let usuarios = JSON.parse(localStorage.getItem("usuariosOS3"));
    if (confirm(`¿Eliminar al usuario ${usuarios[index].user}?`)) {
        usuarios.splice(index, 1);
        localStorage.setItem("usuariosOS3", JSON.stringify(usuarios));
        renderListaUsuarios();
    }
}

// --- LÓGICA DEL INFORME Y EVALUACIÓN ---

const padFolio = (n) => String(n).padStart(3, "0");

function getAnalisisEvaluador(nota) {
    if (nota < 5) return "Se evidencian deficiencias críticas en los sub-ítems evaluados.";
    if (nota < 7) return "La evaluación general es REGULAR.";
    if (nota < 8.5) return "Condición BUENA, cumpliendo estándares.";
    return "Condición ÓPTIMA, destacándose por eficiencia.";
}

function getColor(nota) {
    if (nota >= 8.5) return "#1e3a8a"; 
    if (nota >= 7.0) return "#16a34a"; 
    if (nota >= 5.0) return "#eab308"; 
    return "#dc2626"; 
}

function inicializarTabla() {
    const cuerpo = document.getElementById("cuerpoTabla");
    if(!cuerpo) return;
    cuerpo.innerHTML = "";
    evaluacionData.forEach((item, index) => {
        const trPadre = document.createElement("tr");
        trPadre.className = "row-main";
        trPadre.innerHTML = `<td>${item.nombre}</td><td class="nota-display" id="nota-padre-${index}">10.0</td><td><input type="text" class="obs-input"></td>`;
        cuerpo.appendChild(trPadre);

        item.subs.forEach((sub) => {
            const trSub = document.createElement("tr");
            trSub.className = "row-sub";
            trSub.innerHTML = `<td class="indent">• ${sub}</td><td><input type="number" step="0.1" min="1" max="10" value="10.0" class="nota-input nota-sub-${index}"></td><td><input type="text" class="obs-input" placeholder="Detalle..."></td>`;
            cuerpo.appendChild(trSub);
        });
    });
}

function vincularEventos() {
    const cuerpo = document.getElementById("cuerpoTabla");
    if (cuerpo) {
        cuerpo.addEventListener("input", (e) => {
            if (e.target.classList.contains("nota-input")) {
                const classList = [...e.target.classList];
                const subClass = classList.find((c) => c.startsWith("nota-sub-"));
                if (subClass) {
                    const index = subClass.split("-")[2];
                    calcularPadre(parseInt(index, 10));
                }
            }
        });
    }

    document.getElementById("btnPreparar")?.addEventListener("click", prepararInforme);
    document.getElementById("btnDescargar")?.addEventListener("click", generarPDFyGuardar);

    // ✅ Reiniciar correlativo (UNA sola vez)
    document.getElementById("btnReset")?.addEventListener("click", () => {
        if (confirm("¿Desea reiniciar el correlativo a 001?")) {
            contador = 1;
            localStorage.setItem("folioOS3", contador);
            actualizarVisualizacionFolio();
            document.getElementById("estadoFolio").innerText = "Estado: Reiniciado ✅";
        }
    });
}

function calcularPadre(index) {
    const subs = document.querySelectorAll(`.nota-sub-${index}`);
    let suma = 0;
    subs.forEach(s => suma += parseFloat(s.value) || 0);
    const promedio = suma / subs.length;
    document.getElementById(`nota-padre-${index}`).textContent = promedio.toFixed(1);
    updateAll();
}

function updateAll() {
    renderChart();
    renderPdfPreview();
}

function renderChart() {
    const ctx = document.getElementById("graficoEvaluacion");
    if(!ctx) return;
    const notas = evaluacionData.map((_, i) => parseFloat(document.getElementById(`nota-padre-${i}`).textContent || 10));
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "bar",
        data: { 
            labels: evaluacionData.map(d => d.nombre), 
            datasets: [{ data: notas, backgroundColor: notas.map(n => getColor(n)) }] 
        },
        options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 10 } } }
    });
}

function renderPdfPreview() {
    if (!document.getElementById("pdf-unit-name")) return;

    actualizarVisualizacionFolio();

    const unidad = document.getElementById("nombreUnidad").value || "---";
    document.getElementById("pdf-unit-name").textContent = unidad.toUpperCase();
    document.getElementById("pdf-date").textContent = "FECHA: " + new Date().toLocaleDateString();

    let sumaTotal = 0;
    let gridHtml = "";

    evaluacionData.forEach((item, i) => {
        const n = parseFloat(document.getElementById(`nota-padre-${i}`).textContent);
        sumaTotal += n;

        gridHtml += `<div class="pdf-item-card" style="background:${getColor(n)}">
                        <div style="font-size:9px; font-weight:bold;">${item.nombre}</div>
                        <div style="font-size:24px; font-weight:900;">${n.toFixed(1)}</div>
                     </div>`;
    });

    document.getElementById("pdf-grid-content").innerHTML = gridHtml;

    const promedioGral = sumaTotal / evaluacionData.length;

    const textarea = document.getElementById("comentariosEvaluador");
    if (textarea && textarea.getAttribute("data-auto") !== "false") {
        textarea.value = getAnalisisEvaluador(promedioGral);
    }

    document.getElementById("pdf-nota-final-val").textContent = promedioGral.toFixed(1);
    document.getElementById("pdf-nota-final-box").style.borderColor = getColor(promedioGral);
    document.getElementById("pdf-comentarios").textContent = textarea ? textarea.value : "";
}


function prepararInforme() {
    const unidad = document.getElementById("nombreUnidad").value;
    if (!unidad) return alert("Seleccione Unidad primero");

    const seccionFinal = document.getElementById('seccion-final');
    seccionFinal.style.display = 'flex'; 
    
    const btnDescargar = document.getElementById("btnDescargar");
    btnDescargar.disabled = false;
    btnDescargar.style.cursor = "pointer";
    btnDescargar.style.opacity = "1";

    updateAll();
    seccionFinal.scrollIntoView({ behavior: 'smooth' });
}

async function generarPDFyGuardar() {
    const btn = document.getElementById("btnDescargar");
    const estado = document.getElementById("estadoFolio");

    // abrir pestaña al tiro (evita bloqueo popups)
    const visor = window.open("", "_blank");

    btn.disabled = true;
    estado.innerText = "Generando archivo...";

    const element = document.getElementById("pdf-template");

    // ✅ FORZAR VISIBILIDAD
    element.style.display = "block";
    element.style.visibility = "visible";

    // ✅ esperar para que se pinte completo antes del capture
    await new Promise(r => setTimeout(r, 200));

    const unidad = document.getElementById("nombreUnidad").value || "SIN_UNIDAD";
    const nombreArchivo = `OS3_Folio_${padFolio(contador)}_${unidad.replace(/\s+/g, "_")}.pdf`;

    const opt = {
        margin: 0,
        filename: nombreArchivo,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" }
    };

    try {
        const worker = html2pdf().set(opt).from(element).toPdf();
        const pdf = await worker.get("pdf");

        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);

        if (visor) visor.location.href = blobUrl;

        pdf.save(nombreArchivo);

        contador++;
        localStorage.setItem("folioOS3", contador);
        actualizarVisualizacionFolio();

        estado.innerText = "Finalizado ✅";
        btn.disabled = false;
    } catch (e) {
        console.error(e);
        estado.innerText = "Error ❌";
        btn.disabled = false;

        if (visor) visor.document.write("<p>No se pudo generar el PDF.</p>");
    }
}

function actualizarVisualizacionFolio() {
    const f = padFolio(contador);
    if(document.getElementById("numCorrelativo")) document.getElementById("numCorrelativo").textContent = f;
    if(document.getElementById("pdf-folio-num")) document.getElementById("pdf-folio-num").textContent = f;
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', () => {
    inicializarTabla();
    vincularEventos();
});


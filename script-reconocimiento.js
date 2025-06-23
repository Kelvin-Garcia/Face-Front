// Variables globales
let video = null;
let stream = null;
let currentMode = "menu";

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  if (!history.state || !history.state.mode) {
    history.replaceState({ mode: "menu" }, "Menú", "#menu");
  }
  const notification = document.getElementById("notification");
  if (notification) notification.style.display = "none";
  console.log("Iniciando aplicación...");
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  try {
    // Animaciones de entrada
    setTimeout(() => {
      const mainContainer = document.getElementById("mainContainer");
      if (mainContainer) {
        mainContainer.classList.add("fade-in");
      }
    }, 100);

    setTimeout(() => {
      const header = document.getElementById("header");
      if (header) {
        header.classList.add("slide-down");
      }
    }, 300);

    setTimeout(() => {
      const menuSection = document.getElementById("menuSection");
      if (menuSection) {
        menuSection.classList.add("slide-up");
      }
    }, 500);

    // Inicializar elementos
    video = document.getElementById("video");

    showNotification("Sistema de reconocimiento facial listo", "success");
  } catch (error) {
    console.error("Error en inicialización:", error);
    showNotification("Error al inicializar la aplicación", "error");
  }
}

function setupEventListeners() {
  try {
    // Drag and drop para upload
    const uploadArea = document.getElementById("uploadArea");
    const imageInput = document.getElementById("imageInput");

    if (uploadArea && imageInput) {
      uploadArea.addEventListener("dragover", handleDragOver);
      uploadArea.addEventListener("dragleave", handleDragLeave);
      uploadArea.addEventListener("drop", handleDrop);
      uploadArea.addEventListener("click", () => imageInput.click());

      imageInput.addEventListener("change", handleFileSelect);
    }

    // Cerrar resultados con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeResults();
      }
    });
  } catch (error) {
    console.error("Error configurando event listeners:", error);
  }
}

// Navegación entre modos
function openCameraMode() {
  try {
    history.replaceState({ mode: "camera" }, "Cámara", "#camera");
    console.log("Abriendo modo cámara...");
    currentMode = "camera";
    hideAllModes();

    const cameraMode = document.getElementById("cameraMode");
    if (cameraMode) {
      setTimeout(() => {
        cameraMode.style.display = "block";
        cameraMode.classList.add("slide-up");
        initializeCamera();
      }, 400); // <-- Cambia a 400ms
    }
  } catch (error) {
    console.error("Error abriendo modo cámara:", error);
    showNotification("Error al abrir la cámara", "error");
  }
}

function openUploadMode() {
  try {
    history.replaceState({ mode: "upload" }, "Subir", "#upload");
    console.log("Abriendo modo upload...");
    currentMode = "upload";
    hideAllModes();

    const uploadMode = document.getElementById("uploadMode");
    if (uploadMode) {
      setTimeout(() => {
        uploadMode.style.display = "block";
        uploadMode.classList.add("slide-up");
      }, 400); // <-- Cambia a 400ms
    }
  } catch (error) {
    console.error("Error abriendo modo upload:", error);
    showNotification("Error al abrir el modo de subida", "error");
  }
}

function closeResults() {
  const resultsSection = document.getElementById("resultsSection");
  if (resultsSection) {
    resultsSection.style.display = "none";
  }
}

function backToMenu() {
  try {
    if (currentMode === "camera") {
      stopCamera();
    }

    hideAllModes();

    const menuSection = document.getElementById("menuSection");
    if (menuSection) {
      setTimeout(() => {
        menuSection.style.display = "grid";
        menuSection.classList.add("slide-up");
      }, 400); // <-- Cambia a 400ms
    }

    currentMode = "menu";
    clearPreview();
    closeResults();
  } catch (error) {
    console.error("Error volviendo al menú:", error);
  }
}

function hideAllModes() {
  const modes = ["menuSection", "cameraMode", "uploadMode"];
  modes.forEach((mode) => {
    const element = document.getElementById(mode);
    if (element) {
      element.classList.remove("slide-up");
      setTimeout(() => {
        // Ajusta el display según el modo
        if (mode === "menuSection") {
          element.style.display = "none"; // Solo se muestra cuando vuelves al menú
        } else {
          element.style.display = "none";
        }
      }, 300);
    }
  });
}

// Funciones de cámara
async function initializeCamera() {
  try {
    console.log("Inicializando cámara...");
    showLoading("Iniciando cámara...");

    // Verificar si el navegador soporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Tu navegador no soporta acceso a la cámara");
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      },
    });

    if (video) {
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        hideLoading();
        updateCameraStatus("", "success");
        console.log("Cámara inicializada correctamente");
      };

      video.onerror = (error) => {
        console.error("Error en video:", error);
        hideLoading();
        updateCameraStatus("Error en video", "error");
        showNotification("Error al reproducir el video", "error");
      };
    }
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
    hideLoading();
    updateCameraStatus("Error en la cámara", "error");
    
    let errorMessage = "No se pudo acceder a la cámara. ";
    if (err.name === "NotAllowedError") {
      errorMessage += "Permisos denegados. Permite el acceso a la cámara.";
    } else if (err.name === "NotFoundError") {
      errorMessage += "No se encontró ninguna cámara.";
    } else {
      errorMessage += "Verifica los permisos y que no esté siendo usada por otra aplicación.";
    }
    
    showNotification(errorMessage, "error");
  }
}

function stopCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      console.log("Cámara detenida");
    }
    if (video) {
      video.srcObject = null;
    }
  } catch (error) {
    console.error("Error deteniendo cámara:", error);
  }
}

function updateCameraStatus(message, type) {
  try {
    const statusElement = document.getElementById("cameraStatus");
    if (statusElement) {
      const indicator = statusElement.querySelector(".status-indicator");
      const textElement = statusElement.querySelector("span:last-child") || statusElement;

      if (textElement) {
        textElement.textContent = message;
      }

      // Actualizar color del indicador
      if (indicator) {
        indicator.style.background =
          type === "success" ? "var(--success-color)" : 
          type === "error" ? "var(--error-color)" : "var(--warning-color)";
      }
    }
  } catch (error) {
    console.error("Error actualizando estado de cámara:", error);
  }
}

// Captura y reconocimiento desde cámara
async function capturarYReconocer() {
  try {
    if (!video || !video.srcObject) {
      showNotification("La cámara no está activa", "warning");
      return;
    }

    const captureBtn = document.getElementById("captureBtn");
    if (captureBtn) {
      captureBtn.disabled = true;
      captureBtn.innerHTML = '<span class="btn-icon">⏳</span> Capturando...';
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    showLoading("Analizando imagen...");

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          throw new Error("Error al crear la imagen");
        }

        const formData = new FormData();
        formData.append("imagen", blob, "captura.jpg");

        try {
          const response = await fetch("https://face-app-production.up.railway.app/reconocer", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
          }

          const data = await response.json();
          hideLoading();
          showResults(data);
        } catch (error) {
          console.error("Error en la petición:", error);
          hideLoading();
          showNotification("Error al procesar la imagen. Verifica tu conexión.", "error");
        }
      },
      "image/jpeg",
      0.8,
    );
  } catch (error) {
    console.error("Error en captura:", error);
    hideLoading();
    showNotification("Error al capturar la imagen", "error");
  } finally {
    const captureBtn = document.getElementById("captureBtn");
    if (captureBtn) {
      captureBtn.disabled = false;
      captureBtn.innerHTML = '<span class="btn-icon">📸</span> Capturar y Analizar';
    }
  }
}

// Funciones de upload
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  try {
    if (!file.type.startsWith("image/")) {
      showNotification("Por favor selecciona un archivo de imagen válido", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById("imagePreview");
      const uploadArea = document.getElementById("uploadArea");
      const previewContainer = document.getElementById("previewContainer");

      if (preview && uploadArea && previewContainer) {
        preview.src = e.target.result;
        uploadArea.style.display = "none";
        previewContainer.style.display = "block";
      }
    };
    
    reader.onerror = () => {
      showNotification("Error al leer el archivo", "error");
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error manejando archivo:", error);
    showNotification("Error al procesar el archivo", "error");
  }
}

function clearPreview() {
  try {
    const uploadArea = document.getElementById("uploadArea");
    const previewContainer = document.getElementById("previewContainer");
    const imageInput = document.getElementById("imageInput");

    if (uploadArea) uploadArea.style.display = "block";
    if (previewContainer) previewContainer.style.display = "none";
    if (imageInput) imageInput.value = "";
  } catch (error) {
    console.error("Error limpiando preview:", error);
  }
}

// Reconocimiento desde archivo
async function reconocerImagen() {
  try {
    const input = document.getElementById("imageInput");
    if (!input || input.files.length === 0) {
      showNotification("Por favor selecciona una imagen", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", input.files[0]);

    showLoading("Analizando imagen...");

    const response = await fetch("https://face-app-production.up.railway.app/reconocer", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();
    showResults(data);
  } catch (error) {
    console.error("Error:", error);
    hideLoading();
    showNotification("Error al procesar la imagen. Verifica tu conexión.", "error");
  }
}

// Mostrar resultados
function showResults(data) {
  try {
    const resultsSection = document.getElementById("resultsSection");
    const resultsContent = document.getElementById("resultsContent");

    if (!resultsSection || !resultsContent) {
      console.error("Elementos de resultados no encontrados");
      return;
    }

    let content = "";

    if (data && Array.isArray(data) && data.length > 0) {
      content = data
        .map(
          (person) => `
              <div class="result-item">
                  <div class="result-name">${person.nombre || 'Desconocido'}</div>
                  <div class="result-confidence">Confianza: ${(person.confianza || 0).toFixed(2)}%</div>
              </div>
          `,
        )
        .join("");

      showNotification(`Se reconocieron ${data.length} rostro(s)`, "success");
    } else {
      content = `
              <div class="no-results">
                  <div class="no-results-icon">🔍</div>
                  <h3>No se reconocieron rostros</h3>
                  <p>Intenta con una imagen más clara o con mejor iluminación</p>
              </div>
          `;

      showNotification("No se detectaron rostros en la imagen", "info");
    }

    resultsContent.innerHTML = content;
    resultsSection.style.display = "flex";
  } catch (error) {
    console.error("Error mostrando resultados:", error);
    showNotification("Error al mostrar los resultados", "error");
  }
}

// Funciones de utilidad
function showLoading(message = "Procesando...") {
  try {
    const loadingText = document.getElementById("loadingText");
    const loadingOverlay = document.getElementById("loadingOverlay");

    if (loadingText) loadingText.textContent = message;
    if (loadingOverlay) loadingOverlay.style.display = "flex";
  } catch (error) {
    console.error("Error mostrando loading:", error);
  }
}

function hideLoading() {
  try {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  } catch (error) {
    console.error("Error ocultando loading:", error);
  }
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");
  if (notification && notificationText) {
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, 3500);
  }
}

// Limpiar recursos al cerrar la página
window.addEventListener("beforeunload", () => {
  stopCamera();
});

// Manejo de errores globales
window.addEventListener("error", (event) => {
  console.error("Error global:", event.error);
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.mode === "camera") {
    openCameraMode();
    closeResults();
  } else if (event.state && event.state.mode === "upload") {
    openUploadMode();
    closeResults();
  } else {
    backToMenu();
    closeResults();
  }
});
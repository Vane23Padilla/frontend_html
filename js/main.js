// Variables globales
let currentStudentId = null
const apiBaseUrl = "https://backendgo-production-46db.up.railway.app/api/"
let confirmModalCallback = null

// Elementos DOM
const sections = {
  login: document.getElementById("login-section"),
  home: document.getElementById("home-section"),
  profile: document.getElementById("profile-section"),
  subjects: document.getElementById("subjects-section"),
  enrollment: document.getElementById("enrollment-section"),
  grades: document.getElementById("grades-section"),
}

const navLinks = {
  home: document.getElementById("nav-home"),
  profile: document.getElementById("nav-profile"),
  subjects: document.getElementById("nav-subjects"),
  enrollment: document.getElementById("nav-enrollment"),
  grades: document.getElementById("nav-grades"),
}

const buttons = {
  profile: document.getElementById("btn-profile"),
  subjects: document.getElementById("btn-subjects"),
  enrollment: document.getElementById("btn-enrollment"),
  grades: document.getElementById("btn-grades"),
  editProfile: document.getElementById("btn-edit-profile"),
  cancelProfile: document.getElementById("btn-cancel-profile"),
  confirmModal: document.getElementById("confirm-modal-btn"),
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners()
  checkExistingStudent()
})

// Configurar event listeners
function setupEventListeners() {
  // Navegación
  for (const key in navLinks) {
    navLinks[key].addEventListener("click", () => showSection(key))
  }

  // Login y registro
  document.getElementById("btn-login").addEventListener("click", loginStudent)
  document.getElementById("btn-register").addEventListener("click", registerStudent)

  // Botón de cerrar sesión (nuevo)
  const logoutBtn = document.createElement("button")
  logoutBtn.className = "btn btn-outline-danger mt-3"
  logoutBtn.textContent = "Cerrar Sesión"
  logoutBtn.id = "btn-logout"
  logoutBtn.addEventListener("click", logoutStudent)
  document.querySelector(".sidebar .position-sticky").appendChild(logoutBtn)

  // Botones de acceso rápido
  buttons.profile.addEventListener("click", () => showSection("profile"))
  buttons.subjects.addEventListener("click", () => showSection("subjects"))
  buttons.enrollment.addEventListener("click", () => showSection("enrollment"))
  buttons.grades.addEventListener("click", () => showSection("grades"))

  // Perfil
  buttons.editProfile.addEventListener("click", toggleProfileEdit)
  buttons.cancelProfile.addEventListener("click", toggleProfileEdit)
  document.getElementById("profile-form").addEventListener("submit", saveProfile)

  // Modal de confirmación
  buttons.confirmModal.addEventListener("click", () => {
    if (confirmModalCallback) {
      confirmModalCallback()
      confirmModalCallback = null
      const confirmModal = document.getElementById("confirmModal")
      const modal = bootstrap.Modal.getInstance(confirmModal)
      if (modal) {
        modal.hide()
      }
    }
  })
}

// Verificar si hay un estudiante con sesión iniciada
function checkLoggedInStudent() {
  const savedStudentId = localStorage.getItem("currentStudentId")
  if (savedStudentId) {
    currentStudentId = savedStudentId
    loadStudentProfile()
    showSection("home")
    updateUIForLoggedInUser()
  } else {
    showLoginSection()
  }
}

// Mostrar sección de login
function showLoginSection() {
  for (const key in sections) {
    sections[key].style.display = "none"
  }
  sections.login.style.display = "block"
  
  

}

// Iniciar sesión
async function loginStudent() {
  const studentId = document.getElementById("login-id").value.trim()
  if (!studentId) {
    alert("Por favor ingresa tu ID de estudiante")
    return
  }

  try {
    const response = await fetch(`${apiBaseUrl}/estudiantes/${studentId}`)
    if (!response.ok) {
      throw new Error("Estudiante no encontrado")
    }

    const student = await response.json()
    currentStudentId = student.id_estudiantes
    localStorage.setItem("currentStudentId", currentStudentId)
    
    updateUIForLoggedInUser()
    showSection("home")
  } catch (error) {
    console.error("Error:", error)
    alert("ID de estudiante no válido. Por favor verifica e intenta nuevamente.")
  }
}

// Registrar nuevo estudiante
async function registerStudent() {
  const nombre = document.getElementById("register-name").value.trim()
  if (!nombre) {
    alert("Por favor ingresa tu nombre completo")
    return
  }

  try {
    const response = await fetch(`${apiBaseUrl}/estudiantes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      throw new Error("Error al registrar estudiante")
    }

    const newStudent = await response.json()
    alert(`Registro exitoso! Tu ID de estudiante es: ${newStudent.id_estudiantes}\nGuarda este ID para iniciar sesión en el futuro.`)
    
    // Iniciar sesión automáticamente con el nuevo estudiante
    currentStudentId = newStudent.id_estudiantes
    localStorage.setItem("currentStudentId", currentStudentId)
    
    updateUIForLoggedInUser()
    showSection("home")
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudo completar el registro. Por favor intenta nuevamente.")
  }
}

// Cerrar sesión
function logoutStudent() {
  localStorage.removeItem("currentStudentId")
  currentStudentId = null
  showLoginSection()
}

// Actualizar UI para usuario con sesión iniciada
function updateUIForLoggedInUser() {
  // Mostrar la barra lateral
  document.querySelector(".sidebar").style.display = "block"
  document.querySelector(".content").classList.add("col-md-9", "col-lg-10")
  document.querySelector(".content").classList.remove("col-12")
}

// Guardar perfil del estudiante (modificado)
async function saveProfile(event) {
  event.preventDefault()

  const nombre = document.getElementById("profile-name-input").value.trim()
  if (!nombre) {
    alert("El nombre es requerido")
    return
  }

  try {
    // Solo actualizar estudiante existente (ya no creamos nuevos aquí)
    const response = await fetch(`${apiBaseUrl}/estudiantes/${currentStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar el perfil")
    }

    alert("Perfil actualizado correctamente")
    loadStudentProfile()
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudo guardar el perfil")
  }
}

// Mostrar sección
function showSection(sectionName) {
  // Ocultar todas las secciones
  for (const key in sections) {
    sections[key].style.display = "none"
  }

  // Mostrar la sección seleccionada
  sections[sectionName].style.display = "block"

  // Actualizar navegación
  for (const key in navLinks) {
    navLinks[key].classList.remove("active")
  }
  navLinks[sectionName].classList.add("active")

  // Cargar datos según la sección
  if (sectionName === "profile" && currentStudentId) {
    loadStudentProfile()
  } else if (sectionName === "subjects") {
    loadAvailableSubjects()
  } else if (sectionName === "enrollment" && currentStudentId) {
    loadEnrollments()
  } else if (sectionName === "grades" && currentStudentId) {
    loadGrades()
  }
}

// Verificar si ya existe un estudiante en localStorage
function checkExistingStudent() {
  const savedStudentId = localStorage.getItem("currentStudentId")
  if (savedStudentId) {
    currentStudentId = savedStudentId
    loadStudentProfile()
  } else {
    // Si no hay estudiante, mostrar formulario de creación
    showCreateStudentForm()
  }
}

// Mostrar formulario de creación de estudiante
function showCreateStudentForm() {
  showSection("profile")
  document.getElementById("profile-view").style.display = "none"
  document.getElementById("profile-edit").style.display = "block"
  buttons.editProfile.style.display = "none"
}

// Cargar perfil del estudiante
async function loadStudentProfile() {
  if (!currentStudentId) return

  try {
    const response = await fetch(`${apiBaseUrl}/estudiantes/${currentStudentId}`)
    if (!response.ok) {
      throw new Error("Error al cargar el perfil")
    }

    const student = await response.json()

    // Actualizar la vista del perfil
    document.getElementById("profile-id").textContent = student.id_estudiantes
    document.getElementById("profile-name").textContent = student.nombre

    // Actualizar el formulario de edición
    document.getElementById("profile-name-input").value = student.nombre

    // Mostrar la vista y ocultar el formulario
    document.getElementById("profile-view").style.display = "block"
    document.getElementById("profile-edit").style.display = "none"
    buttons.editProfile.style.display = "block"
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudo cargar el perfil del estudiante")
  }
}

// Alternar entre vista y edición del perfil
function toggleProfileEdit() {
  const profileView = document.getElementById("profile-view")
  const profileEdit = document.getElementById("profile-edit")

  if (profileView.style.display === "none" || profileView.style.display === "") {
    profileView.style.display = "block"
    profileEdit.style.display = "none"
  } else {
    profileView.style.display = "none"
    profileEdit.style.display = "block"
  }
}

// Guardar perfil del estudiante
async function saveProfile(event) {
  event.preventDefault()

  const nombre = document.getElementById("profile-name-input").value.trim()
  if (!nombre) {
    alert("El nombre es requerido")
    return
  }

  try {
    if (currentStudentId) {
      // Actualizar estudiante existente
      const response = await fetch(`${apiBaseUrl}/estudiantes/${currentStudentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil")
      }

      alert("Perfil actualizado correctamente")
    } else {
      // Crear nuevo estudiante
      const response = await fetch(`${apiBaseUrl}/estudiantes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      })

      if (!response.ok) {
        throw new Error("Error al crear el perfil")
      }

      const newStudent = await response.json()
      currentStudentId = newStudent.id_estudiantes
      localStorage.setItem("currentStudentId", currentStudentId)

      alert("Perfil creado correctamente")
    }

    // Recargar el perfil
    loadStudentProfile()
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudo guardar el perfil")
  }
}

// Cargar asignaturas disponibles
async function loadAvailableSubjects() {
  try {
    const response = await fetch(`${apiBaseUrl}/asignaturas-disponibles`)
    if (!response.ok) {
      throw new Error("Error al cargar asignaturas")
    }

    const subjects = await response.json()
    const tableBody = document.getElementById("subjects-table-body")
    tableBody.innerHTML = ""

    if (subjects.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay asignaturas disponibles</td></tr>'
      return
    }

    subjects.forEach((subject) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${subject.asignatura}</td>
                <td>${subject.profesor}</td>
                <td>${subject.ciclo}</td>
                <td>
                    <button class="btn btn-sm btn-primary enroll-btn" data-id="${subject.id}">
                        Matricular
                    </button>
                </td>
            `
      tableBody.appendChild(row)
    })

    // Agregar event listeners a los botones de matrícula
    document.querySelectorAll(".enroll-btn").forEach((button) => {
      button.addEventListener("click", () => {
        if (!currentStudentId) {
          alert("Debes crear un perfil primero")
          showSection("profile")
          return
        }

        showConfirmModal(`¿Estás seguro de que deseas matricularte en esta asignatura?`, () =>
          enrollInSubject(button.dataset.id),
        )
      })
    })
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudieron cargar las asignaturas disponibles")
  }
}

// Matricular en asignatura
async function enrollInSubject(asignacionId) {
  try {
    const response = await fetch(`${apiBaseUrl}/matriculas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_estudiantes: currentStudentId,
        id_profesores_ciclos_asignaturas: asignacionId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al matricularse")
    }

    alert("Te has matriculado correctamente")
    showSection("enrollment")
  } catch (error) {
    console.error("Error:", error)
    alert(error.message || "No se pudo completar la matrícula")
  }
}

// Cargar matrículas
async function loadEnrollments() {
  if (!currentStudentId) return

  try {
    const response = await fetch(`${apiBaseUrl}/matriculas`)
    if (!response.ok) {
      throw new Error("Error al cargar matrículas")
    }

    const allEnrollments = await response.json()
    const enrollments = allEnrollments.filter((e) => e.id_estudiantes === currentStudentId)

    const tableBody = document.getElementById("enrollments-table-body")
    tableBody.innerHTML = ""

    if (enrollments.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center">No estás matriculado en ninguna asignatura</td></tr>'
      return
    }

    enrollments.forEach((enrollment) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${enrollment.nombre_asignatura}</td>
                <td>${enrollment.nombre_profesor}</td>
                <td>${enrollment.ciclo}</td>
                <td>
                    <button class="btn btn-sm btn-danger unenroll-btn" data-id="${enrollment.id_matriculas}">
                        Anular
                    </button>
                </td>
            `
      tableBody.appendChild(row)
    })

    // Agregar event listeners a los botones de anulación
    document.querySelectorAll(".unenroll-btn").forEach((button) => {
      button.addEventListener("click", () => {
        showConfirmModal(
          `¿Estás seguro de que deseas anular esta matrícula? Perderás todas las calificaciones asociadas.`,
          () => unenrollFromSubject(button.dataset.id),
        )
      })
    })
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudieron cargar las matrículas")
  }
}

// Anular matrícula
async function unenrollFromSubject(matriculaId) {
  try {
    const response = await fetch(`${apiBaseUrl}/matriculas/${matriculaId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al anular matrícula")
    }

    alert("Matrícula anulada correctamente")
    loadEnrollments()
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudo anular la matrícula")
  }
}

// Cargar calificaciones
async function loadGrades() {
  if (!currentStudentId) return

  try {
    const response = await fetch(`${apiBaseUrl}/notas-estudiante/${currentStudentId}`)
    if (!response.ok) {
      throw new Error("Error al cargar calificaciones")
    }

    const grades = await response.json()
    const tableBody = document.getElementById("grades-table-body")
    tableBody.innerHTML = ""

    if (grades.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No tienes calificaciones registradas</td></tr>'
      return
    }

    grades.forEach((grade) => {
      const promedio = (grade.nota1 + grade.nota2) / 2
      const estado = grade.sup === 1 ? "Suplementario" : "Aprobado"
      const estadoClass = grade.sup === 1 ? "text-danger" : "text-success"

      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${grade.nombre_asignatura}</td>
                <td>${grade.nombre_profesor}</td>
                <td>${grade.nota1.toFixed(2)}</td>
                <td>${grade.nota2.toFixed(2)}</td>
                <td>${promedio.toFixed(2)}</td>
                <td class="${estadoClass}">${estado}</td>
            `
      tableBody.appendChild(row)
    })
  } catch (error) {
    console.error("Error:", error)
    alert("No se pudieron cargar las calificaciones")
  }
}

// Mostrar modal de confirmación
function showConfirmModal(message, callback) {
  document.getElementById("confirm-modal-body").textContent = message
  confirmModalCallback = callback
  const confirmModalElement = document.getElementById("confirmModal")
  const modal = new bootstrap.Modal(confirmModalElement)
  modal.show()
}

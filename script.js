class GestorDatos {
    constructor() {
        this.datosGuardados = JSON.parse(localStorage.getItem('datosFormulario')) || [];
        this.ultimaPersona = JSON.parse(localStorage.getItem('ultimaPersona')) || null;
        this.inicializarElementos();
        this.configurarEventos();
        this.mostrarDatosGuardados();
        this.mostrarUltimaPersona();
        this.configurarResponsive();
    }

    inicializarElementos() {
        this.form = document.getElementById('dataForm');
        this.nombreSelect = document.getElementById('nombre');
        this.fechaInput = document.getElementById('fecha');
        this.decisionInput = document.getElementById('decision');
        this.guardarBtn = document.getElementById('guardarBtn');
        this.mensajeDiv = document.getElementById('mensaje');
        this.listaDatos = document.getElementById('listaDatos');
        
        // Elementos para la última persona
        this.ultimaPersonaDiv = document.getElementById('ultimaPersona');
        this.avatarImg = document.getElementById('avatarImg');
        this.ultimoNombreSpan = document.getElementById('ultimoNombre');
        this.ultimaFechaSpan = document.getElementById('ultimaFecha');
    }

    configurarEventos() {
        this.guardarBtn.addEventListener('click', () => this.guardarDatos());
        
        this.nombreSelect.addEventListener('change', () => this.limpiarMensaje());
        this.decisionInput.addEventListener('input', () => this.limpiarMensaje());
        
        this.decisionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.guardarDatos();
            }
        });
    }

    configurarResponsive() {
        this.ajustarAlturaLista();
        window.addEventListener('resize', () => this.ajustarAlturaLista());
    }

    ajustarAlturaLista() {
        if (window.innerHeight < 600) {
            this.listaDatos.style.maxHeight = '200px';
        } else {
            this.listaDatos.style.maxHeight = '50vh';
        }
    }

    obtenerFechaActual() {
        const ahora = new Date();
        return ahora.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    obtenerAvatarPorNombre(nombre) {
    const avatares = {
        'Rafa': './images/rafa.jpg',
        'Tana': './images/tana.jpg',
        'TheGoat': './images/Andres.jpg'
    };
    return avatares[nombre] || './images/Nadie.webp';
}

    mostrarUltimaPersona() {
        if (!this.ultimaPersona) {
            this.ultimaPersonaDiv.className = 'ultima-persona vacio';
            this.ultimoNombreSpan.textContent = 'Nadie aún';
            this.ultimaFechaSpan.textContent = 'Sé el primero en guardar datos';
            this.avatarImg.src = this.obtenerAvatarPorNombre('default');
            return;
        }

        // Actualizar la información
        this.ultimoNombreSpan.textContent = this.ultimaPersona.nombre;
        this.ultimaFechaSpan.textContent = this.ultimaPersona.fecha;
        this.avatarImg.src = this.obtenerAvatarPorNombre(this.ultimaPersona.nombre);
        
        // Aplicar clase específica para el estilo de color y animación
        this.ultimaPersonaDiv.className = `ultima-persona nuevo-registro ${this.ultimaPersona.nombre.toLowerCase()}`;
        
        // Remover la clase de animación después de que termine
        setTimeout(() => {
            this.ultimaPersonaDiv.classList.remove('nuevo-registro');
        }, 3000);
    }


    guardarUltimaPersona(nombre, fecha) {
        this.ultimaPersona = {
            nombre: nombre,
            fecha: fecha
        };
        localStorage.setItem('ultimaPersona', JSON.stringify(this.ultimaPersona));
    }

    validarFormulario() {
        if (!this.nombreSelect.value) {
            this.mostrarMensaje('Por favor, selecciona un nombre', 'error');
            this.nombreSelect.focus();
            return false;
        }

        if (!this.decisionInput.value.trim()) {
            this.mostrarMensaje('Por favor, escribe una decisión', 'error');
            this.decisionInput.focus();
            return false;
        }

        return true;
    }

    guardarDatos() {
        if (!this.validarFormulario()) {
            return;
        }

        this.guardarBtn.disabled = true;
        this.guardarBtn.textContent = 'Guardando...';

        setTimeout(() => {
            const fechaClick = this.obtenerFechaActual();
            this.fechaInput.value = fechaClick;

            const nuevoDato = {
                id: Date.now(),
                nombre: this.nombreSelect.value,
                fecha: fechaClick,
                decision: this.decisionInput.value.trim()
            };

            this.datosGuardados.unshift(nuevoDato);
            this.guardarEnLocalStorage();
            
            // Guardar como última persona
            this.guardarUltimaPersona(this.nombreSelect.value, fechaClick);
            this.mostrarUltimaPersona();
            
            this.mostrarMensaje('Datos guardados correctamente', 'exito');
            this.mostrarDatosGuardados();
            this.limpiarFormulario();
            
            this.guardarBtn.disabled = false;
            this.guardarBtn.textContent = 'Guardar Datos';
        }, 500);
    }

    guardarEnLocalStorage() {
        localStorage.setItem('datosFormulario', JSON.stringify(this.datosGuardados));
    }

    mostrarDatosGuardados() {
        if (this.datosGuardados.length === 0) {
            this.listaDatos.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay datos guardados aún.</p>';
            return;
        }

        this.listaDatos.innerHTML = this.datosGuardados.map(dato => `
            <div class="item-dato">
                <p><strong>Nombre:</strong> ${this.escapeHTML(dato.nombre)}</p>
                <p><strong>Fecha:</strong> ${dato.fecha}</p>
                <p><strong>Decisión:</strong> ${this.escapeHTML(dato.decision)}</p>
                <button onclick="gestorDatos.eliminarDato(${dato.id})" class="btn-eliminar">
                    Eliminar
                </button>
            </div>
        `).join('');
    }

    eliminarDato(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este dato?')) {
            this.datosGuardados = this.datosGuardados.filter(dato => dato.id !== id);
            this.guardarEnLocalStorage();
            this.mostrarDatosGuardados();
            this.mostrarMensaje('Dato eliminado correctamente', 'exito');
            
            // Actualizar última persona si era la que se eliminó
            if (this.ultimaPersona && this.datosGuardados.length > 0) {
                const ultimoDato = this.datosGuardados[0];
                this.guardarUltimaPersona(ultimoDato.nombre, ultimoDato.fecha);
                this.mostrarUltimaPersona();
            } else if (this.datosGuardados.length === 0) {
                this.ultimaPersona = null;
                localStorage.removeItem('ultimaPersona');
                this.mostrarUltimaPersona();
            }
        }
    }

    mostrarMensaje(mensaje, tipo) {
        this.mensajeDiv.textContent = mensaje;
        this.mensajeDiv.className = `mensaje ${tipo}`;
        
        setTimeout(() => {
            this.limpiarMensaje();
        }, 4000);
    }

    limpiarMensaje() {
        this.mensajeDiv.style.display = 'none';
        this.mensajeDiv.className = 'mensaje';
    }

    limpiarFormulario() {
        this.nombreSelect.value = '';
        this.decisionInput.value = '';
        this.nombreSelect.focus();
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Estilos adicionales responsive para el botón eliminar
const estiloEliminar = document.createElement('style');
estiloEliminar.textContent = `
    .btn-eliminar {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
        border: none;
        padding: clamp(6px, 2vw, 8px) clamp(10px, 2vw, 15px);
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(11px, 2vw, 13px);
        margin-top: 8px;
        transition: all 0.3s ease;
        font-weight: bold;
    }
    
    .btn-eliminar:hover {
        background: linear-gradient(135deg, #c82333, #a71e2a);
        transform: translateY(-2px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    }
    
    .btn-eliminar:active {
        transform: translateY(0);
    }
    
    @media (max-width: 480px) {
        .btn-eliminar {
            width: 100%;
            padding: 10px;
        }
    }
`;
document.head.appendChild(estiloEliminar);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gestorDatos = new GestorDatos();
});
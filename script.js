// Configuración de Firebase - REEMPLAZA CON TUS DATOS
const firebaseConfig = {
  apiKey: "AIzaSyA7ZLApADgaiuEb0jYq2CRjGfKsJVJs1Cg",
  authDomain: "web-desiciones.firebaseapp.com",
  projectId: "web-desiciones",
  storageBucket: "web-desiciones.firebasestorage.app",
  messagingSenderId: "850430817535",
  appId: "1:850430817535:web:299139648cff9ce20608ca"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class GestorDatosFirebase {
    constructor() {
        this.datosGuardados = [];
        this.ultimaPersona = null;
        this.contadorUsuarios = 0;
        
        this.inicializarElementos();
        this.configurarEventos();
        this.inicializarFirebase();
    }

    inicializarElementos() {
        this.form = document.getElementById('dataForm');
        this.nombreSelect = document.getElementById('nombre');
        this.fechaInput = document.getElementById('fecha');
        this.decisionInput = document.getElementById('decision');
        this.guardarBtn = document.getElementById('guardarBtn');
        this.mensajeDiv = document.getElementById('mensaje');
        this.listaDatos = document.getElementById('listaDatos');
        this.ultimaPersonaDiv = document.getElementById('ultimaPersona');
        this.avatarImg = document.getElementById('avatarImg');
        this.ultimoNombreSpan = document.getElementById('ultimoNombre');
        this.ultimaFechaSpan = document.getElementById('ultimaFecha');
        this.estadoConexion = document.getElementById('estadoConexion');
        this.contadorUsuariosSpan = document.getElementById('contadorUsuarios');
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

    inicializarFirebase() {
        // Escuchar cambios en la colección de datos
        db.collection('formularioDatos')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                this.datosGuardados = [];
                snapshot.forEach((doc) => {
                    this.datosGuardados.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarDatosGuardados();
                this.actualizarUltimaPersona();
            });

        // Escuchar cambios en el contador de usuarios
        db.collection('estado').doc('usuarios')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.contadorUsuarios = doc.data().contador || 0;
                    this.actualizarContadorUsuarios();
                }
            });

        // Registrar usuario conectado
        this.registrarUsuario();
    }

    async registrarUsuario() {
        const usuarioRef = db.collection('estado').doc('usuarios');
        
        // Incrementar contador
        await usuarioRef.set({
            contador: firebase.firestore.FieldValue.increment(1),
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Manejar cuando el usuario cierra la página
        window.addEventListener('beforeunload', async () => {
            await usuarioRef.set({
                contador: firebase.firestore.FieldValue.increment(-1),
                ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    }

    actualizarContadorUsuarios() {
        this.contadorUsuariosSpan.textContent = `${this.contadorUsuarios} usuarios conectados`;
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
        'Rafa': './images/Rafa.jpeg',
        'Tana': './images/Tana.jpg', 
        'TheGoat': './images/Andres.jpg',
        'default': './images/Nadie.webp'
    };
    return avatares[nombre] || avatares['default'];
}

    actualizarUltimaPersona() {
        if (this.datosGuardados.length > 0) {
            const ultimo = this.datosGuardados[0];
            this.ultimaPersona = ultimo;
            this.mostrarUltimaPersona();
        } else {
            this.ultimaPersona = null;
            this.mostrarUltimaPersona();
        }
    }

    mostrarUltimaPersona() {
        if (!this.ultimaPersona) {
            this.ultimaPersonaDiv.className = 'ultima-persona vacio';
            this.ultimoNombreSpan.textContent = 'Nadie aún';
            this.ultimaFechaSpan.textContent = 'Sé el primero en decidir o jodete';
            this.avatarImg.src = this.obtenerAvatarPorNombre('default');
            return;
        }

        this.ultimoNombreSpan.textContent = this.ultimaPersona.nombre;
        this.ultimaFechaSpan.textContent = this.ultimaPersona.fecha;
        this.avatarImg.src = this.obtenerAvatarPorNombre(this.ultimaPersona.nombre);
        
        this.ultimaPersonaDiv.className = `ultima-persona nuevo-registro ${this.ultimaPersona.nombre.toLowerCase()}`;
        
        setTimeout(() => {
            this.ultimaPersonaDiv.classList.remove('nuevo-registro');
        }, 3000);
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

    async guardarDatos() {
        if (!this.validarFormulario()) {
            return;
        }

        this.guardarBtn.disabled = true;
        this.guardarBtn.textContent = 'Guardando...';

        try {
            const fechaClick = this.obtenerFechaActual();
            this.fechaInput.value = fechaClick;

            const nuevoDato = {
                nombre: this.nombreSelect.value,
                fecha: fechaClick,
                decision: this.decisionInput.value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Guardar en Firebase
            await db.collection('formularioDatos').add(nuevoDato);
            
            this.mostrarMensaje('Datos guardados correctamente', 'exito');
            this.limpiarFormulario();
            
        } catch (error) {
            console.error('Error al guardar:', error);
            this.mostrarMensaje('Error al guardar los datos', 'error');
        } finally {
            this.guardarBtn.disabled = false;
            this.guardarBtn.textContent = 'Guardar Datos';
        }
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
                <button onclick="gestorDatos.eliminarDato('${dato.id}')" class="btn-eliminar">
                    Eliminar
                </button>
            </div>
        `).join('');
    }

    async eliminarDato(id) {
    const boton = event.target;
    const item = boton.closest('.item-dato');
    
    // Confirmación con estilo
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
        return;
    }
    
    try {
        // Efecto visual de eliminación
        boton.className = 'btn-eliminar eliminando';
        boton.innerHTML = 'Eliminando...';
        item.classList.add('eliminando');
        
        // Eliminar de Firebase
        await db.collection('formularioDatos').doc(id).delete();
        
        // Animación de desaparición
        item.style.transition = 'all 0.5s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-100%)';
        item.style.margin = '0';
        item.style.padding = '0';
        item.style.maxHeight = '0';
        item.style.overflow = 'hidden';
        
        setTimeout(() => {
            this.mostrarMensaje('✅ Dato eliminado correctamente', 'exito');
        }, 500);
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        this.mostrarMensaje('❌ Error al eliminar el dato', 'error');
        
        // Restaurar botón
        boton.className = 'btn-eliminar';
        boton.innerHTML = 'Eliminar';
        item.classList.remove('eliminando');
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

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.gestorDatos = new GestorDatosFirebase();
});
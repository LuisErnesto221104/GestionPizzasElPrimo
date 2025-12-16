// URL base de la API (json-server u otro backend local)
const API_URL = 'http://localhost:3000';

// Variable que mantiene el id de la pizza que se está editando (null si ninguna)
let pizzaEditando = null;

// Al cargar el DOM, solicitar la lista de pizzas y enlazar el submit del formulario
document.addEventListener('DOMContentLoaded', () => {
    cargarPizzas();
    document.getElementById('form-pizza').addEventListener('submit', guardarPizza);
});

// Obtiene del servidor todas las pizzas y las pasa a renderizar
async function cargarPizzas() {
    try {
        const response = await fetch(`${API_URL}/pizzas`);
        const pizzas = await response.json();
        mostrarPizzas(pizzas);
    } catch (error) {
        // En caso de error, logear y mostrar mensaje en UI
        console.error('Error al cargar pizzas:', error);
        mostrarMensaje('Error al cargar las pizzas', 'error');
    }
}

// Renderiza en la tabla HTML las pizzas recibidas
function mostrarPizzas(pizzas) {
    const tbody = document.getElementById('tabla-pizzas-body');
    // Limpiar filas previas
    tbody.innerHTML = '';

    // Si no hay pizzas, mostrar fila indicativa
    if (pizzas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="sin-datos">No hay pizzas registradas</td>
            </tr>
        `;
        return;
    }

    // Crear fila por cada pizza con sus columnas y botones de acción
    pizzas.forEach(pizza => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pizza.nombre}</td>
            <td class="descripcion-cell">${pizza.descripcion}</td>
            <td>$${pizza.precios.chica.toFixed(2)}</td>
            <td>$${pizza.precios.mediana.toFixed(2)}</td>
            <td>$${pizza.precios.grande.toFixed(2)}</td>
            <td>$${pizza.precios.extragrande.toFixed(2)}</td>
            <td class="acciones-cell">
                <button class="btn-editar" onclick="editarPizza(${pizza.id})">
                    ✏️ Editar
                </button>
                <button class="btn-eliminar" onclick="eliminarPizza(${pizza.id})">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Guarda una pizza nueva o actualiza una existente según el estado de pizzaEditando
async function guardarPizza(e) {
    e.preventDefault();

    // Lee valores del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precioChica = parseFloat(document.getElementById('precio-chica').value);
    const precioMediana = parseFloat(document.getElementById('precio-mediana').value);
    const precioGrande = parseFloat(document.getElementById('precio-grande').value);
    const precioExtraGrande = parseFloat(document.getElementById('precio-extragrande').value);

    // Validaciones básicas de campos requeridos y números
    if (!nombre || !descripcion) {
        mostrarMensaje('Por favor complete todos los campos', 'error');
        return;
    }

    if (isNaN(precioChica) || isNaN(precioMediana) || isNaN(precioGrande) || isNaN(precioExtraGrande)) {
        mostrarMensaje('Por favor ingrese precios válidos', 'error');
        return;
    }

    // Construcción del objeto que se enviará al servidor
    const pizzaData = {
        nombre,
        descripcion,
        precios: {
            chica: precioChica,
            mediana: precioMediana,
            grande: precioGrande,
            extragrande: precioExtraGrande
        }
    };

    try {
        let response;
        if (pizzaEditando) {
            // Si se está editando, usar PUT a la ruta del recurso
            response = await fetch(`${API_URL}/pizzas/${pizzaEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pizzaData)
            });
        } else {
            // Si es creación, POST a /pizzas
            response = await fetch(`${API_URL}/pizzas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pizzaData)
            });
        }

        // Si la respuesta es exitosa, notificar, limpiar y recargar la tabla
        if (response.ok) {
            mostrarMensaje(pizzaEditando ? 'Pizza actualizada correctamente' : 'Pizza creada correctamente', 'exito');
            limpiarFormulario();
            cargarPizzas();
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error al guardar pizza:', error);
        mostrarMensaje('Error al guardar la pizza', 'error');
    }
}

// Carga una pizza por id y llena el formulario para edición
async function editarPizza(id) {
    try {
        const response = await fetch(`${API_URL}/pizzas/${id}`);
        const pizza = await response.json();

        // Rellenar campos del formulario con los datos de la pizza
        document.getElementById('nombre').value = pizza.nombre;
        document.getElementById('descripcion').value = pizza.descripcion;
        document.getElementById('precio-chica').value = pizza.precios.chica;
        document.getElementById('precio-mediana').value = pizza.precios.mediana;
        document.getElementById('precio-grande').value = pizza.precios.grande;
        document.getElementById('precio-extragrande').value = pizza.precios.extragrande;

        // Indicar que ahora estamos editando esa pizza y ajustar UI
        pizzaEditando = id;
        document.getElementById('btn-guardar').textContent = '✏️ Actualizar Pizza';
        document.getElementById('btn-cancelar').style.display = 'inline-block';
        document.getElementById('form-pizza').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error al cargar pizza:', error);
        mostrarMensaje('Error al cargar la pizza para editar', 'error');
    }
}

// Elimina una pizza por id tras pedir confirmación al usuario
async function eliminarPizza(id) {
    if (!confirm('¿Está seguro de eliminar esta pizza?')) return;

    try {
        const response = await fetch(`${API_URL}/pizzas/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarMensaje('Pizza eliminada correctamente', 'exito');
            cargarPizzas();
        } else {
            throw new Error('Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar pizza:', error);
        mostrarMensaje('Error al eliminar la pizza', 'error');
    }
}

// Limpia el formulario y resetea el estado de edición
function limpiarFormulario() {
    document.getElementById('form-pizza').reset();
    pizzaEditando = null;
    document.getElementById('btn-guardar').textContent = '🍕 Guardar Pizza';
    document.getElementById('btn-cancelar').style.display = 'none';
}

// Cancela la edición actual (alias a limpiarFormulario)
function cancelarEdicion() {
    limpiarFormulario();
}

// Muestra un mensaje temporal en la UI (éxito o error)
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';

    // Oculta el mensaje automáticamente después de 3s
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

// URL base de la API donde residen los recursos (json-server u otro backend)
const API_URL = 'http://localhost:3000';

// Agrega un listener para ejecutar código cuando el DOM esté completamente cargado
// y así iniciar la carga de los pedidos.
document.addEventListener('DOMContentLoaded', () => {
    // Llama a la función que obtiene los pedidos desde la API
    cargarPedidos();
});

// Función asíncrona que obtiene todos los pedidos desde la API
async function cargarPedidos() {
    try {
        // Ejecuta una petición GET a /pedidos
        const response = await fetch(`${API_URL}/pedidos`);
        // Parsear la respuesta JSON a un objeto/array de pedidos
        const pedidos = await response.json();
        // Mostrar los pedidos en la interfaz
        mostrarPedidos(pedidos);
        // Calcular estadísticas (totales, pendientes, etc.) y mostrarlas
        calcularEstadisticas(pedidos);
    } catch (error) {
        // Si ocurre un error, mostrarlo en la consola para depuración
        console.error('Error al cargar pedidos:', error);
        // Mostrar un mensaje de error dentro del contenedor de pedidos
        document.getElementById('lista-pedidos').innerHTML = `
            <div class="error-mensaje">
                <p>⚠️ Error al cargar los pedidos</p>
                <p>Asegúrese de que el servidor esté ejecutándose</p>
            </div>
        `;
    }
}

// Renderiza la lista de pedidos en el DOM
function mostrarPedidos(pedidos) {
    // Obtiene el contenedor donde se insertarán las tarjetas de pedido
    const container = document.getElementById('lista-pedidos');

    // Si no hay pedidos, muestra un mensaje y sale
    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="sin-pedidos">
                <p>📋 No hay pedidos registrados</p>
            </div>
        `;
        return;
    }

    // Ordena el array de pedidos por fecha descendente (más recientes primero)
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Construye el HTML para cada pedido y lo une en una sola cadena
    container.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card ${pedido.estado}">
            <div class="pedido-header">
                <div class="pedido-info">
                    <h3>Pedido #${pedido.id}</h3>
                    <span class="pedido-fecha">${formatearFecha(pedido.fecha)}</span>
                </div>
                <span class="pedido-estado estado-${pedido.estado}">${obtenerTextoEstado(pedido.estado)}</span>
            </div>
            
            <div class="pedido-cliente">
                <p><strong>👤 Cliente:</strong> ${pedido.cliente.nombre}</p>
                <p><strong>📞 Teléfono:</strong> ${pedido.cliente.telefono}</p>
            </div>

            <div class="pedido-items">
                <h4>Detalle del pedido:</h4>
                <ul>
                    ${pedido.items.map(item => `
                        <li>
                            <span class="item-cantidad">${item.cantidad}x</span>
                            <span class="item-nombre">${item.nombre}</span>
                            <span class="item-tamano">(${item.tamano})</span>
                            <span class="item-precio">$${item.subtotal.toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="pedido-totales">
                <div class="total-linea">
                    <span>Subtotal:</span>
                    <span>$${pedido.subtotal.toFixed(2)}</span>
                </div>
                ${pedido.descuento.porcentaje > 0 ? `
                    <div class="total-linea descuento">
                        <span>Descuento (${pedido.descuento.porcentaje}%):</span>
                        <span>-$${pedido.descuento.monto.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="total-linea total-final">
                    <span>TOTAL:</span>
                    <span>$${pedido.total.toFixed(2)}</span>
                </div>
            </div>

            <div class="pedido-acciones">
                <select onchange='cambiarEstado(${JSON.stringify(pedido.id)}, this.value)' class="select-estado">
                    <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="preparando" ${pedido.estado === 'preparando' ? 'selected' : ''}>👨‍🍳 Preparando</option>
                    <option value="listo" ${pedido.estado === 'listo' ? 'selected' : ''}>✅ Listo</option>
                    <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>🚀 Entregado</option>
                </select>
                <button class="btn-eliminar" onclick='eliminarPedido(${JSON.stringify(pedido.id)})'>🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Cambia el estado de un pedido llamando a la API con PATCH
async function cambiarEstado(id, nuevoEstado) {
    try {
        // Llama a la ruta específica del pedido con método PATCH
        const response = await fetch(`${API_URL}/pedidos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        // Si la actualización fue exitosa, recarga la lista y muestra una notificación
        if (response.ok) {
            cargarPedidos();
            mostrarNotificacion('Estado actualizado');
        }
    } catch (error) {
        // En caso de error, loguea y muestra notificación de error
        console.error('Error al cambiar estado:', error);
        mostrarNotificacion('Error al actualizar estado', 'error');
    }
}

// Elimina un pedido tras confirmar con el usuario
async function eliminarPedido(id) {
    // Mostrar diálogo de confirmación nativo; si cancela, no hacer nada
    if (!confirm('¿Está seguro de eliminar este pedido?')) return;

    try {
        // Llama a la API con método DELETE
        const response = await fetch(`${API_URL}/pedidos/${id}`, {
            method: 'DELETE'
        });

        // Si se eliminó correctamente, recargar lista y notificar
        if (response.ok) {
            cargarPedidos();
            mostrarNotificacion('Pedido eliminado');
        }
    } catch (error) {
        // Manejo de errores: log y notificación
        console.error('Error al eliminar pedido:', error);
        mostrarNotificacion('Error al eliminar pedido', 'error');
    }
}

// Calcula y muestra estadísticas básicas a partir del array de pedidos
function calcularEstadisticas(pedidos) {
    // Suma total de ventas (campo total de cada pedido)
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    // Número total de pedidos
    const totalPedidos = pedidos.length;
    // Cuenta pedidos con estado 'pendiente'
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;

    // Actualiza los elementos del DOM correspondientes a las estadísticas
    document.getElementById('total-ventas').textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById('total-pedidos').textContent = totalPedidos;
    document.getElementById('pedidos-pendientes').textContent = pedidosPendientes;
}

// Formatea una fecha ISO a un string legible para es-MX con fecha y hora
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Traduce el identificador de estado a un texto human-friendly con emoji
function obtenerTextoEstado(estado) {
    const estados = {
        pendiente: '⏳ Pendiente',
        preparando: '👨‍🍳 Preparando',
        listo: '✅ Listo',
        entregado: '🚀 Entregado'
    };
    // Devuelve la etiqueta correspondiente o el valor original si no existe
    return estados[estado] || estado;
}

// Crea y muestra una notificación temporal en la página
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const notificacion = document.createElement('div');
    // Asigna clases para estilos: 'notificacion' y tipo ('exito' o 'error')
    notificacion.className = `notificacion ${tipo}`;
    // Establece el texto que mostrará la notificación
    notificacion.textContent = mensaje;
    // Agrega la notificación al body para que sea visible
    document.body.appendChild(notificacion);

    // Añade la clase que activa la animación/transición justo después
    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    // Después de un tiempo, oculta y remueve la notificación del DOM
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => notificacion.remove(), 300);
    }, 2500);
}

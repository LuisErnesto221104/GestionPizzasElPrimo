// URL base de la API (ajustar si el backend corre en otra ubicación)
const API_URL = 'http://localhost:3000';

// Carrito en memoria: array de items que el cliente agrega
let carrito = [];
// Array con las pizzas disponibles que se carga desde la API
let pizzasDisponibles = [];

// Cuando el DOM esté listo, carga las pizzas desde la API
document.addEventListener('DOMContentLoaded', () => {
    cargarPizzasDisponibles();
});

// Función asíncrona que obtiene las pizzas disponibles desde /pizzas
async function cargarPizzasDisponibles() {
    try {
        const response = await fetch(`${API_URL}/pizzas`);
        // Guardar el JSON recibido en la variable global
        pizzasDisponibles = await response.json();
        // Renderizar el menú con las pizzas cargadas
        mostrarMenuPizzas();
    } catch (error) {
        // Mostrar error en consola y un mensaje en la UI si la petición falla
        console.error('Error al cargar pizzas:', error);
        document.getElementById('menu-pizzas').innerHTML = `
            <div class="error-mensaje">
                <p>⚠️ Error al cargar el menú. Asegúrese de que el servidor esté ejecutándose.</p>
                <p>Ejecute: <code>npx json-server --watch db.json</code></p>
            </div>
        `;
    }
}

// Renderiza las tarjetas del menú con las pizzas disponibles
function mostrarMenuPizzas() {
    const menuContainer = document.getElementById('menu-pizzas');
    
    // Si no hay pizzas, mostrar un mensaje instructivo
    if (pizzasDisponibles.length === 0) {
        menuContainer.innerHTML = `
            <div class="sin-pizzas">
                <p>🍕 No hay pizzas disponibles en el menú</p>
                <p>El administrador debe agregar pizzas primero</p>
            </div>
        `;
        return;
    }

    // Construye el HTML a partir del array de pizzas
    menuContainer.innerHTML = pizzasDisponibles.map(pizza => `
        <div class="pizza-card">
            <div class="pizza-header">
                <h3>🍕 ${pizza.nombre}</h3>
                <p class="pizza-descripcion">${pizza.descripcion}</p>
            </div>
            <div class="pizza-precios">
                <div class="precio-item">
                    <span class="tamano">Chica</span>
                    <span class="precio">$${pizza.precios.chica.toFixed(2)}</span>
                    <button class="btn-agregar" onclick='agregarAlCarrito(${JSON.stringify(pizza.id)}, "chica")'>+</button>
                </div>
                <div class="precio-item">
                    <span class="tamano">Mediana</span>
                    <span class="precio">$${pizza.precios.mediana.toFixed(2)}</span>
                    <button class="btn-agregar" onclick='agregarAlCarrito(${JSON.stringify(pizza.id)}, "mediana")'>+</button>
                </div>
                <div class="precio-item grande-item">
                    <span class="tamano">Grande</span>
                    <span class="precio">$${pizza.precios.grande.toFixed(2)}</span>
                    <button class="btn-agregar" onclick='agregarAlCarrito(${JSON.stringify(pizza.id)}, "grande")'>+</button>
                    <div class="descuento-info">🏷️ Descuento en 2+</div>
                </div>
                <div class="precio-item">
                    <span class="tamano">Extra Grande</span>
                    <span class="precio">$${pizza.precios.extragrande.toFixed(2)}</span>
                    <button class="btn-agregar" onclick='agregarAlCarrito(${JSON.stringify(pizza.id)}, "extragrande")'>+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Normaliza la entrada del teléfono para permitir solo dígitos
document.addEventListener('DOMContentLoaded', () => {
    const tel = document.getElementById('telefono-cliente');
    if (tel) {
        tel.addEventListener('input', (e) => {
            // Elimina todo lo que no sea dígito
            const cleaned = e.target.value.replace(/\D+/g, '');
            if (e.target.value !== cleaned) e.target.value = cleaned;
        });
    }
});

// Agrega una pizza/tamaño al carrito en memoria
function agregarAlCarrito(pizzaId, tamano) {
    // Asegura que el id sea string para comparaciones consistentes
    const pid = String(pizzaId);
    // Busca la pizza en el catálogo cargado
    const pizza = pizzasDisponibles.find(p => String(p.id) === pid);
    if (!pizza) return; // si no existe, salir

    // Si ya hay el mismo ítem (misma pizza y tamaño), incrementar cantidad
    const itemExistente = carrito.find(item => String(item.pizzaId) === pid && item.tamano === tamano);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        // Si no existe, empujar un nuevo objeto al carrito
        carrito.push({
            pizzaId: pid,
            nombre: pizza.nombre,
            tamano,
            precio: pizza.precios[tamano],
            cantidad: 1
        });
    }

    // Actualiza la visualización del ticket y muestra una notificación breve
    actualizarTicket();
    mostrarNotificacion(`${pizza.nombre} (${tamano}) agregada al carrito`);
}

// Elimina un item del carrito por su índice en el array
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarTicket();
}

// Modifica la cantidad (suma o resta) y elimina si llega a cero
function modificarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    actualizarTicket();
}

// Calcula descuentos aplicables según reglas (ej. por cantidad de pizzas grandes)
function calcularDescuento() {
    const pizzasGrandes = carrito
        .filter(item => item.tamano === 'grande')
        .reduce((total, item) => total + item.cantidad, 0);

    if (pizzasGrandes >= 3) {
        return { porcentaje: 15, cantidad: pizzasGrandes };
    } else if (pizzasGrandes >= 2) {
        return { porcentaje: 8, cantidad: pizzasGrandes };
    }
    return { porcentaje: 0, cantidad: pizzasGrandes };
}

// Actualiza la sección del ticket: lista de items, subtotal, descuento y total
function actualizarTicket() {
    const ticketItems = document.getElementById('ticket-items');
    const subtotalEl = document.getElementById('subtotal');
    const descuentoInfoEl = document.getElementById('descuento-info');
    const descuentoMontoEl = document.getElementById('descuento-monto');
    const totalEl = document.getElementById('total');

    // Si el carrito está vacío, muestra estado vacío y valores a cero
    if (carrito.length === 0) {
        ticketItems.innerHTML = '<p class="carrito-vacio">🛒 El carrito está vacío</p>';
        subtotalEl.textContent = '$0.00';
        descuentoInfoEl.textContent = 'Sin descuento';
        descuentoMontoEl.textContent = '-$0.00';
        totalEl.textContent = '$0.00';
        return;
    }

    // Renderiza cada item del carrito con controles de cantidad y eliminar
    ticketItems.innerHTML = carrito.map((item, index) => `
        <div class="ticket-item">
            <div class="item-info">
                <span class="item-nombre">${item.nombre}</span>
                <span class="item-tamano">(${item.tamano})</span>
            </div>
            <div class="item-controles">
                <button class="btn-cantidad" onclick="modificarCantidad(${index}, -1)">-</button>
                <span class="item-cantidad">${item.cantidad}</span>
                <button class="btn-cantidad" onclick="modificarCantidad(${index}, 1)">+</button>
            </div>
            <div class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</div>
            <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})">🗑️</button>
        </div>
    `).join('');

    // Calcula subtotal, descuento y total
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = calcularDescuento();
    
    const totalPizzasGrandes = carrito
        .filter(item => item.tamano === 'grande')
        .reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const montoDescuento = totalPizzasGrandes * (descuento.porcentaje / 100);
    const total = subtotal - montoDescuento;

    // Actualiza los elementos del DOM con los valores calculados
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    
    if (descuento.porcentaje > 0) {
        descuentoInfoEl.innerHTML = `
            <span class="descuento-activo">
                🎉 ${descuento.porcentaje}% en pizzas grandes (${descuento.cantidad} grandes)
            </span>
        `;
        descuentoMontoEl.textContent = `-$${montoDescuento.toFixed(2)}`;
        descuentoMontoEl.classList.add('tiene-descuento');
    } else {
        if (descuento.cantidad === 1) {
            descuentoInfoEl.innerHTML = `
                <span class="descuento-tip">
                    💡 ¡Agrega 1 pizza grande más para 8% de descuento!
                </span>
            `;
        } else {
            descuentoInfoEl.textContent = 'Sin descuento';
        }
        descuentoMontoEl.textContent = '-$0.00';
        descuentoMontoEl.classList.remove('tiene-descuento');
    }

    totalEl.textContent = `$${total.toFixed(2)}`;
}

// Valida los datos del cliente (nombre y teléfono) y devuelve los datos si válidos
function validarDatosCliente() {
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const telefono = document.getElementById('telefono-cliente').value.trim();

    if (!nombre) {
        mostrarNotificacion('Por favor ingrese su nombre', 'error');
        return false;
    }

    if (!/^[0-9]{10}$/.test(telefono)) {
        mostrarNotificacion('Por favor ingrese un número de teléfono válido de 10 dígitos', 'error');
        return false;
    }

    // Si pasa validaciones, devolver un objeto con nombre y teléfono
    return { nombre, telefono };
}

// Crea el objeto pedido y lo envía a la API con POST
async function confirmarPedido() {
    const cliente = validarDatosCliente();
    if (!cliente) return; // si validación falla, no continuar

    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }

    // Cálculos de subtotal, descuento y total (igual que en actualizarTicket)
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = calcularDescuento();
    const totalPizzasGrandes = carrito
        .filter(item => item.tamano === 'grande')
        .reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const montoDescuento = totalPizzasGrandes * (descuento.porcentaje / 100);
    const total = subtotal - montoDescuento;

    // Estructura del pedido que se enviará al servidor
    const pedido = {
        cliente,
        items: carrito.map(item => ({
            nombre: item.nombre,
            tamano: item.tamano,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.precio * item.cantidad
        })),
        subtotal,
        descuento: {
            porcentaje: descuento.porcentaje,
            monto: montoDescuento
        },
        total,
        fecha: new Date().toISOString(),
        estado: 'pendiente'
    };

    try {
        // Envío del pedido a la API
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        if (response.ok) {
            // Si se guarda correctamente, mostrar confirmación y limpiar carrito
            const pedidoGuardado = await response.json();
            mostrarConfirmacion(pedidoGuardado);
            carrito = [];
            actualizarTicket();
            document.getElementById('nombre-cliente').value = '';
            document.getElementById('telefono-cliente').value = '';
        } else {
            throw new Error('Error al guardar pedido');
        }
    } catch (error) {
        console.error('Error al confirmar pedido:', error);
        mostrarNotificacion('Error al confirmar el pedido', 'error');
    }
}

// Muestra un modal de confirmación con el detalle del pedido guardado
function mostrarConfirmacion(pedido) {
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacion';
    modal.innerHTML = `
        <div class="modal-contenido">
            <h2>✅ ¡Pedido Confirmado!</h2>
            <p class="pedido-numero">Pedido #${pedido.id}</p>
            <div class="pedido-resumen">
                <p><strong>Cliente:</strong> ${pedido.cliente.nombre}</p>
                <p><strong>Teléfono:</strong> ${pedido.cliente.telefono}</p>
                <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
            </div>
            <p class="mensaje-gracias">¡Gracias por su compra! 🍕</p>
            <button class="btn-cerrar-modal" onclick="this.closest('.modal-confirmacion').remove()">
                Cerrar
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Crea y muestra una notificación temporal en la página
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);

    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => notificacion.remove(), 300);
    }, 2500);
}

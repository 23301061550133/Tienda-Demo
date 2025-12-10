let products = [];
const productsEl = document.getElementById('products');
const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const sortSelect = document.getElementById('sortSelect');
const favCount = document.getElementById('favCount');
const cartCount = document.getElementById('cartCount');

// state in localStorage
const state = {
favorites: JSON.parse(localStorage.getItem('td_favs')||'[]'),
cart: JSON.parse(localStorage.getItem('td_cart')||'[]'),
user: JSON.parse(localStorage.getItem('td_user')||'null')
};

let activeCategory = 'all'; // categoría activa

function saveState(){
localStorage.setItem('td_favs', JSON.stringify(state.favorites));
localStorage.setItem('td_cart', JSON.stringify(state.cart));
localStorage.setItem('td_user', JSON.stringify(state.user));
updateCounts();
renderProducts(products); // actualizar ❤ en cards
}

function updateCounts(){
favCount.textContent = state.favorites.length;
cartCount.textContent = state.cart.reduce((s,i)=>s+i.qty,0);
}

async function loadProducts(){
const resp = await fetch('products.json');
products = await resp.json();
renderProducts(products);
updateCounts();
}

function formatPrice(p){ return '$' + p.toFixed(2); }

function renderProducts(list){
productsEl.innerHTML = '';
list.forEach(p=>{
const isFav = state.favorites.includes(p.id);
const card = document.createElement('div');
card.className='card';
card.innerHTML = `       <img src="${p.image}" alt="${p.title}" />       <h4>${p.title}</h4>       <div class="meta">         <div>${p.brand} • ${formatPrice(p.price)}</div>         <div>⭐ ${p.rating}</div>       </div>       <div style="display:flex;gap:8px;margin-top:8px">         <button class="view" data-id="${p.id}">Ver</button>         <button class="fav" data-id="${p.id}">${isFav ? '❤' : '🤍'}</button>         <button class="add" data-id="${p.id}">Añadir</button>       </div>`;
productsEl.appendChild(card);
});
}

function openLogin(){ document.getElementById('loginModal').classList.remove('hidden'); }
function closeModals(){ document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden')); }

document.addEventListener('click', (e)=>{
if(e.target.matches('#loginBtn')) openLogin();
if(e.target.matches('.modal .close')) closeModals();

if(e.target.matches('.view')){
const id = +e.target.dataset.id;
const p = products.find(x=>x.id===id);
document.getElementById('productDetail').innerHTML = `       <h3>${p.title}</h3>       <img style="width:100%;height:260px;object-fit:cover;border-radius:8px" src="${p.image}" />       <p>Marca: ${p.brand}</p>       <p>Precio: ${formatPrice(p.price)}</p>       <p>Valoración: ⭐ ${p.rating}</p>       <div style="display:flex;gap:8px;margin-top:12px">         <button id="favDetail" data-id="${p.id}">${state.favorites.includes(p.id)?'❤ Favorito':'🤍 Favorito'}</button>         <button id="addDetail" data-id="${p.id}">Añadir al carrito</button>       </div>
    `;
document.getElementById('productModal').classList.remove('hidden');
}

// ❤️ FAVORITOS
if(e.target.matches('.fav') || e.target.matches('#favDetail')){
const id = +e.target.dataset.id;
if(!state.favorites.includes(id)) state.favorites.push(id);
else state.favorites = state.favorites.filter(x=>x!==id);
saveState();
}

// 🛒 AÑADIR AL CARRITO
if(e.target.matches('.add') || e.target.matches('#addDetail')){
const id = +e.target.dataset.id;
const item = state.cart.find(x=>x.id===id);
if(item) item.qty++;
else state.cart.push({id, qty:1});
saveState();
}

// ❤️ ABRIR MODAL DE FAVORITOS
if(e.target.matches('#favBtn')){
const favs = state.favorites.map(id => products.find(p=>p.id===id));
if(favs.length === 0){ alert('No hay favoritos'); return; }
renderFavoritesModal(favs);
}

// 🛒 ABRIR MODAL DE CARRITO
if(e.target.matches('#cartBtn')){
if(state.cart.length===0){ alert('Carrito vacío'); return; }
renderCartModal();
}
});

// ❤️ FUNCIÓN PARA MOSTRAR FAVORITOS EN MODAL
function renderFavoritesModal(list){
const container = document.getElementById('favItems');
container.innerHTML = list.map(p => `     <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">       <img src="${p.image}" style="width:60px;height:60px;object-fit:cover;border-radius:6px" />       <span>${p.title}</span>       <button class="removeFav" data-id="${p.id}" style="margin-left:auto">Eliminar</button>     </div>
  `).join('');
document.getElementById('favModal').classList.remove('hidden');
}

// ❤️ ELIMINAR DE FAVORITOS
document.getElementById('favItems').addEventListener('click', e => {
if(e.target.matches('.removeFav')){
const id = +e.target.dataset.id;
state.favorites = state.favorites.filter(x => x !== id);
saveState();
const favs = state.favorites.map(id => products.find(p => p.id===id));
if(favs.length === 0) closeModals();
else renderFavoritesModal(favs);
}
});

// 🛒 FUNCIÓN PARA MOSTRAR CARRITO EN MODAL
function renderCartModal(){
const container = document.getElementById('cartItems');
let total = 0;
container.innerHTML = state.cart.map(ci=>{
const p = products.find(pp=>pp.id===ci.id);
const lineTotal = p.price * ci.qty;
total += lineTotal;
return `       <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">         <img src="${p.image}" style="width:60px;height:60px;object-fit:cover;border-radius:6px" />         <span>${p.title} x ${ci.qty}</span>         <span style="margin-left:auto">${formatPrice(lineTotal)}</span>         <button class="removeCart" data-id="${ci.id}">Eliminar</button>       </div>
    `;
}).join('');
document.getElementById('cartTotal').textContent = formatPrice(total);
document.getElementById('cartModal').classList.remove('hidden');
}

// 🛒 ELIMINAR ITEM DEL CARRITO
document.getElementById('cartItems').addEventListener('click', e => {
if(e.target.matches('.removeCart')){
const id = +e.target.dataset.id;
state.cart = state.cart.filter(x => x.id!==id);
saveState();
if(state.cart.length === 0) closeModals();
else renderCartModal();
}
});

// search & filters
searchInput.addEventListener('input', ()=>applyFilters());
brandFilter.addEventListener('change', ()=>applyFilters());
sortSelect.addEventListener('change', ()=>applyFilters());

function applyFilters(){
const q = searchInput.value.trim().toLowerCase();
const brand = brandFilter.value;

let list = products.filter(p=> {
const matchesText = p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
const matchesBrand = brand ? p.brand===brand : true;
const matchesCategory = activeCategory==='all' ? true : p.category===activeCategory;
return matchesText && matchesBrand && matchesCategory;
});

const s = sortSelect.value;
if(s==='price-asc') list.sort((a,b)=>a.price-b.price);
if(s==='price-desc') list.sort((a,b)=>b.price-a.price);
if(s==='rating-desc') list.sort((a,b)=>b.rating-b.rating);

renderProducts(list);
}

// login demo
document.getElementById('doLogin').addEventListener('click', ()=>{
const email = document.getElementById('email').value.trim();
if(!email){ alert('Escribe un correo'); return; }
state.user = {email, name: email.split('@')[0]};
saveState();
alert('Sesión iniciada como ' + state.user.email);
closeModals();
});

// load
loadProducts();

// FILTRO POR CATEGORÍA
const catButtons = document.querySelectorAll('.catBtn');

catButtons.forEach(btn => {
btn.addEventListener('click', () => {
activeCategory = btn.dataset.cat; // guardar categoría activa
catButtons.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
applyFilters(); // aplicar filtros combinados
});
});



// --------------------------------------------------------------
// ✅ BOTÓN "COMPRAR" — (AGREGADO SIN MODIFICAR NADA DE TU CÓDIGO)
// --------------------------------------------------------------

document.getElementById('cartModal').querySelector('.modal-content').insertAdjacentHTML(
    "beforeend",
    `<button id="buyBtn" style="margin-top:15px;width:100%;padding:10px;border:none;border-radius:8px;background:#28a745;color:white;font-size:18px;cursor:pointer;">
        Comprar
    </button>`
);

document.addEventListener("click", e => {
    if (e.target.id === "buyBtn") {
        alert("🎉 ¡Gracias por tu compra! Tu pedido está en proceso.");
    }
});

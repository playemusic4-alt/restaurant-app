import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyABf4BYpvETlUFKqn70XDd0qIYBJoML0Jo",
    authDomain: "restaurant-app-demo-efa66.firebaseapp.com",
    projectId: "restaurant-app-demo-efa66",
    storageBucket: "restaurant-app-demo-efa66.firebasestorage.app",
    messagingSenderId: "772573783622",
    appId: "1:772573783622:web:a22bd96d5874617ba1cc47"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const menuRef = collection(db, "menu");
const ordersRef = collection(db, "orders");

const menuList = document.getElementById('menuList');
const totalPriceEl = document.getElementById('totalPrice');
let menuItems = [];

onSnapshot(menuRef, (snapshot) => {
    menuList.innerHTML = "";
    menuItems = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        if (!data.name || typeof data.price !== "number") {
            console.warn("Invalid item data", data);
            return;
        }
        menuItems.push(data);

        const div = document.createElement('div');
        div.className = "item";
        div.innerHTML = `
            ${data.image ? `<img src="${data.image}" alt="${data.name}" />` : `<div style="height:120px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#aaa;font-style:italic;">No Image</div>`}
            <div class="item-content">
                <h3>${data.name}</h3>
                <p>₹${data.price}</p>
                <div class="quantity-control">
                    <button onclick="changeQuantity('qty-${data.id}', -1)">-</button>
                    <input type="number" id="qty-${data.id}" min="0" value="0" readonly />
                    <button onclick="changeQuantity('qty-${data.id}', 1)">+</button>
                </div>
            </div>
        `;
        menuList.appendChild(div);
    });
    updateTotal();
});

window.changeQuantity = function(inputId, change) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let value = parseInt(input.value) + change;
    if (value < 0) value = 0;
    input.value = value;
    updateTotal();
};

function updateTotal() {
    let total = 0;
    menuItems.forEach(item => {
        const qty = parseInt(document.getElementById(`qty-${item.id}`)?.value || 0);
        total += qty * item.price;
    });
    totalPriceEl.textContent = "Total: ₹" + total;
}

window.placeOrder = async function() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const table = document.getElementById('table').value.trim();

    if (!name || !phone || !table) {
        alert("Please fill all details.");
        return;
    }

    const items = [];
    menuItems.forEach(item => {
        const qty = parseInt(document.getElementById(`qty-${item.id}`)?.value || 0);
        if (qty > 0) {
            items.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: qty
            });
        }
    });

    if (items.length === 0) {
        alert("Please select at least one item.");
        return;
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        await addDoc(ordersRef, {
            name,
            phone,
            table,
            items,
            total,
            timestamp: new Date()
        });
        alert("Order placed successfully!");
        // Reset form
        document.getElementById('name').value = "";
        document.getElementById('phone').value = "";
        document.getElementById('table').value = "";
        menuItems.forEach(item => {
            document.getElementById(`qty-${item.id}`).value = 0;
        });
        updateTotal();
    } catch (error) {
        console.error("Error placing order: ", error);
        alert("Failed to place order. Please try again.");
    }
};
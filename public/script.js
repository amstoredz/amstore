const TELEGRAM_BOT_TOKEN = '8566898262:AAE7jjCLazUWHxwSTQ89GWg2K_yLupboQ1Q';
const TELEGRAM_CHAT_ID = '5820217239';

let products = [];
let currentProduct = null;
let isAdmin = false;

// --- Default Products ---
const defaultProducts = [
    {
        id: 1700000000001,
        name: "ساعة رولكس دايتونا (نسخة طبق الأصل)",
        price: "45000",
        colors: ["فضية", "ذهبية", "سوداء"],
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        description: "ساعة فاخرة بتصميم رياضي أنيق، مقاومة للماء والصدأ."
    },
    {
        id: 1700000000002,
        name: "ساعة كاسيو فينتاج",
        price: "5500",
        colors: ["ذهبية", "فضية"],
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        description: "تصميم كلاسيكي يعود للثمانينات، مناسبة للجنسين."
    }
];

// --- إعدادات التوصيل ---
const DEFAULT_DELIVERY = 800; // السعر الافتراضي للولايات غير المذكورة
const DELIVERY_RATES = {
    2: 700,  // الشلف
    3: 900,  // الأغواط
    4: 750,  // أم البواقي
    5: 750,  // باتنة
    6: 750,  // بجاية
    7: 850,  // بسكرة
    9: 600,  // البليدة
    10: 700, // البويرة
    12: 800, // تبسة
    13: 750, // تلمسان
    14: 750, // تيارت
    15: 700, // تيزي وزو
    16: 450, // الجزائر
    17: 850, // الجلفة
    18: 750, // جيجل
    19: 700, // سطيف
    20: 800, // سعيدة
    21: 750, // سكيكدة
    22: 750, // سيدي بلعباس
    23: 750, // عنابة
    24: 800, // قالمة
    25: 700, // قسنطينة
    26: 700, // المدية
    27: 750, // مستغانم
    28: 750, // المسيلة
    29: 800, // معسكر
    30: 950, // ورقلة
    31: 700, // وهران
    32: 1000, // البيض
    34: 700, // برج بوعريريج
    35: 650, // بومرداس
    36: 850, // الطارف
    39: 900, // الوادي
    40: 800, // خنشلة
    41: 800, // سوق أهراس
    42: 650, // تيبازة
    43: 750, // ميلة
    44: 700, // عين الدفلى
    45: 850, // النعامة
    46: 750, // عين تموشنت
    47: 950, // غرداية
    48: 750, // غليزان
    51: 950, // أولاد جلال
    55: 950, // تقرت
    57: 950, // المغير
    58: 950, // المنيعة
};
let deliveryPrice = DEFAULT_DELIVERY;

// Algerian Wilayas
const wilayas = [
   "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
    "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
    "وهران", "البيض", "برج بوعريريج", "بومرداس", "الطارف", "الوادي", "خنشلة",
    "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", 
     "أولاد جلال", "تقرت", "المغير", "المنيعة"
];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    populateWilayas();
});

function populateWilayas() {
    const select = document.getElementById('c-state');
    wilayas.forEach((w, index) => {
        const option = document.createElement('option');
        option.value = `${index + 1} - ${w}`;
        option.textContent = `${index + 1} - ${w}`;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Modal Close
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // Buy Now -> Show Form
    document.getElementById('buy-now-btn').addEventListener('click', () => {
        document.getElementById('modal-details').classList.add('hidden');
        document.getElementById('modal-order').classList.remove('hidden');
        updateSummary();
    });

    // Back to Details
    document.getElementById('back-to-details').addEventListener('click', () => {
        document.getElementById('modal-order').classList.add('hidden');
        document.getElementById('modal-details').classList.remove('hidden');
    });

    // Order Form Submit
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);

    // Update Delivery Price on State Change
    document.getElementById('c-state').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
            const id = parseInt(val.split(' - ')[0]);
            deliveryPrice = DELIVERY_RATES[id] || DEFAULT_DELIVERY;
        } else {
            deliveryPrice = DEFAULT_DELIVERY;
        }
        updateSummary();
    });

    // Admin Trigger (Magic Click on Copyright)
    let clickCount = 0;
    const trigger = document.getElementById('copyright-trigger');
    trigger.addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 5) {
            clickCount = 0;
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('login-modal').classList.add('flex');
        }
    });

    // Login Modal Actions
    document.getElementById('close-login').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-modal').classList.remove('flex');
    });

    async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const ADMIN_PASSWORD = 'admin123'; // You can change this

    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-modal').classList.remove('flex');
        document.getElementById('admin-btn').classList.remove('hidden');
        renderProducts();
        showToast('تم تسجيل الدخول كمسؤول');
    } else {
        showToast('كلمة المرور خاطئة', true);
    }
}
    
    // Logout Action
    document.getElementById('logout-btn').addEventListener('click', () => {
        isAdmin = false;
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('admin-btn').classList.add('hidden');
        renderProducts(); // Re-render to remove delete buttons
        showToast('تم تسجيل الخروج');
    });

    // Add Product Form
    async function handleAddProduct(e) {
    e.preventDefault();
    const form = e.target;
    const newProduct = {
        id: Date.now(), // Simple unique ID
        name: form.elements['name'].value,
        price: form.elements['price'].value,
        color: form.elements['color'].value,
        image: form.elements['image'].value,
        description: form.elements['description'].value,
    };

    products.unshift(newProduct); // Add to the beginning
    saveProducts();
    renderProducts();
    form.reset();
    showToast('تمت إضافة المنتج بنجاح');
}
}

async function loadProducts() {
    try {
        const res = await fetch('products.json');
        products = await res.json();
        renderProducts();
    } catch (err) {
        console.error("فشل تحميل المنتجات:", err);
        // fallback to default products if JSON file fails
        products = defaultProducts;
        renderProducts();
    }
}

async function saveProductsToJSON() {
    try {
        // في موقع ثابت، لا يمكننا الكتابة إلى ملف JSON مباشرة
        // لكن يمكننا استخدام خدمة خارجية أو خادم بسيط
        // مؤقتاً، سنعرض لك كيفية نسخ الكود للصقه في ملف JSON
        
        const productsJSON = JSON.stringify(products, null, 2);
        
        // عرض الكود في نافذة منبثقة للنسخ
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-auto">
                <h3 class="text-lg font-bold mb-4">انسخ هذا الكود والصقه في ملف products.json:</h3>
                <textarea class="w-full h-64 p-2 border rounded font-mono text-sm">${productsJSON}</textarea>
                <div class="flex gap-2 mt-4">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        إغلاق
                    </button>
                    <button onclick="navigator.clipboard.writeText(this.parentElement.parentElement.querySelector('textarea').value); alert('تم النسخ!')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        نسخ الكود
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // حفظ مؤقت في LocalStorage أيضاً
        localStorage.setItem('am_store_products', productsJSON);
        
    } catch (err) {
        console.error("خطأ في حفظ المنتجات:", err);
        showToast('لا يمكن حفظ التغييرات بشكل دائم في موقع ثابت', true);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">لا توجد منتجات حالياً</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative group';
        card.innerHTML = `
            <div class="relative h-48 bg-gray-100">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-gray-800 truncate">${product.name}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-blue-600 font-bold">${product.price} د.ج</span>
                    ${product.colors && product.colors.length > 0 ? `<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${product.colors[0]}</span>` : ''}
                </div>
            </div>
            function deleteProduct(id, event) {
    event.stopPropagation(); // Prevent card click
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        showToast('تم حذف المنتج');
    }
}
        `;
        
        // Click to open modal (unless clicking delete)
        card.addEventListener('click', (e) => {
            if (!e.target.innerText.includes('حذف')) {
                openProduct(product);
            }
        });

        grid.appendChild(card);
    });
}

let selectedColor = null;

function openProduct(product) {
    currentProduct = product;
    selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;

    document.getElementById('m-image').src = product.image;
    document.getElementById('m-name').textContent = product.name;
    document.getElementById('m-desc').textContent = product.description || 'لا يوجد وصف';
    document.getElementById('m-price').textContent = `${product.price} د.ج`;
    
    const colorsContainer = document.getElementById('m-colors');
    const colorWrapper = document.getElementById('m-color-container');
    colorsContainer.innerHTML = '';

    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'px-3 py-1 border rounded-full text-sm transition';
            btn.textContent = color;
            btn.addEventListener('click', () => {
                selectedColor = color;
                // Update active state
                Array.from(colorsContainer.children).forEach(child => {
                    child.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
                    child.classList.add('border-gray-300');
                });
                btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            });
            colorsContainer.appendChild(btn);
        });
        // Select first color by default
        colorsContainer.children[0].click();
        colorWrapper.classList.remove('hidden');
    } else {
        colorWrapper.classList.add('hidden');
    }
    
    // Reset Views
    document.getElementById('modal-details').classList.remove('hidden');
    document.getElementById('modal-order').classList.add('hidden');
    
    // Show Modal
    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-modal').classList.remove('flex');
}

function updateSummary() {
    if (!currentProduct) return;
    document.getElementById('summary-price').textContent = `${currentProduct.price} د.ج`;
    document.getElementById('summary-delivery').textContent = `${deliveryPrice} د.ج`;
    document.getElementById('summary-total').textContent = `${parseInt(currentProduct.price) + deliveryPrice} د.ج`;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'جاري الإرسال...';
    btn.disabled = true;

    const customer = {
        name: document.getElementById('c-name').value,
        phone: document.getElementById('c-phone').value,
        state: document.getElementById('c-state').value,
        municipality: document.getElementById('c-muni').value,
    };

    const total = parseInt(currentProduct.price) + deliveryPrice;
    const message = `
        
        *طلب جديد من متجر AM Store* 🛍️
        -----------------------------------
        *المنتج:* ${currentProduct.name}
        *السعر:* ${currentProduct.price} د.ج
        *اللون:* ${selectedColor || 'غير محدد'}
        -----------------------------------
        *الزبون:* ${customer.name}
        *الهاتف:* ${customer.phone}
        *الولاية:* ${customer.state}
        *البلدية:* ${customer.municipality}
        -----------------------------------
        *سعر التوصيل:* ${deliveryPrice} د.ج
        *الإجمالي:* *${total} د.ج*
        
    `;

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const data = await res.json();
        
        if (data.ok) {
            showToast('تم استلام طلبك! سيتم التواصل معك قريباً.');
            closeModal();
            e.target.reset();
        } else {
            showToast('حدث خطأ، يرجى المحاولة لاحقاً', true);
        }
    } catch (err) {
        showToast('خطأ في الاتصال', true);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            isAdmin = true;
            document.getElementById('admin-panel').classList.remove('hidden');
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('flex');
            document.getElementById('admin-btn').classList.remove('hidden'); // Show small indicator
            renderProducts(); // Re-render to show delete buttons
            showToast('تم تسجيل الدخول كمسؤول');
        } else {
            showToast('كلمة المرور خاطئة', true);
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleAddProduct(e) {
    e.preventDefault();
    const product = {
        name: document.getElementById('p-name').value,
        price: document.getElementById('p-price').value,
        color: document.getElementById('p-color').value,
        image: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value
    };

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        if (data.success) {
            showToast('تم إضافة المنتج');
            e.target.reset();
            fetchProducts();
        }
    } catch (err) {
        showToast('فشل الإضافة', true);
    }
}

async function deleteProduct(id, e) {
    e.stopPropagation(); // Prevent opening modal
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        fetchProducts();
        showToast('تم الحذف');
    } catch (err) {
        showToast('فشل الحذف', true);
    }
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg transition-opacity duration-300 z-[70] ${isError ? 'bg-red-600' : 'bg-gray-800'} text-white`;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

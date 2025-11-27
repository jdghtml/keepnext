import { store } from './store.js';
import { auth } from './auth.js';
import { externalApi } from './external-apis.js';
import { stats } from './stats.js';

export const ui = {
    currentCategory: 'all',
    currentView: 'grid',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();

        // Listen for store updates
        store.subscribe(() => this.render());

        // Listen for auth events
        document.addEventListener('auth:login', (e) => this.updateAuthUI(e.detail));
        document.addEventListener('auth:logout', () => this.updateAuthUI(null));

        // Check theme
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Init Stats
        stats.init();

        // Init Icon Picker
        this.renderIconPicker();
    },

    cacheDOM() {
        this.dom = {
            categoriesList: document.getElementById('categoriesList'),
            itemsGrid: document.getElementById('itemsGrid'),
            addCategoryBtn: document.getElementById('addCategoryBtn'),
            addItemBtn: document.getElementById('addItemBtn'),
            itemModal: document.getElementById('itemModal'),
            categoryModal: document.getElementById('categoryModal'),
            exportModal: document.getElementById('exportModal'),
            closeModals: document.querySelectorAll('.close-modal'),
            itemForm: document.getElementById('itemForm'),
            categoryForm: document.getElementById('categoryForm'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            statsBtn: document.getElementById('statsBtn'),
            exportBtn: document.getElementById('exportBtn'),
            downloadExportBtn: document.getElementById('downloadExportBtn'),
            importFile: document.getElementById('importFile'),
            loginBtn: document.getElementById('loginBtn'),
            userInfo: document.getElementById('userInfo'),
            userAvatar: document.getElementById('userAvatar'),
            userName: document.getElementById('userName'),
            logoutBtn: document.getElementById('logoutBtn'),
            searchApiBtn: document.getElementById('searchApiBtn'),
            itemTitle: document.getElementById('itemTitle'),
            searchResults: document.getElementById('searchResults'),
            sortSelect: document.getElementById('sortSelect'),
            searchInput: document.getElementById('searchInput'),
            viewToggles: document.querySelectorAll('.view-toggle button'),
            iconPicker: document.getElementById('iconPicker'),
            categoryIconInput: document.getElementById('categoryIcon'),
            menuToggleBtn: document.getElementById('menuToggleBtn'),
            closeSidebarBtn: document.getElementById('closeSidebarBtn'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            sidebar: document.querySelector('.sidebar')
        };
    },

    bindEvents() {
        // Modals
        this.dom.addCategoryBtn.addEventListener('click', () => this.openModal('categoryModal'));
        this.dom.addItemBtn.addEventListener('click', () => this.openModal('itemModal'));
        this.dom.statsBtn.addEventListener('click', () => stats.show());
        this.dom.exportBtn.addEventListener('click', () => this.openModal('exportModal'));

        this.dom.closeModals.forEach(btn => btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        }));

        // Export/Import
        this.dom.downloadExportBtn.addEventListener('click', () => {
            const data = {
                categories: store.categories,
                items: store.items,
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'keepnext-backup.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        this.dom.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.categories && data.items) {
                        if (confirm('Esto sobrescribirá tus datos actuales. ¿Estás seguro?')) {
                            store.importData(data);
                            this.closeModal('exportModal');
                            alert('Importación exitosa');
                        }
                    } else {
                        alert('Formato de archivo inválido');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error al leer el archivo');
                }
            };
            reader.readAsText(file);
        });

        // Forms
        this.dom.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('categoryId').value; // Need to add this hidden input to HTML
            const name = document.getElementById('categoryName').value;
            const icon = document.getElementById('categoryIcon').value || '📁';

            if (id) {
                store.updateCategory(id, { name, icon });
            } else {
                store.addCategory(name, icon);
            }

            this.closeModal('categoryModal');
            e.target.reset();
        });

        this.dom.itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('itemId').value;
            const title = document.getElementById('itemTitle').value;
            let imageUrl = document.getElementById('itemImage').value;

            // Generate placeholder if empty
            if (!imageUrl) {
                imageUrl = this.generatePlaceholderUrl(title);
            }

            const data = {
                title: title,
                category_id: document.getElementById('itemCategory').value,
                rating: parseInt(document.querySelector('.rating-input').dataset.value || 0),
                image_url: imageUrl,
                description: document.getElementById('itemDescription').value
            };

            if (id) {
                store.updateItem(id, data);
            } else {
                store.addItem(data);
            }

            this.closeModal('itemModal');
            e.target.reset();
            this.resetRating();
        });

        // Auth
        this.dom.loginBtn.addEventListener('click', () => auth.loginWithGoogle());
        this.dom.logoutBtn.addEventListener('click', () => auth.logout());

        // Theme
        this.dom.darkModeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });

        // Search API
        this.dom.searchApiBtn.addEventListener('click', async () => {
            const query = this.dom.itemTitle.value;
            if (!query) return;

            this.dom.searchResults.innerHTML = '<p>Buscando...</p>';
            this.dom.searchResults.classList.remove('hidden');

            const results = await externalApi.search(query);
            this.renderSearchResults(results);
        });

        // Categories Navigation
        this.dom.categoriesList.addEventListener('click', (e) => {
            const item = e.target.closest('.category-item');
            if (item) {
                this.setActiveCategory(item.dataset.id);
            }
        });

        // Rating Star Click
        const ratingContainer = document.getElementById('itemRatingInput');
        this.renderRatingInput(ratingContainer);

        // Sorting
        this.dom.sortSelect.addEventListener('change', () => this.renderItems());

        // Search Filter
        this.dom.searchInput.addEventListener('input', () => this.renderItems());

        // Item Actions Delegation
        this.dom.itemsGrid.addEventListener('click', (e) => {
            if (e.target.closest('.edit-item')) {
                e.stopPropagation(); // Prevent card click if any
                const id = e.target.closest('.item-card').dataset.id;
                this.editItem(id);
            } else if (e.target.closest('.delete-item')) {
                e.stopPropagation();
                const id = e.target.closest('.item-card').dataset.id;
                if (confirm('¿Eliminar elemento?')) {
                    store.deleteItem(id);
                }
            }
        });

        // View Toggle
        this.dom.viewToggles.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.viewToggles.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.dom.itemsGrid.className = this.currentView === 'list' ? 'items-list' : 'items-grid';
                this.renderItems();
            });
        });
    },

    openModal(id) {
        document.getElementById(id).classList.remove('hidden');
        if (id === 'itemModal') {
            this.populateCategorySelect();
            // Reset form if it's a new item (check if we are editing)
            // Actually, we should clear it unless we called editItem
            if (!this.isEditing) {
                document.getElementById('itemForm').reset();
                document.getElementById('itemId').value = '';
                this.resetRating();
                document.getElementById('modalTitle').textContent = 'Añadir Elemento';
            }
            this.isEditing = false;
        } else if (id === 'categoryModal') {
            if (!this.isEditing) {
                document.getElementById('categoryForm').reset();
                document.getElementById('categoryId').value = '';
                this.selectIcon('📁'); // Default
            }
            this.isEditing = false;
        }
    },

    editItem(id) {
        const item = store.items.find(i => i.id === id);
        if (!item) return;

        this.isEditing = true;
        this.openModal('itemModal');

        document.getElementById('modalTitle').textContent = 'Editar Elemento';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemCategory').value = item.category_id;
        document.getElementById('itemImage').value = item.image_url || '';
        document.getElementById('itemDescription').value = item.description || '';

        // Set rating
        const ratingContainer = document.querySelector('.rating-input');
        ratingContainer.dataset.value = item.rating;
        ratingContainer.querySelectorAll('span').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.val) <= item.rating);
        });
    },

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    },

    updateAuthUI(user) {
        if (user) {
            this.dom.loginBtn.classList.add('hidden');
            this.dom.userInfo.classList.remove('hidden');
            this.dom.userName.textContent = user.user_metadata.full_name || user.email;
            this.dom.userAvatar.src = user.user_metadata.avatar_url || 'https://via.placeholder.com/32';
        } else {
            this.dom.loginBtn.classList.remove('hidden');
            this.dom.userInfo.classList.add('hidden');
        }
        store.fetchCategories();
        store.fetchItems();
    },

    render() {
        this.renderCategories();
        this.renderItems();
    },

    renderCategories() {
        const html = store.categories.map(cat => `
            <li class="category-item ${this.currentCategory === cat.id ? 'active' : ''}" 
                data-id="${cat.id}">
                <div class="cat-content">
                    <span>${cat.icon}</span> ${cat.name}
                </div>
                <div class="cat-actions">
                    <button class="btn-icon-small edit-cat" title="Editar">✏️</button>
                    <button class="btn-icon-small delete-cat" title="Eliminar">🗑️</button>
                </div>
            </li>
        `).join('');

        this.dom.categoriesList.innerHTML = `
            <li class="category-item ${this.currentCategory === 'all' ? 'active' : ''}" data-id="all">
                <div class="cat-content"><span>🏠</span> Todas</div>
            </li>
            ${html}
        `;

        // Bind category actions
        this.dom.categoriesList.querySelectorAll('.edit-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.category-item').dataset.id;
                this.editCategory(id);
            });
        });

        this.dom.categoriesList.querySelectorAll('.delete-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.category-item').dataset.id;
                if (confirm('¿Eliminar categoría y sus elementos?')) {
                    store.deleteCategory(id);
                    if (this.currentCategory === id) this.setActiveCategory('all');
                }
            });
        });
    },

    editCategory(id) {
        const cat = store.categories.find(c => c.id === id);
        if (!cat) return;

        this.isEditing = true;
        document.getElementById('categoryId').value = cat.id;
        document.getElementById('categoryName').value = cat.name;
        this.selectIcon(cat.icon);

        this.openModal('categoryModal');
    },

    renderIconPicker() {
        const icons = [
            '📁', '📚', '🎬', '📺', '🎵', '🎮', '💻', '📱', '📷', '🎨',
            '⚽', '🏀', '🏋️', '🧘', '✈️', '🌍', '🏠', '🚗', '💰', '🛒',
            '🍔', '🍕', '🍺', '☕', '🎉', '🎁', '💡', '📝', '❤️', '⭐'
        ];

        this.dom.iconPicker.innerHTML = icons.map(icon => `
            <div class="icon-option" data-icon="${icon}">${icon}</div>
        `).join('');

        this.dom.iconPicker.addEventListener('click', (e) => {
            const option = e.target.closest('.icon-option');
            if (option) {
                this.selectIcon(option.dataset.icon);
            }
        });
    },

    selectIcon(icon) {
        this.dom.categoryIconInput.value = icon;
        this.dom.iconPicker.querySelectorAll('.icon-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.icon === icon);
        });
    },

    setActiveCategory(id) {
        this.currentCategory = id;
        this.render();
    },

    renderItems() {
        let items = store.getItemsByCategory(this.currentCategory);

        // Filter by search
        const search = this.dom.searchInput.value.toLowerCase();
        if (search) {
            items = items.filter(i => i.title.toLowerCase().includes(search));
        }

        // Sort
        const sort = this.dom.sortSelect.value;
        items.sort((a, b) => {
            if (sort === 'rating-desc') return b.rating - a.rating;
            if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
            if (sort === 'title-asc') return a.title.localeCompare(b.title);
            return 0; // custom order (todo)
        });

        this.dom.itemsGrid.innerHTML = items.map(item => this.createItemCard(item)).join('');

        // Re-apply drag events if needed
        this.setupDragAndDrop();
    },

    createItemCard(item) {
        const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
        // Fallback for image load error
        const fallbackUrl = this.generatePlaceholderUrl(item.title);

        return `
            <div class="item-card" draggable="true" data-id="${item.id}">
                <div class="card-actions">
                    <button class="btn-icon-small edit-item" onclick="document.dispatchEvent(new CustomEvent('edit-item', {detail: '${item.id}'}))">✏️</button>
                    <button class="btn-icon-small delete-item" onclick="document.dispatchEvent(new CustomEvent('delete-item', {detail: '${item.id}'}))">🗑️</button>
                </div>
                <img src="${item.image_url || fallbackUrl}" 
                     class="item-image" 
                     alt="${item.title}"
                     onerror="this.onerror=null;this.src='${fallbackUrl}';">
                <div class="item-info">
                    <h3 class="item-title" title="${item.title}">${item.title}</h3>
                    <div class="item-rating">${stars}</div>
                </div>
            </div>
        `;
    },

    bindItemActions() {
        // Since items are re-rendered often, we use a global listener or delegation.
        // But for simplicity in this architecture, let's use the custom events dispatched from inline onclicks
        // or better, delegate to the grid container.
    },

    generatePlaceholderUrl(title) {
        // Use a placeholder service that supports text
        // Encode title to be URL safe
        const text = encodeURIComponent(title);
        // Using placehold.co which is reliable and supports custom colors
        // Background: #e5e7eb (gray-200), Text: #374151 (gray-700)
        return `https://placehold.co/400x600/e5e7eb/374151?text=${text}`;
    },

    populateCategorySelect() {
        const select = document.getElementById('itemCategory');
        select.innerHTML = store.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    },

    renderRatingInput(container) {
        container.innerHTML = [1, 2, 3, 4, 5].map(i => `<span data-val="${i}">★</span>`).join('');
        const stars = container.querySelectorAll('span');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.dataset.val);
                container.dataset.value = val;
                stars.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
                });
            });
        });
    },

    resetRating() {
        const container = document.querySelector('.rating-input');
        container.dataset.value = 0;
        container.querySelectorAll('span').forEach(s => s.classList.remove('active'));
    },

    renderSearchResults(results) {
        this.dom.searchResults.innerHTML = results.map((r, index) => `
            <div class="search-result-item" data-index="${index}">
                <img src="${r.image || ''}" width="40">
                <div>
                    <strong>${r.title}</strong>
                    <p>${r.description}</p>
                </div>
                <button type="button" class="btn-small">Usar</button>
            </div>
        `).join('');

        this.dom.searchResults.querySelectorAll('button').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const data = results[idx];
                document.getElementById('itemTitle').value = data.title;
                document.getElementById('itemImage').value = data.image || '';
                document.getElementById('itemDescription').value = data.description;
                this.dom.searchResults.classList.add('hidden');
            });
        });
    },

    setupDragAndDrop() {
        const cards = document.querySelectorAll('.item-card');
        const container = this.dom.itemsGrid;

        cards.forEach(card => {
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        });

        container.addEventListener('drop', () => {
            // Persist new order
            const newOrderIds = [...container.querySelectorAll('.item-card')].map(el => el.dataset.id);
            store.reorderItems(newOrderIds);
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.item-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};

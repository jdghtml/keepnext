import { db } from './supabase-client.js';
import { auth } from './auth.js';

class Store {
    constructor() {
        this.categories = [];
        this.items = [];
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this));
    }

    // --- Categories ---
    async fetchCategories() {
        if (!auth.user) {
            // Local fallback or empty
            this.categories = JSON.parse(localStorage.getItem('categories')) || [
                { id: 'cat_1', name: 'Películas', icon: '🎬', user_id: 'local' },
                { id: 'cat_2', name: 'Libros', icon: '📚', user_id: 'local' }
            ];
            this.notify();
            return;
        }

        try {
            this.categories = await db.getAll('categories', 'order=order_index.asc');
            this.notify();
        } catch (e) {
            console.error('Error fetching categories:', e);
        }
    }

    async addCategory(name, icon) {
        const newCat = {
            name,
            icon,
            user_id: auth.user ? auth.user.id : 'local',
            order_index: this.categories.length
        };

        if (auth.user) {
            const saved = await db.create('categories', newCat);
            this.categories.push(saved);
        } else {
            newCat.id = 'local_' + Date.now();
            this.categories.push(newCat);
            this.saveLocal();
        }
        this.notify();
    }

    async updateCategory(id, updates) {
        if (auth.user) {
            const updated = await db.update('categories', id, updates);
            const index = this.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                this.categories[index] = updated;
            }
        } else {
            const index = this.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                this.categories[index] = { ...this.categories[index], ...updates };
                this.saveLocal();
            }
        }
        this.notify();
    }

    async deleteCategory(id) {
        if (auth.user) {
            await db.deleteById('categories', id);
        }
        this.categories = this.categories.filter(c => c.id !== id);
        // Also delete items in this category or move them? 
        // For now, let's just keep them or they will be hidden if we filter by category.
        // Better to delete them or move to 'uncategorized' (not implemented).
        // Let's assume cascade delete in DB, but locally we should clean up.
        this.items = this.items.filter(i => i.category_id !== id);

        this.saveLocal();
        this.notify();
    }

    // --- Items ---
    async fetchItems() {
        if (!auth.user) {
            this.items = JSON.parse(localStorage.getItem('items')) || [];
            this.notify();
            return;
        }

        try {
            this.items = await db.getAll('items', 'order=created_at.desc');
            this.notify();
        } catch (e) {
            console.error('Error fetching items:', e);
        }
    }

    async addItem(itemData) {
        const newItem = {
            ...itemData,
            user_id: auth.user ? auth.user.id : 'local',
            created_at: new Date().toISOString()
        };

        if (auth.user) {
            const saved = await db.create('items', newItem);
            this.items.unshift(saved);
        } else {
            newItem.id = 'local_' + Date.now();
            this.items.unshift(newItem);
            this.saveLocal();
        }
        this.notify();
    }

    async updateItem(id, updates) {
        if (auth.user) {
            const updated = await db.update('items', id, updates);
            const index = this.items.findIndex(i => i.id === id);
            if (index !== -1) {
                this.items[index] = updated;
            }
        } else {
            const index = this.items.findIndex(i => i.id === id);
            if (index !== -1) {
                this.items[index] = { ...this.items[index], ...updates };
                this.saveLocal();
            }
        }
        this.notify();
    }

    async deleteItem(id) {
        if (auth.user) {
            await db.deleteById('items', id);
        }
        this.items = this.items.filter(i => i.id !== id);
        this.saveLocal(); // Always save local if in local mode
        this.notify();
    }

    saveLocal() {
        if (!auth.user) {
            localStorage.setItem('categories', JSON.stringify(this.categories));
            localStorage.setItem('items', JSON.stringify(this.items));
        }
    }

    // --- Filtering/Sorting ---
    getItemsByCategory(categoryId) {
        if (categoryId === 'all') return this.items;
        return this.items.filter(i => i.category_id === categoryId);
    }

    // --- Import/Export/Reorder ---
    importData(data) {
        // This is a destructive import for simplicity
        this.categories = data.categories;
        this.items = data.items;
        this.saveLocal();
        // If logged in, we would need to sync this to Supabase, which is complex (delete all, insert all).
        // For now, we'll assume import is mostly for local backup or initial migration.
        // TODO: Implement proper sync for import when logged in.
        this.notify();
    }

    reorderItems(orderedIds) {
        // Create a map for O(1) lookup
        const itemMap = new Map(this.items.map(i => [i.id, i]));

        // Reconstruct items array in the new order
        // Note: This only reorders the items currently visible/dragged. 
        // If we are in a category view, we only reorder those.
        // A better approach for a real app is to have an 'order_index' field.

        // For this simple implementation, we'll just update the local array order
        // based on the IDs passed, keeping others in their place if they weren't involved?
        // Actually, drag and drop usually happens within a filtered view.

        // Let's just update the order_index if we were using it, but here we rely on array order.
        // We will simply re-sort the main items array to match the visual order where possible.

        const newItems = [];
        const touchedIds = new Set(orderedIds);

        // Add ordered items first
        orderedIds.forEach(id => {
            if (itemMap.has(id)) {
                newItems.push(itemMap.get(id));
            }
        });

        // Add remaining items (those not in the current view/drag list)
        this.items.forEach(item => {
            if (!touchedIds.has(item.id)) {
                newItems.push(item);
            }
        });

        this.items = newItems;
        this.saveLocal();
        // We don't notify here to avoid re-rendering and killing the drag animation if it was still ongoing
        // But since this is on 'drop', it's fine.
    }
}

export const store = new Store();

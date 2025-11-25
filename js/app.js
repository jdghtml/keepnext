import { auth } from './auth.js';
import { store } from './store.js';
import { ui } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI
    ui.init();

    // Initialize Auth (checks for session)
    await auth.init();

    // Initial Fetch (will use local storage if not logged in)
    await store.fetchCategories();
    await store.fetchItems();
});

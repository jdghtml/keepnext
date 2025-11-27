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

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered');
        } catch (e) {
            console.error('Service Worker registration failed', e);
        }
    }
});

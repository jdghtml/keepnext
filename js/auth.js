import { CONFIG } from './config.js';
import { db } from './supabase-client.js';

// We use the official Supabase JS client for Auth because implementing OAuth flow manually is complex and error-prone.
// For Database operations, we use our custom 'db' RestClient as requested.

let supabaseAuthClient = null;

if (window.supabase && CONFIG.SUPABASE_URL.startsWith('http')) {
    try {
        supabaseAuthClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    } catch (e) {
        console.warn('Supabase Client failed to initialize. Running in local mode.', e);
    }
} else {
    console.warn('Supabase URL not configured. Running in local mode.');
}

export const auth = {
    user: null,

    async init() {
        if (!supabaseAuthClient) return;

        const { data: { session } } = await supabaseAuthClient.auth.getSession();
        this.handleSession(session);

        supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
            this.handleSession(session);
        });
    },

    handleSession(session) {
        if (session) {
            this.user = session.user;
            db.setAuthToken(session.access_token);
            document.dispatchEvent(new CustomEvent('auth:login', { detail: this.user }));
        } else {
            this.user = null;
            // Reset to anon key if needed, or just keep it (anon key allows public reads usually)
            // db.setAuthToken(CONFIG.SUPABASE_KEY); 
            document.dispatchEvent(new CustomEvent('auth:logout'));
        }
    },

    async loginWithGoogle() {
        if (!supabaseAuthClient) return;
        await supabaseAuthClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
            }
        });
    },

    async logout() {
        if (!supabaseAuthClient) return;
        await supabaseAuthClient.auth.signOut();
    }
};

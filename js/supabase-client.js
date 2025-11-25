import { RestClient } from './api.js';
import { CONFIG } from './config.js';

/**
 * Supabase specific wrapper using the generic RestClient.
 * Handles Supabase REST API conventions (PostgREST).
 */
export class SupabaseApi extends RestClient {
    constructor() {
        super(`${CONFIG.SUPABASE_URL}/rest/v1`, {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            'Prefer': 'return=representation' // Ask Supabase to return the created/updated object
        });
    }

    setAuthToken(token) {
        this.setHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Generic table operations
    async getAll(table, query = '') {
        return this.get(`/${table}?${query}`);
    }

    async getById(table, id) {
        const result = await this.get(`/${table}?id=eq.${id}`);
        return result[0];
    }

    async create(table, data) {
        const result = await this.post(`/${table}`, data);
        return result[0]; // Supabase returns array
    }

    async update(table, id, data) {
        const result = await this.patch(`/${table}?id=eq.${id}`, data);
        return result[0];
    }

    async deleteById(table, id) {
        return this.delete(`/${table}?id=eq.${id}`);
    }
}

export const db = new SupabaseApi();

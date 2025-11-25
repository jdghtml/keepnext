/**
 * Generic REST API Client
 * Designed to be reusable across projects.
 */
export class RestClient {
    constructor(baseUrl, headers = {}) {
        this.baseUrl = baseUrl;
        this.headers = headers;
    }

    setHeaders(headers) {
        this.headers = { ...this.headers, ...headers };
    }

    async request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'API Request Failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    }

    put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    }

    patch(endpoint, body) {
        return this.request(endpoint, 'PATCH', body);
    }

    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }
}

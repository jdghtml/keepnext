import { CONFIG } from './config.js';

export const externalApi = {
    async search(query, type = 'movie') {
        // Simple strategy: try OMDB for movies/series, Google Books for books
        // In a real app, we might select the source based on the category selected

        const results = [];

        // 1. Search OMDB (Movies/Series)
        if (CONFIG.OMDB_API_KEY && CONFIG.OMDB_API_KEY !== 'YOUR_OMDB_KEY') {
            try {
                const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${CONFIG.OMDB_API_KEY}`);
                const data = await res.json();
                if (data.Search) {
                    results.push(...data.Search.map(m => ({
                        title: m.Title,
                        image: m.Poster !== 'N/A' ? m.Poster : null,
                        description: `Year: ${m.Year} | Type: ${m.Type}`,
                        source: 'OMDB',
                        original: m
                    })));
                }
            } catch (e) {
                console.error('OMDB Error', e);
            }
        }

        // 2. Search Google Books
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.items) {
                results.push(...data.items.map(b => ({
                    title: b.volumeInfo.title,
                    image: b.volumeInfo.imageLinks?.thumbnail,
                    description: b.volumeInfo.description || (b.volumeInfo.authors ? `By ${b.volumeInfo.authors.join(', ')}` : ''),
                    source: 'Google Books',
                    original: b
                })));
            }
        } catch (e) {
            console.error('Google Books Error', e);
        }

        return results;
    }
};

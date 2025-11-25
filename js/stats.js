import { store } from './store.js';

export const stats = {
    init() {
        this.modal = document.getElementById('statsModal');
        this.closeBtn = this.modal.querySelector('.close-modal');
        this.canvas = document.getElementById('statsChart');
        this.chart = null;

        this.closeBtn.addEventListener('click', () => {
            this.modal.classList.add('hidden');
        });
    },

    show() {
        this.modal.classList.remove('hidden');
        this.renderChart();
    },

    renderChart() {
        const ctx = this.canvas.getContext('2d');

        // Prepare data: Items per category
        const categoryCounts = {};
        store.categories.forEach(c => categoryCounts[c.name] = 0);

        store.items.forEach(item => {
            const cat = store.categories.find(c => c.id === item.category_id);
            if (cat) {
                categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
            } else {
                categoryCounts['Uncategorized'] = (categoryCounts['Uncategorized'] || 0) + 1;
            }
        });

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Items per Category',
                    data: data,
                    backgroundColor: [
                        '#6366f1',
                        '#818cf8',
                        '#c7d2fe',
                        '#4f46e5',
                        '#312e81',
                        '#fbbf24'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-main')
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de tu Colección',
                        color: getComputedStyle(document.body).getPropertyValue('--text-main')
                    }
                }
            }
        });
    }
};

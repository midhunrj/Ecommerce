
        // document.addEventListener('DOMContentLoaded', function () {
        //     fetch('/sales-data')
        //         .then(response => response.json())
        //         .then(data => {
        //             const ctx = document.getElementById('myChart').getContext('2d');

        //             new Chart(ctx, {
        //                 type: 'line',
        //                 data: {
        //                     labels: data.labels,
        //                     datasets: data.datasets
        //                 },
        //                 options: {
        //                     plugins: {
        //                         legend: {
        //                             labels: {
        //                                 usePointStyle: true,
        //                             },
        //                         },
        //                     },
        //                 },
        //             });
        //         })
        //         .catch(error => console.error('Error fetching sales data:', error));
        // });
        // document.addEventListener('DOMContentLoaded', function () {
        //     const timeRangeFilter = document.getElementById('timeRangeFilter');
        //     const fetchDataButton = document.getElementById('fetchDataButton');

        //     fetchDataButton.addEventListener('click', fetchData);

        //     function fetchData() {
        //         const selectedTimeRange = timeRangeFilter.value;
        //         fetch(`/sales-chart-data?timeRange=${selectedTimeRange}`)
        //             .then(response => response.json())
        //             .then(data => {
        //                 // Render chart with fetched data
        //                 renderChart(data);
        //             })
        //             .catch(error => console.error('Error fetching sales chart data:', error));
        //     }

        //     function renderChart(data) {
        //         const ctx = document.getElementById('myChart').getContext('2d');
        //         new Chart(ctx, {
        //             type: 'line',
        //             data: {
        //                 labels: data.labels,
        //                 datasets: [{
        //                     label: 'Sales',
        //                     data: data.datasets[0].data,
        //                     backgroundColor: 'rgba(44, 120, 220, 0.2)',
        //                     borderColor: 'rgba(44, 120, 220)',
        //                     borderWidth: 1
        //                 }]
        //             },
        //             options: {
        //                 plugins: {
        //                     legend: {
        //                         display: false // Hide legend for simplicity
        //                     }
        //                 },
        //                 scales: {
        //                     y: {
        //                         beginAtZero: true
        //                     }
        //                 }
        //             }
        //         });
        //     }
        // });
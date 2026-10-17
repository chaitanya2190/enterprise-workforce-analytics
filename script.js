document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('.tier-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active classes
            menuLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            link.classList.add('active');
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Chart.js Configurations ---
    Chart.defaults.color = '#5a6d84'; // mute
    Chart.defaults.font.family = 'Inter';

    // Tier 1: Attrition Trend Chart
    const ctxAttrition = document.getElementById('attritionChart').getContext('2d');
    new Chart(ctxAttrition, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Actual Attrition',
                data: [10.2, 10.5, 11.1, 11.5, 12.0, 12.8, 13.5, 13.9, 14.1, 14.2, 14.2, 14.2],
                borderColor: '#d4493a', // coral
                backgroundColor: 'rgba(212, 73, 58, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Target Cap (12%)',
                data: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                borderColor: '#b7791f', // amber
                borderDash: [5, 5],
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'YTD Attrition Trend vs Target',
                    color: '#14202e' // ink
                }
            }
        }
    });

    // Tier 2: Scatter Plot (Overtime vs Performance)
    // Generating mock scatter data
    const scatterData = [];
    for(let i=0; i<150; i++) {
        // High performers with high overtime (Burnout risk)
        if(i < 30) {
            scatterData.push({ x: 45 + Math.random()*20, y: 4.0 + Math.random()*1.0, risk: 'High' });
        } else {
            scatterData.push({ x: 5 + Math.random()*35, y: 2.0 + Math.random()*2.5, risk: 'Low' });
        }
    }

    const ctxScatter = document.getElementById('scatterChart').getContext('2d');
    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'High Risk (Burnout)',
                data: scatterData.filter(d => d.risk === 'High'),
                backgroundColor: '#d4493a', // coral
                pointRadius: 6
            }, {
                label: 'Stable',
                data: scatterData.filter(d => d.risk === 'Low'),
                backgroundColor: '#1c8a99', // teal
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Departmental Analysis: Overtime Hours vs Performance Rating',
                    color: '#14202e', // ink
                    font: { size: 16 }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Overtime Hours (Monthly)' }
                },
                y: {
                    title: { display: true, text: 'Performance Rating (1-5)' },
                    min: 1, max: 5
                }
            }
        }
    });

    // --- Tier 3: Risk Table Population ---
    const riskTableBody = document.getElementById('risk-table-body');
    const mockAtRiskEmployees = [
        { id: 'EMP_04821', tenure: 4.2, cr: 0.85, otr: '18.5%', risk: 0.89, action: 'Targeted Compensation' },
        { id: 'EMP_09133', tenure: 2.1, cr: 0.91, otr: '24.0%', risk: 0.84, action: 'Workload Redistribution' },
        { id: 'EMP_01104', tenure: 7.5, cr: 0.82, otr: '12.0%', risk: 0.76, action: 'Targeted Compensation' },
        { id: 'EMP_06229', tenure: 1.8, cr: 1.05, otr: '30.2%', risk: 0.72, action: 'Workload Redistribution' }
    ];

    mockAtRiskEmployees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${emp.id}</strong></td>
            <td>${emp.tenure}</td>
            <td style="color: ${emp.cr < 0.90 ? '#d4493a' : '#14202e'}">${emp.cr}</td>
            <td style="color: ${parseFloat(emp.otr) > 18 ? '#d4493a' : '#14202e'}">${emp.otr}</td>
            <td><span style="color: #d4493a; font-weight: bold;">${emp.risk}</span></td>
            <td><button class="btn-action" onclick="alert('Initiating Playbook: ${emp.action} for ${emp.id}')">${emp.action}</button></td>
        `;
        riskTableBody.appendChild(row);
    });
});

// ==========================================================================
// Enterprise Workforce Analytics Dashboard — Application Logic
// ==========================================================================

(function() {
  'use strict';

  // ==========================================================================
  // Configuration & Constants
  // ==========================================================================

  const CONFIG = {
    themeKey: 'workforce-theme',
    refreshInterval: 30000,
    animationDuration: 300,
    toastDuration: 4000,
  };

  const DEPARTMENTS = [
    { id: 'engineering', name: 'Engineering', icon: 'code', color: '#3b82f6', employees: 2847, attrition: 16.8, trend: '+2.1%', overtime: 22.4, performance: 4.2, compaRatio: 0.94 },
    { id: 'sales', name: 'Sales', icon: 'trending-up', color: '#ef4444', employees: 1523, attrition: 18.2, trend: '+3.4%', overtime: 18.7, performance: 3.8, compaRatio: 1.02 },
    { id: 'marketing', name: 'Marketing', icon: 'megaphone', color: '#ec4899', employees: 642, attrition: 12.1, trend: '-0.8%', overtime: 14.2, performance: 4.0, compaRatio: 0.98 },
    { id: 'operations', name: 'Operations', icon: 'cog', color: '#f59e0b', employees: 1892, attrition: 9.4, trend: '-1.2%', overtime: 8.3, performance: 3.9, compaRatio: 1.05 },
    { id: 'hr', name: 'Human Resources', icon: 'users', color: '#10b981', employees: 421, attrition: 7.8, trend: '-0.5%', overtime: 5.1, performance: 4.3, compaRatio: 1.08 },
    { id: 'finance', name: 'Finance', icon: 'dollar-sign', color: '#8b5cf6', employees: 922, attrition: 6.2, trend: '-0.3%', overtime: 11.8, performance: 4.1, compaRatio: 1.12 },
  ];

  const RISK_ACTIONS = {
    compensation: { label: 'Targeted Compensation Adjustment', icon: 'dollar-sign', color: 'var(--success)' },
    workload: { label: 'Workload Redistribution', icon: 'share-2', color: 'var(--warning)' },
    career: { label: 'Career Development Plan', icon: 'arrow-up-circle', color: 'var(--info)' },
    mentorship: { label: 'Mentorship Assignment', icon: 'user-plus', color: 'var(--accent)' },
    flexible: { label: 'Flexible Work Arrangement', icon: 'home', color: 'var(--accent)' },
  };

  // ==========================================================================
  // State Management
  // ==========================================================================

  const state = {
    theme: 'light',
    currentSection: 'tier1',
    riskEmployees: [],
    filteredEmployees: [],
    sortColumn: 'risk',
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 10,
    charts: {
      attrition: null,
      dept: null,
      scatter: null,
      attritionSpark: null,
    },
    filters: {
      department: 'all',
      risk: 'all',
      tenure: 'all',
    },
    searchQuery: '',
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  function initTheme() {
    const saved = localStorage.getItem(CONFIG.themeKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem(CONFIG.themeKey, state.theme);
    updateChartsForTheme();
    showToast('Theme changed to ' + state.theme + ' mode', 'info');
  }

  function updateChartsForTheme() {
    const isDark = state.theme === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)';

    Object.values(state.charts).forEach(chart => {
      if (chart && chart.options) {
        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
          chart.options.plugins.legend.labels.color = textColor;
        }
        if (chart.options.scales) {
          if (chart.options.scales.x) {
            chart.options.scales.x.grid = chart.options.scales.x.grid || {};
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.x.ticks = chart.options.scales.x.ticks || {};
            chart.options.scales.x.ticks.color = textColor;
          }
          if (chart.options.scales.y) {
            chart.options.scales.y.grid = chart.options.scales.y.grid || {};
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.y.ticks = chart.options.scales.y.ticks || {};
            chart.options.scales.y.ticks.color = textColor;
          }
        }
        if (chart.options.plugins && chart.options.plugins.title) {
          chart.options.plugins.title.color = isDark ? '#f8fafc' : '#0f172a';
        }
        chart.update('none');
      }
    });
  }

  // ==========================================================================
  // Navigation
  // ==========================================================================

  function initNavigation() {
    $$('.menu-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        navigateTo(targetId);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '3') {
        e.preventDefault();
        navigateTo('tier' + e.key);
      }
    });
  }

  function navigateTo(sectionId) {
    $$('.menu-item').forEach(l => l.classList.remove('active'));
    $$('.tier-section').forEach(s => s.classList.remove('active'));

    const link = $('[data-section="' + sectionId + '"]');
    const section = $('#' + sectionId);

    if (link && section) {
      link.classList.add('active');
      section.classList.add('active');
      state.currentSection = sectionId;

      // Trigger chart resize on section change
      setTimeout(() => {
        Object.values(state.charts).forEach(chart => chart?.resize());
      }, 50);
    }
  }

  // ==========================================================================
  // Data Generation
  // ==========================================================================

  function generateRiskEmployees() {
    const names = [
      'Sarah Chen', 'Marcus Johnson', 'Priya Patel', 'James Wilson', 'Aisha Khan',
      'David Park', 'Elena Rodriguez', 'Thomas Anderson', 'Lisa Wang', 'Robert Kim',
      'Jennifer Lopez', 'Michael Brown', 'Amanda Foster', 'Christopher Lee', 'Nicole Taylor',
      'Daniel Martinez', 'Rachel Green', 'Andrew Clark', 'Stephanie Lewis', 'Kevin Hall',
    ];

    const departments = DEPARTMENTS.map(d => d.id);
    const tenureBuckets = ['0-1', '1-3', '3-5', '5+'];

    state.riskEmployees = Array.from({ length: 24 }, (_, i) => {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const tenureBucket = tenureBuckets[Math.floor(Math.random() * tenureBuckets.length)];
      let tenure;
      switch (tenureBucket) {
        case '0-1': tenure = (Math.random() * 1).toFixed(1); break;
        case '1-3': tenure = (1 + Math.random() * 2).toFixed(1); break;
        case '3-5': tenure = (3 + Math.random() * 2).toFixed(1); break;
        case '5+': tenure = (5 + Math.random() * 15).toFixed(1); break;
      }

      const cr = 0.75 + Math.random() * 0.5;
      const otr = (5 + Math.random() * 30).toFixed(1);
      const performance = (2 + Math.random() * 3).toFixed(1);
      const baseRisk = 0.65 + Math.random() * 0.3;
      const risk = Math.min(0.98, baseRisk + (cr < 0.9 ? 0.05 : 0) + (otr > 18 ? 0.08 : 0) + (performance < 3 ? 0.07 : 0));

      let actionKey;
      if (cr < 0.9 && otr > 18) actionKey = 'compensation';
      else if (otr > 20) actionKey = 'workload';
      else if (performance > 4 && tenure < 3) actionKey = 'career';
      else if (tenure > 5) actionKey = 'mentorship';
      else actionKey = 'flexible';

      return {
        id: 'EMP_' + String(10000 + Math.floor(Math.random() * 90000)),
        name: names[i % names.length] + ' ' + String.fromCharCode(65 + (i % 26)),
        department: dept,
        tenure: parseFloat(tenure),
        cr: parseFloat(cr.toFixed(2)),
        otr: parseFloat(otr),
        performance: parseFloat(performance),
        risk: parseFloat(risk.toFixed(2)),
        action: actionKey,
        factors: generateRiskFactors(cr, otr, performance, tenure),
      };
    }).sort((a, b) => b.risk - a.risk);

    state.filteredEmployees = [...state.riskEmployees];
  }

  function generateRiskFactors(cr, otr, performance, tenure) {
    const factors = [];
    if (cr < 0.9) factors.push({ label: 'Below-market compensation (CR: ' + cr.toFixed(2) + ')', severity: 'high' });
    if (otr > 18) factors.push({ label: 'Excessive overtime (' + otr + '%)', severity: 'high' });
    if (performance < 3) factors.push({ label: 'Performance decline (' + performance + '/5)', severity: 'medium' });
    if (tenure < 2) factors.push({ label: 'Low tenure (' + tenure + ' years)', severity: 'medium' });
    if (factors.length === 0) factors.push({ label: 'Engagement signals declining', severity: 'low' });
    return factors;
  }

  function generateScatterData() {
    const data = [];
    const deptColors = {
      engineering: '#3b82f6',
      sales: '#ef4444',
      marketing: '#ec4899',
      operations: '#f59e0b',
      hr: '#10b981',
      finance: '#8b5cf6',
    };

    for (let i = 0; i < 200; i++) {
      const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)].id;
      let overtime, performance, riskLevel;

      const rand = Math.random();
      if (rand < 0.15) {
        // Burnout quadrant: High perf, High OT
        overtime = 35 + Math.random() * 25;
        performance = 4 + Math.random() * 1;
        riskLevel = 'burnout';
      } else if (rand < 0.3) {
        // Overworked: Med perf, High OT
        overtime = 25 + Math.random() * 20;
        performance = 2.5 + Math.random() * 1.5;
        riskLevel = 'overworked';
      } else if (rand < 0.55) {
        // Engaged: High perf, Low OT
        overtime = 2 + Math.random() * 15;
        performance = 3.8 + Math.random() * 1.2;
        riskLevel = 'engaged';
      } else {
        // Stable: Low perf, Low OT
        overtime = 1 + Math.random() * 12;
        performance = 2 + Math.random() * 2;
        riskLevel = 'stable';
      }

      data.push({
        x: Math.round(overtime * 10) / 10,
        y: Math.round(performance * 10) / 10,
        risk: riskLevel,
        department: dept,
        color: deptColors[dept],
        employeeId: 'EMP_' + String(10000 + Math.floor(Math.random() * 90000)),
      });
    }

    return data;
  }

  // ==========================================================================
  // Chart Initialization
  // ==========================================================================

  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded yet');
      return;
    }

    try {
      const isDark = state.theme === 'dark';
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)';

    // Color palette for charts (CSS variables don't work in canvas)
    const colors = {
      danger: '#dc2626',
      warning: '#eab308',
      success: '#16a34a',
      accent: '#0d9488',
      muted: '#94a3b8',
    };

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.font.size = 12;
    Chart.defaults.elements.point.radius = 4;
    Chart.defaults.elements.point.hoverRadius = 6;
    Chart.defaults.elements.line.tension = 0.35;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip = {
      enabled: true,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: isDark ? '#f8fafc' : '#0f172a',
      bodyColor: isDark ? '#cbd5e1' : '#475569',
      borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
    };

    // Attrition Trend Chart
    const attritionCtx = $('#attritionChart')?.getContext('2d');
    if (attritionCtx) {
      state.charts.attrition = new Chart(attritionCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Actual Attrition',
              data: [10.2, 10.5, 11.1, 11.5, 12.0, 12.8, 13.5, 13.9, 14.1, 14.2, 14.2, 14.2],
              borderColor: colors.danger,
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: colors.danger,
              pointBorderColor: isDark ? '#0f172a' : '#ffffff',
              pointBorderWidth: 2,
              pointHoverRadius: 7,
            },
            {
              label: 'Target Cap (12%)',
              data: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
              borderColor: colors.warning,
              borderDash: [6, 4],
              borderWidth: 2,
              fill: false,
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 5,
            },
            {
              label: 'Forecast (Model)',
              data: [null, null, null, null, null, null, null, null, 14.2, 13.8, 13.2, 12.7],
              borderColor: colors.success,
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              borderDash: [4, 4],
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            title: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%',
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor, drawBorder: false },
              ticks: { color: textColor, padding: 8 },
            },
            y: {
              min: 8,
              max: 18,
              grid: { color: gridColor, drawBorder: false },
              ticks: {
                color: textColor,
                padding: 8,
                callback: (val) => val + '%',
              },
            },
          },
        },
      });
    }

    // Department Attrition Chart
    const deptCtx = $('#deptChart')?.getContext('2d');
    if (deptCtx) {
      state.charts.dept = new Chart(deptCtx, {
        type: 'bar',
        data: {
          labels: DEPARTMENTS.map(d => d.name),
          datasets: [
            {
              label: 'Current Quarter',
              data: DEPARTMENTS.map(d => d.attrition),
              backgroundColor: DEPARTMENTS.map(d => d.color + 'CC'),
              borderColor: DEPARTMENTS.map(d => d.color),
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Previous Quarter',
              data: DEPARTMENTS.map(d => Math.max(3, d.attrition - parseFloat(d.trend))),
              backgroundColor: 'transparent',
              borderColor: DEPARTMENTS.map(d => d.color + '80'),
              borderWidth: 2,
              borderDash: [4, 4],
              borderRadius: 6,
              borderSkipped: false,
              type: 'bar',
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.x.toFixed(1) + '%' } } },
          scales: {
            x: {
              min: 0,
              max: 22,
              grid: { color: gridColor, drawBorder: false },
              ticks: { color: textColor, callback: (val) => val + '%' },
            },
            y: {
              grid: { display: false },
              ticks: { color: textColor, padding: 8 },
            },
          },
        },
      });
    }

    // Scatter Chart
    const scatterCtx = $('#scatterChart')?.getContext('2d');
    if (scatterCtx) {
      const scatterData = generateScatterData();

      const datasets = ['burnout', 'overworked', 'engaged', 'stable'].map(risk => ({
        label: risk === 'burnout' ? 'Burnout Risk' : risk === 'overworked' ? 'Overworked' : risk === 'engaged' ? 'Engaged' : 'Stable',
        data: scatterData.filter(d => d.risk === risk).map(d => ({ x: d.x, y: d.y, employeeId: d.employeeId, department: d.department })),
        backgroundColor: risk === 'burnout' ? colors.danger : risk === 'overworked' ? colors.warning : risk === 'engaged' ? colors.accent : colors.muted,
        borderColor: risk === 'burnout' ? colors.danger : risk === 'overworked' ? colors.warning : risk === 'engaged' ? colors.accent : colors.muted,
        pointRadius: risk === 'burnout' ? 7 : risk === 'overworked' ? 6 : 5,
        pointHoverRadius: risk === 'burnout' ? 10 : 8,
      }));

      state.charts.scatter = new Chart(scatterCtx, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: true },
          plugins: {
            tooltip: {
              callbacks: {
                title: (ctx) => ctx[0].raw.employeeId + ' (' + ctx[0].raw.department + ')',
                label: (ctx) => 'OT: ' + ctx.parsed.x + ' hrs | Perf: ' + ctx.parsed.y.toFixed(1) + '/5',
              },
            },
          },
          scales: {
            x: {
              min: 0,
              max: 65,
              title: { display: true, text: 'Monthly Overtime Hours', color: textColor, font: { weight: 500, size: 12 } },
              grid: { color: gridColor, drawBorder: false },
              ticks: { color: textColor, callback: (val) => val + 'h' },
            },
            y: {
              min: 1,
              max: 5,
              title: { display: true, text: 'Performance Rating (1-5)', color: textColor, font: { weight: 500, size: 12 } },
              grid: { color: gridColor, drawBorder: false },
              ticks: { color: textColor, stepSize: 1 },
            },
          },
        },
      });

      // Quadrant toggle
      $('#showQuadrants')?.addEventListener('change', (e) => {
        $$('.quadrant-label').forEach(el => el.style.display = e.target.checked ? 'flex' : 'none');
      });
    }

      // Attrition Sparkline
      const sparkCtx = $('#attritionSpark')?.getContext('2d');
      if (sparkCtx) {
        state.charts.attritionSpark = new Chart(sparkCtx, {
          type: 'line',
          data: {
            labels: ['', '', '', '', '', '', '', '', '', '', '', ''],
            datasets: [{
              data: [10.2, 10.5, 11.1, 11.5, 12.0, 12.8, 13.5, 13.9, 14.1, 14.2, 14.2, 14.2],
              borderColor: colors.danger,
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
            elements: { point: { radius: 0 } },
          },
        });
      }
    } catch (err) {
      console.error('Failed to initialize charts:', err);
    }
  }

  // ==========================================================================
  // KPI Counter Animation
  // ==========================================================================

  function animateKPIs() {
    const kpis = [
      { id: 'total-headcount', value: 8247, format: formatNumber },
      { id: 'attrition-rate', value: 14.2, format: (v) => v.toFixed(1) + '%' },
      { id: 'productivity-index', value: 87.4, format: (v) => v.toFixed(1) },
      { id: 'revenue-fte', value: 358, format: (v) => '$' + v + 'k' },
    ];

    kpis.forEach(({ id, value, format }) => {
      const el = $('#' + id);
      if (!el) return;

      const duration = 1200;
      const start = 0;
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (value - start) * eased;
        el.textContent = format(current);
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  // ==========================================================================
  // Department Summary Cards
  // ==========================================================================

  function renderDeptSummaries() {
    const container = $('.dept-summary-grid');
    if (!container) return;

    container.innerHTML = DEPARTMENTS.map(dept => {
      const trendClass = dept.trend.startsWith('+') ? 'negative' : 'positive';
      const trendIcon = dept.trend.startsWith('+') ?
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>' :
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>';

      return `
        <article class="dept-summary-card" data-dept="${dept.id}">
          <div class="dept-summary-icon" style="background: ${dept.color}20; color: ${dept.color};">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              ${getDeptIcon(dept.icon)}
            </svg>
          </div>
          <div class="dept-summary-info">
            <p class="dept-summary-name">${dept.name}</p>
            <div class="dept-summary-metrics">
              <span class="dept-summary-metric">
                <strong>${dept.employees.toLocaleString()}</strong> FTE
              </span>
              <span class="dept-summary-metric">
                <strong>${dept.attrition}%</strong> attrition
              </span>
            </div>
          </div>
          <div class="dept-summary-trend ${trendClass}">
            ${trendIcon} ${dept.trend}
          </div>
        </article>
      `;
    }).join('');
  }

  function getDeptIcon(name) {
    const icons = {
      'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
      'megaphone': '<path d="M3 11l18-5v12L3 14v-3"/><path d="M11.6 16.8a3 3 0 0 1 5.8 0"/><path d="M12.4 19.3a7 7 0 0 1 11.2 0"/>',
      'cog': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    };
    return icons[name] || icons.code;
  }

  // ==========================================================================
  // Risk Table Rendering
  // ==========================================================================

  function applyFilters() {
    state.filteredEmployees = state.riskEmployees.filter(emp => {
      if (state.filters.department !== 'all' && emp.department !== state.filters.department) return false;
      if (state.filters.risk !== 'all') {
        if (state.filters.risk === 'high' && emp.risk < 0.85) return false;
        if (state.filters.risk === 'medium' && (emp.risk < 0.75 || emp.risk >= 0.85)) return false;
        if (state.filters.risk === 'low' && emp.risk >= 0.75) return false;
      }
      if (state.filters.tenure !== 'all') {
        const tenure = emp.tenure;
        if (state.filters.tenure === '0-1' && tenure >= 1) return false;
        if (state.filters.tenure === '1-3' && (tenure < 1 || tenure >= 3)) return false;
        if (state.filters.tenure === '3-5' && (tenure < 3 || tenure >= 5)) return false;
        if (state.filters.tenure === '5+' && tenure < 5) return false;
      }
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        if (!emp.id.toLowerCase().includes(query) &&
            !emp.name.toLowerCase().includes(query) &&
            !emp.department.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });

    sortEmployees();
    renderRiskTable();
    updatePagination();
  }

  function sortEmployees() {
    state.filteredEmployees.sort((a, b) => {
      let aVal = a[state.sortColumn];
      let bVal = b[state.sortColumn];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function renderRiskTable() {
    const tbody = $('#risk-table-body');
    if (!tbody) return;

    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredEmployees.slice(start, end);

    tbody.innerHTML = pageData.map(emp => {
      const dept = DEPARTMENTS.find(d => d.id === emp.department);
      const riskClass = emp.risk >= 0.9 ? 'critical' : emp.risk >= 0.85 ? 'high' : emp.risk >= 0.75 ? 'medium' : 'low';
      const action = RISK_ACTIONS[emp.action];

      return `
        <tr data-emp-id="${emp.id}">
          <td><span class="emp-id">${emp.id}</span></td>
          <td>${emp.name}</td>
          <td><span class="dept-badge" style="border-color: ${dept.color}40; color: ${dept.color};">${dept.name}</span></td>
          <td>${emp.tenure.toFixed(1)}</td>
          <td style="color: ${emp.cr < 0.9 ? 'var(--danger)' : 'var(--text)'}; font-weight: ${emp.cr < 0.9 ? '600' : '400'}">${emp.cr.toFixed(2)}</td>
          <td style="color: ${emp.otr > 18 ? 'var(--danger)' : emp.otr > 12 ? 'var(--warning)' : 'var(--text)'}; font-weight: ${emp.otr > 18 ? '600' : '400'}">${emp.otr}%</td>
          <td>${emp.performance.toFixed(1)} <span style="color: var(--text-muted); font-size: var(--text-xs);">/5</span></td>
          <td><span class="risk-score-cell ${riskClass}">${emp.risk.toFixed(2)}</span></td>
          <td><span class="action-text">${action.label}</span></td>
          <td>
            <button class="btn-action" data-action="${emp.action}" data-emp-id="${emp.id}" aria-label="Initiate ${action.label} for ${emp.name}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              Initiate
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach action button listeners
    $$('.btn-action[data-emp-id]', tbody).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const empId = e.currentTarget.dataset.empId;
        const action = e.currentTarget.dataset.action;
        openActionModal(empId, action);
      });
    });
  }

  function updatePagination() {
    const total = state.filteredEmployees.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, total);

    $('#showingStart').textContent = total ? start : 0;
    $('#showingEnd').textContent = end;
    $('#totalRisk').textContent = total;
    $('#riskCount').textContent = total;

    const pagination = $('.pagination');
    if (pagination) {
      pagination.innerHTML = `
        <button class="page-btn prev-btn" ${state.currentPage === 1 ? 'disabled' : ''} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => `
          <button class="page-btn num-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}" ${p === state.currentPage ? 'aria-current="page"' : ''}>${p}</button>
        `).join('')}
        <button class="page-btn next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      `;

      $('.prev-btn', pagination)?.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderRiskTable();
          updatePagination();
        }
      });

      $('.next-btn', pagination)?.addEventListener('click', () => {
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderRiskTable();
          updatePagination();
        }
      });

      $$('.num-btn', pagination).forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page);
          if (page && page !== state.currentPage) {
            state.currentPage = page;
            renderRiskTable();
            updatePagination();
          }
        });
      });
    }
  }

  // ==========================================================================
  // Search & Filters
  // ==========================================================================

  function initFilters() {
    $('#riskSearch')?.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      applyFilters();
    }, 200));

    $('#deptFilter')?.addEventListener('change', (e) => {
      state.filters.department = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });

    $('#riskFilter')?.addEventListener('change', (e) => {
      state.filters.risk = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });

    $('#tenureFilter')?.addEventListener('change', (e) => {
      state.filters.tenure = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });

    // Table sorting
    $$('.risk-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.sort;
        if (state.sortColumn === column) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = column;
          state.sortDirection = 'desc';
        }
        $$('.risk-table th').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
        applyFilters();
      });
    });
  }

  // ==========================================================================
  // Action Modal
  // ==========================================================================

  function openActionModal(empId, suggestedAction) {
    const emp = state.riskEmployees.find(e => e.id === empId);
    if (!emp) return;

    const modal = $('#actionModal');
    const deptInfo = DEPARTMENTS.find(d => d.id === emp.department);

    $('#modalEmpId').textContent = emp.id;
    $('#modalEmpName').textContent = emp.name;
    $('#modalRiskScore').textContent = emp.risk.toFixed(2);

    const factorsList = $('#modalFactors');
    factorsList.innerHTML = emp.factors.map(f => `<li>${f.label}</li>`).join('');

    const actionSelect = $('#actionSelect');
    actionSelect.innerHTML = '<option value="">Select an action...</option>' +
      Object.entries(RISK_ACTIONS).map(([key, action]) => `
        <option value="${key}" ${key === suggestedAction ? 'selected' : ''}>${action.label}</option>
      `).join('');

    if (typeof modal.showModal === 'function') {
      try {
        modal.showModal();
      } catch (err) {
        modal.setAttribute('open', '');
      }
    } else {
      modal.setAttribute('open', '');
    }
    actionSelect.focus();
  }

  function closeActionModal() {
    const modal = $('#actionModal');
    if (!modal) return;
    if (typeof modal.close === 'function') {
      try {
        modal.close();
      } catch (err) {
        modal.removeAttribute('open');
      }
    } else {
      modal.removeAttribute('open');
    }
  }

  function initModal() {
    const modal = $('#actionModal');
    if (!modal) return;

    $('.modal-close', modal)?.addEventListener('click', closeActionModal);
    $('.modal-cancel', modal)?.addEventListener('click', closeActionModal);
    $('.modal-backdrop', modal)?.addEventListener('click', closeActionModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeActionModal();
    });

    $('#confirmAction', modal)?.addEventListener('click', () => {
      const actionSelect = $('#actionSelect');
      const actionKey = actionSelect.value;
      if (!actionKey) {
        showToast('Please select an action', 'warning');
        actionSelect.focus();
        return;
      }

      const empId = $('#modalEmpId').textContent;
      const action = RISK_ACTIONS[actionKey];
      closeActionModal();
      showToast(`Initiated "${action.label}" for ${empId}`, 'success');

      // Simulate action effect
      setTimeout(() => {
        const empIndex = state.riskEmployees.findIndex(e => e.id === empId);
        if (empIndex !== -1) {
          state.riskEmployees[empIndex].risk = Math.max(0.3, state.riskEmployees[empIndex].risk - 0.15 - Math.random() * 0.1);
          applyFilters();
        }
      }, 500);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.open) closeActionModal();
    });
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================

  function showToast(message, type = 'info', title) {
    const container = $('#toastContainer');
    if (!container) return;

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' };

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        <p class="toast-title">${title || titles[type]}</p>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);

    setTimeout(() => removeToast(toast), CONFIG.toastDuration);
  }

  function removeToast(toast) {
    toast.style.animation = 'slideIn 0.2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  }

  // ==========================================================================
  // Refresh & Export
  // ==========================================================================

  function initActions() {
    $('#refreshBtn')?.addEventListener('click', async () => {
      const btn = $('#refreshBtn');
      btn.classList.add('loading');
      btn.disabled = true;

      // Simulate data refresh
      await new Promise(r => setTimeout(r, 1000));

      // Regenerate some data
      generateRiskEmployees();
      applyFilters();

      // Update charts with slight variations
      if (state.charts.attrition) {
        const data = state.charts.attrition.data.datasets[0].data.map(v => v + (Math.random() - 0.5) * 0.4);
        state.charts.attrition.data.datasets[0].data = data.map(v => Math.max(9, Math.min(16, v)));
        state.charts.attrition.update();
      }

      btn.classList.remove('loading');
      btn.disabled = false;
      showToast('Data refreshed successfully', 'success');
    });

    $('#exportBtn')?.addEventListener('click', () => exportData('full'));
    $('#exportRiskBtn')?.addEventListener('click', () => exportData('risk'));
  }

  function exportData(type) {
    let csvContent = '';
    let filename = '';

    if (type === 'risk') {
      const headers = ['Employee ID', 'Name', 'Department', 'Tenure (Years)', 'Compa-Ratio', 'Overtime %', 'Performance', 'Risk Score', 'Recommended Action'];
      const rows = state.filteredEmployees.map(emp => {
        const dept = DEPARTMENTS.find(d => d.id === emp.department);
        const action = RISK_ACTIONS[emp.action];
        return [emp.id, emp.name, dept.name, emp.tenure.toFixed(1), emp.cr.toFixed(2), emp.otr.toFixed(1), emp.performance.toFixed(1), emp.risk.toFixed(2), action.label];
      });
      csvContent = [headers, ...rows].map(r => r.map(v => '"' + v + '"').join(',')).join('\n');
      filename = 'risk-employees-' + new Date().toISOString().split('T')[0] + '.csv';
    } else {
      const headers = ['Department', 'Employees', 'Attrition %', 'Trend', 'Avg Overtime %', 'Avg Performance', 'Avg Compa-Ratio'];
      const rows = DEPARTMENTS.map(d => [d.name, d.employees, d.attrition, d.trend, d.overtime, d.performance, d.compaRatio]);
      csvContent = [headers, ...rows].map(r => r.map(v => '"' + v + '"').join(',')).join('\n');
      filename = 'department-summary-' + new Date().toISOString().split('T')[0] + '.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast(`${type === 'risk' ? 'Risk employee' : 'Department'} data exported as ${filename}`, 'success');
  }

  // ==========================================================================
  // Chart Period Buttons
  // ==========================================================================

  function initChartControls() {
    $$('.chart-btn[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.chart-btn[data-period]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        // In a real app, this would fetch different data
        showToast('Showing ' + btn.textContent + ' data', 'info');
      });
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    initTheme();
    initNavigation();
    generateRiskEmployees();
    initCharts();
    renderDeptSummaries();
    applyFilters();
    animateKPIs();
    initFilters();
    initModal();
    initActions();
    initChartControls();

    // View Analysis button in Key Insight panel
    $('.insight-action')?.addEventListener('click', () => {
      navigateTo('tier2');
      showToast('Navigated to Departmental Analysis', 'info');
    });

    // Make department summary cards clickable to filter
    $$('.dept-summary-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const deptId = card.dataset.dept;
        const deptFilter = $('#deptFilter');
        if (deptFilter) {
          deptFilter.value = deptId;
          state.filters.department = deptId;
          state.currentPage = 1;
          applyFilters();
          showToast(`Filtered by ${deptId.toUpperCase()} department`, 'info');
        }
      });
    });

    // Theme toggle
    $('#themeToggle')?.addEventListener('click', toggleTheme);

    // Mobile sidebar toggle
    const mobileMenuBtn = $('#mobileMenuBtn');
    const sidebar = $('.sidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        mobileMenuBtn.setAttribute('aria-expanded', isOpen);
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      });

      // Close sidebar when clicking a menu item on mobile
      $$('.menu-item', sidebar).forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
          }
        });
      });

      // Close sidebar on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
          mobileMenuBtn.focus();
        }
      });
    }

    console.log('Workforce Analytics Dashboard initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
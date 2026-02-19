/**
 * ADMIN DASHBOARD LOGIC
 * Password: Wisdomfx22a
 */

const ADMIN_PASSWORD = 'Wisdomfx22a';
let adminData = null;

function login() {
    const input = document.getElementById('passwordInput').value;
    if (input === ADMIN_PASSWORD) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadDashboard();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
        setTimeout(() => {
            document.getElementById('errorMsg').style.display = 'none';
        }, 3000);
    }
}

function logout() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('passwordInput').value = '';
}

function loadDashboard() {
    const saved = localStorage.getItem('fruitCrushAdmin');
    if (saved) {
        adminData = JSON.parse(saved);
        updateDashboard();
    } else {
        showEmptyState();
    }
}

function updateDashboard() {
    if (!adminData) return;

    // Overview stats
    const totalRevenue = adminData.revenue ? adminData.revenue.reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    
    const today = new Date().toDateString();
    const todayRevenue = adminData.dailyStats && adminData.dailyStats[today] ? adminData.dailyStats[today].revenue || 0 : 0;
    document.getElementById('todayRevenue').textContent = '$' + todayRevenue.toFixed(2);
    
    document.getElementById('totalSessions').textContent = adminData.userSessions ? adminData.userSessions.length : 0;
    
    const impressions = adminData.adImpressions ? adminData.adImpressions.length : 0;
    document.getElementById('adImpressions').textContent = impressions;
    
    const clicks = adminData.adClicks ? adminData.adClicks.length : 0;
    document.getElementById('adClicks').textContent = clicks;
    
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
    document.getElementById('ctrRate').textContent = ctr + '%';

    // All tabs
    updateRevenueTab();
    updateAdsTab();
    updateUsersTab();
    updateLevelsTab();
    updateDailyChart();
}

function updateRevenueTab() {
    if (!adminData.revenue || adminData.revenue.length === 0) {
        document.getElementById('revenueBySource').innerHTML = '<div class="empty-state">No revenue data yet</div>';
        document.getElementById('transactionsTable').innerHTML = '';
        return;
    }

    const bySource = {};
    adminData.revenue.forEach(r => {
        bySource[r.source] = (bySource[r.source] || 0) + r.amount;
    });

    let html = '<div class="stats-grid">';
    for (let [source, amount] of Object.entries(bySource)) {
        html += `
            <div class="stat-card">
                <div class="stat-label">${source}</div>
                <div class="stat-value gold">$${amount.toFixed(2)}</div>
            </div>
        `;
    }
    html += '</div>';
    document.getElementById('revenueBySource').innerHTML = html;

    const tbody = document.getElementById('transactionsTable');
    tbody.innerHTML = adminData.revenue.slice(-10).reverse().map(r => `
        <tr>
            <td>${new Date(r.date).toLocaleString()}</td>
            <td><span class="badge badge-${r.source === 'ad' ? 'warning' : r.source === 'premium' ? 'success' : 'info'}">${r.source}</span></td>
            <td>${r.item}</td>
            <td>$${r.amount.toFixed(2)}</td>
            <td>${r.userLevel}</td>
        </tr>
    `).join('');
}

function updateAdsTab() {
    const impressions = adminData.adImpressions ? adminData.adImpressions.length : 0;
    const clicks = adminData.adClicks ? adminData.adClicks.length : 0;
    const estRevenue = (impressions * 0.001 + clicks * 0.01).toFixed(2);
    const ecpm = impressions > 0 ? ((estRevenue / impressions) * 1000).toFixed(2) : 0;

    document.getElementById('totalImpressions').textContent = impressions;
    document.getElementById('totalClicks').textContent = clicks;
    document.getElementById('estAdRevenue').textContent = '$' + estRevenue;
    document.getElementById('ecpm').textContent = '$' + ecpm;

    const tbody = document.getElementById('impressionsTable');
    if (!adminData.adImpressions || adminData.adImpressions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No ad data yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = adminData.adImpressions.slice(-10).reverse().map(i => `
        <tr>
            <td>${new Date(i.date).toLocaleString()}</td>
            <td>${i.type}</td>
            <td>${i.provider}</td>
            <td>${i.userLevel}</td>
        </tr>
    `).join('');
}

function updateUsersTab() {
    if (!adminData.userSessions || adminData.userSessions.length === 0) {
        document.getElementById('userStats').innerHTML = '<div class="empty-state">No user data yet</div>';
        return;
    }

    const totalSessions = adminData.userSessions.length;
    const avgDuration = totalSessions > 0 
        ? adminData.userSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions / 1000 / 60
        : 0;
    const totalHours = adminData.userSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 1000 / 60 / 60;

    document.getElementById('userStats').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Sessions</div>
                <div class="stat-value">${totalSessions}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Session</div>
                <div class="stat-value">${avgDuration.toFixed(1)}m</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Play Time</div>
                <div class="stat-value">${totalHours.toFixed(1)}h</div>
            </div>
        </div>
    `;

    const tbody = document.getElementById('sessionsTable');
    tbody.innerHTML = adminData.userSessions.slice(-10).reverse().map(s => {
        const duration = s.duration ? (s.duration / 1000 / 60).toFixed(1) + ' min' : 'Active';
        return `
            <tr>
                <td>${new Date(s.startTime).toLocaleString()}</td>
                <td>${duration}</td>
                <td>${s.device ? s.device.substring(0, 50) + '...' : 'Unknown'}</td>
                <td>${s.screen}</td>
            </tr>
        `;
    }).join('');
}

function updateLevelsTab() {
    if (!adminData.levelCompletions || adminData.levelCompletions.length === 0) {
        document.getElementById('levelStats').innerHTML = '<div class="empty-state">No level data yet</div>';
        return;
    }

    const levelStats = {};
    adminData.levelCompletions.forEach(c => {
        if (!levelStats[c.level]) {
            levelStats[c.level] = { completions: 0, totalScore: 0 };
        }
        levelStats[c.level].completions++;
        levelStats[c.level].totalScore += c.score;
    });

    const sorted = Object.entries(levelStats).sort((a, b) => b[1].completions - a[1].completions).slice(0, 5);

    document.getElementById('levelStats').innerHTML = `
        <div class="stat-card" style="margin-bottom: 20px;">
            <div class="stat-label">Total Level Completions</div>
            <div class="stat-value">${adminData.levelCompletions.length}</div>
        </div>
    `;

    const tbody = document.getElementById('topLevelsTable');
    tbody.innerHTML = sorted.map(([level, stats]) => {
        const avgScore = Math.round(stats.totalScore / stats.completions);
        const performance = stats.completions > 10 ? '🔥 Hot' : stats.completions > 5 ? '⭐ Good' : '📊 New';
        return `
            <tr>
                <td>Level ${level}</td>
                <td>${stats.completions}</td>
                <td>${avgScore}</td>
                <td><span class="badge badge-${stats.completions > 10 ? 'success' : 'info'}">${performance}</span></td>
            </tr>
        `;
    }).join('');
}

function updateDailyChart() {
    const days = 7;
    const dates = [];
    const revenues = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        dates.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const stats = adminData.dailyStats && adminData.dailyStats[dateStr];
        revenues.push(stats ? stats.revenue || 0 : 0);
    }

    const maxRevenue = Math.max(...revenues, 1);
    
    const chartHtml = dates.map((date, i) => {
        const height = (revenues[i] / maxRevenue) * 100;
        return `
            <div class="bar" style="height: ${Math.max(height, 5)}%">
                <div class="bar-value">$${revenues[i].toFixed(0)}</div>
                <div class="bar-label">${date}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('dailyChart').innerHTML = chartHtml;

    const tbody = document.getElementById('dailyTable');
    tbody.innerHTML = dates.map((date, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const fullDate = d.toDateString();
        const stats = adminData.dailyStats && adminData.dailyStats[fullDate];
        
        return `
            <tr>
                <td>${fullDate}</td>
                <td>$${stats ? (stats.revenue || 0).toFixed(2) : '0.00'}</td>
                <td>${stats ? stats.sessions || 0 : 0}</td>
                <td>${stats ? stats.adImpressions || 0 : 0}</td>
                <td>${stats ? stats.levelsCompleted || 0 : 0}</td>
            </tr>
        `;
    }).join('');
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function exportData() {
    if (!adminData || !adminData.revenue) {
        alert('No data to export!');
        return;
    }
    
    const csv = [
        ['Date', 'Source', 'Item', 'Amount', 'User Level'].join(','),
        ...adminData.revenue.map(r => [
            r.date, r.source, r.item, r.amount, r.userLevel
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fruit-crush-revenue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    alert('Data exported successfully!');
}

function refreshData() {
    loadDashboard();
    alert('Data refreshed!');
}

function showEmptyState() {
    document.querySelectorAll('.stat-value').forEach(el => el.textContent = '0');
    document.querySelectorAll('tbody').forEach(el => el.innerHTML = '<tr><td colspan="5" class="empty-state">Play the game to generate data!</td></tr>');
}

// Auto-refresh every 30 seconds
setInterval(() => {
    if (document.getElementById('dashboard').style.display !== 'none') {
        loadDashboard();
    }
}, 30000);


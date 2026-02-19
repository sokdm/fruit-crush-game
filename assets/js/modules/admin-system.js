/**
 * COMPLETE ADMIN & ANALYTICS SYSTEM
 * Tracks everything: revenue, users, gameplay, ads
 */

class AdminSystem {
    constructor(game) {
        this.game = game;
        this.password = 'Wisdomfx22a';
        this.data = {
            revenue: [],
            adImpressions: [],
            adClicks: [],
            userSessions: [],
            levelCompletions: [],
            purchases: [],
            dailyStats: {}
        };
        
        this.loadData();
        this.startAutoTracking();
    }

    // Load all admin data
    loadData() {
        const saved = localStorage.getItem('fruitCrushAdmin');
        if (saved) {
            this.data = JSON.parse(saved);
        }
        
        // Ensure all arrays exist
        this.data.revenue = this.data.revenue || [];
        this.data.adImpressions = this.data.adImpressions || [];
        this.data.adClicks = this.data.adClicks || [];
        this.data.userSessions = this.data.userSessions || [];
        this.data.levelCompletions = this.data.levelCompletions || [];
        this.data.purchases = this.data.purchases || [];
        this.data.dailyStats = this.data.dailyStats || {};
    }

    // Save all data
    saveData() {
        localStorage.setItem('fruitCrushAdmin', JSON.stringify(this.data));
    }

    // AUTO-TRACKING SYSTEM
    startAutoTracking() {
        // Track session start
        this.trackSessionStart();
        
        // Track every 30 seconds (active user)
        setInterval(() => this.trackActiveUser(), 30000);
        
        // Save data every minute
        setInterval(() => this.saveData(), 60000);
        
        // Track before page closes
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
            this.saveData();
        });
    }

    trackSessionStart() {
        const session = {
            id: Date.now(),
            startTime: new Date().toISOString(),
            device: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            referrer: document.referrer || 'direct'
        };
        
        this.data.userSessions.push(session);
        this.updateDailyStat('sessions', 1);
    }

    trackSessionEnd() {
        const sessions = this.data.userSessions;
        if (sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            lastSession.endTime = new Date().toISOString();
            lastSession.duration = Date.now() - parseInt(lastSession.id);
        }
    }

    trackActiveUser() {
        this.updateDailyStat('activeMinutes', 0.5); // 30 seconds = 0.5 minute
    }

    // REVENUE TRACKING
    trackRevenue(amount, source, item) {
        const transaction = {
            id: 'TXN' + Date.now(),
            date: new Date().toISOString(),
            amount: parseFloat(amount),
            currency: 'USD',
            source: source, // 'ad', 'purchase', 'premium'
            item: item,
            userLevel: this.game.level,
            userCoins: this.game.player.coins
        };
        
        this.data.revenue.push(transaction);
        this.updateDailyStat('revenue', amount);
        
        // Also track as purchase
        if (source === 'purchase' || source === 'premium') {
            this.trackPurchase(item, amount);
        }
        
        this.saveData();
        console.log(`💰 Revenue tracked: $${amount} from ${source}`);
    }

    // AD TRACKING
    trackAdImpression(adType, adProvider) {
        const impression = {
            date: new Date().toISOString(),
            type: adType, // 'banner', 'interstitial', 'rewarded'
            provider: adProvider || 'admob',
            userLevel: this.game.level
        };
        
        this.data.adImpressions.push(impression);
        this.updateDailyStat('adImpressions', 1);
    }

    trackAdClick(adType) {
        const click = {
            date: new Date().toISOString(),
            type: adType,
            userLevel: this.game.level
        };
        
        this.data.adClicks.push(click);
        this.updateDailyStat('adClicks', 1);
        this.updateDailyStat('revenue', 0.01); // Estimated $0.01 per click
    }

    trackAdReward(rewardType) {
        this.data.purchases.push({
            type: 'ad_reward',
            reward: rewardType,
            date: new Date().toISOString()
        });
    }

    // GAMEPLAY TRACKING
    trackLevelComplete(level, score, stars, movesLeft) {
        const completion = {
            date: new Date().toISOString(),
            level: level,
            score: score,
            stars: stars,
            movesLeft: movesLeft,
            timeSpent: this.getSessionTime()
        };
        
        this.data.levelCompletions.push(completion);
        this.updateDailyStat('levelsCompleted', 1);
        
        // Track potential ad opportunity
        if (level % 3 === 0) {
            this.updateDailyStat('interstitialOpportunities', 1);
        }
    }

    trackGameOver(level, score, reason) {
        this.data.purchases.push({
            type: 'game_over',
            level: level,
            score: score,
            reason: reason,
            date: new Date().toISOString()
        });
    }

    trackPurchase(item, amount) {
        this.data.purchases.push({
            type: 'purchase',
            item: item,
            amount: amount,
            date: new Date().toISOString(),
            userCoins: this.game.player.coins
        });
        this.updateDailyStat('purchases', 1);
    }

    // DAILY STATS AGGREGATION
    updateDailyStat(key, value) {
        const today = new Date().toDateString();
        
        if (!this.data.dailyStats[today]) {
            this.data.dailyStats[today] = {
                date: today,
                revenue: 0,
                adImpressions: 0,
                adClicks: 0,
                sessions: 0,
                activeMinutes: 0,
                levelsCompleted: 0,
                purchases: 0,
                interstitialOpportunities: 0
            };
        }
        
        this.data.dailyStats[today][key] = (this.data.dailyStats[today][key] || 0) + value;
    }

    // ANALYTICS METHODS
    getTotalRevenue() {
        return this.data.revenue.reduce((sum, r) => sum + r.amount, 0);
    }

    getTodayRevenue() {
        const today = new Date().toDateString();
        return this.data.dailyStats[today]?.revenue || 0;
    }

    getRevenueBySource() {
        const bySource = {};
        this.data.revenue.forEach(r => {
            bySource[r.source] = (bySource[r.source] || 0) + r.amount;
        });
        return bySource;
    }

    getAdStats() {
        return {
            totalImpressions: this.data.adImpressions.length,
            totalClicks: this.data.adClicks.length,
            ctr: this.data.adImpressions.length > 0 
                ? (this.data.adClicks.length / this.data.adImpressions.length * 100).toFixed(2)
                : 0,
            estimatedRevenue: (this.data.adImpressions.length * 0.001 + this.data.adClicks.length * 0.01).toFixed(2)
        };
    }

    getUserStats() {
        const sessions = this.data.userSessions;
        const totalSessions = sessions.length;
        const avgDuration = totalSessions > 0
            ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions / 1000 / 60
            : 0;
        
        return {
            totalSessions: totalSessions,
            avgSessionMinutes: avgDuration.toFixed(2),
            totalPlayTime: (sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 1000 / 60 / 60).toFixed(2) + ' hours',
            retention: this.calculateRetention()
        };
    }

    calculateRetention() {
        // Simple retention: users who played more than once
        const sessionsByDay = {};
        this.data.userSessions.forEach(s => {
            const day = new Date(s.startTime).toDateString();
            sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
        });
        
        const days = Object.keys(sessionsByDay).length;
        const avgSessionsPerDay = this.data.userSessions.length / Math.max(days, 1);
        
        return {
            daysActive: days,
            avgSessionsPerDay: avgSessionsPerDay.toFixed(2),
            retentionRate: avgSessionsPerDay > 1 ? 'Good' : 'Needs Improvement'
        };
    }

    getTopLevels() {
        const levelStats = {};
        this.data.levelCompletions.forEach(c => {
            if (!levelStats[c.level]) {
                levelStats[c.level] = { completions: 0, avgScore: 0, totalScore: 0 };
            }
            levelStats[c.level].completions++;
            levelStats[c.level].totalScore += c.score;
            levelStats[c.level].avgScore = Math.round(levelStats[c.level].totalScore / levelStats[c.level].completions);
        });
        
        return Object.entries(levelStats)
            .sort((a, b) => b[1].completions - a[1].completions)
            .slice(0, 10);
    }

    getDailyStats(days = 7) {
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toDateString());
        }
        
        return dates.map(date => ({
            date: date,
            stats: this.data.dailyStats[date] || {
                revenue: 0, adImpressions: 0, sessions: 0, levelsCompleted: 0
            }
        }));
    }

    // EXPORT DATA
    exportToCSV() {
        const csv = [
            ['Date', 'Source', 'Item', 'Amount', 'User Level'].join(','),
            ...this.data.revenue.map(r => [
                r.date, r.source, r.item, r.amount, r.userLevel
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fruit-crush-revenue-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }

    exportAllData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fruit-crush-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    // CLEAR DATA (use carefully!)
    clearAllData() {
        if (confirm('WARNING: This will delete ALL tracking data. Are you sure?')) {
            this.data = {
                revenue: [],
                adImpressions: [],
                adClicks: [],
                userSessions: [],
                levelCompletions: [],
                purchases: [],
                dailyStats: {}
            };
            this.saveData();
            return true;
        }
        return false;
    }

    getSessionTime() {
        const sessions = this.data.userSessions;
        if (sessions.length === 0) return 0;
        const last = sessions[sessions.length - 1];
        return Date.now() - parseInt(last.id);
    }
}

// Export
window.AdminSystem = AdminSystem;


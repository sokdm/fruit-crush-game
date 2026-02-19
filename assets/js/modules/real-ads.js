/**
 * COMPLETE AD MONETIZATION SYSTEM
 * Google AdMob + Fallback ads + Revenue tracking
 */

class RealAds {
    constructor(game) {
        this.game = game;
        this.admin = game.admin;
        this.adCount = 0;
        this.bannerVisible = false;
        
        // Ad configuration
        this.config = {
            // Your AdMob IDs (replace with real ones when you get them)
            admob: {
                appId: 'ca-app-pub-3940256099942544~3347511713', // Test ID
                bannerId: 'ca-app-pub-3940256099942544/6300978111', // Test ID
                interstitialId: 'ca-app-pub-3940256099942544/1033173712', // Test ID
                rewardedId: 'ca-app-pub-3940256099942544/5224354917' // Test ID
            },
            
            // Show interstitial every N games
            interstitialFrequency: 3,
            
            // Enable test mode (set to false for production)
            testMode: true
        };
        
        this.init();
    }

    init() {
        // Check if running as mobile app (Cordova/Capacitor)
        if (window.cordova) {
            this.initMobileAds();
        } else {
            // Web version - use simulated ads or AdSense
            this.initWebAds();
        }
    }

    // MOBILE APP ADS (AdMob via Cordova)
    initMobileAds() {
        if (!window.admob) {
            console.log('AdMob plugin not found');
            this.initWebAds(); // Fallback
            return;
        }

        console.log('Initializing mobile ads...');

        // Initialize AdMob
        admob.setOptions({
            publisherId: this.config.admob.appId,
            interstitialAdId: this.config.admob.interstitialId,
            rewardedAdId: this.config.admob.rewardedId,
            isTesting: this.config.testMode,
            autoShowBanner: false
        });

        // Prepare ads
        this.prepareInterstitial();
        this.prepareRewarded();
        
        // Show banner after delay
        setTimeout(() => this.showBanner(), 5000);
    }

    prepareInterstitial() {
        if (!window.admob) return;
        
        admob.interstitial.config({
            id: this.config.admob.interstitialId,
            isTesting: this.config.testMode
        });
        
        admob.interstitial.prepare();
        
        admob.interstitial.onLoad = () => {
            console.log('Interstitial loaded');
            this.interstitialReady = true;
        };
        
        admob.interstitial.onFailLoad = (error) => {
            console.log('Interstitial failed:', error);
            this.interstitialReady = false;
        };
    }

    prepareRewarded() {
        if (!window.admob) return;
        
        admob.rewardVideo.config({
            id: this.config.admob.rewardedId,
            isTesting: this.config.testMode
        });
        
        admob.rewardVideo.prepare();
        
        admob.rewardVideo.onLoad = () => {
            console.log('Rewarded ad loaded');
            this.rewardedReady = true;
        };
    }

    // WEB ADS (Simulated for now, replace with AdSense later)
    initWebAds() {
        console.log('Initializing web ads...');
        
        // Create banner ad container
        this.createWebBanner();
        
        // Simulate ad loading
        setTimeout(() => {
            this.simulateAdLoad();
        }, 3000);
    }

    createWebBanner() {
        if (this.game.player.isPremium) return;
        
        const banner = document.createElement('div');
        banner.id = 'web-banner-ad';
        banner.className = 'web-banner-ad';
        banner.innerHTML = `
            <div class="ad-label">Ad</div>
            <div class="ad-content">
                <div class="ad-placeholder">
                    <span>📺</span>
                    <p>Advertisement</p>
                </div>
            </div>
            <button class="ad-remove" onclick="game.ads.removeAdsPrompt()">✕</button>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .web-banner-ad {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 60px;
                background: #1a1a2e;
                border-top: 2px solid #333;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                font-family: sans-serif;
            }
            .ad-label {
                position: absolute;
                left: 10px;
                top: 5px;
                font-size: 10px;
                background: #ff6b6b;
                padding: 2px 8px;
                border-radius: 10px;
                color: white;
            }
            .ad-content {
                text-align: center;
                color: #888;
            }
            .ad-placeholder {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ad-placeholder span {
                font-size: 24px;
            }
            .ad-remove {
                position: absolute;
                right: 10px;
                background: rgba(255,255,255,0.1);
                border: none;
                color: #888;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        
        // Only add to game screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            document.body.appendChild(banner);
            this.bannerVisible = true;
            
            // Track impression
            this.trackImpression('banner', 'web');
        }
    }

    simulateAdLoad() {
        // Rotate ad content
        const ads = [
            { text: '🎮 Play Now!', icon: '🎮' },
            { text: '💎 Get Coins!', icon: '💎' },
            { text: '🔥 Hot Game!', icon: '🔥' },
            { text: '🏆 Win Prizes!', icon: '🏆' }
        ];
        
        let current = 0;
        setInterval(() => {
            if (!this.bannerVisible) return;
            
            const ad = ads[current % ads.length];
            const content = document.querySelector('.ad-content');
            if (content) {
                content.innerHTML = `
                    <div class="ad-placeholder" style="cursor: pointer;" onclick="game.ads.clickAd()">
                        <span>${ad.icon}</span>
                        <p>${ad.text}</p>
                    </div>
                `;
            }
            current++;
        }, 10000); // Change every 10 seconds
    }

    // AD DISPLAY METHODS

    showBanner() {
        if (this.game.player.isPremium) return;
        
        if (window.admob) {
            admob.banner.show();
        } else {
            const banner = document.getElementById('web-banner-ad');
            if (banner) banner.style.display = 'flex';
            this.bannerVisible = true;
        }
        
        this.trackImpression('banner', window.admob ? 'admob' : 'web');
    }

    hideBanner() {
        if (window.admob) {
            admob.banner.hide();
        } else {
            const banner = document.getElementById('web-banner-ad');
            if (banner) banner.style.display = 'none';
            this.bannerVisible = false;
        }
    }

    // Show interstitial ad (between games)
    showInterstitial(callback) {
        if (this.game.player.isPremium) {
            if (callback) callback();
            return;
        }

        this.adCount++;
        
        // Only show every N times
        if (this.adCount % this.config.interstitialFrequency !== 0) {
            if (callback) callback();
            return;
        }

        if (window.admob && this.interstitialReady) {
            // Mobile ad
            admob.interstitial.show();
            this.trackImpression('interstitial', 'admob');
            
            admob.interstitial.onClose = () => {
                this.prepareInterstitial(); // Load next
                if (callback) callback();
            };
        } else {
            // Web fallback - show custom interstitial
            this.showWebInterstitial(callback);
        }
    }

    showWebInterstitial(callback) {
        this.trackImpression('interstitial', 'web');
        
        const modal = document.createElement('div');
        modal.className = 'interstitial-modal';
        modal.innerHTML = `
            <div class="interstitial-content">
                <div class="interstitial-header">
                    <span>Advertisement</span>
                    <span class="timer">5</span>
                </div>
                <div class="interstitial-body">
                    <div class="fake-ad">
                        <div class="fake-ad-icon">📱</div>
                        <h3>Awesome Game!</h3>
                        <p>Download now and play!</p>
                        <button class="fake-ad-btn">Install</button>
                    </div>
                </div>
                <button class="skip-btn" disabled>Skip in 5s</button>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .interstitial-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .interstitial-content {
                width: 90%;
                max-width: 400px;
                background: #1a1a2e;
                border-radius: 20px;
                overflow: hidden;
            }
            .interstitial-header {
                display: flex;
                justify-content: space-between;
                padding: 15px 20px;
                background: rgba(255,255,255,0.1);
            }
            .timer {
                background: #ffd700;
                color: #000;
                padding: 5px 15px;
                border-radius: 20px;
                font-weight: bold;
            }
            .interstitial-body {
                padding: 40px;
                text-align: center;
            }
            .fake-ad {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                border-radius: 15px;
            }
            .fake-ad-icon {
                font-size: 60px;
                margin-bottom: 15px;
            }
            .fake-ad-btn {
                margin-top: 15px;
                padding: 12px 30px;
                border: none;
                border-radius: 25px;
                background: #ffd700;
                color: #000;
                font-weight: bold;
                cursor: pointer;
            }
            .skip-btn {
                width: 100%;
                padding: 20px;
                border: none;
                background: rgba(255,255,255,0.1);
                color: #888;
                font-size: 16px;
                cursor: not-allowed;
            }
            .skip-btn.active {
                background: #4ecdc4;
                color: white;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Countdown
        let timeLeft = 5;
        const timer = setInterval(() => {
            timeLeft--;
            const timerEl = modal.querySelector('.timer');
            const skipBtn = modal.querySelector('.skip-btn');
            
            if (timerEl) timerEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (skipBtn) {
                    skipBtn.textContent = 'Skip Ad ✕';
                    skipBtn.classList.add('active');
                    skipBtn.disabled = false;
                    skipBtn.onclick = () => {
                        modal.remove();
                        if (callback) callback();
                    };
                }
            }
        }, 1000);
        
        // Auto-close after 15 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
                if (callback) callback();
            }
        }, 15000);
    }

    // Rewarded ad (user chooses to watch for reward)
    showRewarded(reward, callback) {
        if (window.admob && this.rewardedReady) {
            // Mobile rewarded ad
            admob.rewardVideo.show();
            this.trackImpression('rewarded', 'admob');
            
            admob.rewardVideo.onReward = (rewardData) => {
                this.admin.trackAdReward(reward);
                this.game.grantReward(reward);
                if (callback) callback();
            };
            
            admob.rewardVideo.onClose = () => {
                this.prepareRewarded();
            };
        } else {
            // Web fallback
            this.showWebRewarded(reward, callback);
        }
    }

    showWebRewarded(reward, callback) {
        this.trackImpression('rewarded', 'web');
        
        const modal = document.createElement('div');
        modal.className = 'rewarded-modal';
        modal.innerHTML = `
            <div class="rewarded-content">
                <h3>🎁 Bonus Reward!</h3>
                <p>Watch a short video to get:</p>
                <div class="reward-preview">${reward}</div>
                <div class="reward-actions">
                    <button class="btn-watch" onclick="game.ads.watchRewardedVideo('${reward}')">
                        ▶️ Watch & Get Reward
                    </button>
                    <button class="btn-skip" onclick="this.closest('.rewarded-modal').remove()">
                        No Thanks
                    </button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .rewarded-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .rewarded-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border-radius: 25px;
                text-align: center;
                max-width: 350px;
            }
            .reward-preview {
                font-size: 2em;
                margin: 20px 0;
                padding: 20px;
                background: rgba(255,255,255,0.2);
                border-radius: 15px;
            }
            .reward-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 20px;
            }
            .btn-watch {
                padding: 15px;
                border: none;
                border-radius: 25px;
                background: #ffd700;
                color: #000;
                font-weight: bold;
                cursor: pointer;
            }
            .btn-skip {
                padding: 15px;
                border: none;
                border-radius: 25px;
                background: rgba(255,255,255,0.2);
                color: white;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Store callback
        this.pendingReward = reward;
        this.pendingCallback = callback;
    }

    watchRewardedVideo(reward) {
        const modal = document.querySelector('.rewarded-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="rewarded-watching">
                <div class="spinner"></div>
                <p>Playing video...</p>
                <div class="video-progress">
                    <div class="video-progress-bar"></div>
                </div>
            </div>
        `;
        
        // Simulate video progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            const bar = modal.querySelector('.video-progress-bar');
            if (bar) bar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                modal.remove();
                
                // Grant reward
                this.admin.trackAdReward(this.pendingReward);
                this.game.grantReward(this.pendingReward);
                
                if (this.pendingCallback) this.pendingCallback();
            }
        }, 500); // 10 seconds total
    }

    // Click tracking
    clickAd() {
        this.trackClick('banner');
        window.open('https://play.google.com/store', '_blank');
    }

    removeAdsPrompt() {
        this.game.showPremiumModal();
    }

    // TRACKING METHODS

    trackImpression(type, provider) {
        if (this.admin) {
            this.admin.trackAdImpression(type, provider);
        }
    }

    trackClick(type) {
        if (this.admin) {
            this.admin.trackAdClick(type);
        }
    }

    // Revenue estimation
    getEstimatedRevenue() {
        if (!this.admin) return 0;
        
        const stats = this.admin.getAdStats();
        // Industry averages: $1-5 per 1000 impressions, $0.10-0.50 per click
        const impressionRevenue = stats.totalImpressions * 0.002; // $2 CPM
        const clickRevenue = stats.totalClicks * 0.20; // $0.20 per click
        
        return impressionRevenue + clickRevenue;
    }
}

window.RealAds = RealAds;


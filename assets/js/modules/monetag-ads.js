/**
 * MONETAG ADS - Fruit Crush Game Monetization
 */

class MonetagAds {
    constructor(game) {
        this.game = game;
        this.initialized = false;
        this.init();
    }

    init() {
        // Don't show ads to premium users
        if (this.game.player && this.game.player.isPremium) {
            console.log('Ads disabled for premium user');
            return;
        }

        // Add Monetag meta tag
        this.addMetaTag();
        
        // Load Monetag script
        this.loadScript();
        
        this.initialized = true;
        console.log('Monetag initialized');
    }

    addMetaTag() {
        // Check if meta tag already exists
        if (document.querySelector('meta[name="monetag"]')) return;
        
        const meta = document.createElement('meta');
        meta.name = 'monetag';
        meta.content = '8b36d5553707bba1ec1c7c3c321e8b02';
        document.head.appendChild(meta);
    }

    loadScript() {
        // Monetag auto-ads script
        const script = document.createElement('script');
        script.src = 'https://alwingulla.com/88/tag.min.js';
        script.async = true;
        script.setAttribute('data-zone', '123456'); // Your zone ID from Monetag
        script.onerror = () => {
            console.log('Monetag script failed, using fallback');
            this.loadFallback();
        };
        document.body.appendChild(script);
        
        // Track impression
        if (this.game.admin) {
            this.game.admin.trackAdImpression('auto', 'monetag');
        }
    }

    loadFallback() {
        // Fallback direct link
        const script2 = document.createElement('script');
        script2.innerHTML = `
            (function(s,u,z,p){
                s.src=u,
                s.setAttribute('data-zone',z),
                p.appendChild(s);
            })(document.createElement('script'),'https://inklinkor.com/tag.min.js',1234567890,document.body||document.documentElement);
        `;
        document.body.appendChild(script2);
    }

    // Show interstitial ad
    showInterstitial(callback) {
        if (this.game.player && this.game.player.isPremium) {
            if (callback) callback();
            return;
        }

        // Trigger Monetag popup
        this.triggerAd();
        
        if (this.game.admin) {
            this.game.admin.trackAdImpression('interstitial', 'monetag');
        }

        // Delay for ad to show
        setTimeout(() => {
            // Reward player
            this.game.player.coins += 10;
            this.game.showToast('+10 coins for watching!');
            this.game.updateProfileStats();
            this.game.savePlayerData();
            
            if (callback) callback();
        }, 2000);
    }

    // Show rewarded ad (player chooses)
    showRewarded(reward, callback) {
        const modal = document.createElement('div');
        modal.className = 'rewarded-modal';
        modal.innerHTML = `
            <div class="rewarded-content">
                <h3>🎁 Free Reward!</h3>
                <p>Watch a short ad to get:</p>
                <div class="reward-item">${reward}</div>
                <button class="btn-watch" onclick="game.ads.watchRewardedAd('${reward}')">
                    ▶️ Watch Ad & Get Reward
                </button>
                <button class="btn-skip" onclick="document.querySelector('.rewarded-modal').remove()">
                    No Thanks
                </button>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .rewarded-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; }
            .rewarded-content { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 25px; text-align: center; max-width: 350px; }
            .reward-item { font-size: 2em; margin: 20px 0; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 15px; color: #ffd700; font-weight: bold; }
            .btn-watch { padding: 15px 30px; border: none; border-radius: 25px; background: #ffd700; color:255,0.2); border-radius: 15px; color: #ffd700; font-weight: bold; }
            .btn-watch { padding: 15px 30px; border: none; border-radius: 25px; background: #ffd700; color: #000; font-weight: bold; cursor: pointer; margin-bottom: 10px; width: 100%; }
            .btn-skip { padding: 15px; border: none; border-radius: 25px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; width: 100%; }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Store callback
        window.rewardCallback = callback;
    }

    watchRewardedAd(reward) {
        // Remove modal
        const modal = document.querySelector('.rewarded-modal');
        if (modal) modal.remove();
        
        // Trigger ad
        this.triggerAd();
        
        if (this.game.admin) {
            this.game.admin.trackAdImpression('rewarded', 'monetag');
        }

        // Show loading
        const loading = document.createElement('div');
        loading.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border-radius: 15px; z-index: 10001; text-align: center; color: white;';
        loading.innerHTML = '<div style="width: 40px; height: 40px; border: 4px solid #333; border-top-color: #ffd700; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div><p>Loading ad...</p>';
        document.body.appendChild(loading);

        // Complete after delay
        setTimeout(() => {
            loading.remove();
            
            // Grant reward
            if (reward.includes('coins')) {
                const amount = parseInt(reward.match(/\d+/)[0]) || 50;
                this.game.player.coins += amount;
            } else if (reward.includes('moves')) {
                this.game.moves += 5;
            } else if (reward.includes('power')) {
                this.game.player.powerUps.hammer += 2;
            }
            
            this.game.showToast(`🎉 Reward received: ${reward}!`);
            this.game.updateProfileStats();
            this.game.updateGameStats();
            this.game.savePlayerData();
            
            if (this.game.admin) {
                this.game.admin.trackAdReward(reward);
            }
            
            if (window.rewardCallback) {
                window.rewardCallback();
                window.rewardCallback = null;
            }
        }, 3500);
    }

    triggerAd() {
        // Trigger Monetag ad by clicking body
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.body.dispatchEvent(event);
        
        // Also try to trigger any Monetag functions
        if (window.show_123456) {
            window.show_123456();
        }
    }

    // Banner ad at bottom
    showBanner() {
        if (this.game.player && this.game.player.isPremium) return;
        
        const banner = document.createElement('div');
        banner.id = 'monetag-banner';
        banner.style.cssText = 'position: fixed; bottom: 0; left: 0; width: 100%; height: 60px; background: #1a1a2e; z-index: 1000; text-align: center; display: flex; align-items: center; justify-content: center; border-top: 2px solid #333;';
        banner.innerHTML = '<span style="color: #666; font-size: 12px;">Advertisement</span>';
        
        document.body.appendChild(banner);
        
        if (this.game.admin) {
            this.game.admin.trackAdImpression('banner', 'monetag');
        }
    }

    trackClick() {
        if (this.game.admin) {
            this.game.admin.trackAdClick('monetag');
        }
    }
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

window.MonetagAds = MonetagAds;


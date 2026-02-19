/**
 * MONETIZATION SYSTEM
 * Ads, Premium, In-app purchases
 */

class Monetization {
    constructor(game) {
        this.game = game;
        this.adsEnabled = true;
        this.adCount = 0;
        this.premiumPrice = 4.99;
        this.coinPacks = [
            { id: 'coins_small', amount: 100, price: 0.99, bonus: 0 },
            { id: 'coins_medium', amount: 550, price: 4.99, bonus: 50 },
            { id: 'coins_large', amount: 1200, price: 9.99, bonus: 200 },
            { id: 'coins_huge', amount: 2500, price: 19.99, bonus: 500 }
        ];
        
        this.initAds();
    }

    initAds() {
        // Simulated ad system - replace with real ad network
        this.adScripts = {
            admob: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            unity: 'https://unityads.unity3d.com/...',
            ironsource: 'https://ironsrc.com/...'
        };
        
        // Load ad script (commented for now - enable when you have ad account)
        // this.loadAdScript();
    }

    loadAdScript() {
        const script = document.createElement('script');
        script.src = this.adScripts.admob;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        
        // Initialize ads when loaded
        script.onload = () => this.setupAds();
    }

    setupAds() {
        // Google AdMob setup
        if (window.adsbygoogle) {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-YOUR_PUBLISHER_ID",
                enable_page_level_ads: true
            });
        }
    }

    showInterstitialAd(callback) {
        if (this.game.player.isPremium || !this.adsEnabled) {
            if (callback) callback();
            return;
        }

        this.adCount++;
        
        // Show ad every 3 games
        if (this.adCount % 3 === 0) {
            this.displayAdModal(callback);
        } else {
            if (callback) callback();
        }
    }

    displayAdModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'ad-modal';
        modal.innerHTML = `
            <div class="ad-content">
                <div class="ad-header">
                    <span class="ad-badge">Advertisement</span>
                    <button class="ad-close" onclick="this.closest('.ad-modal').remove()">✕</button>
                </div>
                <div class="ad-body">
                    <div class="ad-placeholder">
                        <div class="ad-spinner"></div>
                        <p>Loading ad...</p>
                    </div>
                    <div class="ad-real" style="display:none;">
                        <div class="ad-video">📺 Video Ad Playing...</div>
                        <p>Watch to continue playing!</p>
                    </div>
                </div>
                <div class="ad-footer">
                    <button class="btn btn-skip" onclick="game.monetization.skipAd(this)">
                        Skip in <span class="ad-timer">5</span>s
                    </button>
                    <button class="btn btn-premium" onclick="game.monetization.goPremium()">
                        Remove Ads Forever $${this.premiumPrice}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Simulate ad loading
        setTimeout(() => {
            modal.querySelector('.ad-placeholder').style.display = 'none';
            modal.querySelector('.ad-real').style.display = 'block';
        }, 1500);
        
        // Countdown
        let timeLeft = 5;
        const timer = setInterval(() => {
            timeLeft--;
            const span = modal.querySelector('.ad-timer');
            if (span) span.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                const skipBtn = modal.querySelector('.btn-skip');
                if (skipBtn) {
                    skipBtn.textContent = 'Skip Ad ✕';
                    skipBtn.onclick = () => {
                        modal.remove();
                        if (callback) callback();
                    };
                }
            }
        }, 1000);
        
        // Reward after watching
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
                this.game.player.coins += 10; // Reward for watching
                this.game.showToast('+10 coins for watching!');
                this.game.updateProfileStats();
                if (callback) callback();
            }
        }, 15000); // 15 second ad
    }

    skipAd(btn) {
        // Force skip (lose reward)
        btn.closest('.ad-modal').remove();
    }

    showRewardedAd(reward, callback) {
        // Rewarded ad - user chooses to watch for bonus
        const modal = document.createElement('div');
        modal.className = 'reward-modal';
        modal.innerHTML = `
            <div class="reward-content">
                <h3>🎁 Bonus Reward!</h3>
                <p>Watch a short video to get:</p>
                <div class="reward-item">${reward}</div>
                <div class="reward-buttons">
                    <button class="btn btn-watch" onclick="game.monetization.watchRewarded(this, '${reward}')">
                        ▶️ Watch & Get Reward
                    </button>
                    <button class="btn btn-skip" onclick="this.closest('.reward-modal').remove()">
                        No Thanks
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.rewardCallback = callback;
    }

    watchRewarded(btn, reward) {
        const modal = btn.closest('.reward-modal');
        modal.innerHTML = `
            <div class="reward-watching">
                <div class="spinner"></div>
                <p>Playing rewarded video...</p>
                <div class="progress-bar"><div class="progress"></div></div>
            </div>
        `;
        
        // Simulate 10 second rewarded ad
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            modal.querySelector('.progress').style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                modal.remove();
                this.grantReward(reward);
                if (this.rewardCallback) this.rewardCallback();
            }
        }, 1000);
    }

    grantReward(reward) {
        if (reward.includes('coins')) {
            const amount = parseInt(reward.match(/\d+/)[0]);
            this.game.player.coins += amount;
        } else if (reward.includes('moves')) {
            this.game.moves += 5;
        } else if (reward.includes('power')) {
            this.game.player.powerUps.hammer += 2;
        }
        
        this.game.showToast(`🎉 Reward received: ${reward}!`);
        this.game.updateProfileStats();
        this.game.updatePowerUpButtons();
        this.game.updateGameStats();
    }

    goPremium() {
        // In real app, integrate with Stripe/PayPal/Apple Pay/Google Pay
        const modal = document.createElement('div');
        modal.className = 'premium-modal';
        modal.innerHTML = `
            <div class="premium-offer">
                <div class="premium-header">👑 Go Premium</div>
                <div class="premium-price">$${this.premiumPrice}</div>
                <div class="premium-features">
                    <div class="feature">✅ No Ads Forever</div>
                    <div class="feature">✅ 2x Coins on Every Level</div>
                    <div class="feature">✅ Exclusive Premium Fruits</div>
                    <div class="feature">✅ Unlimited Hints</div>
                    <div class="feature">✅ Special Power-ups</div>
                    <div class="feature">✅ Premium Badge</div>
                </div>
                <div class="premium-payment">
                    <button class="btn btn-buy" onclick="game.monetization.processPayment()">
                        💳 Buy Now - $${this.premiumPrice}
                    </button>
                    <p class="payment-secure">🔒 Secure payment processed by Stripe</p>
                </div>
                <button class="btn btn-close" onclick="this.closest('.premium-modal').remove()">✕</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    processPayment() {
        // Simulate payment processing
        const btn = document.querySelector('.btn-buy');
        btn.textContent = 'Processing...';
        btn.disabled = true;
        
        setTimeout(() => {
            this.game.player.isPremium = true;
            this.game.showToast('🎉 Premium Activated! Welcome to VIP!');
            this.game.savePlayerData();
            
            // Remove all modals
            document.querySelectorAll('.premium-modal, .ad-modal').forEach(m => m.remove());
            
            // Update UI
            this.game.updateProfileStats();
        }, 2000);
    }

    buyCoins(packId) {
        const pack = this.coinPacks.find(p => p.id === packId);
        if (!pack) return;
        
        // Show purchase modal
        const modal = document.createElement('div');
        modal.className = 'purchase-modal';
        modal.innerHTML = `
            <div class="purchase-content">
                <h3>💎 ${pack.amount} Coins</h3>
                <div class="purchase-bonus">${pack.bonus > 0 ? '+' + pack.bonus + ' Bonus!' : ''}</div>
                <div class="purchase-price">$${pack.price}</div>
                <button class="btn btn-buy" onclick="game.monetization.completeCoinPurchase('${packId}')">
                    Complete Purchase
                </button>
                <button class="btn btn-cancel" onclick="this.closest('.purchase-modal').remove()">
                    Cancel
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    completeCoinPurchase(packId) {
        const pack = this.coinPacks.find(p => p.id === packId);
        if (pack) {
            this.game.player.coins += pack.amount + pack.bonus;
            this.game.showToast(`+${pack.amount + pack.bonus} coins added!`);
            this.game.updateProfileStats();
            this.game.savePlayerData();
            document.querySelector('.purchase-modal')?.remove();
        }
    }

    // Banner ad for bottom of screen
    showBannerAd() {
        if (this.game.player.isPremium) return;
        
        const banner = document.createElement('div');
        banner.className = 'banner-ad';
        banner.innerHTML = `
            <div class="ad-label">Ad</div>
            <div class="ad-content">Advertisement Space - Your Ad Here</div>
            <button class="ad-remove" onclick="game.monetization.goPremium()">✕</button>
        `;
        
        document.body.appendChild(banner);
        
        // Simulate ad refresh
        setInterval(() => {
            if (!document.body.contains(banner)) return;
            banner.querySelector('.ad-content').textContent = 
                ['Play Now!', 'Download Today!', 'Special Offer!', 'Try For Free!'][Math.floor(Math.random() * 4)];
        }, 30000);
    }
}

// Export for use
window.Monetization = Monetization;


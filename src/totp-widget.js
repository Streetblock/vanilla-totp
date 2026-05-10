class TOTPWidget {
    constructor(config) {
        this.period = config.period || 30;
        this.digits = config.digits || 6;
        this.generator = new TOTPGenerator(this.period, this.digits);

        this.inputSecret = document.querySelector(config.selectors.input);
        this.displayOTP = document.querySelector(config.selectors.display);
        this.progressBar = document.querySelector(config.selectors.progress);
        this.timerText = document.querySelector(config.selectors.timer);

        this.lastSecret = "";
        this.intervalId = null;

        this.init();
    }

    init() {
        if (this.inputSecret) {
            this.inputSecret.addEventListener("input", () => this.updateOTP());
        }

        this.startTimer();
        this.updateOTP();
    }

    formatCode(code) {
        const half = Math.floor(code.length / 2);
        return `${code.substring(0, half)} ${code.substring(half)}`;
    }

    async updateOTP() {
        if (!this.inputSecret || !this.displayOTP) return;

        const secret = this.inputSecret.value.trim();
        if (!secret) {
            this.displayOTP.textContent = "--- ---";
            return;
        }
        this.lastSecret = secret;

        const code = await this.generator.generate(secret);
        if (code) {
            this.displayOTP.textContent = this.formatCode(code);
        } else {
            this.displayOTP.textContent = "Fehler!";
        }
    }

    updateTimerUI() {
        const epoch = Math.floor(Date.now() / 1000);
        const secondsRemaining = this.period - (epoch % this.period);
        const progressPercentage = (secondsRemaining / this.period) * 100;

        if (this.timerText) this.timerText.textContent = secondsRemaining;
        if (this.progressBar) {
            this.progressBar.style.transition = secondsRemaining === this.period ? "none" : "width 1s linear";
            this.progressBar.style.width = `${progressPercentage}%`;
        }

        if (secondsRemaining === this.period && this.inputSecret.value.trim() === this.lastSecret) {
            this.updateOTP();
        }
    }

    startTimer() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.updateTimerUI();
        this.intervalId = setInterval(() => this.updateTimerUI(), 1000);
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.TOTPWidget = TOTPWidget;
}

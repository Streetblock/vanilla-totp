class TOTPWidget {
    constructor(config) {
        this.period = config.period || 30;
        this.digits = config.digits || 6;
        this.generator = new TOTPGenerator(this.period, this.digits);

        this.inputSecret = document.querySelector(config.selectors.input);
        this.displayOTP = document.querySelector(config.selectors.display);
        this.progressBar = document.querySelector(config.selectors.progress);
        this.timerText = document.querySelector(config.selectors.timer);
        this.copyButton = document.querySelector(config.selectors.copy);
        this.copyIcon = document.querySelector(config.selectors.copyIcon);
        this.copySuccessIcon = document.querySelector(config.selectors.copySuccessIcon);
        this.copyFeedback = document.querySelector(config.selectors.copyFeedback);

        this.lastSecret = "";
        this.lastOTP = "";
        this.intervalId = null;
        this.copyFeedbackTimeoutId = null;
        this.updateToken = 0;

        this.init();
    }

    init() {
        if (this.inputSecret) {
            this.inputSecret.addEventListener("input", () => this.updateOTP());
        }

        if (this.copyButton) {
            this.copyButton.addEventListener("click", () => this.copyOTP());
        }

        document.addEventListener("keydown", (event) => this.handleKeyboardShortcuts(event));

        this.startTimer();
        this.updateOTP();
    }

    formatCode(code) {
        const half = Math.floor(code.length / 2);
        return `${code.substring(0, half)} ${code.substring(half)}`;
    }

    async updateOTP() {
        if (!this.inputSecret || !this.displayOTP) return;

        const token = ++this.updateToken;
        const secret = this.inputSecret.value.trim();
        if (!secret) {
            if (token !== this.updateToken) return;
            this.displayOTP.textContent = "--- ---";
            this.lastOTP = "";
            this.updateCopyButtonState(false);
            return;
        }
        this.lastSecret = secret;
        this.lastOTP = "";
        this.updateCopyButtonState(false);

        const code = await this.generator.generate(secret);
        if (token !== this.updateToken) return;

        if (code) {
            this.lastOTP = code;
            this.displayOTP.textContent = this.formatCode(code);
            this.updateCopyButtonState(true);
        } else {
            this.lastOTP = "";
            this.displayOTP.textContent = "Fehler!";
            this.updateCopyButtonState(false);
        }
    }

    updateCopyButtonState(enabled) {
        if (!this.copyButton) return;

        if (this.copyFeedbackTimeoutId) {
            clearTimeout(this.copyFeedbackTimeoutId);
            this.copyFeedbackTimeoutId = null;
        }

        this.copyButton.disabled = !enabled;
        if (this.copyIcon) this.copyIcon.classList.remove("hidden");
        if (this.copySuccessIcon) this.copySuccessIcon.classList.add("hidden");
        if (this.copyFeedback) {
            this.copyFeedback.classList.add("opacity-0");
            this.copyFeedback.classList.remove("opacity-100");
        }
    }

    flashCopySuccess() {
        if (!this.copyButton || !this.copyIcon || !this.copySuccessIcon || !this.copyFeedback) return;

        if (this.copyFeedbackTimeoutId) clearTimeout(this.copyFeedbackTimeoutId);

        this.copyIcon.classList.add("hidden");
        this.copySuccessIcon.classList.remove("hidden");
        this.copyFeedback.classList.remove("opacity-0");
        this.copyFeedback.classList.add("opacity-100");

        this.copyFeedbackTimeoutId = setTimeout(() => {
            this.copySuccessIcon.classList.add("hidden");
            this.copyIcon.classList.remove("hidden");
            this.copyFeedback.classList.remove("opacity-100");
            this.copyFeedback.classList.add("opacity-0");
            this.copyFeedbackTimeoutId = null;
        }, 1400);
    }

    async copyOTP() {
        if (!this.lastOTP) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(this.lastOTP);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = this.lastOTP;
                textarea.setAttribute("readonly", "true");
                textarea.style.position = "absolute";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            this.flashCopySuccess();
        } catch (error) {
            console.error("Could not copy TOTP code:", error);
        }
    }

    handleKeyboardShortcuts(event) {
        const key = event.key.toLowerCase();
        const isCopyShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && key === "c";
        const isFallbackCopy = (event.ctrlKey || event.metaKey) && event.shiftKey && key === "c";
        if ((!isCopyShortcut && !isFallbackCopy) || !this.lastOTP) return;

        const target = event.target;
        const isEditableTarget = target instanceof HTMLElement && (
            target.matches("input, textarea") ||
            target.isContentEditable
        );
        if (isEditableTarget) return;

        event.preventDefault();
        this.copyOTP();
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

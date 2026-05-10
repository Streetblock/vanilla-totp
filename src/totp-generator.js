class TOTPGenerator {
    constructor(period = 30, digits = 6, cryptoProvider = globalThis.crypto) {
        this.period = period;
        this.digits = digits;
        this.cryptoProvider = cryptoProvider;
    }

    _base32Decode(base32) {
        const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        const bits = base32.toUpperCase().replace(/=+$/, "").split("").map((char) => {
            const val = base32chars.indexOf(char);
            if (val === -1) throw new Error("Invalid Base32 character: " + char);
            return val.toString(2).padStart(5, "0");
        }).join("");

        const chunks = bits.match(/.{1,8}/g) || [];
        if (chunks.length > 0 && chunks[chunks.length - 1].length < 8) {
            chunks.pop();
        }
        return new Uint8Array(chunks.map((chunk) => parseInt(chunk, 2)));
    }

    async generate(secret, timestampMs = Date.now()) {
        if (!secret) return null;
        if (!this.cryptoProvider || !this.cryptoProvider.subtle) {
            throw new Error("Web Crypto API not available in this runtime.");
        }

        const key = this._base32Decode(secret);
        const epoch = Math.floor(timestampMs / 1000);
        const timeStep = Math.floor(epoch / this.period);

        const timeStepBuffer = new ArrayBuffer(8);
        const timeStepView = new DataView(timeStepBuffer);
        timeStepView.setBigUint64(0, BigInt(timeStep), false);

        const cryptoKey = await this.cryptoProvider.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-1" },
            false,
            ["sign"]
        );
        const hmacResult = await this.cryptoProvider.subtle.sign("HMAC", cryptoKey, timeStepBuffer);
        const hmacBytes = new Uint8Array(hmacResult);

        const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
        const dataView = new DataView(hmacResult);
        const truncatedHash = dataView.getInt32(offset, false) & 0x7fffffff;

        const modulus = Math.pow(10, this.digits);
        const otp = truncatedHash % modulus;
        return otp.toString().padStart(this.digits, "0");
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { TOTPGenerator };
}

if (typeof globalThis !== "undefined") {
    globalThis.TOTPGenerator = TOTPGenerator;
}

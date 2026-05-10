const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

const { TOTPGenerator } = require("../src/totp-generator");

test("generates expected RFC6238 SHA1 8-digit code at T=59s", async () => {
    const generator = new TOTPGenerator(30, 8, webcrypto);
    const secretBase32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const otp = await generator.generate(secretBase32, 59000);
    assert.equal(otp, "94287082");
});

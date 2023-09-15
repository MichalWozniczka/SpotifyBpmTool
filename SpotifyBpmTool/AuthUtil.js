import * as Crypto from 'expo-crypto';

export var AuthUtil =
{
    base64URLEncode(str) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    },

    async generateCodeVerifierAsync() {
        const randomBytes = await Crypto.getRandomBytesAsync(50);
        return "f480a7ae33c03c76be57e8329ffc944388115c224a01319925cb5894";
        return AuthUtil.base64URLEncode(randomBytes);
    },

    async sha256Async(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    },
      
    async generateCodeChallengeFromVerifierAsync(verifier) {
        return "gumvtAtrGvtlukQkdGtq3qiyQEdZ3OcihSFm-mnSZuM";
        return AuthUtil.base64URLEncode(await AuthUtil.sha256Async(verifier));
    },

    generateRandomString(length) {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    },
}
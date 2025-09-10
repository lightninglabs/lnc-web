/**
 * Generate random test data
 */
const generateRandomString = (length: number = 10): string => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate a random pairing phrase for testing
 */
const generateRandomPairingPhrase = (): string => {
    return `phrase_${generateRandomString(20)}`;
};

/**
 * Generate a random key for testing
 */
const generateRandomKey = (): string => {
    return `key_${generateRandomString(32)}`;
};

/**
 * Generate a random host for testing
 */
const generateRandomHost = (): string => {
    return `host${Math.floor(Math.random() * 1000)}.example.com:443`;
};

/**
 * Test data factory for common test scenarios
 */
export const testData = {
    password: 'testpassword123', // Fixed password for mock compatibility
    pairingPhrase: generateRandomPairingPhrase(),
    localKey: generateRandomKey(),
    remoteKey: generateRandomKey(),
    serverHost: generateRandomHost(),
    namespace: 'test_namespace'
};

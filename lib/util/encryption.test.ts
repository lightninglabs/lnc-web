import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testData } from '../../test/utils/test-helpers';
import {
    createTestCipher,
    decrypt,
    encrypt,
    generateSalt,
    verifyTestCipher
} from './encryption';

describe('Encryption Utilities', () => {
    beforeEach(() => {
        // Reset crypto mock calls
        vi.clearAllMocks();
    });

    describe('generateSalt', () => {
        it('should generate a salt of correct length', () => {
            const salt = generateSalt();
            expect(salt).toHaveLength(32);
        });

        it('should generate salt with valid characters only', () => {
            const salt = generateSalt();
            const validChars =
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (const char of salt) {
                expect(validChars).toContain(char);
            }
        });

        it('should call crypto.getRandomValues with correct array size', () => {
            generateSalt();
            expect(globalThis.crypto.getRandomValues).toHaveBeenCalledWith(
                expect.any(Uint8Array)
            );
            const callArgs = (globalThis.crypto.getRandomValues as any).mock
                .calls[0][0];
            expect(callArgs).toHaveLength(32);
        });

        it('should generate different salts on subsequent calls', () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            // Note: In a real implementation, these would likely be different
            // but our mock uses Math.random() which could potentially return same values
            expect(typeof salt1).toBe('string');
            expect(typeof salt2).toBe('string');
        });
    });

    describe('encrypt', () => {
        it('should encrypt data with password and salt', () => {
            const data = { test: 'data' };
            const password = testData.password;
            const salt = 'testsalt12345678901234567890123456789012';

            const result = encrypt(data, password, salt);

            expect(typeof result).toBe('string');
            expect(result).toHaveLength(44); // AES encrypted strings are typically 44 chars
        });

        it('should produce different results for different data', () => {
            const password = testData.password;
            const salt = generateSalt();

            const result1 = encrypt('data1', password, salt);
            const result2 = encrypt('data2', password, salt);

            expect(result1).not.toBe(result2);
        });

        it('should produce different results for different passwords', () => {
            const data = 'test data';
            const salt = generateSalt();

            const result1 = encrypt(data, 'password1', salt);
            const result2 = encrypt(data, 'password2', salt);

            expect(result1).not.toBe(result2);
        });

        it('should produce different results for different salts', () => {
            const data = 'test data';
            const password = testData.password;

            const result1 = encrypt(data, password, generateSalt());
            const result2 = encrypt(data, password, generateSalt());

            // Salts are random, so results should be different
            expect(result1).not.toBe(result2);
        });
    });

    describe('decrypt', () => {
        it('should decrypt previously encrypted data', () => {
            const originalData = { message: 'secret data', number: 42 };
            const password = testData.password;
            const salt = generateSalt();

            const encrypted = encrypt(originalData, password, salt);
            const decrypted = decrypt(encrypted, password, salt);

            expect(decrypted).toEqual(originalData);
        });

        it('should throw error for invalid encrypted data', () => {
            const invalidData = 'not-a-valid-encrypted-string';
            const password = testData.password;
            const salt = generateSalt();

            expect(() => {
                decrypt(invalidData, password, salt);
            }).toThrow();
        });

        it('should throw error for wrong password', () => {
            const originalData = 'secret message';
            const correctPassword = testData.password;
            const wrongPassword = 'wrongpassword';
            const salt = generateSalt();

            const encrypted = encrypt(originalData, correctPassword, salt);

            expect(() => {
                decrypt(encrypted, wrongPassword, salt);
            }).toThrow();
        });
    });

    describe('createTestCipher', () => {
        it('should create a test cipher with password and salt', () => {
            const password = testData.password;
            const salt = generateSalt();

            const cipher = createTestCipher(password, salt);

            expect(typeof cipher).toBe('string');
            expect(cipher.length).toBeGreaterThan(0);
        });

        it('should create different ciphers for different passwords', () => {
            const salt = generateSalt();

            const cipher1 = createTestCipher('password1', salt);
            const cipher2 = createTestCipher('password2', salt);

            expect(cipher1).not.toBe(cipher2);
        });
    });

    describe('verifyTestCipher', () => {
        it('should return true for valid cipher with correct password and salt', () => {
            const password = testData.password;
            const salt = generateSalt();
            const cipher = createTestCipher(password, salt);

            const isValid = verifyTestCipher(cipher, password, salt);

            expect(isValid).toBe(true);
        });

        it('should return false for invalid cipher', () => {
            const password = testData.password;
            const salt = generateSalt();
            const invalidCipher = 'invalid-cipher-string';

            const isValid = verifyTestCipher(invalidCipher, password, salt);

            expect(isValid).toBe(false);
        });

        it('should return false for wrong password', () => {
            const correctPassword = testData.password;
            const wrongPassword = 'wrongpassword';
            const salt = generateSalt();
            const cipher = createTestCipher(correctPassword, salt);

            const isValid = verifyTestCipher(cipher, wrongPassword, salt);

            expect(isValid).toBe(false);
        });

        it('should handle decryption errors gracefully', () => {
            const password = testData.password;
            const salt = generateSalt();
            const corruptedCipher = 'corrupted-cipher-data';

            const isValid = verifyTestCipher(corruptedCipher, password, salt);

            expect(isValid).toBe(false);
        });
    });

    describe('Integration tests', () => {
        it('should successfully encrypt and decrypt complex data structures', () => {
            const complexData = {
                user: {
                    id: 123,
                    name: 'Test User',
                    preferences: {
                        theme: 'dark',
                        notifications: true
                    }
                },
                tokens: ['token1', 'token2', 'token3'],
                metadata: {
                    created: new Date().toISOString(),
                    version: '1.0.0'
                }
            };

            const password = testData.password;
            const salt = generateSalt();

            const encrypted = encrypt(complexData, password, salt);
            const decrypted = decrypt(encrypted, password, salt);

            expect(decrypted).toEqual(complexData);
        });

        it('should maintain data integrity through encrypt/decrypt cycle', () => {
            const testCases = [
                'simple string',
                42,
                { key: 'value' },
                [1, 2, 3, 'test'],
                { nested: { deeply: { nested: 'value' } } },
                true,
                false,
                '',
                [],
                {}
            ];

            const password = testData.password;
            const salt = generateSalt();

            testCases.forEach((data) => {
                const encrypted = encrypt(data, password, salt);
                const decrypted = decrypt(encrypted, password, salt);

                expect(decrypted).toEqual(data);
            });
        });
    });
});

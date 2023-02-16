import { CredentialStore } from '../types/lnc';
import {
    createTestCipher,
    decrypt,
    encrypt,
    generateSalt,
    verifyTestCipher
} from './encryption';

const STORAGE_KEY = 'lnc-web';

/**
 * A wrapper around `window.localStorage` used to store sensitive data required
 * by LNC to reconnect after the initial pairing process has been completed. The
 * data is encrypted at rest using the provided `password`.
 */
export default class LncCredentialStore implements CredentialStore {
    // the data to store in localStorage
    private persisted = {
        salt: '',
        cipher: '',
        serverHost: '',
        // encrypted fields
        localKey: '',
        remoteKey: '',
        pairingPhrase: ''
    };
    // the decrypted credentials in plain text. these fields are separate from the
    // persisted encrypted fields in order to be able to set the password at any
    // time. we may have plain text values that we need to hold onto until the
    // password is set, or may load encrypted values that we delay decrypting until
    // the password is provided.
    private _localKey: string = '';
    private _remoteKey: string = '';
    private _pairingPhrase: string = '';
    /** The password used to encrypt and decrypt the stored data */
    private _password?: string;
    /** The namespace to use in the localStorage key */
    private namespace: string = 'default';

    /**
     * Constructs a new `LncCredentialStore` instance
     */
    constructor(namespace?: string, password?: string) {
        if (namespace) this.namespace = namespace;
        if (password) this.password = password;

        // load data stored in localStorage
        this._load();
    }

    //
    // Public fields which implement the `CredentialStore` interface
    //

    /**
     * Stores the optional password to use for encryption of the data. LNC does not
     * read or write the password. This is just exposed publicly to simplify access
     * to the field via `lnc.credentials.password`
     */
    get password() {
        return this._password || '';
    }

    /**
     * Stores the optional password to use for encryption of the data. LNC does not
     * read or write the password. This is just exposed publicly to simplify access
     * to the field via `lnc.credentials.password`
     */
    set password(password: string) {
        // when a password is provided, we need to either decrypt the persisted
        // data, or encrypt and store the plain text data
        if (this.persisted.cipher) {
            // we have encrypted data to decrypt
            const { cipher, salt } = this.persisted;
            if (!verifyTestCipher(cipher, password, salt)) {
                throw new Error('The password provided is not valid');
            }
            // set the password before decrypting data
            this._password = password;
            // decrypt the persisted data
            this._pairingPhrase = this._decrypt(this.persisted.pairingPhrase);
            this._localKey = this._decrypt(this.persisted.localKey);
            this._remoteKey = this._decrypt(this.persisted.remoteKey);
        } else {
            // we have plain text data to encrypt
            this._password = password;
            // create new salt and cipher using the password
            this.persisted.salt = generateSalt();
            this.persisted.cipher = createTestCipher(
                password,
                this.persisted.salt
            );
            // encrypt and persist any in-memory values
            if (this.pairingPhrase)
                this.persisted.pairingPhrase = this._encrypt(
                    this.pairingPhrase
                );
            if (this.localKey)
                this.persisted.localKey = this._encrypt(this.localKey);
            if (this.remoteKey)
                this.persisted.remoteKey = this._encrypt(this.remoteKey);
            this._save();
        }
    }

    /** Stores the host:port of the Lightning Node Connect proxy server to connect to */
    get serverHost() {
        return this.persisted.serverHost;
    }

    /** Stores the host:port of the Lightning Node Connect proxy server to connect to */
    set serverHost(host: string) {
        this.persisted.serverHost = host;
        this._save();
    }

    /** Stores the LNC pairing phrase used to initialize the connection to the LNC proxy */
    get pairingPhrase() {
        return this._pairingPhrase;
    }

    /** Stores the LNC pairing phrase used to initialize the connection to the LNC proxy */
    set pairingPhrase(phrase: string) {
        this._pairingPhrase = phrase;
        if (this._password) {
            this.persisted.pairingPhrase = this._encrypt(phrase);
            this._save();
        }
    }

    /** Stores the local private key which LNC uses to reestablish a connection */
    get localKey() {
        return this._localKey;
    }

    /** Stores the local private key which LNC uses to reestablish a connection */
    set localKey(key: string) {
        this._localKey = key;
        if (this._password) {
            this.persisted.localKey = this._encrypt(key);
            this._save();
        }
    }

    /** Stores the remote static key which LNC uses to reestablish a connection */
    get remoteKey() {
        return this._remoteKey;
    }

    /** Stores the remote static key which LNC uses to reestablish a connection */
    set remoteKey(key: string) {
        this._remoteKey = key;
        if (this._password) {
            this.persisted.remoteKey = this._encrypt(key);
            this._save();
        }
    }

    /**
     * Read-only field which should return `true` if the client app has prior
     * credentials persisted in teh store
     */
    get isPaired() {
        return !!this.persisted.remoteKey || !!this.persisted.pairingPhrase;
    }

    /** Clears any persisted data in the store */
    clear() {
        const key = `${STORAGE_KEY}:${this.namespace}`;
        localStorage.removeItem(key);
        this.persisted = {
            salt: '',
            cipher: '',
            serverHost: this.persisted.serverHost,
            localKey: '',
            remoteKey: '',
            pairingPhrase: ''
        };
        this._localKey = '';
        this._remoteKey = '';
        this._pairingPhrase = '';
        this._password = undefined;
    }

    //
    // Private functions only used internally
    //

    /** Loads persisted data from localStorage */
    private _load() {
        // do nothing if localStorage is not available
        if (typeof localStorage === 'undefined') return;

        try {
            const key = `${STORAGE_KEY}:${this.namespace}`;
            const json = localStorage.getItem(key);
            if (!json) return;
            this.persisted = JSON.parse(json);
        } catch (error) {
            const msg = (error as Error).message;
            throw new Error(`Failed to load secure data: ${msg}`);
        }
    }

    /** Saves persisted data to localStorage */
    private _save() {
        // do nothing if localStorage is not available
        if (typeof localStorage === 'undefined') return;

        const key = `${STORAGE_KEY}:${this.namespace}`;
        localStorage.setItem(key, JSON.stringify(this.persisted));
    }

    /**
     * A wrapper around `encrypt` which just returns an empty string if the
     * value or password have no value
     */
    private _encrypt(value: string) {
        if (!value || !this._password) return '';
        return encrypt(value, this._password, this.persisted.salt);
    }

    /**
     * A wrapper around `decrypt` which just returns an empty string if the
     * value or password have no value
     */
    private _decrypt(value: string) {
        if (!value || !this._password) return '';
        return decrypt(value, this._password, this.persisted.salt);
    }
}

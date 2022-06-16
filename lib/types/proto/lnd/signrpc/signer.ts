/* eslint-disable */
export interface KeyLocator {
    /** The family of key being identified. */
    keyFamily: number;
    /** The precise index of the key being identified. */
    keyIndex: number;
}

export interface KeyDescriptor {
    /**
     * The raw bytes of the public key in the key pair being identified. Either
     * this or the KeyLocator must be specified.
     */
    rawKeyBytes: Uint8Array | string;
    /**
     * The key locator that identifies which private key to use for signing.
     * Either this or the raw bytes of the target public key must be specified.
     */
    keyLoc: KeyLocator | undefined;
}

export interface TxOut {
    /** The value of the output being spent. */
    value: string;
    /** The script of the output being spent. */
    pkScript: Uint8Array | string;
}

export interface SignDescriptor {
    /**
     * A descriptor that precisely describes *which* key to use for signing. This
     * may provide the raw public key directly, or require the Signer to re-derive
     * the key according to the populated derivation path.
     *
     * Note that if the key descriptor was obtained through walletrpc.DeriveKey,
     * then the key locator MUST always be provided, since the derived keys are not
     * persisted unlike with DeriveNextKey.
     */
    keyDesc: KeyDescriptor | undefined;
    /**
     * A scalar value that will be added to the private key corresponding to the
     * above public key to obtain the private key to be used to sign this input.
     * This value is typically derived via the following computation:
     *
     * derivedKey = privkey + sha256(perCommitmentPoint || pubKey) mod N
     */
    singleTweak: Uint8Array | string;
    /**
     * A private key that will be used in combination with its corresponding
     * private key to derive the private key that is to be used to sign the target
     * input. Within the Lightning protocol, this value is typically the
     * commitment secret from a previously revoked commitment transaction. This
     * value is in combination with two hash values, and the original private key
     * to derive the private key to be used when signing.
     *
     * k = (privKey*sha256(pubKey || tweakPub) +
     * tweakPriv*sha256(tweakPub || pubKey)) mod N
     */
    doubleTweak: Uint8Array | string;
    /**
     * The full script required to properly redeem the output.  This field will
     * only be populated if a p2wsh or a p2sh output is being signed.
     */
    witnessScript: Uint8Array | string;
    /**
     * A description of the output being spent. The value and script MUST be
     * provided.
     */
    output: TxOut | undefined;
    /**
     * The target sighash type that should be used when generating the final
     * sighash, and signature.
     */
    sighash: number;
    /** The target input within the transaction that should be signed. */
    inputIndex: number;
}

export interface SignReq {
    /** The raw bytes of the transaction to be signed. */
    rawTxBytes: Uint8Array | string;
    /** A set of sign descriptors, for each input to be signed. */
    signDescs: SignDescriptor[];
}

export interface SignResp {
    /**
     * A set of signatures realized in a fixed 64-byte format ordered in ascending
     * input order.
     */
    rawSigs: Uint8Array | string[];
}

export interface InputScript {
    /** The serializes witness stack for the specified input. */
    witness: Uint8Array | string[];
    /**
     * The optional sig script for the specified witness that will only be set if
     * the input specified is a nested p2sh witness program.
     */
    sigScript: Uint8Array | string;
}

export interface InputScriptResp {
    /** The set of fully valid input scripts requested. */
    inputScripts: InputScript[];
}

export interface SignMessageReq {
    /** The message to be signed. */
    msg: Uint8Array | string;
    /** The key locator that identifies which key to use for signing. */
    keyLoc: KeyLocator | undefined;
    /** Double-SHA256 hash instead of just the default single round. */
    doubleHash: boolean;
    /**
     * Use the compact (pubkey recoverable) format instead of the raw lnwire
     * format.
     */
    compactSig: boolean;
}

export interface SignMessageResp {
    /** The signature for the given message in the fixed-size LN wire format. */
    signature: Uint8Array | string;
}

export interface VerifyMessageReq {
    /** The message over which the signature is to be verified. */
    msg: Uint8Array | string;
    /**
     * The fixed-size LN wire encoded signature to be verified over the given
     * message.
     */
    signature: Uint8Array | string;
    /** The public key the signature has to be valid for. */
    pubkey: Uint8Array | string;
}

export interface VerifyMessageResp {
    /** Whether the signature was valid over the given message. */
    valid: boolean;
}

export interface SharedKeyRequest {
    /** The ephemeral public key to use for the DH key derivation. */
    ephemeralPubkey: Uint8Array | string;
    /**
     * Deprecated. The optional key locator of the local key that should be used.
     * If this parameter is not set then the node's identity private key will be
     * used.
     *
     * @deprecated
     */
    keyLoc: KeyLocator | undefined;
    /**
     * A key descriptor describes the key used for performing ECDH. Either a key
     * locator or a raw public key is expected, if neither is supplied, defaults to
     * the node's identity private key.
     */
    keyDesc: KeyDescriptor | undefined;
}

export interface SharedKeyResponse {
    /** The shared public key, hashed with sha256. */
    sharedKey: Uint8Array | string;
}

/**
 * Signer is a service that gives access to the signing functionality of the
 * daemon's wallet.
 */
export interface Signer {
    /**
     * SignOutputRaw is a method that can be used to generated a signature for a
     * set of inputs/outputs to a transaction. Each request specifies details
     * concerning how the outputs should be signed, which keys they should be
     * signed with, and also any optional tweaks. The return value is a fixed
     * 64-byte signature (the same format as we use on the wire in Lightning).
     *
     * If we are  unable to sign using the specified keys, then an error will be
     * returned.
     */
    signOutputRaw(request?: DeepPartial<SignReq>): Promise<SignResp>;
    /**
     * ComputeInputScript generates a complete InputIndex for the passed
     * transaction with the signature as defined within the passed SignDescriptor.
     * This method should be capable of generating the proper input script for
     * both regular p2wkh output and p2wkh outputs nested within a regular p2sh
     * output.
     *
     * Note that when using this method to sign inputs belonging to the wallet,
     * the only items of the SignDescriptor that need to be populated are pkScript
     * in the TxOut field, the value in that same field, and finally the input
     * index.
     */
    computeInputScript(
        request?: DeepPartial<SignReq>
    ): Promise<InputScriptResp>;
    /**
     * SignMessage signs a message with the key specified in the key locator. The
     * returned signature is fixed-size LN wire format encoded.
     *
     * The main difference to SignMessage in the main RPC is that a specific key is
     * used to sign the message instead of the node identity private key.
     */
    signMessage(
        request?: DeepPartial<SignMessageReq>
    ): Promise<SignMessageResp>;
    /**
     * VerifyMessage verifies a signature over a message using the public key
     * provided. The signature must be fixed-size LN wire format encoded.
     *
     * The main difference to VerifyMessage in the main RPC is that the public key
     * used to sign the message does not have to be a node known to the network.
     */
    verifyMessage(
        request?: DeepPartial<VerifyMessageReq>
    ): Promise<VerifyMessageResp>;
    /**
     * DeriveSharedKey returns a shared secret key by performing Diffie-Hellman key
     * derivation between the ephemeral public key in the request and the node's
     * key specified in the key_desc parameter. Either a key locator or a raw
     * public key is expected in the key_desc, if neither is supplied, defaults to
     * the node's identity private key:
     * P_shared = privKeyNode * ephemeralPubkey
     * The resulting shared public key is serialized in the compressed format and
     * hashed with sha256, resulting in the final key length of 256bit.
     */
    deriveSharedKey(
        request?: DeepPartial<SharedKeyRequest>
    ): Promise<SharedKeyResponse>;
}

type Builtin =
    | Date
    | Function
    | Uint8Array
    | string
    | number
    | boolean
    | undefined;

type DeepPartial<T> = T extends Builtin
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends {}
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : Partial<T>;

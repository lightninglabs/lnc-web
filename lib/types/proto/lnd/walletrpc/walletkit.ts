/* eslint-disable */
import type { Utxo, OutPoint, TransactionDetails } from '../lightning';
import type { TxOut, KeyDescriptor, KeyLocator } from '../signrpc/signer';

export enum AddressType {
    UNKNOWN = 'UNKNOWN',
    WITNESS_PUBKEY_HASH = 'WITNESS_PUBKEY_HASH',
    NESTED_WITNESS_PUBKEY_HASH = 'NESTED_WITNESS_PUBKEY_HASH',
    HYBRID_NESTED_WITNESS_PUBKEY_HASH = 'HYBRID_NESTED_WITNESS_PUBKEY_HASH',
    TAPROOT_PUBKEY = 'TAPROOT_PUBKEY',
    UNRECOGNIZED = 'UNRECOGNIZED'
}

export enum WitnessType {
    UNKNOWN_WITNESS = 'UNKNOWN_WITNESS',
    /**
     * COMMITMENT_TIME_LOCK - A witness that allows us to spend the output of a commitment transaction
     * after a relative lock-time lockout.
     */
    COMMITMENT_TIME_LOCK = 'COMMITMENT_TIME_LOCK',
    /**
     * COMMITMENT_NO_DELAY - A witness that allows us to spend a settled no-delay output immediately on a
     * counterparty's commitment transaction.
     */
    COMMITMENT_NO_DELAY = 'COMMITMENT_NO_DELAY',
    /**
     * COMMITMENT_REVOKE - A witness that allows us to sweep the settled output of a malicious
     * counterparty's who broadcasts a revoked commitment transaction.
     */
    COMMITMENT_REVOKE = 'COMMITMENT_REVOKE',
    /**
     * HTLC_OFFERED_REVOKE - A witness that allows us to sweep an HTLC which we offered to the remote
     * party in the case that they broadcast a revoked commitment state.
     */
    HTLC_OFFERED_REVOKE = 'HTLC_OFFERED_REVOKE',
    /**
     * HTLC_ACCEPTED_REVOKE - A witness that allows us to sweep an HTLC output sent to us in the case that
     * the remote party broadcasts a revoked commitment state.
     */
    HTLC_ACCEPTED_REVOKE = 'HTLC_ACCEPTED_REVOKE',
    /**
     * HTLC_OFFERED_TIMEOUT_SECOND_LEVEL - A witness that allows us to sweep an HTLC output that we extended to a
     * party, but was never fulfilled.  This HTLC output isn't directly on the
     * commitment transaction, but is the result of a confirmed second-level HTLC
     * transaction. As a result, we can only spend this after a CSV delay.
     */
    HTLC_OFFERED_TIMEOUT_SECOND_LEVEL = 'HTLC_OFFERED_TIMEOUT_SECOND_LEVEL',
    /**
     * HTLC_ACCEPTED_SUCCESS_SECOND_LEVEL - A witness that allows us to sweep an HTLC output that was offered to us, and
     * for which we have a payment preimage. This HTLC output isn't directly on our
     * commitment transaction, but is the result of confirmed second-level HTLC
     * transaction. As a result, we can only spend this after a CSV delay.
     */
    HTLC_ACCEPTED_SUCCESS_SECOND_LEVEL = 'HTLC_ACCEPTED_SUCCESS_SECOND_LEVEL',
    /**
     * HTLC_OFFERED_REMOTE_TIMEOUT - A witness that allows us to sweep an HTLC that we offered to the remote
     * party which lies in the commitment transaction of the remote party. We can
     * spend this output after the absolute CLTV timeout of the HTLC as passed.
     */
    HTLC_OFFERED_REMOTE_TIMEOUT = 'HTLC_OFFERED_REMOTE_TIMEOUT',
    /**
     * HTLC_ACCEPTED_REMOTE_SUCCESS - A witness that allows us to sweep an HTLC that was offered to us by the
     * remote party. We use this witness in the case that the remote party goes to
     * chain, and we know the pre-image to the HTLC. We can sweep this without any
     * additional timeout.
     */
    HTLC_ACCEPTED_REMOTE_SUCCESS = 'HTLC_ACCEPTED_REMOTE_SUCCESS',
    /**
     * HTLC_SECOND_LEVEL_REVOKE - A witness that allows us to sweep an HTLC from the remote party's commitment
     * transaction in the case that the broadcast a revoked commitment, but then
     * also immediately attempt to go to the second level to claim the HTLC.
     */
    HTLC_SECOND_LEVEL_REVOKE = 'HTLC_SECOND_LEVEL_REVOKE',
    /**
     * WITNESS_KEY_HASH - A witness type that allows us to spend a regular p2wkh output that's sent to
     * an output which is under complete control of the backing wallet.
     */
    WITNESS_KEY_HASH = 'WITNESS_KEY_HASH',
    /**
     * NESTED_WITNESS_KEY_HASH - A witness type that allows us to sweep an output that sends to a nested P2SH
     * script that pays to a key solely under our control.
     */
    NESTED_WITNESS_KEY_HASH = 'NESTED_WITNESS_KEY_HASH',
    /**
     * COMMITMENT_ANCHOR - A witness type that allows us to spend our anchor on the commitment
     * transaction.
     */
    COMMITMENT_ANCHOR = 'COMMITMENT_ANCHOR',
    UNRECOGNIZED = 'UNRECOGNIZED'
}

export interface ListUnspentRequest {
    /** The minimum number of confirmations to be included. */
    minConfs: number;
    /** The maximum number of confirmations to be included. */
    maxConfs: number;
    /** An optional filter to only include outputs belonging to an account. */
    account: string;
    /**
     * When min_confs and max_confs are zero, setting false implicitly
     * overrides max_confs to be MaxInt32, otherwise max_confs remains
     * zero. An error is returned if the value is true and both min_confs
     * and max_confs are non-zero. (default: false)
     */
    unconfirmedOnly: boolean;
}

export interface ListUnspentResponse {
    /** A list of utxos satisfying the specified number of confirmations. */
    utxos: Utxo[];
}

export interface LeaseOutputRequest {
    /**
     * An ID of 32 random bytes that must be unique for each distinct application
     * using this RPC which will be used to bound the output lease to.
     */
    id: Uint8Array | string;
    /** The identifying outpoint of the output being leased. */
    outpoint: OutPoint | undefined;
    /**
     * The time in seconds before the lock expires. If set to zero, the default
     * lock duration is used.
     */
    expirationSeconds: string;
}

export interface LeaseOutputResponse {
    /** The absolute expiration of the output lease represented as a unix timestamp. */
    expiration: string;
}

export interface ReleaseOutputRequest {
    /** The unique ID that was used to lock the output. */
    id: Uint8Array | string;
    /** The identifying outpoint of the output being released. */
    outpoint: OutPoint | undefined;
}

export interface ReleaseOutputResponse {}

export interface KeyReq {
    /**
     * Is the key finger print of the root pubkey that this request is targeting.
     * This allows the WalletKit to possibly serve out keys for multiple HD chains
     * via public derivation.
     */
    keyFingerPrint: number;
    /**
     * The target key family to derive a key from. In other contexts, this is
     * known as the "account".
     */
    keyFamily: number;
}

export interface AddrRequest {
    /**
     * The name of the account to retrieve the next address of. If empty, the
     * default wallet account is used.
     */
    account: string;
    /** The type of address to derive. */
    type: AddressType;
    /** Whether a change address should be derived. */
    change: boolean;
}

export interface AddrResponse {
    /** The address encoded using a bech32 format. */
    addr: string;
}

export interface Account {
    /** The name used to identify the account. */
    name: string;
    /**
     * The type of addresses the account supports.
     * AddressType                       | External Branch | Internal Branch
     * ---------------------------------------------------------------------
     * WITNESS_PUBKEY_HASH               | P2WPKH          | P2WPKH
     * NESTED_WITNESS_PUBKEY_HASH        | NP2WPKH         | NP2WPKH
     * HYBRID_NESTED_WITNESS_PUBKEY_HASH | NP2WPKH         | P2WPKH
     */
    addressType: AddressType;
    /**
     * The public key backing the account that all keys are derived from
     * represented as an extended key. This will always be empty for the default
     * imported account in which single public keys are imported into.
     */
    extendedPublicKey: string;
    /**
     * The fingerprint of the root key from which the account public key was
     * derived from. This will always be zero for the default imported account in
     * which single public keys are imported into. The bytes are in big-endian
     * order.
     */
    masterKeyFingerprint: Uint8Array | string;
    /**
     * The derivation path corresponding to the account public key. This will
     * always be empty for the default imported account in which single public keys
     * are imported into.
     */
    derivationPath: string;
    /**
     * The number of keys derived from the external branch of the account public
     * key. This will always be zero for the default imported account in which
     * single public keys are imported into.
     */
    externalKeyCount: number;
    /**
     * The number of keys derived from the internal branch of the account public
     * key. This will always be zero for the default imported account in which
     * single public keys are imported into.
     */
    internalKeyCount: number;
    /** Whether the wallet stores private keys for the account. */
    watchOnly: boolean;
}

export interface ListAccountsRequest {
    /** An optional filter to only return accounts matching this name. */
    name: string;
    /** An optional filter to only return accounts matching this address type. */
    addressType: AddressType;
}

export interface ListAccountsResponse {
    accounts: Account[];
}

export interface RequiredReserveRequest {
    /** The number of additional channels the user would like to open. */
    additionalPublicChannels: number;
}

export interface RequiredReserveResponse {
    /** The amount of reserve required. */
    requiredReserve: string;
}

export interface ImportAccountRequest {
    /** A name to identify the account with. */
    name: string;
    /**
     * A public key that corresponds to a wallet account represented as an extended
     * key. It must conform to a derivation path of the form
     * m/purpose'/coin_type'/account'.
     */
    extendedPublicKey: string;
    /**
     * The fingerprint of the root key (also known as the key with derivation path
     * m/) from which the account public key was derived from. This may be required
     * by some hardware wallets for proper identification and signing. The bytes
     * must be in big-endian order.
     */
    masterKeyFingerprint: Uint8Array | string;
    /**
     * An address type is only required when the extended account public key has a
     * legacy version (xpub, tpub, etc.), such that the wallet cannot detect what
     * address scheme it belongs to.
     */
    addressType: AddressType;
    /**
     * Whether a dry run should be attempted when importing the account. This
     * serves as a way to confirm whether the account is being imported correctly
     * by returning the first N addresses for the external and internal branches of
     * the account. If these addresses match as expected, then it should be safe to
     * import the account as is.
     */
    dryRun: boolean;
}

export interface ImportAccountResponse {
    /** The details of the imported account. */
    account: Account | undefined;
    /**
     * The first N addresses that belong to the external branch of the account.
     * The external branch is typically used for external non-change addresses.
     * These are only returned if a dry run was specified within the request.
     */
    dryRunExternalAddrs: string[];
    /**
     * The first N addresses that belong to the internal branch of the account.
     * The internal branch is typically used for change addresses. These are only
     * returned if a dry run was specified within the request.
     */
    dryRunInternalAddrs: string[];
}

export interface ImportPublicKeyRequest {
    /** A compressed public key represented as raw bytes. */
    publicKey: Uint8Array | string;
    /** The type of address that will be generated from the public key. */
    addressType: AddressType;
}

export interface ImportPublicKeyResponse {}

export interface Transaction {
    /** The raw serialized transaction. */
    txHex: Uint8Array | string;
    /** An optional label to save with the transaction. Limited to 500 characters. */
    label: string;
}

export interface PublishResponse {
    /**
     * If blank, then no error occurred and the transaction was successfully
     * published. If not the empty string, then a string representation of the
     * broadcast error.
     *
     * TODO(roasbeef): map to a proper enum type
     */
    publishError: string;
}

export interface SendOutputsRequest {
    /**
     * The number of satoshis per kilo weight that should be used when crafting
     * this transaction.
     */
    satPerKw: string;
    /** A slice of the outputs that should be created in the transaction produced. */
    outputs: TxOut[];
    /** An optional label for the transaction, limited to 500 characters. */
    label: string;
    /**
     * The minimum number of confirmations each one of your outputs used for
     * the transaction must satisfy.
     */
    minConfs: number;
    /** Whether unconfirmed outputs should be used as inputs for the transaction. */
    spendUnconfirmed: boolean;
}

export interface SendOutputsResponse {
    /** The serialized transaction sent out on the network. */
    rawTx: Uint8Array | string;
}

export interface EstimateFeeRequest {
    /** The number of confirmations to shoot for when estimating the fee. */
    confTarget: number;
}

export interface EstimateFeeResponse {
    /**
     * The amount of satoshis per kw that should be used in order to reach the
     * confirmation target in the request.
     */
    satPerKw: string;
}

export interface PendingSweep {
    /** The outpoint of the output we're attempting to sweep. */
    outpoint: OutPoint | undefined;
    /** The witness type of the output we're attempting to sweep. */
    witnessType: WitnessType;
    /** The value of the output we're attempting to sweep. */
    amountSat: number;
    /**
     * Deprecated, use sat_per_vbyte.
     * The fee rate we'll use to sweep the output, expressed in sat/vbyte. The fee
     * rate is only determined once a sweeping transaction for the output is
     * created, so it's possible for this to be 0 before this.
     *
     * @deprecated
     */
    satPerByte: number;
    /** The number of broadcast attempts we've made to sweep the output. */
    broadcastAttempts: number;
    /**
     * The next height of the chain at which we'll attempt to broadcast the
     * sweep transaction of the output.
     */
    nextBroadcastHeight: number;
    /** The requested confirmation target for this output. */
    requestedConfTarget: number;
    /**
     * Deprecated, use requested_sat_per_vbyte.
     * The requested fee rate, expressed in sat/vbyte, for this output.
     *
     * @deprecated
     */
    requestedSatPerByte: number;
    /**
     * The fee rate we'll use to sweep the output, expressed in sat/vbyte. The fee
     * rate is only determined once a sweeping transaction for the output is
     * created, so it's possible for this to be 0 before this.
     */
    satPerVbyte: string;
    /** The requested fee rate, expressed in sat/vbyte, for this output. */
    requestedSatPerVbyte: string;
    /**
     * Whether this input must be force-swept. This means that it is swept even
     * if it has a negative yield.
     */
    force: boolean;
}

export interface PendingSweepsRequest {}

export interface PendingSweepsResponse {
    /** The set of outputs currently being swept by lnd's central batching engine. */
    pendingSweeps: PendingSweep[];
}

export interface BumpFeeRequest {
    /** The input we're attempting to bump the fee of. */
    outpoint: OutPoint | undefined;
    /** The target number of blocks that the input should be spent within. */
    targetConf: number;
    /**
     * Deprecated, use sat_per_vbyte.
     * The fee rate, expressed in sat/vbyte, that should be used to spend the input
     * with.
     *
     * @deprecated
     */
    satPerByte: number;
    /**
     * Whether this input must be force-swept. This means that it is swept even
     * if it has a negative yield.
     */
    force: boolean;
    /**
     * The fee rate, expressed in sat/vbyte, that should be used to spend the input
     * with.
     */
    satPerVbyte: string;
}

export interface BumpFeeResponse {}

export interface ListSweepsRequest {
    /**
     * Retrieve the full sweep transaction details. If false, only the sweep txids
     * will be returned. Note that some sweeps that LND publishes will have been
     * replaced-by-fee, so will not be included in this output.
     */
    verbose: boolean;
}

export interface ListSweepsResponse {
    transactionDetails: TransactionDetails | undefined;
    transactionIds: ListSweepsResponse_TransactionIDs | undefined;
}

export interface ListSweepsResponse_TransactionIDs {
    /**
     * Reversed, hex-encoded string representing the transaction ids of the
     * sweeps that our node has broadcast. Note that these transactions may
     * not have confirmed yet, we record sweeps on broadcast, not confirmation.
     */
    transactionIds: string[];
}

export interface LabelTransactionRequest {
    /** The txid of the transaction to label. */
    txid: Uint8Array | string;
    /** The label to add to the transaction, limited to 500 characters. */
    label: string;
    /** Whether to overwrite the existing label, if it is present. */
    overwrite: boolean;
}

export interface LabelTransactionResponse {}

export interface FundPsbtRequest {
    /**
     * Use an existing PSBT packet as the template for the funded PSBT.
     *
     * The packet must contain at least one non-dust output. If one or more
     * inputs are specified, no coin selection is performed. In that case every
     * input must be an UTXO known to the wallet that has not been locked
     * before. The sum of all inputs must be sufficiently greater than the sum
     * of all outputs to pay a miner fee with the specified fee rate. A change
     * output is added to the PSBT if necessary.
     */
    psbt: Uint8Array | string | undefined;
    /** Use the outputs and optional inputs from this raw template. */
    raw: TxTemplate | undefined;
    /** The target number of blocks that the transaction should be confirmed in. */
    targetConf: number | undefined;
    /**
     * The fee rate, expressed in sat/vbyte, that should be used to spend the
     * input with.
     */
    satPerVbyte: string | undefined;
    /**
     * The name of the account to fund the PSBT with. If empty, the default wallet
     * account is used.
     */
    account: string;
    /**
     * The minimum number of confirmations each one of your outputs used for
     * the transaction must satisfy.
     */
    minConfs: number;
    /** Whether unconfirmed outputs should be used as inputs for the transaction. */
    spendUnconfirmed: boolean;
}

export interface FundPsbtResponse {
    /** The funded but not yet signed PSBT packet. */
    fundedPsbt: Uint8Array | string;
    /** The index of the added change output or -1 if no change was left over. */
    changeOutputIndex: number;
    /**
     * The list of lock leases that were acquired for the inputs in the funded PSBT
     * packet.
     */
    lockedUtxos: UtxoLease[];
}

export interface TxTemplate {
    /**
     * An optional list of inputs to use. Every input must be an UTXO known to the
     * wallet that has not been locked before. The sum of all inputs must be
     * sufficiently greater than the sum of all outputs to pay a miner fee with the
     * fee rate specified in the parent message.
     *
     * If no inputs are specified, coin selection will be performed instead and
     * inputs of sufficient value will be added to the resulting PSBT.
     */
    inputs: OutPoint[];
    /** A map of all addresses and the amounts to send to in the funded PSBT. */
    outputs: { [key: string]: string };
}

export interface TxTemplate_OutputsEntry {
    key: string;
    value: string;
}

export interface UtxoLease {
    /** A 32 byte random ID that identifies the lease. */
    id: Uint8Array | string;
    /** The identifying outpoint of the output being leased. */
    outpoint: OutPoint | undefined;
    /** The absolute expiration of the output lease represented as a unix timestamp. */
    expiration: string;
    /** The public key script of the leased output. */
    pkScript: Uint8Array | string;
    /** The value of the leased output in satoshis. */
    value: string;
}

export interface SignPsbtRequest {
    /**
     * The PSBT that should be signed. The PSBT must contain all required inputs,
     * outputs, UTXO data and custom fields required to identify the signing key.
     */
    fundedPsbt: Uint8Array | string;
}

export interface SignPsbtResponse {
    /** The signed transaction in PSBT format. */
    signedPsbt: Uint8Array | string;
}

export interface FinalizePsbtRequest {
    /**
     * A PSBT that should be signed and finalized. The PSBT must contain all
     * required inputs, outputs, UTXO data and partial signatures of all other
     * signers.
     */
    fundedPsbt: Uint8Array | string;
    /**
     * The name of the account to finalize the PSBT with. If empty, the default
     * wallet account is used.
     */
    account: string;
}

export interface FinalizePsbtResponse {
    /** The fully signed and finalized transaction in PSBT format. */
    signedPsbt: Uint8Array | string;
    /** The fully signed and finalized transaction in the raw wire format. */
    rawFinalTx: Uint8Array | string;
}

export interface ListLeasesRequest {}

export interface ListLeasesResponse {
    /** The list of currently leased utxos. */
    lockedUtxos: UtxoLease[];
}

/**
 * WalletKit is a service that gives access to the core functionalities of the
 * daemon's wallet.
 */
export interface WalletKit {
    /**
     * ListUnspent returns a list of all utxos spendable by the wallet with a
     * number of confirmations between the specified minimum and maximum. By
     * default, all utxos are listed. To list only the unconfirmed utxos, set
     * the unconfirmed_only to true.
     */
    listUnspent(
        request?: DeepPartial<ListUnspentRequest>
    ): Promise<ListUnspentResponse>;
    /**
     * LeaseOutput locks an output to the given ID, preventing it from being
     * available for any future coin selection attempts. The absolute time of the
     * lock's expiration is returned. The expiration of the lock can be extended by
     * successive invocations of this RPC. Outputs can be unlocked before their
     * expiration through `ReleaseOutput`.
     */
    leaseOutput(
        request?: DeepPartial<LeaseOutputRequest>
    ): Promise<LeaseOutputResponse>;
    /**
     * ReleaseOutput unlocks an output, allowing it to be available for coin
     * selection if it remains unspent. The ID should match the one used to
     * originally lock the output.
     */
    releaseOutput(
        request?: DeepPartial<ReleaseOutputRequest>
    ): Promise<ReleaseOutputResponse>;
    /** ListLeases lists all currently locked utxos. */
    listLeases(
        request?: DeepPartial<ListLeasesRequest>
    ): Promise<ListLeasesResponse>;
    /**
     * DeriveNextKey attempts to derive the *next* key within the key family
     * (account in BIP43) specified. This method should return the next external
     * child within this branch.
     */
    deriveNextKey(request?: DeepPartial<KeyReq>): Promise<KeyDescriptor>;
    /**
     * DeriveKey attempts to derive an arbitrary key specified by the passed
     * KeyLocator.
     */
    deriveKey(request?: DeepPartial<KeyLocator>): Promise<KeyDescriptor>;
    /** NextAddr returns the next unused address within the wallet. */
    nextAddr(request?: DeepPartial<AddrRequest>): Promise<AddrResponse>;
    /**
     * ListAccounts retrieves all accounts belonging to the wallet by default. A
     * name and key scope filter can be provided to filter through all of the
     * wallet accounts and return only those matching.
     */
    listAccounts(
        request?: DeepPartial<ListAccountsRequest>
    ): Promise<ListAccountsResponse>;
    /**
     * RequiredReserve returns the minimum amount of satoshis that should be kept
     * in the wallet in order to fee bump anchor channels if necessary. The value
     * scales with the number of public anchor channels but is capped at a maximum.
     */
    requiredReserve(
        request?: DeepPartial<RequiredReserveRequest>
    ): Promise<RequiredReserveResponse>;
    /**
     * ImportAccount imports an account backed by an account extended public key.
     * The master key fingerprint denotes the fingerprint of the root key
     * corresponding to the account public key (also known as the key with
     * derivation path m/). This may be required by some hardware wallets for
     * proper identification and signing.
     *
     * The address type can usually be inferred from the key's version, but may be
     * required for certain keys to map them into the proper scope.
     *
     * For BIP-0044 keys, an address type must be specified as we intend to not
     * support importing BIP-0044 keys into the wallet using the legacy
     * pay-to-pubkey-hash (P2PKH) scheme. A nested witness address type will force
     * the standard BIP-0049 derivation scheme, while a witness address type will
     * force the standard BIP-0084 derivation scheme.
     *
     * For BIP-0049 keys, an address type must also be specified to make a
     * distinction between the standard BIP-0049 address schema (nested witness
     * pubkeys everywhere) and our own BIP-0049Plus address schema (nested pubkeys
     * externally, witness pubkeys internally).
     *
     * NOTE: Events (deposits/spends) for keys derived from an account will only be
     * detected by lnd if they happen after the import. Rescans to detect past
     * events will be supported later on.
     */
    importAccount(
        request?: DeepPartial<ImportAccountRequest>
    ): Promise<ImportAccountResponse>;
    /**
     * ImportPublicKey imports a public key as watch-only into the wallet.
     *
     * NOTE: Events (deposits/spends) for a key will only be detected by lnd if
     * they happen after the import. Rescans to detect past events will be
     * supported later on.
     */
    importPublicKey(
        request?: DeepPartial<ImportPublicKeyRequest>
    ): Promise<ImportPublicKeyResponse>;
    /**
     * PublishTransaction attempts to publish the passed transaction to the
     * network. Once this returns without an error, the wallet will continually
     * attempt to re-broadcast the transaction on start up, until it enters the
     * chain.
     */
    publishTransaction(
        request?: DeepPartial<Transaction>
    ): Promise<PublishResponse>;
    /**
     * SendOutputs is similar to the existing sendmany call in Bitcoind, and
     * allows the caller to create a transaction that sends to several outputs at
     * once. This is ideal when wanting to batch create a set of transactions.
     */
    sendOutputs(
        request?: DeepPartial<SendOutputsRequest>
    ): Promise<SendOutputsResponse>;
    /**
     * EstimateFee attempts to query the internal fee estimator of the wallet to
     * determine the fee (in sat/kw) to attach to a transaction in order to
     * achieve the confirmation target.
     */
    estimateFee(
        request?: DeepPartial<EstimateFeeRequest>
    ): Promise<EstimateFeeResponse>;
    /**
     * PendingSweeps returns lists of on-chain outputs that lnd is currently
     * attempting to sweep within its central batching engine. Outputs with similar
     * fee rates are batched together in order to sweep them within a single
     * transaction.
     *
     * NOTE: Some of the fields within PendingSweepsRequest are not guaranteed to
     * remain supported. This is an advanced API that depends on the internals of
     * the UtxoSweeper, so things may change.
     */
    pendingSweeps(
        request?: DeepPartial<PendingSweepsRequest>
    ): Promise<PendingSweepsResponse>;
    /**
     * BumpFee bumps the fee of an arbitrary input within a transaction. This RPC
     * takes a different approach than bitcoind's bumpfee command. lnd has a
     * central batching engine in which inputs with similar fee rates are batched
     * together to save on transaction fees. Due to this, we cannot rely on
     * bumping the fee on a specific transaction, since transactions can change at
     * any point with the addition of new inputs. The list of inputs that
     * currently exist within lnd's central batching engine can be retrieved
     * through the PendingSweeps RPC.
     *
     * When bumping the fee of an input that currently exists within lnd's central
     * batching engine, a higher fee transaction will be created that replaces the
     * lower fee transaction through the Replace-By-Fee (RBF) policy. If it
     *
     * This RPC also serves useful when wanting to perform a Child-Pays-For-Parent
     * (CPFP), where the child transaction pays for its parent's fee. This can be
     * done by specifying an outpoint within the low fee transaction that is under
     * the control of the wallet.
     *
     * The fee preference can be expressed either as a specific fee rate or a delta
     * of blocks in which the output should be swept on-chain within. If a fee
     * preference is not explicitly specified, then an error is returned.
     *
     * Note that this RPC currently doesn't perform any validation checks on the
     * fee preference being provided. For now, the responsibility of ensuring that
     * the new fee preference is sufficient is delegated to the user.
     */
    bumpFee(request?: DeepPartial<BumpFeeRequest>): Promise<BumpFeeResponse>;
    /**
     * ListSweeps returns a list of the sweep transactions our node has produced.
     * Note that these sweeps may not be confirmed yet, as we record sweeps on
     * broadcast, not confirmation.
     */
    listSweeps(
        request?: DeepPartial<ListSweepsRequest>
    ): Promise<ListSweepsResponse>;
    /**
     * LabelTransaction adds a label to a transaction. If the transaction already
     * has a label the call will fail unless the overwrite bool is set. This will
     * overwrite the exiting transaction label. Labels must not be empty, and
     * cannot exceed 500 characters.
     */
    labelTransaction(
        request?: DeepPartial<LabelTransactionRequest>
    ): Promise<LabelTransactionResponse>;
    /**
     * FundPsbt creates a fully populated PSBT that contains enough inputs to fund
     * the outputs specified in the template. There are two ways of specifying a
     * template: Either by passing in a PSBT with at least one output declared or
     * by passing in a raw TxTemplate message.
     *
     * If there are no inputs specified in the template, coin selection is
     * performed automatically. If the template does contain any inputs, it is
     * assumed that full coin selection happened externally and no additional
     * inputs are added. If the specified inputs aren't enough to fund the outputs
     * with the given fee rate, an error is returned.
     *
     * After either selecting or verifying the inputs, all input UTXOs are locked
     * with an internal app ID.
     *
     * NOTE: If this method returns without an error, it is the caller's
     * responsibility to either spend the locked UTXOs (by finalizing and then
     * publishing the transaction) or to unlock/release the locked UTXOs in case of
     * an error on the caller's side.
     */
    fundPsbt(request?: DeepPartial<FundPsbtRequest>): Promise<FundPsbtResponse>;
    /**
     * SignPsbt expects a partial transaction with all inputs and outputs fully
     * declared and tries to sign all unsigned inputs that have all required fields
     * (UTXO information, BIP32 derivation information, witness or sig scripts)
     * set.
     * If no error is returned, the PSBT is ready to be given to the next signer or
     * to be finalized if lnd was the last signer.
     *
     * NOTE: This RPC only signs inputs (and only those it can sign), it does not
     * perform any other tasks (such as coin selection, UTXO locking or
     * input/output/fee value validation, PSBT finalization). Any input that is
     * incomplete will be skipped.
     */
    signPsbt(request?: DeepPartial<SignPsbtRequest>): Promise<SignPsbtResponse>;
    /**
     * FinalizePsbt expects a partial transaction with all inputs and outputs fully
     * declared and tries to sign all inputs that belong to the wallet. Lnd must be
     * the last signer of the transaction. That means, if there are any unsigned
     * non-witness inputs or inputs without UTXO information attached or inputs
     * without witness data that do not belong to lnd's wallet, this method will
     * fail. If no error is returned, the PSBT is ready to be extracted and the
     * final TX within to be broadcast.
     *
     * NOTE: This method does NOT publish the transaction once finalized. It is the
     * caller's responsibility to either publish the transaction on success or
     * unlock/release any locked UTXOs in case of an error in this method.
     */
    finalizePsbt(
        request?: DeepPartial<FinalizePsbtRequest>
    ): Promise<FinalizePsbtResponse>;
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

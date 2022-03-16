// package: walletrpc
// file: walletrpc/walletkit.proto

import * as jspb from 'google-protobuf';
import * as lightning_pb from '../lightning_pb';
import * as signrpc_signer_pb from '../signrpc/signer_pb';

export class ListUnspentRequest extends jspb.Message {
    getMinConfs(): number;
    setMinConfs(value: number): void;

    getMaxConfs(): number;
    setMaxConfs(value: number): void;

    getAccount(): string;
    setAccount(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUnspentRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListUnspentRequest
    ): ListUnspentRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListUnspentRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListUnspentRequest;
    static deserializeBinaryFromReader(
        message: ListUnspentRequest,
        reader: jspb.BinaryReader
    ): ListUnspentRequest;
}

export namespace ListUnspentRequest {
    export type AsObject = {
        minConfs: number;
        maxConfs: number;
        account: string;
    };
}

export class ListUnspentResponse extends jspb.Message {
    clearUtxosList(): void;
    getUtxosList(): Array<lightning_pb.Utxo>;
    setUtxosList(value: Array<lightning_pb.Utxo>): void;
    addUtxos(value?: lightning_pb.Utxo, index?: number): lightning_pb.Utxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUnspentResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListUnspentResponse
    ): ListUnspentResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListUnspentResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListUnspentResponse;
    static deserializeBinaryFromReader(
        message: ListUnspentResponse,
        reader: jspb.BinaryReader
    ): ListUnspentResponse;
}

export namespace ListUnspentResponse {
    export type AsObject = {
        utxos: Array<lightning_pb.Utxo.AsObject>;
    };
}

export class LeaseOutputRequest extends jspb.Message {
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): void;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): lightning_pb.OutPoint | undefined;
    setOutpoint(value?: lightning_pb.OutPoint): void;

    getExpirationSeconds(): number;
    setExpirationSeconds(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LeaseOutputRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: LeaseOutputRequest
    ): LeaseOutputRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: LeaseOutputRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): LeaseOutputRequest;
    static deserializeBinaryFromReader(
        message: LeaseOutputRequest,
        reader: jspb.BinaryReader
    ): LeaseOutputRequest;
}

export namespace LeaseOutputRequest {
    export type AsObject = {
        id: Uint8Array | string;
        outpoint?: lightning_pb.OutPoint.AsObject;
        expirationSeconds: number;
    };
}

export class LeaseOutputResponse extends jspb.Message {
    getExpiration(): number;
    setExpiration(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LeaseOutputResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: LeaseOutputResponse
    ): LeaseOutputResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: LeaseOutputResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): LeaseOutputResponse;
    static deserializeBinaryFromReader(
        message: LeaseOutputResponse,
        reader: jspb.BinaryReader
    ): LeaseOutputResponse;
}

export namespace LeaseOutputResponse {
    export type AsObject = {
        expiration: number;
    };
}

export class ReleaseOutputRequest extends jspb.Message {
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): void;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): lightning_pb.OutPoint | undefined;
    setOutpoint(value?: lightning_pb.OutPoint): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReleaseOutputRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ReleaseOutputRequest
    ): ReleaseOutputRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ReleaseOutputRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ReleaseOutputRequest;
    static deserializeBinaryFromReader(
        message: ReleaseOutputRequest,
        reader: jspb.BinaryReader
    ): ReleaseOutputRequest;
}

export namespace ReleaseOutputRequest {
    export type AsObject = {
        id: Uint8Array | string;
        outpoint?: lightning_pb.OutPoint.AsObject;
    };
}

export class ReleaseOutputResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReleaseOutputResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ReleaseOutputResponse
    ): ReleaseOutputResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ReleaseOutputResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ReleaseOutputResponse;
    static deserializeBinaryFromReader(
        message: ReleaseOutputResponse,
        reader: jspb.BinaryReader
    ): ReleaseOutputResponse;
}

export namespace ReleaseOutputResponse {
    export type AsObject = {};
}

export class KeyReq extends jspb.Message {
    getKeyFingerPrint(): number;
    setKeyFingerPrint(value: number): void;

    getKeyFamily(): number;
    setKeyFamily(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyReq.AsObject;
    static toObject(includeInstance: boolean, msg: KeyReq): KeyReq.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: KeyReq,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): KeyReq;
    static deserializeBinaryFromReader(
        message: KeyReq,
        reader: jspb.BinaryReader
    ): KeyReq;
}

export namespace KeyReq {
    export type AsObject = {
        keyFingerPrint: number;
        keyFamily: number;
    };
}

export class AddrRequest extends jspb.Message {
    getAccount(): string;
    setAccount(value: string): void;

    getType(): AddressTypeMap[keyof AddressTypeMap];
    setType(value: AddressTypeMap[keyof AddressTypeMap]): void;

    getChange(): boolean;
    setChange(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddrRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: AddrRequest
    ): AddrRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: AddrRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): AddrRequest;
    static deserializeBinaryFromReader(
        message: AddrRequest,
        reader: jspb.BinaryReader
    ): AddrRequest;
}

export namespace AddrRequest {
    export type AsObject = {
        account: string;
        type: AddressTypeMap[keyof AddressTypeMap];
        change: boolean;
    };
}

export class AddrResponse extends jspb.Message {
    getAddr(): string;
    setAddr(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddrResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: AddrResponse
    ): AddrResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: AddrResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): AddrResponse;
    static deserializeBinaryFromReader(
        message: AddrResponse,
        reader: jspb.BinaryReader
    ): AddrResponse;
}

export namespace AddrResponse {
    export type AsObject = {
        addr: string;
    };
}

export class Account extends jspb.Message {
    getName(): string;
    setName(value: string): void;

    getAddressType(): AddressTypeMap[keyof AddressTypeMap];
    setAddressType(value: AddressTypeMap[keyof AddressTypeMap]): void;

    getExtendedPublicKey(): string;
    setExtendedPublicKey(value: string): void;

    getMasterKeyFingerprint(): Uint8Array | string;
    getMasterKeyFingerprint_asU8(): Uint8Array;
    getMasterKeyFingerprint_asB64(): string;
    setMasterKeyFingerprint(value: Uint8Array | string): void;

    getDerivationPath(): string;
    setDerivationPath(value: string): void;

    getExternalKeyCount(): number;
    setExternalKeyCount(value: number): void;

    getInternalKeyCount(): number;
    setInternalKeyCount(value: number): void;

    getWatchOnly(): boolean;
    setWatchOnly(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Account.AsObject;
    static toObject(includeInstance: boolean, msg: Account): Account.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: Account,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): Account;
    static deserializeBinaryFromReader(
        message: Account,
        reader: jspb.BinaryReader
    ): Account;
}

export namespace Account {
    export type AsObject = {
        name: string;
        addressType: AddressTypeMap[keyof AddressTypeMap];
        extendedPublicKey: string;
        masterKeyFingerprint: Uint8Array | string;
        derivationPath: string;
        externalKeyCount: number;
        internalKeyCount: number;
        watchOnly: boolean;
    };
}

export class ListAccountsRequest extends jspb.Message {
    getName(): string;
    setName(value: string): void;

    getAddressType(): AddressTypeMap[keyof AddressTypeMap];
    setAddressType(value: AddressTypeMap[keyof AddressTypeMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAccountsRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListAccountsRequest
    ): ListAccountsRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListAccountsRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListAccountsRequest;
    static deserializeBinaryFromReader(
        message: ListAccountsRequest,
        reader: jspb.BinaryReader
    ): ListAccountsRequest;
}

export namespace ListAccountsRequest {
    export type AsObject = {
        name: string;
        addressType: AddressTypeMap[keyof AddressTypeMap];
    };
}

export class ListAccountsResponse extends jspb.Message {
    clearAccountsList(): void;
    getAccountsList(): Array<Account>;
    setAccountsList(value: Array<Account>): void;
    addAccounts(value?: Account, index?: number): Account;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAccountsResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListAccountsResponse
    ): ListAccountsResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListAccountsResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListAccountsResponse;
    static deserializeBinaryFromReader(
        message: ListAccountsResponse,
        reader: jspb.BinaryReader
    ): ListAccountsResponse;
}

export namespace ListAccountsResponse {
    export type AsObject = {
        accounts: Array<Account.AsObject>;
    };
}

export class ImportAccountRequest extends jspb.Message {
    getName(): string;
    setName(value: string): void;

    getExtendedPublicKey(): string;
    setExtendedPublicKey(value: string): void;

    getMasterKeyFingerprint(): Uint8Array | string;
    getMasterKeyFingerprint_asU8(): Uint8Array;
    getMasterKeyFingerprint_asB64(): string;
    setMasterKeyFingerprint(value: Uint8Array | string): void;

    getAddressType(): AddressTypeMap[keyof AddressTypeMap];
    setAddressType(value: AddressTypeMap[keyof AddressTypeMap]): void;

    getDryRun(): boolean;
    setDryRun(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportAccountRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ImportAccountRequest
    ): ImportAccountRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ImportAccountRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ImportAccountRequest;
    static deserializeBinaryFromReader(
        message: ImportAccountRequest,
        reader: jspb.BinaryReader
    ): ImportAccountRequest;
}

export namespace ImportAccountRequest {
    export type AsObject = {
        name: string;
        extendedPublicKey: string;
        masterKeyFingerprint: Uint8Array | string;
        addressType: AddressTypeMap[keyof AddressTypeMap];
        dryRun: boolean;
    };
}

export class ImportAccountResponse extends jspb.Message {
    hasAccount(): boolean;
    clearAccount(): void;
    getAccount(): Account | undefined;
    setAccount(value?: Account): void;

    clearDryRunExternalAddrsList(): void;
    getDryRunExternalAddrsList(): Array<string>;
    setDryRunExternalAddrsList(value: Array<string>): void;
    addDryRunExternalAddrs(value: string, index?: number): string;

    clearDryRunInternalAddrsList(): void;
    getDryRunInternalAddrsList(): Array<string>;
    setDryRunInternalAddrsList(value: Array<string>): void;
    addDryRunInternalAddrs(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportAccountResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ImportAccountResponse
    ): ImportAccountResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ImportAccountResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ImportAccountResponse;
    static deserializeBinaryFromReader(
        message: ImportAccountResponse,
        reader: jspb.BinaryReader
    ): ImportAccountResponse;
}

export namespace ImportAccountResponse {
    export type AsObject = {
        account?: Account.AsObject;
        dryRunExternalAddrs: Array<string>;
        dryRunInternalAddrs: Array<string>;
    };
}

export class ImportPublicKeyRequest extends jspb.Message {
    getPublicKey(): Uint8Array | string;
    getPublicKey_asU8(): Uint8Array;
    getPublicKey_asB64(): string;
    setPublicKey(value: Uint8Array | string): void;

    getAddressType(): AddressTypeMap[keyof AddressTypeMap];
    setAddressType(value: AddressTypeMap[keyof AddressTypeMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportPublicKeyRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ImportPublicKeyRequest
    ): ImportPublicKeyRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ImportPublicKeyRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ImportPublicKeyRequest;
    static deserializeBinaryFromReader(
        message: ImportPublicKeyRequest,
        reader: jspb.BinaryReader
    ): ImportPublicKeyRequest;
}

export namespace ImportPublicKeyRequest {
    export type AsObject = {
        publicKey: Uint8Array | string;
        addressType: AddressTypeMap[keyof AddressTypeMap];
    };
}

export class ImportPublicKeyResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportPublicKeyResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ImportPublicKeyResponse
    ): ImportPublicKeyResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ImportPublicKeyResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ImportPublicKeyResponse;
    static deserializeBinaryFromReader(
        message: ImportPublicKeyResponse,
        reader: jspb.BinaryReader
    ): ImportPublicKeyResponse;
}

export namespace ImportPublicKeyResponse {
    export type AsObject = {};
}

export class Transaction extends jspb.Message {
    getTxHex(): Uint8Array | string;
    getTxHex_asU8(): Uint8Array;
    getTxHex_asB64(): string;
    setTxHex(value: Uint8Array | string): void;

    getLabel(): string;
    setLabel(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Transaction.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: Transaction
    ): Transaction.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: Transaction,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): Transaction;
    static deserializeBinaryFromReader(
        message: Transaction,
        reader: jspb.BinaryReader
    ): Transaction;
}

export namespace Transaction {
    export type AsObject = {
        txHex: Uint8Array | string;
        label: string;
    };
}

export class PublishResponse extends jspb.Message {
    getPublishError(): string;
    setPublishError(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PublishResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PublishResponse
    ): PublishResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PublishResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PublishResponse;
    static deserializeBinaryFromReader(
        message: PublishResponse,
        reader: jspb.BinaryReader
    ): PublishResponse;
}

export namespace PublishResponse {
    export type AsObject = {
        publishError: string;
    };
}

export class SendOutputsRequest extends jspb.Message {
    getSatPerKw(): number;
    setSatPerKw(value: number): void;

    clearOutputsList(): void;
    getOutputsList(): Array<signrpc_signer_pb.TxOut>;
    setOutputsList(value: Array<signrpc_signer_pb.TxOut>): void;
    addOutputs(
        value?: signrpc_signer_pb.TxOut,
        index?: number
    ): signrpc_signer_pb.TxOut;

    getLabel(): string;
    setLabel(value: string): void;

    getMinConfs(): number;
    setMinConfs(value: number): void;

    getSpendUnconfirmed(): boolean;
    setSpendUnconfirmed(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOutputsRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: SendOutputsRequest
    ): SendOutputsRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: SendOutputsRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): SendOutputsRequest;
    static deserializeBinaryFromReader(
        message: SendOutputsRequest,
        reader: jspb.BinaryReader
    ): SendOutputsRequest;
}

export namespace SendOutputsRequest {
    export type AsObject = {
        satPerKw: number;
        outputs: Array<signrpc_signer_pb.TxOut.AsObject>;
        label: string;
        minConfs: number;
        spendUnconfirmed: boolean;
    };
}

export class SendOutputsResponse extends jspb.Message {
    getRawTx(): Uint8Array | string;
    getRawTx_asU8(): Uint8Array;
    getRawTx_asB64(): string;
    setRawTx(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOutputsResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: SendOutputsResponse
    ): SendOutputsResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: SendOutputsResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): SendOutputsResponse;
    static deserializeBinaryFromReader(
        message: SendOutputsResponse,
        reader: jspb.BinaryReader
    ): SendOutputsResponse;
}

export namespace SendOutputsResponse {
    export type AsObject = {
        rawTx: Uint8Array | string;
    };
}

export class EstimateFeeRequest extends jspb.Message {
    getConfTarget(): number;
    setConfTarget(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EstimateFeeRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: EstimateFeeRequest
    ): EstimateFeeRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: EstimateFeeRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): EstimateFeeRequest;
    static deserializeBinaryFromReader(
        message: EstimateFeeRequest,
        reader: jspb.BinaryReader
    ): EstimateFeeRequest;
}

export namespace EstimateFeeRequest {
    export type AsObject = {
        confTarget: number;
    };
}

export class EstimateFeeResponse extends jspb.Message {
    getSatPerKw(): number;
    setSatPerKw(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EstimateFeeResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: EstimateFeeResponse
    ): EstimateFeeResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: EstimateFeeResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): EstimateFeeResponse;
    static deserializeBinaryFromReader(
        message: EstimateFeeResponse,
        reader: jspb.BinaryReader
    ): EstimateFeeResponse;
}

export namespace EstimateFeeResponse {
    export type AsObject = {
        satPerKw: number;
    };
}

export class PendingSweep extends jspb.Message {
    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): lightning_pb.OutPoint | undefined;
    setOutpoint(value?: lightning_pb.OutPoint): void;

    getWitnessType(): WitnessTypeMap[keyof WitnessTypeMap];
    setWitnessType(value: WitnessTypeMap[keyof WitnessTypeMap]): void;

    getAmountSat(): number;
    setAmountSat(value: number): void;

    getSatPerByte(): number;
    setSatPerByte(value: number): void;

    getBroadcastAttempts(): number;
    setBroadcastAttempts(value: number): void;

    getNextBroadcastHeight(): number;
    setNextBroadcastHeight(value: number): void;

    getRequestedConfTarget(): number;
    setRequestedConfTarget(value: number): void;

    getRequestedSatPerByte(): number;
    setRequestedSatPerByte(value: number): void;

    getSatPerVbyte(): number;
    setSatPerVbyte(value: number): void;

    getRequestedSatPerVbyte(): number;
    setRequestedSatPerVbyte(value: number): void;

    getForce(): boolean;
    setForce(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PendingSweep.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PendingSweep
    ): PendingSweep.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PendingSweep,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PendingSweep;
    static deserializeBinaryFromReader(
        message: PendingSweep,
        reader: jspb.BinaryReader
    ): PendingSweep;
}

export namespace PendingSweep {
    export type AsObject = {
        outpoint?: lightning_pb.OutPoint.AsObject;
        witnessType: WitnessTypeMap[keyof WitnessTypeMap];
        amountSat: number;
        satPerByte: number;
        broadcastAttempts: number;
        nextBroadcastHeight: number;
        requestedConfTarget: number;
        requestedSatPerByte: number;
        satPerVbyte: number;
        requestedSatPerVbyte: number;
        force: boolean;
    };
}

export class PendingSweepsRequest extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PendingSweepsRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PendingSweepsRequest
    ): PendingSweepsRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PendingSweepsRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PendingSweepsRequest;
    static deserializeBinaryFromReader(
        message: PendingSweepsRequest,
        reader: jspb.BinaryReader
    ): PendingSweepsRequest;
}

export namespace PendingSweepsRequest {
    export type AsObject = {};
}

export class PendingSweepsResponse extends jspb.Message {
    clearPendingSweepsList(): void;
    getPendingSweepsList(): Array<PendingSweep>;
    setPendingSweepsList(value: Array<PendingSweep>): void;
    addPendingSweeps(value?: PendingSweep, index?: number): PendingSweep;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PendingSweepsResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PendingSweepsResponse
    ): PendingSweepsResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PendingSweepsResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PendingSweepsResponse;
    static deserializeBinaryFromReader(
        message: PendingSweepsResponse,
        reader: jspb.BinaryReader
    ): PendingSweepsResponse;
}

export namespace PendingSweepsResponse {
    export type AsObject = {
        pendingSweeps: Array<PendingSweep.AsObject>;
    };
}

export class BumpFeeRequest extends jspb.Message {
    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): lightning_pb.OutPoint | undefined;
    setOutpoint(value?: lightning_pb.OutPoint): void;

    getTargetConf(): number;
    setTargetConf(value: number): void;

    getSatPerByte(): number;
    setSatPerByte(value: number): void;

    getForce(): boolean;
    setForce(value: boolean): void;

    getSatPerVbyte(): number;
    setSatPerVbyte(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BumpFeeRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: BumpFeeRequest
    ): BumpFeeRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: BumpFeeRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): BumpFeeRequest;
    static deserializeBinaryFromReader(
        message: BumpFeeRequest,
        reader: jspb.BinaryReader
    ): BumpFeeRequest;
}

export namespace BumpFeeRequest {
    export type AsObject = {
        outpoint?: lightning_pb.OutPoint.AsObject;
        targetConf: number;
        satPerByte: number;
        force: boolean;
        satPerVbyte: number;
    };
}

export class BumpFeeResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BumpFeeResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: BumpFeeResponse
    ): BumpFeeResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: BumpFeeResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): BumpFeeResponse;
    static deserializeBinaryFromReader(
        message: BumpFeeResponse,
        reader: jspb.BinaryReader
    ): BumpFeeResponse;
}

export namespace BumpFeeResponse {
    export type AsObject = {};
}

export class ListSweepsRequest extends jspb.Message {
    getVerbose(): boolean;
    setVerbose(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSweepsRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListSweepsRequest
    ): ListSweepsRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListSweepsRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListSweepsRequest;
    static deserializeBinaryFromReader(
        message: ListSweepsRequest,
        reader: jspb.BinaryReader
    ): ListSweepsRequest;
}

export namespace ListSweepsRequest {
    export type AsObject = {
        verbose: boolean;
    };
}

export class ListSweepsResponse extends jspb.Message {
    hasTransactionDetails(): boolean;
    clearTransactionDetails(): void;
    getTransactionDetails(): lightning_pb.TransactionDetails | undefined;
    setTransactionDetails(value?: lightning_pb.TransactionDetails): void;

    hasTransactionIds(): boolean;
    clearTransactionIds(): void;
    getTransactionIds(): ListSweepsResponse.TransactionIDs | undefined;
    setTransactionIds(value?: ListSweepsResponse.TransactionIDs): void;

    getSweepsCase(): ListSweepsResponse.SweepsCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSweepsResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListSweepsResponse
    ): ListSweepsResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListSweepsResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListSweepsResponse;
    static deserializeBinaryFromReader(
        message: ListSweepsResponse,
        reader: jspb.BinaryReader
    ): ListSweepsResponse;
}

export namespace ListSweepsResponse {
    export type AsObject = {
        transactionDetails?: lightning_pb.TransactionDetails.AsObject;
        transactionIds?: ListSweepsResponse.TransactionIDs.AsObject;
    };

    export class TransactionIDs extends jspb.Message {
        clearTransactionIdsList(): void;
        getTransactionIdsList(): Array<string>;
        setTransactionIdsList(value: Array<string>): void;
        addTransactionIds(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): TransactionIDs.AsObject;
        static toObject(
            includeInstance: boolean,
            msg: TransactionIDs
        ): TransactionIDs.AsObject;
        static extensions: {
            [key: number]: jspb.ExtensionFieldInfo<jspb.Message>;
        };
        static extensionsBinary: {
            [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
        };
        static serializeBinaryToWriter(
            message: TransactionIDs,
            writer: jspb.BinaryWriter
        ): void;
        static deserializeBinary(bytes: Uint8Array): TransactionIDs;
        static deserializeBinaryFromReader(
            message: TransactionIDs,
            reader: jspb.BinaryReader
        ): TransactionIDs;
    }

    export namespace TransactionIDs {
        export type AsObject = {
            transactionIds: Array<string>;
        };
    }

    export enum SweepsCase {
        SWEEPS_NOT_SET = 0,
        TRANSACTION_DETAILS = 1,
        TRANSACTION_IDS = 2
    }
}

export class LabelTransactionRequest extends jspb.Message {
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): void;

    getLabel(): string;
    setLabel(value: string): void;

    getOverwrite(): boolean;
    setOverwrite(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LabelTransactionRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: LabelTransactionRequest
    ): LabelTransactionRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: LabelTransactionRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): LabelTransactionRequest;
    static deserializeBinaryFromReader(
        message: LabelTransactionRequest,
        reader: jspb.BinaryReader
    ): LabelTransactionRequest;
}

export namespace LabelTransactionRequest {
    export type AsObject = {
        txid: Uint8Array | string;
        label: string;
        overwrite: boolean;
    };
}

export class LabelTransactionResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LabelTransactionResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: LabelTransactionResponse
    ): LabelTransactionResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: LabelTransactionResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): LabelTransactionResponse;
    static deserializeBinaryFromReader(
        message: LabelTransactionResponse,
        reader: jspb.BinaryReader
    ): LabelTransactionResponse;
}

export namespace LabelTransactionResponse {
    export type AsObject = {};
}

export class FundPsbtRequest extends jspb.Message {
    hasPsbt(): boolean;
    clearPsbt(): void;
    getPsbt(): Uint8Array | string;
    getPsbt_asU8(): Uint8Array;
    getPsbt_asB64(): string;
    setPsbt(value: Uint8Array | string): void;

    hasRaw(): boolean;
    clearRaw(): void;
    getRaw(): TxTemplate | undefined;
    setRaw(value?: TxTemplate): void;

    hasTargetConf(): boolean;
    clearTargetConf(): void;
    getTargetConf(): number;
    setTargetConf(value: number): void;

    hasSatPerVbyte(): boolean;
    clearSatPerVbyte(): void;
    getSatPerVbyte(): number;
    setSatPerVbyte(value: number): void;

    getAccount(): string;
    setAccount(value: string): void;

    getMinConfs(): number;
    setMinConfs(value: number): void;

    getSpendUnconfirmed(): boolean;
    setSpendUnconfirmed(value: boolean): void;

    getTemplateCase(): FundPsbtRequest.TemplateCase;
    getFeesCase(): FundPsbtRequest.FeesCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundPsbtRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: FundPsbtRequest
    ): FundPsbtRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: FundPsbtRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): FundPsbtRequest;
    static deserializeBinaryFromReader(
        message: FundPsbtRequest,
        reader: jspb.BinaryReader
    ): FundPsbtRequest;
}

export namespace FundPsbtRequest {
    export type AsObject = {
        psbt: Uint8Array | string;
        raw?: TxTemplate.AsObject;
        targetConf: number;
        satPerVbyte: number;
        account: string;
        minConfs: number;
        spendUnconfirmed: boolean;
    };

    export enum TemplateCase {
        TEMPLATE_NOT_SET = 0,
        PSBT = 1,
        RAW = 2
    }

    export enum FeesCase {
        FEES_NOT_SET = 0,
        TARGET_CONF = 3,
        SAT_PER_VBYTE = 4
    }
}

export class FundPsbtResponse extends jspb.Message {
    getFundedPsbt(): Uint8Array | string;
    getFundedPsbt_asU8(): Uint8Array;
    getFundedPsbt_asB64(): string;
    setFundedPsbt(value: Uint8Array | string): void;

    getChangeOutputIndex(): number;
    setChangeOutputIndex(value: number): void;

    clearLockedUtxosList(): void;
    getLockedUtxosList(): Array<UtxoLease>;
    setLockedUtxosList(value: Array<UtxoLease>): void;
    addLockedUtxos(value?: UtxoLease, index?: number): UtxoLease;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundPsbtResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: FundPsbtResponse
    ): FundPsbtResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: FundPsbtResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): FundPsbtResponse;
    static deserializeBinaryFromReader(
        message: FundPsbtResponse,
        reader: jspb.BinaryReader
    ): FundPsbtResponse;
}

export namespace FundPsbtResponse {
    export type AsObject = {
        fundedPsbt: Uint8Array | string;
        changeOutputIndex: number;
        lockedUtxos: Array<UtxoLease.AsObject>;
    };
}

export class TxTemplate extends jspb.Message {
    clearInputsList(): void;
    getInputsList(): Array<lightning_pb.OutPoint>;
    setInputsList(value: Array<lightning_pb.OutPoint>): void;
    addInputs(
        value?: lightning_pb.OutPoint,
        index?: number
    ): lightning_pb.OutPoint;

    getOutputsMap(): jspb.Map<string, number>;
    clearOutputsMap(): void;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxTemplate.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: TxTemplate
    ): TxTemplate.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: TxTemplate,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): TxTemplate;
    static deserializeBinaryFromReader(
        message: TxTemplate,
        reader: jspb.BinaryReader
    ): TxTemplate;
}

export namespace TxTemplate {
    export type AsObject = {
        inputs: Array<lightning_pb.OutPoint.AsObject>;
        outputs: Array<[string, number]>;
    };
}

export class UtxoLease extends jspb.Message {
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): void;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): lightning_pb.OutPoint | undefined;
    setOutpoint(value?: lightning_pb.OutPoint): void;

    getExpiration(): number;
    setExpiration(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxoLease.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: UtxoLease
    ): UtxoLease.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: UtxoLease,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): UtxoLease;
    static deserializeBinaryFromReader(
        message: UtxoLease,
        reader: jspb.BinaryReader
    ): UtxoLease;
}

export namespace UtxoLease {
    export type AsObject = {
        id: Uint8Array | string;
        outpoint?: lightning_pb.OutPoint.AsObject;
        expiration: number;
    };
}

export class SignPsbtRequest extends jspb.Message {
    getFundedPsbt(): Uint8Array | string;
    getFundedPsbt_asU8(): Uint8Array;
    getFundedPsbt_asB64(): string;
    setFundedPsbt(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignPsbtRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: SignPsbtRequest
    ): SignPsbtRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: SignPsbtRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): SignPsbtRequest;
    static deserializeBinaryFromReader(
        message: SignPsbtRequest,
        reader: jspb.BinaryReader
    ): SignPsbtRequest;
}

export namespace SignPsbtRequest {
    export type AsObject = {
        fundedPsbt: Uint8Array | string;
    };
}

export class SignPsbtResponse extends jspb.Message {
    getSignedPsbt(): Uint8Array | string;
    getSignedPsbt_asU8(): Uint8Array;
    getSignedPsbt_asB64(): string;
    setSignedPsbt(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignPsbtResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: SignPsbtResponse
    ): SignPsbtResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: SignPsbtResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): SignPsbtResponse;
    static deserializeBinaryFromReader(
        message: SignPsbtResponse,
        reader: jspb.BinaryReader
    ): SignPsbtResponse;
}

export namespace SignPsbtResponse {
    export type AsObject = {
        signedPsbt: Uint8Array | string;
    };
}

export class FinalizePsbtRequest extends jspb.Message {
    getFundedPsbt(): Uint8Array | string;
    getFundedPsbt_asU8(): Uint8Array;
    getFundedPsbt_asB64(): string;
    setFundedPsbt(value: Uint8Array | string): void;

    getAccount(): string;
    setAccount(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FinalizePsbtRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: FinalizePsbtRequest
    ): FinalizePsbtRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: FinalizePsbtRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): FinalizePsbtRequest;
    static deserializeBinaryFromReader(
        message: FinalizePsbtRequest,
        reader: jspb.BinaryReader
    ): FinalizePsbtRequest;
}

export namespace FinalizePsbtRequest {
    export type AsObject = {
        fundedPsbt: Uint8Array | string;
        account: string;
    };
}

export class FinalizePsbtResponse extends jspb.Message {
    getSignedPsbt(): Uint8Array | string;
    getSignedPsbt_asU8(): Uint8Array;
    getSignedPsbt_asB64(): string;
    setSignedPsbt(value: Uint8Array | string): void;

    getRawFinalTx(): Uint8Array | string;
    getRawFinalTx_asU8(): Uint8Array;
    getRawFinalTx_asB64(): string;
    setRawFinalTx(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FinalizePsbtResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: FinalizePsbtResponse
    ): FinalizePsbtResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: FinalizePsbtResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): FinalizePsbtResponse;
    static deserializeBinaryFromReader(
        message: FinalizePsbtResponse,
        reader: jspb.BinaryReader
    ): FinalizePsbtResponse;
}

export namespace FinalizePsbtResponse {
    export type AsObject = {
        signedPsbt: Uint8Array | string;
        rawFinalTx: Uint8Array | string;
    };
}

export class ListLeasesRequest extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListLeasesRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListLeasesRequest
    ): ListLeasesRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListLeasesRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListLeasesRequest;
    static deserializeBinaryFromReader(
        message: ListLeasesRequest,
        reader: jspb.BinaryReader
    ): ListLeasesRequest;
}

export namespace ListLeasesRequest {
    export type AsObject = {};
}

export class ListLeasesResponse extends jspb.Message {
    clearLockedUtxosList(): void;
    getLockedUtxosList(): Array<UtxoLease>;
    setLockedUtxosList(value: Array<UtxoLease>): void;
    addLockedUtxos(value?: UtxoLease, index?: number): UtxoLease;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListLeasesResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListLeasesResponse
    ): ListLeasesResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListLeasesResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListLeasesResponse;
    static deserializeBinaryFromReader(
        message: ListLeasesResponse,
        reader: jspb.BinaryReader
    ): ListLeasesResponse;
}

export namespace ListLeasesResponse {
    export type AsObject = {
        lockedUtxos: Array<UtxoLease.AsObject>;
    };
}

export interface AddressTypeMap {
    UNKNOWN: 0;
    WITNESS_PUBKEY_HASH: 1;
    NESTED_WITNESS_PUBKEY_HASH: 2;
    HYBRID_NESTED_WITNESS_PUBKEY_HASH: 3;
}

export const AddressType: AddressTypeMap;

export interface WitnessTypeMap {
    UNKNOWN_WITNESS: 0;
    COMMITMENT_TIME_LOCK: 1;
    COMMITMENT_NO_DELAY: 2;
    COMMITMENT_REVOKE: 3;
    HTLC_OFFERED_REVOKE: 4;
    HTLC_ACCEPTED_REVOKE: 5;
    HTLC_OFFERED_TIMEOUT_SECOND_LEVEL: 6;
    HTLC_ACCEPTED_SUCCESS_SECOND_LEVEL: 7;
    HTLC_OFFERED_REMOTE_TIMEOUT: 8;
    HTLC_ACCEPTED_REMOTE_SUCCESS: 9;
    HTLC_SECOND_LEVEL_REVOKE: 10;
    WITNESS_KEY_HASH: 11;
    NESTED_WITNESS_KEY_HASH: 12;
    COMMITMENT_ANCHOR: 13;
}

export const WitnessType: WitnessTypeMap;

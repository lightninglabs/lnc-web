// package: poolrpc
// file: auctioneerrpc/hashmail.proto

import * as jspb from 'google-protobuf';

export class PoolAccountAuth extends jspb.Message {
    getAcctKey(): Uint8Array | string;
    getAcctKey_asU8(): Uint8Array;
    getAcctKey_asB64(): string;
    setAcctKey(value: Uint8Array | string): void;

    getStreamSig(): Uint8Array | string;
    getStreamSig_asU8(): Uint8Array;
    getStreamSig_asB64(): string;
    setStreamSig(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PoolAccountAuth.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PoolAccountAuth
    ): PoolAccountAuth.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PoolAccountAuth,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PoolAccountAuth;
    static deserializeBinaryFromReader(
        message: PoolAccountAuth,
        reader: jspb.BinaryReader
    ): PoolAccountAuth;
}

export namespace PoolAccountAuth {
    export type AsObject = {
        acctKey: Uint8Array | string;
        streamSig: Uint8Array | string;
    };
}

export class SidecarAuth extends jspb.Message {
    getTicket(): string;
    setTicket(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SidecarAuth.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: SidecarAuth
    ): SidecarAuth.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: SidecarAuth,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): SidecarAuth;
    static deserializeBinaryFromReader(
        message: SidecarAuth,
        reader: jspb.BinaryReader
    ): SidecarAuth;
}

export namespace SidecarAuth {
    export type AsObject = {
        ticket: string;
    };
}

export class CipherBoxAuth extends jspb.Message {
    hasDesc(): boolean;
    clearDesc(): void;
    getDesc(): CipherBoxDesc | undefined;
    setDesc(value?: CipherBoxDesc): void;

    hasAcctAuth(): boolean;
    clearAcctAuth(): void;
    getAcctAuth(): PoolAccountAuth | undefined;
    setAcctAuth(value?: PoolAccountAuth): void;

    hasSidecarAuth(): boolean;
    clearSidecarAuth(): void;
    getSidecarAuth(): SidecarAuth | undefined;
    setSidecarAuth(value?: SidecarAuth): void;

    getAuthCase(): CipherBoxAuth.AuthCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherBoxAuth.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherBoxAuth
    ): CipherBoxAuth.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherBoxAuth,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherBoxAuth;
    static deserializeBinaryFromReader(
        message: CipherBoxAuth,
        reader: jspb.BinaryReader
    ): CipherBoxAuth;
}

export namespace CipherBoxAuth {
    export type AsObject = {
        desc?: CipherBoxDesc.AsObject;
        acctAuth?: PoolAccountAuth.AsObject;
        sidecarAuth?: SidecarAuth.AsObject;
    };

    export enum AuthCase {
        AUTH_NOT_SET = 0,
        ACCT_AUTH = 2,
        SIDECAR_AUTH = 3
    }
}

export class DelCipherBoxResp extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelCipherBoxResp.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: DelCipherBoxResp
    ): DelCipherBoxResp.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: DelCipherBoxResp,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): DelCipherBoxResp;
    static deserializeBinaryFromReader(
        message: DelCipherBoxResp,
        reader: jspb.BinaryReader
    ): DelCipherBoxResp;
}

export namespace DelCipherBoxResp {
    export type AsObject = {};
}

export class CipherChallenge extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherChallenge.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherChallenge
    ): CipherChallenge.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherChallenge,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherChallenge;
    static deserializeBinaryFromReader(
        message: CipherChallenge,
        reader: jspb.BinaryReader
    ): CipherChallenge;
}

export namespace CipherChallenge {
    export type AsObject = {};
}

export class CipherError extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherError.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherError
    ): CipherError.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherError,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherError;
    static deserializeBinaryFromReader(
        message: CipherError,
        reader: jspb.BinaryReader
    ): CipherError;
}

export namespace CipherError {
    export type AsObject = {};
}

export class CipherSuccess extends jspb.Message {
    hasDesc(): boolean;
    clearDesc(): void;
    getDesc(): CipherBoxDesc | undefined;
    setDesc(value?: CipherBoxDesc): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherSuccess.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherSuccess
    ): CipherSuccess.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherSuccess,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherSuccess;
    static deserializeBinaryFromReader(
        message: CipherSuccess,
        reader: jspb.BinaryReader
    ): CipherSuccess;
}

export namespace CipherSuccess {
    export type AsObject = {
        desc?: CipherBoxDesc.AsObject;
    };
}

export class CipherInitResp extends jspb.Message {
    hasSuccess(): boolean;
    clearSuccess(): void;
    getSuccess(): CipherSuccess | undefined;
    setSuccess(value?: CipherSuccess): void;

    hasChallenge(): boolean;
    clearChallenge(): void;
    getChallenge(): CipherChallenge | undefined;
    setChallenge(value?: CipherChallenge): void;

    hasError(): boolean;
    clearError(): void;
    getError(): CipherError | undefined;
    setError(value?: CipherError): void;

    getRespCase(): CipherInitResp.RespCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherInitResp.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherInitResp
    ): CipherInitResp.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherInitResp,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherInitResp;
    static deserializeBinaryFromReader(
        message: CipherInitResp,
        reader: jspb.BinaryReader
    ): CipherInitResp;
}

export namespace CipherInitResp {
    export type AsObject = {
        success?: CipherSuccess.AsObject;
        challenge?: CipherChallenge.AsObject;
        error?: CipherError.AsObject;
    };

    export enum RespCase {
        RESP_NOT_SET = 0,
        SUCCESS = 1,
        CHALLENGE = 2,
        ERROR = 3
    }
}

export class CipherBoxDesc extends jspb.Message {
    getStreamId(): Uint8Array | string;
    getStreamId_asU8(): Uint8Array;
    getStreamId_asB64(): string;
    setStreamId(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherBoxDesc.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherBoxDesc
    ): CipherBoxDesc.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherBoxDesc,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherBoxDesc;
    static deserializeBinaryFromReader(
        message: CipherBoxDesc,
        reader: jspb.BinaryReader
    ): CipherBoxDesc;
}

export namespace CipherBoxDesc {
    export type AsObject = {
        streamId: Uint8Array | string;
    };
}

export class CipherBox extends jspb.Message {
    hasDesc(): boolean;
    clearDesc(): void;
    getDesc(): CipherBoxDesc | undefined;
    setDesc(value?: CipherBoxDesc): void;

    getMsg(): Uint8Array | string;
    getMsg_asU8(): Uint8Array;
    getMsg_asB64(): string;
    setMsg(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CipherBox.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: CipherBox
    ): CipherBox.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: CipherBox,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): CipherBox;
    static deserializeBinaryFromReader(
        message: CipherBox,
        reader: jspb.BinaryReader
    ): CipherBox;
}

export namespace CipherBox {
    export type AsObject = {
        desc?: CipherBoxDesc.AsObject;
        msg: Uint8Array | string;
    };
}

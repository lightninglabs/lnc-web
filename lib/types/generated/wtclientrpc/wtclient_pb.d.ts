// package: wtclientrpc
// file: wtclientrpc/wtclient.proto

import * as jspb from 'google-protobuf';

export class AddTowerRequest extends jspb.Message {
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): void;

    getAddress(): string;
    setAddress(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddTowerRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: AddTowerRequest
    ): AddTowerRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: AddTowerRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): AddTowerRequest;
    static deserializeBinaryFromReader(
        message: AddTowerRequest,
        reader: jspb.BinaryReader
    ): AddTowerRequest;
}

export namespace AddTowerRequest {
    export type AsObject = {
        pubkey: Uint8Array | string;
        address: string;
    };
}

export class AddTowerResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddTowerResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: AddTowerResponse
    ): AddTowerResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: AddTowerResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): AddTowerResponse;
    static deserializeBinaryFromReader(
        message: AddTowerResponse,
        reader: jspb.BinaryReader
    ): AddTowerResponse;
}

export namespace AddTowerResponse {
    export type AsObject = {};
}

export class RemoveTowerRequest extends jspb.Message {
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): void;

    getAddress(): string;
    setAddress(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveTowerRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: RemoveTowerRequest
    ): RemoveTowerRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: RemoveTowerRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): RemoveTowerRequest;
    static deserializeBinaryFromReader(
        message: RemoveTowerRequest,
        reader: jspb.BinaryReader
    ): RemoveTowerRequest;
}

export namespace RemoveTowerRequest {
    export type AsObject = {
        pubkey: Uint8Array | string;
        address: string;
    };
}

export class RemoveTowerResponse extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveTowerResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: RemoveTowerResponse
    ): RemoveTowerResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: RemoveTowerResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): RemoveTowerResponse;
    static deserializeBinaryFromReader(
        message: RemoveTowerResponse,
        reader: jspb.BinaryReader
    ): RemoveTowerResponse;
}

export namespace RemoveTowerResponse {
    export type AsObject = {};
}

export class GetTowerInfoRequest extends jspb.Message {
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): void;

    getIncludeSessions(): boolean;
    setIncludeSessions(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTowerInfoRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: GetTowerInfoRequest
    ): GetTowerInfoRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: GetTowerInfoRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): GetTowerInfoRequest;
    static deserializeBinaryFromReader(
        message: GetTowerInfoRequest,
        reader: jspb.BinaryReader
    ): GetTowerInfoRequest;
}

export namespace GetTowerInfoRequest {
    export type AsObject = {
        pubkey: Uint8Array | string;
        includeSessions: boolean;
    };
}

export class TowerSession extends jspb.Message {
    getNumBackups(): number;
    setNumBackups(value: number): void;

    getNumPendingBackups(): number;
    setNumPendingBackups(value: number): void;

    getMaxBackups(): number;
    setMaxBackups(value: number): void;

    getSweepSatPerByte(): number;
    setSweepSatPerByte(value: number): void;

    getSweepSatPerVbyte(): number;
    setSweepSatPerVbyte(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TowerSession.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: TowerSession
    ): TowerSession.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: TowerSession,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): TowerSession;
    static deserializeBinaryFromReader(
        message: TowerSession,
        reader: jspb.BinaryReader
    ): TowerSession;
}

export namespace TowerSession {
    export type AsObject = {
        numBackups: number;
        numPendingBackups: number;
        maxBackups: number;
        sweepSatPerByte: number;
        sweepSatPerVbyte: number;
    };
}

export class Tower extends jspb.Message {
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): void;

    clearAddressesList(): void;
    getAddressesList(): Array<string>;
    setAddressesList(value: Array<string>): void;
    addAddresses(value: string, index?: number): string;

    getActiveSessionCandidate(): boolean;
    setActiveSessionCandidate(value: boolean): void;

    getNumSessions(): number;
    setNumSessions(value: number): void;

    clearSessionsList(): void;
    getSessionsList(): Array<TowerSession>;
    setSessionsList(value: Array<TowerSession>): void;
    addSessions(value?: TowerSession, index?: number): TowerSession;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Tower.AsObject;
    static toObject(includeInstance: boolean, msg: Tower): Tower.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: Tower,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): Tower;
    static deserializeBinaryFromReader(
        message: Tower,
        reader: jspb.BinaryReader
    ): Tower;
}

export namespace Tower {
    export type AsObject = {
        pubkey: Uint8Array | string;
        addresses: Array<string>;
        activeSessionCandidate: boolean;
        numSessions: number;
        sessions: Array<TowerSession.AsObject>;
    };
}

export class ListTowersRequest extends jspb.Message {
    getIncludeSessions(): boolean;
    setIncludeSessions(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListTowersRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListTowersRequest
    ): ListTowersRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListTowersRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListTowersRequest;
    static deserializeBinaryFromReader(
        message: ListTowersRequest,
        reader: jspb.BinaryReader
    ): ListTowersRequest;
}

export namespace ListTowersRequest {
    export type AsObject = {
        includeSessions: boolean;
    };
}

export class ListTowersResponse extends jspb.Message {
    clearTowersList(): void;
    getTowersList(): Array<Tower>;
    setTowersList(value: Array<Tower>): void;
    addTowers(value?: Tower, index?: number): Tower;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListTowersResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: ListTowersResponse
    ): ListTowersResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: ListTowersResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): ListTowersResponse;
    static deserializeBinaryFromReader(
        message: ListTowersResponse,
        reader: jspb.BinaryReader
    ): ListTowersResponse;
}

export namespace ListTowersResponse {
    export type AsObject = {
        towers: Array<Tower.AsObject>;
    };
}

export class StatsRequest extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatsRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: StatsRequest
    ): StatsRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: StatsRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): StatsRequest;
    static deserializeBinaryFromReader(
        message: StatsRequest,
        reader: jspb.BinaryReader
    ): StatsRequest;
}

export namespace StatsRequest {
    export type AsObject = {};
}

export class StatsResponse extends jspb.Message {
    getNumBackups(): number;
    setNumBackups(value: number): void;

    getNumPendingBackups(): number;
    setNumPendingBackups(value: number): void;

    getNumFailedBackups(): number;
    setNumFailedBackups(value: number): void;

    getNumSessionsAcquired(): number;
    setNumSessionsAcquired(value: number): void;

    getNumSessionsExhausted(): number;
    setNumSessionsExhausted(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatsResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: StatsResponse
    ): StatsResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: StatsResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): StatsResponse;
    static deserializeBinaryFromReader(
        message: StatsResponse,
        reader: jspb.BinaryReader
    ): StatsResponse;
}

export namespace StatsResponse {
    export type AsObject = {
        numBackups: number;
        numPendingBackups: number;
        numFailedBackups: number;
        numSessionsAcquired: number;
        numSessionsExhausted: number;
    };
}

export class PolicyRequest extends jspb.Message {
    getPolicyType(): PolicyTypeMap[keyof PolicyTypeMap];
    setPolicyType(value: PolicyTypeMap[keyof PolicyTypeMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PolicyRequest.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PolicyRequest
    ): PolicyRequest.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PolicyRequest,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PolicyRequest;
    static deserializeBinaryFromReader(
        message: PolicyRequest,
        reader: jspb.BinaryReader
    ): PolicyRequest;
}

export namespace PolicyRequest {
    export type AsObject = {
        policyType: PolicyTypeMap[keyof PolicyTypeMap];
    };
}

export class PolicyResponse extends jspb.Message {
    getMaxUpdates(): number;
    setMaxUpdates(value: number): void;

    getSweepSatPerByte(): number;
    setSweepSatPerByte(value: number): void;

    getSweepSatPerVbyte(): number;
    setSweepSatPerVbyte(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PolicyResponse.AsObject;
    static toObject(
        includeInstance: boolean,
        msg: PolicyResponse
    ): PolicyResponse.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
        [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
        message: PolicyResponse,
        writer: jspb.BinaryWriter
    ): void;
    static deserializeBinary(bytes: Uint8Array): PolicyResponse;
    static deserializeBinaryFromReader(
        message: PolicyResponse,
        reader: jspb.BinaryReader
    ): PolicyResponse;
}

export namespace PolicyResponse {
    export type AsObject = {
        maxUpdates: number;
        sweepSatPerByte: number;
        sweepSatPerVbyte: number;
    };
}

export interface PolicyTypeMap {
    LEGACY: 0;
    ANCHOR: 1;
}

export const PolicyType: PolicyTypeMap;

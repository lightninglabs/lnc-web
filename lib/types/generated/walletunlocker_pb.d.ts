// package: lnrpc
// file: walletunlocker.proto

import * as jspb from "google-protobuf";
import * as lightning_pb from "./lightning_pb";

export class GenSeedRequest extends jspb.Message {
  getAezeedPassphrase(): Uint8Array | string;
  getAezeedPassphrase_asU8(): Uint8Array;
  getAezeedPassphrase_asB64(): string;
  setAezeedPassphrase(value: Uint8Array | string): void;

  getSeedEntropy(): Uint8Array | string;
  getSeedEntropy_asU8(): Uint8Array;
  getSeedEntropy_asB64(): string;
  setSeedEntropy(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GenSeedRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GenSeedRequest): GenSeedRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GenSeedRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GenSeedRequest;
  static deserializeBinaryFromReader(message: GenSeedRequest, reader: jspb.BinaryReader): GenSeedRequest;
}

export namespace GenSeedRequest {
  export type AsObject = {
    aezeedPassphrase: Uint8Array | string,
    seedEntropy: Uint8Array | string,
  }
}

export class GenSeedResponse extends jspb.Message {
  clearCipherSeedMnemonicList(): void;
  getCipherSeedMnemonicList(): Array<string>;
  setCipherSeedMnemonicList(value: Array<string>): void;
  addCipherSeedMnemonic(value: string, index?: number): string;

  getEncipheredSeed(): Uint8Array | string;
  getEncipheredSeed_asU8(): Uint8Array;
  getEncipheredSeed_asB64(): string;
  setEncipheredSeed(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GenSeedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GenSeedResponse): GenSeedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GenSeedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GenSeedResponse;
  static deserializeBinaryFromReader(message: GenSeedResponse, reader: jspb.BinaryReader): GenSeedResponse;
}

export namespace GenSeedResponse {
  export type AsObject = {
    cipherSeedMnemonic: Array<string>,
    encipheredSeed: Uint8Array | string,
  }
}

export class InitWalletRequest extends jspb.Message {
  getWalletPassword(): Uint8Array | string;
  getWalletPassword_asU8(): Uint8Array;
  getWalletPassword_asB64(): string;
  setWalletPassword(value: Uint8Array | string): void;

  clearCipherSeedMnemonicList(): void;
  getCipherSeedMnemonicList(): Array<string>;
  setCipherSeedMnemonicList(value: Array<string>): void;
  addCipherSeedMnemonic(value: string, index?: number): string;

  getAezeedPassphrase(): Uint8Array | string;
  getAezeedPassphrase_asU8(): Uint8Array;
  getAezeedPassphrase_asB64(): string;
  setAezeedPassphrase(value: Uint8Array | string): void;

  getRecoveryWindow(): number;
  setRecoveryWindow(value: number): void;

  hasChannelBackups(): boolean;
  clearChannelBackups(): void;
  getChannelBackups(): lightning_pb.ChanBackupSnapshot | undefined;
  setChannelBackups(value?: lightning_pb.ChanBackupSnapshot): void;

  getStatelessInit(): boolean;
  setStatelessInit(value: boolean): void;

  getExtendedMasterKey(): string;
  setExtendedMasterKey(value: string): void;

  getExtendedMasterKeyBirthdayTimestamp(): number;
  setExtendedMasterKeyBirthdayTimestamp(value: number): void;

  hasWatchOnly(): boolean;
  clearWatchOnly(): void;
  getWatchOnly(): WatchOnly | undefined;
  setWatchOnly(value?: WatchOnly): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitWalletRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InitWalletRequest): InitWalletRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InitWalletRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitWalletRequest;
  static deserializeBinaryFromReader(message: InitWalletRequest, reader: jspb.BinaryReader): InitWalletRequest;
}

export namespace InitWalletRequest {
  export type AsObject = {
    walletPassword: Uint8Array | string,
    cipherSeedMnemonic: Array<string>,
    aezeedPassphrase: Uint8Array | string,
    recoveryWindow: number,
    channelBackups?: lightning_pb.ChanBackupSnapshot.AsObject,
    statelessInit: boolean,
    extendedMasterKey: string,
    extendedMasterKeyBirthdayTimestamp: number,
    watchOnly?: WatchOnly.AsObject,
  }
}

export class InitWalletResponse extends jspb.Message {
  getAdminMacaroon(): Uint8Array | string;
  getAdminMacaroon_asU8(): Uint8Array;
  getAdminMacaroon_asB64(): string;
  setAdminMacaroon(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitWalletResponse.AsObject;
  static toObject(includeInstance: boolean, msg: InitWalletResponse): InitWalletResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InitWalletResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitWalletResponse;
  static deserializeBinaryFromReader(message: InitWalletResponse, reader: jspb.BinaryReader): InitWalletResponse;
}

export namespace InitWalletResponse {
  export type AsObject = {
    adminMacaroon: Uint8Array | string,
  }
}

export class WatchOnly extends jspb.Message {
  getMasterKeyBirthdayTimestamp(): number;
  setMasterKeyBirthdayTimestamp(value: number): void;

  getMasterKeyFingerprint(): Uint8Array | string;
  getMasterKeyFingerprint_asU8(): Uint8Array;
  getMasterKeyFingerprint_asB64(): string;
  setMasterKeyFingerprint(value: Uint8Array | string): void;

  clearAccountsList(): void;
  getAccountsList(): Array<WatchOnlyAccount>;
  setAccountsList(value: Array<WatchOnlyAccount>): void;
  addAccounts(value?: WatchOnlyAccount, index?: number): WatchOnlyAccount;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WatchOnly.AsObject;
  static toObject(includeInstance: boolean, msg: WatchOnly): WatchOnly.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WatchOnly, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WatchOnly;
  static deserializeBinaryFromReader(message: WatchOnly, reader: jspb.BinaryReader): WatchOnly;
}

export namespace WatchOnly {
  export type AsObject = {
    masterKeyBirthdayTimestamp: number,
    masterKeyFingerprint: Uint8Array | string,
    accounts: Array<WatchOnlyAccount.AsObject>,
  }
}

export class WatchOnlyAccount extends jspb.Message {
  getPurpose(): number;
  setPurpose(value: number): void;

  getCoinType(): number;
  setCoinType(value: number): void;

  getAccount(): number;
  setAccount(value: number): void;

  getXpub(): string;
  setXpub(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WatchOnlyAccount.AsObject;
  static toObject(includeInstance: boolean, msg: WatchOnlyAccount): WatchOnlyAccount.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WatchOnlyAccount, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WatchOnlyAccount;
  static deserializeBinaryFromReader(message: WatchOnlyAccount, reader: jspb.BinaryReader): WatchOnlyAccount;
}

export namespace WatchOnlyAccount {
  export type AsObject = {
    purpose: number,
    coinType: number,
    account: number,
    xpub: string,
  }
}

export class UnlockWalletRequest extends jspb.Message {
  getWalletPassword(): Uint8Array | string;
  getWalletPassword_asU8(): Uint8Array;
  getWalletPassword_asB64(): string;
  setWalletPassword(value: Uint8Array | string): void;

  getRecoveryWindow(): number;
  setRecoveryWindow(value: number): void;

  hasChannelBackups(): boolean;
  clearChannelBackups(): void;
  getChannelBackups(): lightning_pb.ChanBackupSnapshot | undefined;
  setChannelBackups(value?: lightning_pb.ChanBackupSnapshot): void;

  getStatelessInit(): boolean;
  setStatelessInit(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnlockWalletRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UnlockWalletRequest): UnlockWalletRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UnlockWalletRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnlockWalletRequest;
  static deserializeBinaryFromReader(message: UnlockWalletRequest, reader: jspb.BinaryReader): UnlockWalletRequest;
}

export namespace UnlockWalletRequest {
  export type AsObject = {
    walletPassword: Uint8Array | string,
    recoveryWindow: number,
    channelBackups?: lightning_pb.ChanBackupSnapshot.AsObject,
    statelessInit: boolean,
  }
}

export class UnlockWalletResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnlockWalletResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UnlockWalletResponse): UnlockWalletResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UnlockWalletResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnlockWalletResponse;
  static deserializeBinaryFromReader(message: UnlockWalletResponse, reader: jspb.BinaryReader): UnlockWalletResponse;
}

export namespace UnlockWalletResponse {
  export type AsObject = {
  }
}

export class ChangePasswordRequest extends jspb.Message {
  getCurrentPassword(): Uint8Array | string;
  getCurrentPassword_asU8(): Uint8Array;
  getCurrentPassword_asB64(): string;
  setCurrentPassword(value: Uint8Array | string): void;

  getNewPassword(): Uint8Array | string;
  getNewPassword_asU8(): Uint8Array;
  getNewPassword_asB64(): string;
  setNewPassword(value: Uint8Array | string): void;

  getStatelessInit(): boolean;
  setStatelessInit(value: boolean): void;

  getNewMacaroonRootKey(): boolean;
  setNewMacaroonRootKey(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePasswordRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ChangePasswordRequest): ChangePasswordRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChangePasswordRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangePasswordRequest;
  static deserializeBinaryFromReader(message: ChangePasswordRequest, reader: jspb.BinaryReader): ChangePasswordRequest;
}

export namespace ChangePasswordRequest {
  export type AsObject = {
    currentPassword: Uint8Array | string,
    newPassword: Uint8Array | string,
    statelessInit: boolean,
    newMacaroonRootKey: boolean,
  }
}

export class ChangePasswordResponse extends jspb.Message {
  getAdminMacaroon(): Uint8Array | string;
  getAdminMacaroon_asU8(): Uint8Array;
  getAdminMacaroon_asB64(): string;
  setAdminMacaroon(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePasswordResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ChangePasswordResponse): ChangePasswordResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChangePasswordResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangePasswordResponse;
  static deserializeBinaryFromReader(message: ChangePasswordResponse, reader: jspb.BinaryReader): ChangePasswordResponse;
}

export namespace ChangePasswordResponse {
  export type AsObject = {
    adminMacaroon: Uint8Array | string,
  }
}


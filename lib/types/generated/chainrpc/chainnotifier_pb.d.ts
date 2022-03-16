// package: chainrpc
// file: chainrpc/chainnotifier.proto

import * as jspb from "google-protobuf";

export class ConfRequest extends jspb.Message {
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): void;

  getScript(): Uint8Array | string;
  getScript_asU8(): Uint8Array;
  getScript_asB64(): string;
  setScript(value: Uint8Array | string): void;

  getNumConfs(): number;
  setNumConfs(value: number): void;

  getHeightHint(): number;
  setHeightHint(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConfRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ConfRequest): ConfRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConfRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConfRequest;
  static deserializeBinaryFromReader(message: ConfRequest, reader: jspb.BinaryReader): ConfRequest;
}

export namespace ConfRequest {
  export type AsObject = {
    txid: Uint8Array | string,
    script: Uint8Array | string,
    numConfs: number,
    heightHint: number,
  }
}

export class ConfDetails extends jspb.Message {
  getRawTx(): Uint8Array | string;
  getRawTx_asU8(): Uint8Array;
  getRawTx_asB64(): string;
  setRawTx(value: Uint8Array | string): void;

  getBlockHash(): Uint8Array | string;
  getBlockHash_asU8(): Uint8Array;
  getBlockHash_asB64(): string;
  setBlockHash(value: Uint8Array | string): void;

  getBlockHeight(): number;
  setBlockHeight(value: number): void;

  getTxIndex(): number;
  setTxIndex(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConfDetails.AsObject;
  static toObject(includeInstance: boolean, msg: ConfDetails): ConfDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConfDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConfDetails;
  static deserializeBinaryFromReader(message: ConfDetails, reader: jspb.BinaryReader): ConfDetails;
}

export namespace ConfDetails {
  export type AsObject = {
    rawTx: Uint8Array | string,
    blockHash: Uint8Array | string,
    blockHeight: number,
    txIndex: number,
  }
}

export class Reorg extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Reorg.AsObject;
  static toObject(includeInstance: boolean, msg: Reorg): Reorg.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Reorg, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Reorg;
  static deserializeBinaryFromReader(message: Reorg, reader: jspb.BinaryReader): Reorg;
}

export namespace Reorg {
  export type AsObject = {
  }
}

export class ConfEvent extends jspb.Message {
  hasConf(): boolean;
  clearConf(): void;
  getConf(): ConfDetails | undefined;
  setConf(value?: ConfDetails): void;

  hasReorg(): boolean;
  clearReorg(): void;
  getReorg(): Reorg | undefined;
  setReorg(value?: Reorg): void;

  getEventCase(): ConfEvent.EventCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConfEvent.AsObject;
  static toObject(includeInstance: boolean, msg: ConfEvent): ConfEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConfEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConfEvent;
  static deserializeBinaryFromReader(message: ConfEvent, reader: jspb.BinaryReader): ConfEvent;
}

export namespace ConfEvent {
  export type AsObject = {
    conf?: ConfDetails.AsObject,
    reorg?: Reorg.AsObject,
  }

  export enum EventCase {
    EVENT_NOT_SET = 0,
    CONF = 1,
    REORG = 2,
  }
}

export class Outpoint extends jspb.Message {
  getHash(): Uint8Array | string;
  getHash_asU8(): Uint8Array;
  getHash_asB64(): string;
  setHash(value: Uint8Array | string): void;

  getIndex(): number;
  setIndex(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Outpoint.AsObject;
  static toObject(includeInstance: boolean, msg: Outpoint): Outpoint.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Outpoint, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Outpoint;
  static deserializeBinaryFromReader(message: Outpoint, reader: jspb.BinaryReader): Outpoint;
}

export namespace Outpoint {
  export type AsObject = {
    hash: Uint8Array | string,
    index: number,
  }
}

export class SpendRequest extends jspb.Message {
  hasOutpoint(): boolean;
  clearOutpoint(): void;
  getOutpoint(): Outpoint | undefined;
  setOutpoint(value?: Outpoint): void;

  getScript(): Uint8Array | string;
  getScript_asU8(): Uint8Array;
  getScript_asB64(): string;
  setScript(value: Uint8Array | string): void;

  getHeightHint(): number;
  setHeightHint(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SpendRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SpendRequest): SpendRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SpendRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SpendRequest;
  static deserializeBinaryFromReader(message: SpendRequest, reader: jspb.BinaryReader): SpendRequest;
}

export namespace SpendRequest {
  export type AsObject = {
    outpoint?: Outpoint.AsObject,
    script: Uint8Array | string,
    heightHint: number,
  }
}

export class SpendDetails extends jspb.Message {
  hasSpendingOutpoint(): boolean;
  clearSpendingOutpoint(): void;
  getSpendingOutpoint(): Outpoint | undefined;
  setSpendingOutpoint(value?: Outpoint): void;

  getRawSpendingTx(): Uint8Array | string;
  getRawSpendingTx_asU8(): Uint8Array;
  getRawSpendingTx_asB64(): string;
  setRawSpendingTx(value: Uint8Array | string): void;

  getSpendingTxHash(): Uint8Array | string;
  getSpendingTxHash_asU8(): Uint8Array;
  getSpendingTxHash_asB64(): string;
  setSpendingTxHash(value: Uint8Array | string): void;

  getSpendingInputIndex(): number;
  setSpendingInputIndex(value: number): void;

  getSpendingHeight(): number;
  setSpendingHeight(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SpendDetails.AsObject;
  static toObject(includeInstance: boolean, msg: SpendDetails): SpendDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SpendDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SpendDetails;
  static deserializeBinaryFromReader(message: SpendDetails, reader: jspb.BinaryReader): SpendDetails;
}

export namespace SpendDetails {
  export type AsObject = {
    spendingOutpoint?: Outpoint.AsObject,
    rawSpendingTx: Uint8Array | string,
    spendingTxHash: Uint8Array | string,
    spendingInputIndex: number,
    spendingHeight: number,
  }
}

export class SpendEvent extends jspb.Message {
  hasSpend(): boolean;
  clearSpend(): void;
  getSpend(): SpendDetails | undefined;
  setSpend(value?: SpendDetails): void;

  hasReorg(): boolean;
  clearReorg(): void;
  getReorg(): Reorg | undefined;
  setReorg(value?: Reorg): void;

  getEventCase(): SpendEvent.EventCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SpendEvent.AsObject;
  static toObject(includeInstance: boolean, msg: SpendEvent): SpendEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SpendEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SpendEvent;
  static deserializeBinaryFromReader(message: SpendEvent, reader: jspb.BinaryReader): SpendEvent;
}

export namespace SpendEvent {
  export type AsObject = {
    spend?: SpendDetails.AsObject,
    reorg?: Reorg.AsObject,
  }

  export enum EventCase {
    EVENT_NOT_SET = 0,
    SPEND = 1,
    REORG = 2,
  }
}

export class BlockEpoch extends jspb.Message {
  getHash(): Uint8Array | string;
  getHash_asU8(): Uint8Array;
  getHash_asB64(): string;
  setHash(value: Uint8Array | string): void;

  getHeight(): number;
  setHeight(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BlockEpoch.AsObject;
  static toObject(includeInstance: boolean, msg: BlockEpoch): BlockEpoch.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BlockEpoch, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BlockEpoch;
  static deserializeBinaryFromReader(message: BlockEpoch, reader: jspb.BinaryReader): BlockEpoch;
}

export namespace BlockEpoch {
  export type AsObject = {
    hash: Uint8Array | string,
    height: number,
  }
}


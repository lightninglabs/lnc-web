// package: autopilotrpc
// file: autopilotrpc/autopilot.proto

import * as jspb from "google-protobuf";

export class StatusRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StatusRequest): StatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusRequest;
  static deserializeBinaryFromReader(message: StatusRequest, reader: jspb.BinaryReader): StatusRequest;
}

export namespace StatusRequest {
  export type AsObject = {
  }
}

export class StatusResponse extends jspb.Message {
  getActive(): boolean;
  setActive(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StatusResponse): StatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusResponse;
  static deserializeBinaryFromReader(message: StatusResponse, reader: jspb.BinaryReader): StatusResponse;
}

export namespace StatusResponse {
  export type AsObject = {
    active: boolean,
  }
}

export class ModifyStatusRequest extends jspb.Message {
  getEnable(): boolean;
  setEnable(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModifyStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ModifyStatusRequest): ModifyStatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ModifyStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModifyStatusRequest;
  static deserializeBinaryFromReader(message: ModifyStatusRequest, reader: jspb.BinaryReader): ModifyStatusRequest;
}

export namespace ModifyStatusRequest {
  export type AsObject = {
    enable: boolean,
  }
}

export class ModifyStatusResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModifyStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ModifyStatusResponse): ModifyStatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ModifyStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModifyStatusResponse;
  static deserializeBinaryFromReader(message: ModifyStatusResponse, reader: jspb.BinaryReader): ModifyStatusResponse;
}

export namespace ModifyStatusResponse {
  export type AsObject = {
  }
}

export class QueryScoresRequest extends jspb.Message {
  clearPubkeysList(): void;
  getPubkeysList(): Array<string>;
  setPubkeysList(value: Array<string>): void;
  addPubkeys(value: string, index?: number): string;

  getIgnoreLocalState(): boolean;
  setIgnoreLocalState(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryScoresRequest.AsObject;
  static toObject(includeInstance: boolean, msg: QueryScoresRequest): QueryScoresRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryScoresRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryScoresRequest;
  static deserializeBinaryFromReader(message: QueryScoresRequest, reader: jspb.BinaryReader): QueryScoresRequest;
}

export namespace QueryScoresRequest {
  export type AsObject = {
    pubkeys: Array<string>,
    ignoreLocalState: boolean,
  }
}

export class QueryScoresResponse extends jspb.Message {
  clearResultsList(): void;
  getResultsList(): Array<QueryScoresResponse.HeuristicResult>;
  setResultsList(value: Array<QueryScoresResponse.HeuristicResult>): void;
  addResults(value?: QueryScoresResponse.HeuristicResult, index?: number): QueryScoresResponse.HeuristicResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryScoresResponse.AsObject;
  static toObject(includeInstance: boolean, msg: QueryScoresResponse): QueryScoresResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryScoresResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryScoresResponse;
  static deserializeBinaryFromReader(message: QueryScoresResponse, reader: jspb.BinaryReader): QueryScoresResponse;
}

export namespace QueryScoresResponse {
  export type AsObject = {
    results: Array<QueryScoresResponse.HeuristicResult.AsObject>,
  }

  export class HeuristicResult extends jspb.Message {
    getHeuristic(): string;
    setHeuristic(value: string): void;

    getScoresMap(): jspb.Map<string, number>;
    clearScoresMap(): void;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HeuristicResult.AsObject;
    static toObject(includeInstance: boolean, msg: HeuristicResult): HeuristicResult.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HeuristicResult, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HeuristicResult;
    static deserializeBinaryFromReader(message: HeuristicResult, reader: jspb.BinaryReader): HeuristicResult;
  }

  export namespace HeuristicResult {
    export type AsObject = {
      heuristic: string,
      scores: Array<[string, number]>,
    }
  }
}

export class SetScoresRequest extends jspb.Message {
  getHeuristic(): string;
  setHeuristic(value: string): void;

  getScoresMap(): jspb.Map<string, number>;
  clearScoresMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetScoresRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetScoresRequest): SetScoresRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetScoresRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetScoresRequest;
  static deserializeBinaryFromReader(message: SetScoresRequest, reader: jspb.BinaryReader): SetScoresRequest;
}

export namespace SetScoresRequest {
  export type AsObject = {
    heuristic: string,
    scores: Array<[string, number]>,
  }
}

export class SetScoresResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetScoresResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SetScoresResponse): SetScoresResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetScoresResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetScoresResponse;
  static deserializeBinaryFromReader(message: SetScoresResponse, reader: jspb.BinaryReader): SetScoresResponse;
}

export namespace SetScoresResponse {
  export type AsObject = {
  }
}


// package: frdrpc
// file: faraday.proto

import * as jspb from "google-protobuf";

export class CloseRecommendationRequest extends jspb.Message {
  getMinimumMonitored(): number;
  setMinimumMonitored(value: number): void;

  getMetric(): CloseRecommendationRequest.MetricMap[keyof CloseRecommendationRequest.MetricMap];
  setMetric(value: CloseRecommendationRequest.MetricMap[keyof CloseRecommendationRequest.MetricMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseRecommendationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CloseRecommendationRequest): CloseRecommendationRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CloseRecommendationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloseRecommendationRequest;
  static deserializeBinaryFromReader(message: CloseRecommendationRequest, reader: jspb.BinaryReader): CloseRecommendationRequest;
}

export namespace CloseRecommendationRequest {
  export type AsObject = {
    minimumMonitored: number,
    metric: CloseRecommendationRequest.MetricMap[keyof CloseRecommendationRequest.MetricMap],
  }

  export interface MetricMap {
    UNKNOWN: 0;
    UPTIME: 1;
    REVENUE: 2;
    INCOMING_VOLUME: 3;
    OUTGOING_VOLUME: 4;
    TOTAL_VOLUME: 5;
  }

  export const Metric: MetricMap;
}

export class OutlierRecommendationsRequest extends jspb.Message {
  hasRecRequest(): boolean;
  clearRecRequest(): void;
  getRecRequest(): CloseRecommendationRequest | undefined;
  setRecRequest(value?: CloseRecommendationRequest): void;

  getOutlierMultiplier(): number;
  setOutlierMultiplier(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OutlierRecommendationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: OutlierRecommendationsRequest): OutlierRecommendationsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OutlierRecommendationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OutlierRecommendationsRequest;
  static deserializeBinaryFromReader(message: OutlierRecommendationsRequest, reader: jspb.BinaryReader): OutlierRecommendationsRequest;
}

export namespace OutlierRecommendationsRequest {
  export type AsObject = {
    recRequest?: CloseRecommendationRequest.AsObject,
    outlierMultiplier: number,
  }
}

export class ThresholdRecommendationsRequest extends jspb.Message {
  hasRecRequest(): boolean;
  clearRecRequest(): void;
  getRecRequest(): CloseRecommendationRequest | undefined;
  setRecRequest(value?: CloseRecommendationRequest): void;

  getThresholdValue(): number;
  setThresholdValue(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ThresholdRecommendationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ThresholdRecommendationsRequest): ThresholdRecommendationsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ThresholdRecommendationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ThresholdRecommendationsRequest;
  static deserializeBinaryFromReader(message: ThresholdRecommendationsRequest, reader: jspb.BinaryReader): ThresholdRecommendationsRequest;
}

export namespace ThresholdRecommendationsRequest {
  export type AsObject = {
    recRequest?: CloseRecommendationRequest.AsObject,
    thresholdValue: number,
  }
}

export class CloseRecommendationsResponse extends jspb.Message {
  getTotalChannels(): number;
  setTotalChannels(value: number): void;

  getConsideredChannels(): number;
  setConsideredChannels(value: number): void;

  clearRecommendationsList(): void;
  getRecommendationsList(): Array<Recommendation>;
  setRecommendationsList(value: Array<Recommendation>): void;
  addRecommendations(value?: Recommendation, index?: number): Recommendation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseRecommendationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CloseRecommendationsResponse): CloseRecommendationsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CloseRecommendationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloseRecommendationsResponse;
  static deserializeBinaryFromReader(message: CloseRecommendationsResponse, reader: jspb.BinaryReader): CloseRecommendationsResponse;
}

export namespace CloseRecommendationsResponse {
  export type AsObject = {
    totalChannels: number,
    consideredChannels: number,
    recommendations: Array<Recommendation.AsObject>,
  }
}

export class Recommendation extends jspb.Message {
  getChanPoint(): string;
  setChanPoint(value: string): void;

  getValue(): number;
  setValue(value: number): void;

  getRecommendClose(): boolean;
  setRecommendClose(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Recommendation.AsObject;
  static toObject(includeInstance: boolean, msg: Recommendation): Recommendation.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Recommendation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Recommendation;
  static deserializeBinaryFromReader(message: Recommendation, reader: jspb.BinaryReader): Recommendation;
}

export namespace Recommendation {
  export type AsObject = {
    chanPoint: string,
    value: number,
    recommendClose: boolean,
  }
}

export class RevenueReportRequest extends jspb.Message {
  clearChanPointsList(): void;
  getChanPointsList(): Array<string>;
  setChanPointsList(value: Array<string>): void;
  addChanPoints(value: string, index?: number): string;

  getStartTime(): number;
  setStartTime(value: number): void;

  getEndTime(): number;
  setEndTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RevenueReportRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RevenueReportRequest): RevenueReportRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RevenueReportRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RevenueReportRequest;
  static deserializeBinaryFromReader(message: RevenueReportRequest, reader: jspb.BinaryReader): RevenueReportRequest;
}

export namespace RevenueReportRequest {
  export type AsObject = {
    chanPoints: Array<string>,
    startTime: number,
    endTime: number,
  }
}

export class RevenueReportResponse extends jspb.Message {
  clearReportsList(): void;
  getReportsList(): Array<RevenueReport>;
  setReportsList(value: Array<RevenueReport>): void;
  addReports(value?: RevenueReport, index?: number): RevenueReport;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RevenueReportResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RevenueReportResponse): RevenueReportResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RevenueReportResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RevenueReportResponse;
  static deserializeBinaryFromReader(message: RevenueReportResponse, reader: jspb.BinaryReader): RevenueReportResponse;
}

export namespace RevenueReportResponse {
  export type AsObject = {
    reports: Array<RevenueReport.AsObject>,
  }
}

export class RevenueReport extends jspb.Message {
  getTargetChannel(): string;
  setTargetChannel(value: string): void;

  getPairReportsMap(): jspb.Map<string, PairReport>;
  clearPairReportsMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RevenueReport.AsObject;
  static toObject(includeInstance: boolean, msg: RevenueReport): RevenueReport.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RevenueReport, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RevenueReport;
  static deserializeBinaryFromReader(message: RevenueReport, reader: jspb.BinaryReader): RevenueReport;
}

export namespace RevenueReport {
  export type AsObject = {
    targetChannel: string,
    pairReports: Array<[string, PairReport.AsObject]>,
  }
}

export class PairReport extends jspb.Message {
  getAmountOutgoingMsat(): number;
  setAmountOutgoingMsat(value: number): void;

  getFeesOutgoingMsat(): number;
  setFeesOutgoingMsat(value: number): void;

  getAmountIncomingMsat(): number;
  setAmountIncomingMsat(value: number): void;

  getFeesIncomingMsat(): number;
  setFeesIncomingMsat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PairReport.AsObject;
  static toObject(includeInstance: boolean, msg: PairReport): PairReport.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PairReport, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PairReport;
  static deserializeBinaryFromReader(message: PairReport, reader: jspb.BinaryReader): PairReport;
}

export namespace PairReport {
  export type AsObject = {
    amountOutgoingMsat: number,
    feesOutgoingMsat: number,
    amountIncomingMsat: number,
    feesIncomingMsat: number,
  }
}

export class ChannelInsightsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelInsightsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelInsightsRequest): ChannelInsightsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelInsightsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelInsightsRequest;
  static deserializeBinaryFromReader(message: ChannelInsightsRequest, reader: jspb.BinaryReader): ChannelInsightsRequest;
}

export namespace ChannelInsightsRequest {
  export type AsObject = {
  }
}

export class ChannelInsightsResponse extends jspb.Message {
  clearChannelInsightsList(): void;
  getChannelInsightsList(): Array<ChannelInsight>;
  setChannelInsightsList(value: Array<ChannelInsight>): void;
  addChannelInsights(value?: ChannelInsight, index?: number): ChannelInsight;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelInsightsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelInsightsResponse): ChannelInsightsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelInsightsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelInsightsResponse;
  static deserializeBinaryFromReader(message: ChannelInsightsResponse, reader: jspb.BinaryReader): ChannelInsightsResponse;
}

export namespace ChannelInsightsResponse {
  export type AsObject = {
    channelInsights: Array<ChannelInsight.AsObject>,
  }
}

export class ChannelInsight extends jspb.Message {
  getChanPoint(): string;
  setChanPoint(value: string): void;

  getMonitoredSeconds(): number;
  setMonitoredSeconds(value: number): void;

  getUptimeSeconds(): number;
  setUptimeSeconds(value: number): void;

  getVolumeIncomingMsat(): number;
  setVolumeIncomingMsat(value: number): void;

  getVolumeOutgoingMsat(): number;
  setVolumeOutgoingMsat(value: number): void;

  getFeesEarnedMsat(): number;
  setFeesEarnedMsat(value: number): void;

  getConfirmations(): number;
  setConfirmations(value: number): void;

  getPrivate(): boolean;
  setPrivate(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelInsight.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelInsight): ChannelInsight.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelInsight, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelInsight;
  static deserializeBinaryFromReader(message: ChannelInsight, reader: jspb.BinaryReader): ChannelInsight;
}

export namespace ChannelInsight {
  export type AsObject = {
    chanPoint: string,
    monitoredSeconds: number,
    uptimeSeconds: number,
    volumeIncomingMsat: number,
    volumeOutgoingMsat: number,
    feesEarnedMsat: number,
    confirmations: number,
    pb_private: boolean,
  }
}

export class ExchangeRateRequest extends jspb.Message {
  clearTimestampsList(): void;
  getTimestampsList(): Array<number>;
  setTimestampsList(value: Array<number>): void;
  addTimestamps(value: number, index?: number): number;

  getGranularity(): GranularityMap[keyof GranularityMap];
  setGranularity(value: GranularityMap[keyof GranularityMap]): void;

  getFiatBackend(): FiatBackendMap[keyof FiatBackendMap];
  setFiatBackend(value: FiatBackendMap[keyof FiatBackendMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExchangeRateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ExchangeRateRequest): ExchangeRateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExchangeRateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExchangeRateRequest;
  static deserializeBinaryFromReader(message: ExchangeRateRequest, reader: jspb.BinaryReader): ExchangeRateRequest;
}

export namespace ExchangeRateRequest {
  export type AsObject = {
    timestamps: Array<number>,
    granularity: GranularityMap[keyof GranularityMap],
    fiatBackend: FiatBackendMap[keyof FiatBackendMap],
  }
}

export class ExchangeRateResponse extends jspb.Message {
  clearRatesList(): void;
  getRatesList(): Array<ExchangeRate>;
  setRatesList(value: Array<ExchangeRate>): void;
  addRates(value?: ExchangeRate, index?: number): ExchangeRate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExchangeRateResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ExchangeRateResponse): ExchangeRateResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExchangeRateResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExchangeRateResponse;
  static deserializeBinaryFromReader(message: ExchangeRateResponse, reader: jspb.BinaryReader): ExchangeRateResponse;
}

export namespace ExchangeRateResponse {
  export type AsObject = {
    rates: Array<ExchangeRate.AsObject>,
  }
}

export class BitcoinPrice extends jspb.Message {
  getPrice(): string;
  setPrice(value: string): void;

  getPriceTimestamp(): number;
  setPriceTimestamp(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BitcoinPrice.AsObject;
  static toObject(includeInstance: boolean, msg: BitcoinPrice): BitcoinPrice.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BitcoinPrice, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BitcoinPrice;
  static deserializeBinaryFromReader(message: BitcoinPrice, reader: jspb.BinaryReader): BitcoinPrice;
}

export namespace BitcoinPrice {
  export type AsObject = {
    price: string,
    priceTimestamp: number,
  }
}

export class ExchangeRate extends jspb.Message {
  getTimestamp(): number;
  setTimestamp(value: number): void;

  hasBtcPrice(): boolean;
  clearBtcPrice(): void;
  getBtcPrice(): BitcoinPrice | undefined;
  setBtcPrice(value?: BitcoinPrice): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExchangeRate.AsObject;
  static toObject(includeInstance: boolean, msg: ExchangeRate): ExchangeRate.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExchangeRate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExchangeRate;
  static deserializeBinaryFromReader(message: ExchangeRate, reader: jspb.BinaryReader): ExchangeRate;
}

export namespace ExchangeRate {
  export type AsObject = {
    timestamp: number,
    btcPrice?: BitcoinPrice.AsObject,
  }
}

export class NodeAuditRequest extends jspb.Message {
  getStartTime(): number;
  setStartTime(value: number): void;

  getEndTime(): number;
  setEndTime(value: number): void;

  getDisableFiat(): boolean;
  setDisableFiat(value: boolean): void;

  getGranularity(): GranularityMap[keyof GranularityMap];
  setGranularity(value: GranularityMap[keyof GranularityMap]): void;

  clearCustomCategoriesList(): void;
  getCustomCategoriesList(): Array<CustomCategory>;
  setCustomCategoriesList(value: Array<CustomCategory>): void;
  addCustomCategories(value?: CustomCategory, index?: number): CustomCategory;

  getFiatBackend(): FiatBackendMap[keyof FiatBackendMap];
  setFiatBackend(value: FiatBackendMap[keyof FiatBackendMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NodeAuditRequest.AsObject;
  static toObject(includeInstance: boolean, msg: NodeAuditRequest): NodeAuditRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NodeAuditRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NodeAuditRequest;
  static deserializeBinaryFromReader(message: NodeAuditRequest, reader: jspb.BinaryReader): NodeAuditRequest;
}

export namespace NodeAuditRequest {
  export type AsObject = {
    startTime: number,
    endTime: number,
    disableFiat: boolean,
    granularity: GranularityMap[keyof GranularityMap],
    customCategories: Array<CustomCategory.AsObject>,
    fiatBackend: FiatBackendMap[keyof FiatBackendMap],
  }
}

export class CustomCategory extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getOnChain(): boolean;
  setOnChain(value: boolean): void;

  getOffChain(): boolean;
  setOffChain(value: boolean): void;

  clearLabelPatternsList(): void;
  getLabelPatternsList(): Array<string>;
  setLabelPatternsList(value: Array<string>): void;
  addLabelPatterns(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CustomCategory.AsObject;
  static toObject(includeInstance: boolean, msg: CustomCategory): CustomCategory.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CustomCategory, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CustomCategory;
  static deserializeBinaryFromReader(message: CustomCategory, reader: jspb.BinaryReader): CustomCategory;
}

export namespace CustomCategory {
  export type AsObject = {
    name: string,
    onChain: boolean,
    offChain: boolean,
    labelPatterns: Array<string>,
  }
}

export class ReportEntry extends jspb.Message {
  getTimestamp(): number;
  setTimestamp(value: number): void;

  getOnChain(): boolean;
  setOnChain(value: boolean): void;

  getAmount(): number;
  setAmount(value: number): void;

  getCredit(): boolean;
  setCredit(value: boolean): void;

  getAsset(): string;
  setAsset(value: string): void;

  getType(): EntryTypeMap[keyof EntryTypeMap];
  setType(value: EntryTypeMap[keyof EntryTypeMap]): void;

  getCustomCategory(): string;
  setCustomCategory(value: string): void;

  getTxid(): string;
  setTxid(value: string): void;

  getFiat(): string;
  setFiat(value: string): void;

  getReference(): string;
  setReference(value: string): void;

  getNote(): string;
  setNote(value: string): void;

  hasBtcPrice(): boolean;
  clearBtcPrice(): void;
  getBtcPrice(): BitcoinPrice | undefined;
  setBtcPrice(value?: BitcoinPrice): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReportEntry.AsObject;
  static toObject(includeInstance: boolean, msg: ReportEntry): ReportEntry.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReportEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReportEntry;
  static deserializeBinaryFromReader(message: ReportEntry, reader: jspb.BinaryReader): ReportEntry;
}

export namespace ReportEntry {
  export type AsObject = {
    timestamp: number,
    onChain: boolean,
    amount: number,
    credit: boolean,
    asset: string,
    type: EntryTypeMap[keyof EntryTypeMap],
    customCategory: string,
    txid: string,
    fiat: string,
    reference: string,
    note: string,
    btcPrice?: BitcoinPrice.AsObject,
  }
}

export class NodeAuditResponse extends jspb.Message {
  clearReportsList(): void;
  getReportsList(): Array<ReportEntry>;
  setReportsList(value: Array<ReportEntry>): void;
  addReports(value?: ReportEntry, index?: number): ReportEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NodeAuditResponse.AsObject;
  static toObject(includeInstance: boolean, msg: NodeAuditResponse): NodeAuditResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NodeAuditResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NodeAuditResponse;
  static deserializeBinaryFromReader(message: NodeAuditResponse, reader: jspb.BinaryReader): NodeAuditResponse;
}

export namespace NodeAuditResponse {
  export type AsObject = {
    reports: Array<ReportEntry.AsObject>,
  }
}

export class CloseReportRequest extends jspb.Message {
  getChannelPoint(): string;
  setChannelPoint(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseReportRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CloseReportRequest): CloseReportRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CloseReportRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloseReportRequest;
  static deserializeBinaryFromReader(message: CloseReportRequest, reader: jspb.BinaryReader): CloseReportRequest;
}

export namespace CloseReportRequest {
  export type AsObject = {
    channelPoint: string,
  }
}

export class CloseReportResponse extends jspb.Message {
  getChannelPoint(): string;
  setChannelPoint(value: string): void;

  getChannelInitiator(): boolean;
  setChannelInitiator(value: boolean): void;

  getCloseType(): string;
  setCloseType(value: string): void;

  getCloseTxid(): string;
  setCloseTxid(value: string): void;

  getOpenFee(): string;
  setOpenFee(value: string): void;

  getCloseFee(): string;
  setCloseFee(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseReportResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CloseReportResponse): CloseReportResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CloseReportResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloseReportResponse;
  static deserializeBinaryFromReader(message: CloseReportResponse, reader: jspb.BinaryReader): CloseReportResponse;
}

export namespace CloseReportResponse {
  export type AsObject = {
    channelPoint: string,
    channelInitiator: boolean,
    closeType: string,
    closeTxid: string,
    openFee: string,
    closeFee: string,
  }
}

export interface GranularityMap {
  UNKNOWN_GRANULARITY: 0;
  MINUTE: 1;
  FIVE_MINUTES: 2;
  FIFTEEN_MINUTES: 3;
  THIRTY_MINUTES: 4;
  HOUR: 5;
  SIX_HOURS: 6;
  TWELVE_HOURS: 7;
  DAY: 8;
}

export const Granularity: GranularityMap;

export interface FiatBackendMap {
  UNKNOWN_FIATBACKEND: 0;
  COINCAP: 1;
  COINDESK: 2;
}

export const FiatBackend: FiatBackendMap;

export interface EntryTypeMap {
  UNKNOWN: 0;
  LOCAL_CHANNEL_OPEN: 1;
  REMOTE_CHANNEL_OPEN: 2;
  CHANNEL_OPEN_FEE: 3;
  CHANNEL_CLOSE: 4;
  RECEIPT: 5;
  PAYMENT: 6;
  FEE: 7;
  CIRCULAR_RECEIPT: 8;
  FORWARD: 9;
  FORWARD_FEE: 10;
  CIRCULAR_PAYMENT: 11;
  CIRCULAR_FEE: 12;
  SWEEP: 13;
  SWEEP_FEE: 14;
  CHANNEL_CLOSE_FEE: 15;
}

export const EntryType: EntryTypeMap;


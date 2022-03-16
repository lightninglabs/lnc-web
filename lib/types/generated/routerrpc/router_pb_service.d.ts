// package: routerrpc
// file: routerrpc/router.proto

import * as routerrpc_router_pb from "../routerrpc/router_pb";
import * as lightning_pb from "../lightning_pb";
import {grpc} from "@improbable-eng/grpc-web";

type RouterSendPaymentV2 = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.SendPaymentRequest;
  readonly responseType: typeof lightning_pb.Payment;
};

type RouterTrackPaymentV2 = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.TrackPaymentRequest;
  readonly responseType: typeof lightning_pb.Payment;
};

type RouterEstimateRouteFee = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.RouteFeeRequest;
  readonly responseType: typeof routerrpc_router_pb.RouteFeeResponse;
};

type RouterSendToRoute = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.SendToRouteRequest;
  readonly responseType: typeof routerrpc_router_pb.SendToRouteResponse;
};

type RouterSendToRouteV2 = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.SendToRouteRequest;
  readonly responseType: typeof lightning_pb.HTLCAttempt;
};

type RouterResetMissionControl = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.ResetMissionControlRequest;
  readonly responseType: typeof routerrpc_router_pb.ResetMissionControlResponse;
};

type RouterQueryMissionControl = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.QueryMissionControlRequest;
  readonly responseType: typeof routerrpc_router_pb.QueryMissionControlResponse;
};

type RouterXImportMissionControl = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.XImportMissionControlRequest;
  readonly responseType: typeof routerrpc_router_pb.XImportMissionControlResponse;
};

type RouterGetMissionControlConfig = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.GetMissionControlConfigRequest;
  readonly responseType: typeof routerrpc_router_pb.GetMissionControlConfigResponse;
};

type RouterSetMissionControlConfig = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.SetMissionControlConfigRequest;
  readonly responseType: typeof routerrpc_router_pb.SetMissionControlConfigResponse;
};

type RouterQueryProbability = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.QueryProbabilityRequest;
  readonly responseType: typeof routerrpc_router_pb.QueryProbabilityResponse;
};

type RouterBuildRoute = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.BuildRouteRequest;
  readonly responseType: typeof routerrpc_router_pb.BuildRouteResponse;
};

type RouterSubscribeHtlcEvents = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.SubscribeHtlcEventsRequest;
  readonly responseType: typeof routerrpc_router_pb.HtlcEvent;
};

type RouterSendPayment = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.SendPaymentRequest;
  readonly responseType: typeof routerrpc_router_pb.PaymentStatus;
};

type RouterTrackPayment = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.TrackPaymentRequest;
  readonly responseType: typeof routerrpc_router_pb.PaymentStatus;
};

type RouterHtlcInterceptor = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof routerrpc_router_pb.ForwardHtlcInterceptResponse;
  readonly responseType: typeof routerrpc_router_pb.ForwardHtlcInterceptRequest;
};

type RouterUpdateChanStatus = {
  readonly methodName: string;
  readonly service: typeof Router;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof routerrpc_router_pb.UpdateChanStatusRequest;
  readonly responseType: typeof routerrpc_router_pb.UpdateChanStatusResponse;
};

export class Router {
  static readonly serviceName: string;
  static readonly SendPaymentV2: RouterSendPaymentV2;
  static readonly TrackPaymentV2: RouterTrackPaymentV2;
  static readonly EstimateRouteFee: RouterEstimateRouteFee;
  static readonly SendToRoute: RouterSendToRoute;
  static readonly SendToRouteV2: RouterSendToRouteV2;
  static readonly ResetMissionControl: RouterResetMissionControl;
  static readonly QueryMissionControl: RouterQueryMissionControl;
  static readonly XImportMissionControl: RouterXImportMissionControl;
  static readonly GetMissionControlConfig: RouterGetMissionControlConfig;
  static readonly SetMissionControlConfig: RouterSetMissionControlConfig;
  static readonly QueryProbability: RouterQueryProbability;
  static readonly BuildRoute: RouterBuildRoute;
  static readonly SubscribeHtlcEvents: RouterSubscribeHtlcEvents;
  static readonly SendPayment: RouterSendPayment;
  static readonly TrackPayment: RouterTrackPayment;
  static readonly HtlcInterceptor: RouterHtlcInterceptor;
  static readonly UpdateChanStatus: RouterUpdateChanStatus;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class RouterClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  sendPaymentV2(requestMessage: routerrpc_router_pb.SendPaymentRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.Payment>;
  trackPaymentV2(requestMessage: routerrpc_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.Payment>;
  estimateRouteFee(
    requestMessage: routerrpc_router_pb.RouteFeeRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.RouteFeeResponse|null) => void
  ): UnaryResponse;
  estimateRouteFee(
    requestMessage: routerrpc_router_pb.RouteFeeRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.RouteFeeResponse|null) => void
  ): UnaryResponse;
  sendToRoute(
    requestMessage: routerrpc_router_pb.SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.SendToRouteResponse|null) => void
  ): UnaryResponse;
  sendToRoute(
    requestMessage: routerrpc_router_pb.SendToRouteRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.SendToRouteResponse|null) => void
  ): UnaryResponse;
  sendToRouteV2(
    requestMessage: routerrpc_router_pb.SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.HTLCAttempt|null) => void
  ): UnaryResponse;
  sendToRouteV2(
    requestMessage: routerrpc_router_pb.SendToRouteRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.HTLCAttempt|null) => void
  ): UnaryResponse;
  resetMissionControl(
    requestMessage: routerrpc_router_pb.ResetMissionControlRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.ResetMissionControlResponse|null) => void
  ): UnaryResponse;
  resetMissionControl(
    requestMessage: routerrpc_router_pb.ResetMissionControlRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.ResetMissionControlResponse|null) => void
  ): UnaryResponse;
  queryMissionControl(
    requestMessage: routerrpc_router_pb.QueryMissionControlRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.QueryMissionControlResponse|null) => void
  ): UnaryResponse;
  queryMissionControl(
    requestMessage: routerrpc_router_pb.QueryMissionControlRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.QueryMissionControlResponse|null) => void
  ): UnaryResponse;
  xImportMissionControl(
    requestMessage: routerrpc_router_pb.XImportMissionControlRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.XImportMissionControlResponse|null) => void
  ): UnaryResponse;
  xImportMissionControl(
    requestMessage: routerrpc_router_pb.XImportMissionControlRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.XImportMissionControlResponse|null) => void
  ): UnaryResponse;
  getMissionControlConfig(
    requestMessage: routerrpc_router_pb.GetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.GetMissionControlConfigResponse|null) => void
  ): UnaryResponse;
  getMissionControlConfig(
    requestMessage: routerrpc_router_pb.GetMissionControlConfigRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.GetMissionControlConfigResponse|null) => void
  ): UnaryResponse;
  setMissionControlConfig(
    requestMessage: routerrpc_router_pb.SetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.SetMissionControlConfigResponse|null) => void
  ): UnaryResponse;
  setMissionControlConfig(
    requestMessage: routerrpc_router_pb.SetMissionControlConfigRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.SetMissionControlConfigResponse|null) => void
  ): UnaryResponse;
  queryProbability(
    requestMessage: routerrpc_router_pb.QueryProbabilityRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.QueryProbabilityResponse|null) => void
  ): UnaryResponse;
  queryProbability(
    requestMessage: routerrpc_router_pb.QueryProbabilityRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.QueryProbabilityResponse|null) => void
  ): UnaryResponse;
  buildRoute(
    requestMessage: routerrpc_router_pb.BuildRouteRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.BuildRouteResponse|null) => void
  ): UnaryResponse;
  buildRoute(
    requestMessage: routerrpc_router_pb.BuildRouteRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.BuildRouteResponse|null) => void
  ): UnaryResponse;
  subscribeHtlcEvents(requestMessage: routerrpc_router_pb.SubscribeHtlcEventsRequest, metadata?: grpc.Metadata): ResponseStream<routerrpc_router_pb.HtlcEvent>;
  sendPayment(requestMessage: routerrpc_router_pb.SendPaymentRequest, metadata?: grpc.Metadata): ResponseStream<routerrpc_router_pb.PaymentStatus>;
  trackPayment(requestMessage: routerrpc_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata): ResponseStream<routerrpc_router_pb.PaymentStatus>;
  htlcInterceptor(metadata?: grpc.Metadata): BidirectionalStream<routerrpc_router_pb.ForwardHtlcInterceptResponse, routerrpc_router_pb.ForwardHtlcInterceptRequest>;
  updateChanStatus(
    requestMessage: routerrpc_router_pb.UpdateChanStatusRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.UpdateChanStatusResponse|null) => void
  ): UnaryResponse;
  updateChanStatus(
    requestMessage: routerrpc_router_pb.UpdateChanStatusRequest,
    callback: (error: ServiceError|null, responseMessage: routerrpc_router_pb.UpdateChanStatusResponse|null) => void
  ): UnaryResponse;
}


// package: invoicesrpc
// file: invoicesrpc/invoices.proto

import * as invoicesrpc_invoices_pb from "../invoicesrpc/invoices_pb";
import * as lightning_pb from "../lightning_pb";
import {grpc} from "@improbable-eng/grpc-web";

type InvoicesSubscribeSingleInvoice = {
  readonly methodName: string;
  readonly service: typeof Invoices;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof invoicesrpc_invoices_pb.SubscribeSingleInvoiceRequest;
  readonly responseType: typeof lightning_pb.Invoice;
};

type InvoicesCancelInvoice = {
  readonly methodName: string;
  readonly service: typeof Invoices;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof invoicesrpc_invoices_pb.CancelInvoiceMsg;
  readonly responseType: typeof invoicesrpc_invoices_pb.CancelInvoiceResp;
};

type InvoicesAddHoldInvoice = {
  readonly methodName: string;
  readonly service: typeof Invoices;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof invoicesrpc_invoices_pb.AddHoldInvoiceRequest;
  readonly responseType: typeof invoicesrpc_invoices_pb.AddHoldInvoiceResp;
};

type InvoicesSettleInvoice = {
  readonly methodName: string;
  readonly service: typeof Invoices;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof invoicesrpc_invoices_pb.SettleInvoiceMsg;
  readonly responseType: typeof invoicesrpc_invoices_pb.SettleInvoiceResp;
};

type InvoicesLookupInvoiceV2 = {
  readonly methodName: string;
  readonly service: typeof Invoices;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof invoicesrpc_invoices_pb.LookupInvoiceMsg;
  readonly responseType: typeof lightning_pb.Invoice;
};

export class Invoices {
  static readonly serviceName: string;
  static readonly SubscribeSingleInvoice: InvoicesSubscribeSingleInvoice;
  static readonly CancelInvoice: InvoicesCancelInvoice;
  static readonly AddHoldInvoice: InvoicesAddHoldInvoice;
  static readonly SettleInvoice: InvoicesSettleInvoice;
  static readonly LookupInvoiceV2: InvoicesLookupInvoiceV2;
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

export class InvoicesClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  subscribeSingleInvoice(requestMessage: invoicesrpc_invoices_pb.SubscribeSingleInvoiceRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.Invoice>;
  cancelInvoice(
    requestMessage: invoicesrpc_invoices_pb.CancelInvoiceMsg,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.CancelInvoiceResp|null) => void
  ): UnaryResponse;
  cancelInvoice(
    requestMessage: invoicesrpc_invoices_pb.CancelInvoiceMsg,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.CancelInvoiceResp|null) => void
  ): UnaryResponse;
  addHoldInvoice(
    requestMessage: invoicesrpc_invoices_pb.AddHoldInvoiceRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.AddHoldInvoiceResp|null) => void
  ): UnaryResponse;
  addHoldInvoice(
    requestMessage: invoicesrpc_invoices_pb.AddHoldInvoiceRequest,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.AddHoldInvoiceResp|null) => void
  ): UnaryResponse;
  settleInvoice(
    requestMessage: invoicesrpc_invoices_pb.SettleInvoiceMsg,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.SettleInvoiceResp|null) => void
  ): UnaryResponse;
  settleInvoice(
    requestMessage: invoicesrpc_invoices_pb.SettleInvoiceMsg,
    callback: (error: ServiceError|null, responseMessage: invoicesrpc_invoices_pb.SettleInvoiceResp|null) => void
  ): UnaryResponse;
  lookupInvoiceV2(
    requestMessage: invoicesrpc_invoices_pb.LookupInvoiceMsg,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.Invoice|null) => void
  ): UnaryResponse;
  lookupInvoiceV2(
    requestMessage: invoicesrpc_invoices_pb.LookupInvoiceMsg,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.Invoice|null) => void
  ): UnaryResponse;
}


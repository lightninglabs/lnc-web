// package: invoicesrpc
// file: invoicesrpc/invoices.proto

var invoicesrpc_invoices_pb = require("../invoicesrpc/invoices_pb");
var lightning_pb = require("../lightning_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Invoices = (function () {
  function Invoices() {}
  Invoices.serviceName = "invoicesrpc.Invoices";
  return Invoices;
}());

Invoices.SubscribeSingleInvoice = {
  methodName: "SubscribeSingleInvoice",
  service: Invoices,
  requestStream: false,
  responseStream: true,
  requestType: invoicesrpc_invoices_pb.SubscribeSingleInvoiceRequest,
  responseType: lightning_pb.Invoice
};

Invoices.CancelInvoice = {
  methodName: "CancelInvoice",
  service: Invoices,
  requestStream: false,
  responseStream: false,
  requestType: invoicesrpc_invoices_pb.CancelInvoiceMsg,
  responseType: invoicesrpc_invoices_pb.CancelInvoiceResp
};

Invoices.AddHoldInvoice = {
  methodName: "AddHoldInvoice",
  service: Invoices,
  requestStream: false,
  responseStream: false,
  requestType: invoicesrpc_invoices_pb.AddHoldInvoiceRequest,
  responseType: invoicesrpc_invoices_pb.AddHoldInvoiceResp
};

Invoices.SettleInvoice = {
  methodName: "SettleInvoice",
  service: Invoices,
  requestStream: false,
  responseStream: false,
  requestType: invoicesrpc_invoices_pb.SettleInvoiceMsg,
  responseType: invoicesrpc_invoices_pb.SettleInvoiceResp
};

Invoices.LookupInvoiceV2 = {
  methodName: "LookupInvoiceV2",
  service: Invoices,
  requestStream: false,
  responseStream: false,
  requestType: invoicesrpc_invoices_pb.LookupInvoiceMsg,
  responseType: lightning_pb.Invoice
};

exports.Invoices = Invoices;

function InvoicesClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

InvoicesClient.prototype.subscribeSingleInvoice = function subscribeSingleInvoice(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Invoices.SubscribeSingleInvoice, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

InvoicesClient.prototype.cancelInvoice = function cancelInvoice(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Invoices.CancelInvoice, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

InvoicesClient.prototype.addHoldInvoice = function addHoldInvoice(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Invoices.AddHoldInvoice, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

InvoicesClient.prototype.settleInvoice = function settleInvoice(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Invoices.SettleInvoice, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

InvoicesClient.prototype.lookupInvoiceV2 = function lookupInvoiceV2(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Invoices.LookupInvoiceV2, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

exports.InvoicesClient = InvoicesClient;


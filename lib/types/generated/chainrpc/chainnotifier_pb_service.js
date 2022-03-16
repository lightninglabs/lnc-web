// package: chainrpc
// file: chainrpc/chainnotifier.proto

var chainrpc_chainnotifier_pb = require("../chainrpc/chainnotifier_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var ChainNotifier = (function () {
  function ChainNotifier() {}
  ChainNotifier.serviceName = "chainrpc.ChainNotifier";
  return ChainNotifier;
}());

ChainNotifier.RegisterConfirmationsNtfn = {
  methodName: "RegisterConfirmationsNtfn",
  service: ChainNotifier,
  requestStream: false,
  responseStream: true,
  requestType: chainrpc_chainnotifier_pb.ConfRequest,
  responseType: chainrpc_chainnotifier_pb.ConfEvent
};

ChainNotifier.RegisterSpendNtfn = {
  methodName: "RegisterSpendNtfn",
  service: ChainNotifier,
  requestStream: false,
  responseStream: true,
  requestType: chainrpc_chainnotifier_pb.SpendRequest,
  responseType: chainrpc_chainnotifier_pb.SpendEvent
};

ChainNotifier.RegisterBlockEpochNtfn = {
  methodName: "RegisterBlockEpochNtfn",
  service: ChainNotifier,
  requestStream: false,
  responseStream: true,
  requestType: chainrpc_chainnotifier_pb.BlockEpoch,
  responseType: chainrpc_chainnotifier_pb.BlockEpoch
};

exports.ChainNotifier = ChainNotifier;

function ChainNotifierClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

ChainNotifierClient.prototype.registerConfirmationsNtfn = function registerConfirmationsNtfn(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(ChainNotifier.RegisterConfirmationsNtfn, {
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

ChainNotifierClient.prototype.registerSpendNtfn = function registerSpendNtfn(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(ChainNotifier.RegisterSpendNtfn, {
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

ChainNotifierClient.prototype.registerBlockEpochNtfn = function registerBlockEpochNtfn(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(ChainNotifier.RegisterBlockEpochNtfn, {
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

exports.ChainNotifierClient = ChainNotifierClient;


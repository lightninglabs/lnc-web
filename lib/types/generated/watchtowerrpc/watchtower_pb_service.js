// package: watchtowerrpc
// file: watchtowerrpc/watchtower.proto

var watchtowerrpc_watchtower_pb = require("../watchtowerrpc/watchtower_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Watchtower = (function () {
  function Watchtower() {}
  Watchtower.serviceName = "watchtowerrpc.Watchtower";
  return Watchtower;
}());

Watchtower.GetInfo = {
  methodName: "GetInfo",
  service: Watchtower,
  requestStream: false,
  responseStream: false,
  requestType: watchtowerrpc_watchtower_pb.GetInfoRequest,
  responseType: watchtowerrpc_watchtower_pb.GetInfoResponse
};

exports.Watchtower = Watchtower;

function WatchtowerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

WatchtowerClient.prototype.getInfo = function getInfo(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Watchtower.GetInfo, {
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

exports.WatchtowerClient = WatchtowerClient;


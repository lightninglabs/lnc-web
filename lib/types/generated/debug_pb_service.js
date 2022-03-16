// package: looprpc
// file: debug.proto

var debug_pb = require("./debug_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Debug = (function () {
  function Debug() {}
  Debug.serviceName = "looprpc.Debug";
  return Debug;
}());

Debug.ForceAutoLoop = {
  methodName: "ForceAutoLoop",
  service: Debug,
  requestStream: false,
  responseStream: false,
  requestType: debug_pb.ForceAutoLoopRequest,
  responseType: debug_pb.ForceAutoLoopResponse
};

exports.Debug = Debug;

function DebugClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

DebugClient.prototype.forceAutoLoop = function forceAutoLoop(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Debug.ForceAutoLoop, {
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

exports.DebugClient = DebugClient;


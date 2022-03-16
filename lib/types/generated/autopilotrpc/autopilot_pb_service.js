// package: autopilotrpc
// file: autopilotrpc/autopilot.proto

var autopilotrpc_autopilot_pb = require("../autopilotrpc/autopilot_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Autopilot = (function () {
  function Autopilot() {}
  Autopilot.serviceName = "autopilotrpc.Autopilot";
  return Autopilot;
}());

Autopilot.Status = {
  methodName: "Status",
  service: Autopilot,
  requestStream: false,
  responseStream: false,
  requestType: autopilotrpc_autopilot_pb.StatusRequest,
  responseType: autopilotrpc_autopilot_pb.StatusResponse
};

Autopilot.ModifyStatus = {
  methodName: "ModifyStatus",
  service: Autopilot,
  requestStream: false,
  responseStream: false,
  requestType: autopilotrpc_autopilot_pb.ModifyStatusRequest,
  responseType: autopilotrpc_autopilot_pb.ModifyStatusResponse
};

Autopilot.QueryScores = {
  methodName: "QueryScores",
  service: Autopilot,
  requestStream: false,
  responseStream: false,
  requestType: autopilotrpc_autopilot_pb.QueryScoresRequest,
  responseType: autopilotrpc_autopilot_pb.QueryScoresResponse
};

Autopilot.SetScores = {
  methodName: "SetScores",
  service: Autopilot,
  requestStream: false,
  responseStream: false,
  requestType: autopilotrpc_autopilot_pb.SetScoresRequest,
  responseType: autopilotrpc_autopilot_pb.SetScoresResponse
};

exports.Autopilot = Autopilot;

function AutopilotClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

AutopilotClient.prototype.status = function status(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Autopilot.Status, {
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

AutopilotClient.prototype.modifyStatus = function modifyStatus(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Autopilot.ModifyStatus, {
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

AutopilotClient.prototype.queryScores = function queryScores(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Autopilot.QueryScores, {
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

AutopilotClient.prototype.setScores = function setScores(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Autopilot.SetScores, {
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

exports.AutopilotClient = AutopilotClient;


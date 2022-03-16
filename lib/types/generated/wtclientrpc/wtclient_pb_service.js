// package: wtclientrpc
// file: wtclientrpc/wtclient.proto

var wtclientrpc_wtclient_pb = require("../wtclientrpc/wtclient_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var WatchtowerClient = (function () {
  function WatchtowerClient() {}
  WatchtowerClient.serviceName = "wtclientrpc.WatchtowerClient";
  return WatchtowerClient;
}());

WatchtowerClient.AddTower = {
  methodName: "AddTower",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.AddTowerRequest,
  responseType: wtclientrpc_wtclient_pb.AddTowerResponse
};

WatchtowerClient.RemoveTower = {
  methodName: "RemoveTower",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.RemoveTowerRequest,
  responseType: wtclientrpc_wtclient_pb.RemoveTowerResponse
};

WatchtowerClient.ListTowers = {
  methodName: "ListTowers",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.ListTowersRequest,
  responseType: wtclientrpc_wtclient_pb.ListTowersResponse
};

WatchtowerClient.GetTowerInfo = {
  methodName: "GetTowerInfo",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.GetTowerInfoRequest,
  responseType: wtclientrpc_wtclient_pb.Tower
};

WatchtowerClient.Stats = {
  methodName: "Stats",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.StatsRequest,
  responseType: wtclientrpc_wtclient_pb.StatsResponse
};

WatchtowerClient.Policy = {
  methodName: "Policy",
  service: WatchtowerClient,
  requestStream: false,
  responseStream: false,
  requestType: wtclientrpc_wtclient_pb.PolicyRequest,
  responseType: wtclientrpc_wtclient_pb.PolicyResponse
};

exports.WatchtowerClient = WatchtowerClient;

function WatchtowerClientClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

WatchtowerClientClient.prototype.addTower = function addTower(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.AddTower, {
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

WatchtowerClientClient.prototype.removeTower = function removeTower(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.RemoveTower, {
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

WatchtowerClientClient.prototype.listTowers = function listTowers(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.ListTowers, {
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

WatchtowerClientClient.prototype.getTowerInfo = function getTowerInfo(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.GetTowerInfo, {
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

WatchtowerClientClient.prototype.stats = function stats(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.Stats, {
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

WatchtowerClientClient.prototype.policy = function policy(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WatchtowerClient.Policy, {
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

exports.WatchtowerClientClient = WatchtowerClientClient;


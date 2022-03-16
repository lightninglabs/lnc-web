// package: lnrpc
// file: walletunlocker.proto

var walletunlocker_pb = require("./walletunlocker_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var WalletUnlocker = (function () {
  function WalletUnlocker() {}
  WalletUnlocker.serviceName = "lnrpc.WalletUnlocker";
  return WalletUnlocker;
}());

WalletUnlocker.GenSeed = {
  methodName: "GenSeed",
  service: WalletUnlocker,
  requestStream: false,
  responseStream: false,
  requestType: walletunlocker_pb.GenSeedRequest,
  responseType: walletunlocker_pb.GenSeedResponse
};

WalletUnlocker.InitWallet = {
  methodName: "InitWallet",
  service: WalletUnlocker,
  requestStream: false,
  responseStream: false,
  requestType: walletunlocker_pb.InitWalletRequest,
  responseType: walletunlocker_pb.InitWalletResponse
};

WalletUnlocker.UnlockWallet = {
  methodName: "UnlockWallet",
  service: WalletUnlocker,
  requestStream: false,
  responseStream: false,
  requestType: walletunlocker_pb.UnlockWalletRequest,
  responseType: walletunlocker_pb.UnlockWalletResponse
};

WalletUnlocker.ChangePassword = {
  methodName: "ChangePassword",
  service: WalletUnlocker,
  requestStream: false,
  responseStream: false,
  requestType: walletunlocker_pb.ChangePasswordRequest,
  responseType: walletunlocker_pb.ChangePasswordResponse
};

exports.WalletUnlocker = WalletUnlocker;

function WalletUnlockerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

WalletUnlockerClient.prototype.genSeed = function genSeed(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletUnlocker.GenSeed, {
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

WalletUnlockerClient.prototype.initWallet = function initWallet(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletUnlocker.InitWallet, {
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

WalletUnlockerClient.prototype.unlockWallet = function unlockWallet(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletUnlocker.UnlockWallet, {
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

WalletUnlockerClient.prototype.changePassword = function changePassword(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletUnlocker.ChangePassword, {
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

exports.WalletUnlockerClient = WalletUnlockerClient;


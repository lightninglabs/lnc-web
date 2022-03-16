// package: signrpc
// file: signrpc/signer.proto

var signrpc_signer_pb = require("../signrpc/signer_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Signer = (function () {
  function Signer() {}
  Signer.serviceName = "signrpc.Signer";
  return Signer;
}());

Signer.SignOutputRaw = {
  methodName: "SignOutputRaw",
  service: Signer,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.SignReq,
  responseType: signrpc_signer_pb.SignResp
};

Signer.ComputeInputScript = {
  methodName: "ComputeInputScript",
  service: Signer,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.SignReq,
  responseType: signrpc_signer_pb.InputScriptResp
};

Signer.SignMessage = {
  methodName: "SignMessage",
  service: Signer,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.SignMessageReq,
  responseType: signrpc_signer_pb.SignMessageResp
};

Signer.VerifyMessage = {
  methodName: "VerifyMessage",
  service: Signer,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.VerifyMessageReq,
  responseType: signrpc_signer_pb.VerifyMessageResp
};

Signer.DeriveSharedKey = {
  methodName: "DeriveSharedKey",
  service: Signer,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.SharedKeyRequest,
  responseType: signrpc_signer_pb.SharedKeyResponse
};

exports.Signer = Signer;

function SignerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

SignerClient.prototype.signOutputRaw = function signOutputRaw(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Signer.SignOutputRaw, {
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

SignerClient.prototype.computeInputScript = function computeInputScript(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Signer.ComputeInputScript, {
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

SignerClient.prototype.signMessage = function signMessage(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Signer.SignMessage, {
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

SignerClient.prototype.verifyMessage = function verifyMessage(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Signer.VerifyMessage, {
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

SignerClient.prototype.deriveSharedKey = function deriveSharedKey(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Signer.DeriveSharedKey, {
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

exports.SignerClient = SignerClient;


// package: walletrpc
// file: walletrpc/walletkit.proto

var walletrpc_walletkit_pb = require("../walletrpc/walletkit_pb");
var signrpc_signer_pb = require("../signrpc/signer_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var WalletKit = (function () {
  function WalletKit() {}
  WalletKit.serviceName = "walletrpc.WalletKit";
  return WalletKit;
}());

WalletKit.ListUnspent = {
  methodName: "ListUnspent",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ListUnspentRequest,
  responseType: walletrpc_walletkit_pb.ListUnspentResponse
};

WalletKit.LeaseOutput = {
  methodName: "LeaseOutput",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.LeaseOutputRequest,
  responseType: walletrpc_walletkit_pb.LeaseOutputResponse
};

WalletKit.ReleaseOutput = {
  methodName: "ReleaseOutput",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ReleaseOutputRequest,
  responseType: walletrpc_walletkit_pb.ReleaseOutputResponse
};

WalletKit.ListLeases = {
  methodName: "ListLeases",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ListLeasesRequest,
  responseType: walletrpc_walletkit_pb.ListLeasesResponse
};

WalletKit.DeriveNextKey = {
  methodName: "DeriveNextKey",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.KeyReq,
  responseType: signrpc_signer_pb.KeyDescriptor
};

WalletKit.DeriveKey = {
  methodName: "DeriveKey",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: signrpc_signer_pb.KeyLocator,
  responseType: signrpc_signer_pb.KeyDescriptor
};

WalletKit.NextAddr = {
  methodName: "NextAddr",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.AddrRequest,
  responseType: walletrpc_walletkit_pb.AddrResponse
};

WalletKit.ListAccounts = {
  methodName: "ListAccounts",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ListAccountsRequest,
  responseType: walletrpc_walletkit_pb.ListAccountsResponse
};

WalletKit.ImportAccount = {
  methodName: "ImportAccount",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ImportAccountRequest,
  responseType: walletrpc_walletkit_pb.ImportAccountResponse
};

WalletKit.ImportPublicKey = {
  methodName: "ImportPublicKey",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ImportPublicKeyRequest,
  responseType: walletrpc_walletkit_pb.ImportPublicKeyResponse
};

WalletKit.PublishTransaction = {
  methodName: "PublishTransaction",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.Transaction,
  responseType: walletrpc_walletkit_pb.PublishResponse
};

WalletKit.SendOutputs = {
  methodName: "SendOutputs",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.SendOutputsRequest,
  responseType: walletrpc_walletkit_pb.SendOutputsResponse
};

WalletKit.EstimateFee = {
  methodName: "EstimateFee",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.EstimateFeeRequest,
  responseType: walletrpc_walletkit_pb.EstimateFeeResponse
};

WalletKit.PendingSweeps = {
  methodName: "PendingSweeps",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.PendingSweepsRequest,
  responseType: walletrpc_walletkit_pb.PendingSweepsResponse
};

WalletKit.BumpFee = {
  methodName: "BumpFee",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.BumpFeeRequest,
  responseType: walletrpc_walletkit_pb.BumpFeeResponse
};

WalletKit.ListSweeps = {
  methodName: "ListSweeps",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.ListSweepsRequest,
  responseType: walletrpc_walletkit_pb.ListSweepsResponse
};

WalletKit.LabelTransaction = {
  methodName: "LabelTransaction",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.LabelTransactionRequest,
  responseType: walletrpc_walletkit_pb.LabelTransactionResponse
};

WalletKit.FundPsbt = {
  methodName: "FundPsbt",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.FundPsbtRequest,
  responseType: walletrpc_walletkit_pb.FundPsbtResponse
};

WalletKit.SignPsbt = {
  methodName: "SignPsbt",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.SignPsbtRequest,
  responseType: walletrpc_walletkit_pb.SignPsbtResponse
};

WalletKit.FinalizePsbt = {
  methodName: "FinalizePsbt",
  service: WalletKit,
  requestStream: false,
  responseStream: false,
  requestType: walletrpc_walletkit_pb.FinalizePsbtRequest,
  responseType: walletrpc_walletkit_pb.FinalizePsbtResponse
};

exports.WalletKit = WalletKit;

function WalletKitClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

WalletKitClient.prototype.listUnspent = function listUnspent(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ListUnspent, {
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

WalletKitClient.prototype.leaseOutput = function leaseOutput(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.LeaseOutput, {
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

WalletKitClient.prototype.releaseOutput = function releaseOutput(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ReleaseOutput, {
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

WalletKitClient.prototype.listLeases = function listLeases(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ListLeases, {
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

WalletKitClient.prototype.deriveNextKey = function deriveNextKey(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.DeriveNextKey, {
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

WalletKitClient.prototype.deriveKey = function deriveKey(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.DeriveKey, {
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

WalletKitClient.prototype.nextAddr = function nextAddr(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.NextAddr, {
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

WalletKitClient.prototype.listAccounts = function listAccounts(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ListAccounts, {
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

WalletKitClient.prototype.importAccount = function importAccount(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ImportAccount, {
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

WalletKitClient.prototype.importPublicKey = function importPublicKey(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ImportPublicKey, {
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

WalletKitClient.prototype.publishTransaction = function publishTransaction(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.PublishTransaction, {
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

WalletKitClient.prototype.sendOutputs = function sendOutputs(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.SendOutputs, {
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

WalletKitClient.prototype.estimateFee = function estimateFee(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.EstimateFee, {
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

WalletKitClient.prototype.pendingSweeps = function pendingSweeps(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.PendingSweeps, {
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

WalletKitClient.prototype.bumpFee = function bumpFee(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.BumpFee, {
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

WalletKitClient.prototype.listSweeps = function listSweeps(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.ListSweeps, {
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

WalletKitClient.prototype.labelTransaction = function labelTransaction(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.LabelTransaction, {
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

WalletKitClient.prototype.fundPsbt = function fundPsbt(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.FundPsbt, {
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

WalletKitClient.prototype.signPsbt = function signPsbt(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.SignPsbt, {
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

WalletKitClient.prototype.finalizePsbt = function finalizePsbt(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WalletKit.FinalizePsbt, {
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

exports.WalletKitClient = WalletKitClient;


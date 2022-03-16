// package: poolrpc
// file: auctioneerrpc/hashmail.proto

var auctioneerrpc_hashmail_pb = require("../auctioneerrpc/hashmail_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var HashMail = (function () {
  function HashMail() {}
  HashMail.serviceName = "poolrpc.HashMail";
  return HashMail;
}());

HashMail.NewCipherBox = {
  methodName: "NewCipherBox",
  service: HashMail,
  requestStream: false,
  responseStream: false,
  requestType: auctioneerrpc_hashmail_pb.CipherBoxAuth,
  responseType: auctioneerrpc_hashmail_pb.CipherInitResp
};

HashMail.DelCipherBox = {
  methodName: "DelCipherBox",
  service: HashMail,
  requestStream: false,
  responseStream: false,
  requestType: auctioneerrpc_hashmail_pb.CipherBoxAuth,
  responseType: auctioneerrpc_hashmail_pb.DelCipherBoxResp
};

HashMail.SendStream = {
  methodName: "SendStream",
  service: HashMail,
  requestStream: true,
  responseStream: false,
  requestType: auctioneerrpc_hashmail_pb.CipherBox,
  responseType: auctioneerrpc_hashmail_pb.CipherBoxDesc
};

HashMail.RecvStream = {
  methodName: "RecvStream",
  service: HashMail,
  requestStream: false,
  responseStream: true,
  requestType: auctioneerrpc_hashmail_pb.CipherBoxDesc,
  responseType: auctioneerrpc_hashmail_pb.CipherBox
};

exports.HashMail = HashMail;

function HashMailClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

HashMailClient.prototype.newCipherBox = function newCipherBox(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(HashMail.NewCipherBox, {
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

HashMailClient.prototype.delCipherBox = function delCipherBox(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(HashMail.DelCipherBox, {
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

HashMailClient.prototype.sendStream = function sendStream(metadata) {
  var listeners = {
    end: [],
    status: []
  };
  var client = grpc.client(HashMail.SendStream, {
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport
  });
  client.onEnd(function (status, statusMessage, trailers) {
    listeners.status.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners.end.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners = null;
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
      if (!client.started) {
        client.start(metadata);
      }
      client.send(requestMessage);
      return this;
    },
    end: function () {
      client.finishSend();
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

HashMailClient.prototype.recvStream = function recvStream(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(HashMail.RecvStream, {
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

exports.HashMailClient = HashMailClient;


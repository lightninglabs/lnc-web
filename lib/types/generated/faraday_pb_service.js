// package: frdrpc
// file: faraday.proto

var faraday_pb = require("./faraday_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var FaradayServer = (function () {
  function FaradayServer() {}
  FaradayServer.serviceName = "frdrpc.FaradayServer";
  return FaradayServer;
}());

FaradayServer.OutlierRecommendations = {
  methodName: "OutlierRecommendations",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.OutlierRecommendationsRequest,
  responseType: faraday_pb.CloseRecommendationsResponse
};

FaradayServer.ThresholdRecommendations = {
  methodName: "ThresholdRecommendations",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.ThresholdRecommendationsRequest,
  responseType: faraday_pb.CloseRecommendationsResponse
};

FaradayServer.RevenueReport = {
  methodName: "RevenueReport",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.RevenueReportRequest,
  responseType: faraday_pb.RevenueReportResponse
};

FaradayServer.ChannelInsights = {
  methodName: "ChannelInsights",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.ChannelInsightsRequest,
  responseType: faraday_pb.ChannelInsightsResponse
};

FaradayServer.ExchangeRate = {
  methodName: "ExchangeRate",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.ExchangeRateRequest,
  responseType: faraday_pb.ExchangeRateResponse
};

FaradayServer.NodeAudit = {
  methodName: "NodeAudit",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.NodeAuditRequest,
  responseType: faraday_pb.NodeAuditResponse
};

FaradayServer.CloseReport = {
  methodName: "CloseReport",
  service: FaradayServer,
  requestStream: false,
  responseStream: false,
  requestType: faraday_pb.CloseReportRequest,
  responseType: faraday_pb.CloseReportResponse
};

exports.FaradayServer = FaradayServer;

function FaradayServerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

FaradayServerClient.prototype.outlierRecommendations = function outlierRecommendations(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.OutlierRecommendations, {
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

FaradayServerClient.prototype.thresholdRecommendations = function thresholdRecommendations(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.ThresholdRecommendations, {
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

FaradayServerClient.prototype.revenueReport = function revenueReport(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.RevenueReport, {
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

FaradayServerClient.prototype.channelInsights = function channelInsights(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.ChannelInsights, {
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

FaradayServerClient.prototype.exchangeRate = function exchangeRate(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.ExchangeRate, {
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

FaradayServerClient.prototype.nodeAudit = function nodeAudit(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.NodeAudit, {
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

FaradayServerClient.prototype.closeReport = function closeReport(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(FaradayServer.CloseReport, {
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

exports.FaradayServerClient = FaradayServerClient;


// package: routerrpc
// file: routerrpc/router.proto

var routerrpc_router_pb = require("../routerrpc/router_pb");
var lightning_pb = require("../lightning_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Router = (function () {
  function Router() {}
  Router.serviceName = "routerrpc.Router";
  return Router;
}());

Router.SendPaymentV2 = {
  methodName: "SendPaymentV2",
  service: Router,
  requestStream: false,
  responseStream: true,
  requestType: routerrpc_router_pb.SendPaymentRequest,
  responseType: lightning_pb.Payment
};

Router.TrackPaymentV2 = {
  methodName: "TrackPaymentV2",
  service: Router,
  requestStream: false,
  responseStream: true,
  requestType: routerrpc_router_pb.TrackPaymentRequest,
  responseType: lightning_pb.Payment
};

Router.EstimateRouteFee = {
  methodName: "EstimateRouteFee",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.RouteFeeRequest,
  responseType: routerrpc_router_pb.RouteFeeResponse
};

Router.SendToRoute = {
  methodName: "SendToRoute",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.SendToRouteRequest,
  responseType: routerrpc_router_pb.SendToRouteResponse
};

Router.SendToRouteV2 = {
  methodName: "SendToRouteV2",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.SendToRouteRequest,
  responseType: lightning_pb.HTLCAttempt
};

Router.ResetMissionControl = {
  methodName: "ResetMissionControl",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.ResetMissionControlRequest,
  responseType: routerrpc_router_pb.ResetMissionControlResponse
};

Router.QueryMissionControl = {
  methodName: "QueryMissionControl",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.QueryMissionControlRequest,
  responseType: routerrpc_router_pb.QueryMissionControlResponse
};

Router.XImportMissionControl = {
  methodName: "XImportMissionControl",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.XImportMissionControlRequest,
  responseType: routerrpc_router_pb.XImportMissionControlResponse
};

Router.GetMissionControlConfig = {
  methodName: "GetMissionControlConfig",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.GetMissionControlConfigRequest,
  responseType: routerrpc_router_pb.GetMissionControlConfigResponse
};

Router.SetMissionControlConfig = {
  methodName: "SetMissionControlConfig",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.SetMissionControlConfigRequest,
  responseType: routerrpc_router_pb.SetMissionControlConfigResponse
};

Router.QueryProbability = {
  methodName: "QueryProbability",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.QueryProbabilityRequest,
  responseType: routerrpc_router_pb.QueryProbabilityResponse
};

Router.BuildRoute = {
  methodName: "BuildRoute",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.BuildRouteRequest,
  responseType: routerrpc_router_pb.BuildRouteResponse
};

Router.SubscribeHtlcEvents = {
  methodName: "SubscribeHtlcEvents",
  service: Router,
  requestStream: false,
  responseStream: true,
  requestType: routerrpc_router_pb.SubscribeHtlcEventsRequest,
  responseType: routerrpc_router_pb.HtlcEvent
};

Router.SendPayment = {
  methodName: "SendPayment",
  service: Router,
  requestStream: false,
  responseStream: true,
  requestType: routerrpc_router_pb.SendPaymentRequest,
  responseType: routerrpc_router_pb.PaymentStatus
};

Router.TrackPayment = {
  methodName: "TrackPayment",
  service: Router,
  requestStream: false,
  responseStream: true,
  requestType: routerrpc_router_pb.TrackPaymentRequest,
  responseType: routerrpc_router_pb.PaymentStatus
};

Router.HtlcInterceptor = {
  methodName: "HtlcInterceptor",
  service: Router,
  requestStream: true,
  responseStream: true,
  requestType: routerrpc_router_pb.ForwardHtlcInterceptResponse,
  responseType: routerrpc_router_pb.ForwardHtlcInterceptRequest
};

Router.UpdateChanStatus = {
  methodName: "UpdateChanStatus",
  service: Router,
  requestStream: false,
  responseStream: false,
  requestType: routerrpc_router_pb.UpdateChanStatusRequest,
  responseType: routerrpc_router_pb.UpdateChanStatusResponse
};

exports.Router = Router;

function RouterClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

RouterClient.prototype.sendPaymentV2 = function sendPaymentV2(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Router.SendPaymentV2, {
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

RouterClient.prototype.trackPaymentV2 = function trackPaymentV2(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Router.TrackPaymentV2, {
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

RouterClient.prototype.estimateRouteFee = function estimateRouteFee(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.EstimateRouteFee, {
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

RouterClient.prototype.sendToRoute = function sendToRoute(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.SendToRoute, {
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

RouterClient.prototype.sendToRouteV2 = function sendToRouteV2(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.SendToRouteV2, {
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

RouterClient.prototype.resetMissionControl = function resetMissionControl(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.ResetMissionControl, {
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

RouterClient.prototype.queryMissionControl = function queryMissionControl(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.QueryMissionControl, {
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

RouterClient.prototype.xImportMissionControl = function xImportMissionControl(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.XImportMissionControl, {
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

RouterClient.prototype.getMissionControlConfig = function getMissionControlConfig(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.GetMissionControlConfig, {
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

RouterClient.prototype.setMissionControlConfig = function setMissionControlConfig(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.SetMissionControlConfig, {
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

RouterClient.prototype.queryProbability = function queryProbability(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.QueryProbability, {
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

RouterClient.prototype.buildRoute = function buildRoute(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.BuildRoute, {
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

RouterClient.prototype.subscribeHtlcEvents = function subscribeHtlcEvents(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Router.SubscribeHtlcEvents, {
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

RouterClient.prototype.sendPayment = function sendPayment(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Router.SendPayment, {
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

RouterClient.prototype.trackPayment = function trackPayment(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Router.TrackPayment, {
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

RouterClient.prototype.htlcInterceptor = function htlcInterceptor(metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.client(Router.HtlcInterceptor, {
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
  client.onMessage(function (message) {
    listeners.data.forEach(function (handler) {
      handler(message);
    })
  });
  client.start(metadata);
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
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

RouterClient.prototype.updateChanStatus = function updateChanStatus(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Router.UpdateChanStatus, {
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

exports.RouterClient = RouterClient;


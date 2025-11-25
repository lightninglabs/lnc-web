import { Lightning } from '@lightninglabs/lnc-core/dist/types/proto/lnrpc';
import { WalletKit } from '@lightninglabs/lnc-core/dist/types/proto/walletrpc';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import LNC from '../lnc';
import { createRpc } from './createRpc';

// Mock the external dependency
vi.mock('@lightninglabs/lnc-core', () => ({
  subscriptionMethods: [
    'lnrpc.Lightning.SubscribeInvoices',
    'lnrpc.Lightning.SubscribeChannelEvents',
    'lnrpc.Lightning.ChannelAcceptor'
  ]
}));

// Create the mocked LNC instance
const mockLnc = {
  request: vi.fn(),
  subscribe: vi.fn()
} as unknown as Mocked<LNC>;

describe('RPC Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRpc function', () => {
    it('should create a proxy object', () => {
      const packageName = 'lnrpc.Lightning';
      const rpc = createRpc(packageName, mockLnc);

      expect(typeof rpc).toBe('object');
      expect(rpc).toBeInstanceOf(Object);
    });
  });

  describe('Proxy behavior', () => {
    const packageName = 'lnrpc.Lightning';
    let rpc: Lightning;

    beforeEach(() => {
      rpc = createRpc(packageName, mockLnc);
    });

    describe('Method name capitalization', () => {
      it('should capitalize method names correctly', () => {
        // Access a property to trigger the proxy get handler
        const method = rpc.getInfo;

        expect(typeof method).toBe('function');

        // Call the method to verify capitalization
        const request = { includeChannels: true };
        method(request);

        expect(mockLnc.request).toHaveBeenCalledWith(
          'lnrpc.Lightning.GetInfo',
          request
        );
      });

      it('should handle method names with numbers', () => {
        const method = (rpc as any).method123;

        const request = {};
        method(request);

        expect(mockLnc.request).toHaveBeenCalledWith(
          'lnrpc.Lightning.Method123',
          request
        );
      });
    });

    describe('Unary RPC methods', () => {
      it('should create async functions for non-subscription methods', async () => {
        const method = rpc.getInfo;
        expect(typeof method).toBe('function');

        const mockResponse = { identityPubkey: 'test' };
        mockLnc.request.mockResolvedValue(mockResponse);

        const request = {};
        const result = await method(request);

        expect(result).toBe(mockResponse);
        expect(mockLnc.request).toHaveBeenCalledWith(
          'lnrpc.Lightning.GetInfo',
          request
        );
      });

      it('should handle empty request objects', async () => {
        const method = rpc.getInfo;
        const request = {};

        mockLnc.request.mockResolvedValue({});

        await method(request);

        expect(mockLnc.request).toHaveBeenCalledWith(
          'lnrpc.Lightning.GetInfo',
          request
        );
      });
    });

    describe('Streaming RPC methods (subscriptions)', () => {
      it('should create subscription functions for streaming methods', () => {
        // Test with SubscribeInvoices which is in subscriptionMethods
        const method = rpc.subscribeInvoices;

        expect(typeof method).toBe('function');

        const request = { addIndex: '1' };
        const callback = vi.fn();
        const errCallback = vi.fn();

        method(request, callback, errCallback);

        expect(mockLnc.subscribe).toHaveBeenCalledWith(
          'lnrpc.Lightning.SubscribeInvoices',
          request,
          callback,
          errCallback
        );
      });

      it('should create subscription functions for ChannelAcceptor', () => {
        const method = rpc.channelAcceptor;

        expect(typeof method).toBe('function');

        const request = {};
        const callback = vi.fn();
        const errCallback = vi.fn();

        method(request, callback, errCallback);

        expect(mockLnc.subscribe).toHaveBeenCalledWith(
          'lnrpc.Lightning.ChannelAcceptor',
          request,
          callback,
          errCallback
        );
      });
    });

    describe('Method classification', () => {
      it('should handle different package names correctly', () => {
        const walletRpc = createRpc<WalletKit>('lnrpc.WalletKit', mockLnc);
        const method = walletRpc.listUnspent;

        const request = { minConfs: 1 };
        method(request);

        expect(mockLnc.request).toHaveBeenCalledWith(
          'lnrpc.WalletKit.ListUnspent',
          request
        );
      });
    });

    describe('Error handling', () => {
      it('should handle LNC request errors', async () => {
        const method = rpc.getInfo;
        const error = new Error('RPC Error');
        mockLnc.request.mockRejectedValueOnce(error);

        const request = {};
        await expect(method(request)).rejects.toThrow('RPC Error');
      });
    });
  });
});

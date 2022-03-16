'use strict';
var expect = require('chai').expect;
var LNC = require('../dist/index.js').default;

describe('init tests', () => {
    it('properly initialize wasmClient properties', () => {
        const pairingPhrase = 'artefact morning piano photo consider light';
        const wasmClient = new LNC({
            pairingPhrase
        });
        expect(wasmClient._pairingPhrase).to.equal(pairingPhrase);
        expect(wasmClient._serverHost).to.equal('mailbox.terminal.lightning.today:443');
        expect(wasmClient._wasmClientCode).to.equal('https://dev-website.example/wasm-client.wasm');
    });
});

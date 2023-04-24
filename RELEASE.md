# lnc-web Release Process

This document describes the steps needed to release a new version of
`@lightninglabs/lnc-web` and publish the package to the NPM registry.

We typically release a new version of `lnc-web` whenever a new version of
`lnc-core` has been released. We want to keep the version numbers in sync
for both packages.

The steps below to should be done in a PR with proper review.

## Update WASM binary CDN URL

In [lnc.ts](https://github.com/lightninglabs/lnc-web/blob/main/lib/lnc.ts),
update the default `wasmClientCode` property to point to the latest version
of the WASM binary which should have been published to the
https://lightning.engineering website.

## Update lnc-core version

Run the following command in the root dir of the project to update to the
latest version of `@lightninglabs/lnc-core`.

```sh
$ yarn upgrade @lightninglabs/lnc-core@latest
```

## Versioning

Increment the version number in the
[package.json](https://github.com/lightninglabs/lnc-web/blob/main/package.json)
file to match the latest version of `@lightninglabs/lnc-core`. If we need to bump 
the version of `lnc-web` without requiring a new version of 
`lightning-node-connect` or `lnc-core`, we should append an incrementing number 
to the end of the version. For example, 
[v0.1.11-alpha.1](https://github.com/lightninglabs/lnc-web/releases/tag/v0.1.11-alpha.1).

## Publishing to NPM

Building and publishing the this package to NPM is handled automatically by
the [npm.yml](https://github.com/lightninglabs/lnc-web/blob/main/.github/workflows/npm.yml)
Github workflow. This is triggered when a new release is created.

## Github Release

[Draft a new release](https://github.com/lightninglabs/lnc-web/releases/new)
on Github. Create a new tag and auto-generate the release notes. You do not
need to include any assets.

Once you publish the release, the build and publish to NPM will complete in
a few minutes. You can confirm the new version is published by visiting
https://www.npmjs.com/package/@lightninglabs/lnc-web

## Post Release

After the release has been published, remember to update the demo apps to use
the latest version of `@lightninglabs/lnc-web`.

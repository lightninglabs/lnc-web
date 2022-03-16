#!/bin/bash -x
# Generate typescript definitions and service definitions from proto file

set -e

# LND_RELEASE_TAG=$1
# PROTOC_VERSION=$2

LND_RELEASE_TAG="v0.14.2-beta"
LOOP_RELEASE_TAG="v0.17.0-beta"
POOL_RELEASE_TAG="v0.5.5-alpha"
FARADAY_RELEASE_TAG="v0.2.5-alpha"

PROTOC_VERSION="3.15.8"

# Sanitize all proto files prior to type generation
rm -f *.proto
# ts-node scripts/proto-sanitizer.ts "protos/lnd/${LND_RELEASE_TAG}/**/*.proto"
# ts-node scripts/proto-sanitizer.ts "protos/loop/${LOOP_RELEASE_TAG}/**/*.proto"

# Copy google definitions
# cp -r protos/google/. protos/lnd/${LND_RELEASE_TAG}/google

GENERATED_TYPES_DIR=lib/types/generated
if [ -d "$GENERATED_TYPES_DIR" ]
then
    rm -rf "$GENERATED_TYPES_DIR"
fi
mkdir -p "$GENERATED_TYPES_DIR"

# Download and install protoc
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     platform=Linux;;
    Darwin*)    platform=Mac;;
    *)          platform="UNKNOWN:${unameOut}"
esac

mkdir -p protoc
if [[ $platform == 'Linux' ]]; then
    PROTOC_URL="https://github.com/google/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-linux-x86_64.zip"
elif [[ $platform == 'Mac' ]]; then
    PROTOC_URL="https://github.com/google/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-osx-x86_64.zip"
else
    echo "Cannot download protoc. ${platform} is not currently supported by ts-protoc-gen"
    exit 1
fi

curl -L ${PROTOC_URL} -o "protoc-${PROTOC_VERSION}.zip"
unzip "protoc-${PROTOC_VERSION}.zip" -d protoc
rm "protoc-${PROTOC_VERSION}.zip"

# Run protoc
echo "LND: running protoc..."
protoc/bin/protoc \
  --proto_path=protos/lnd/${LND_RELEASE_TAG} \
  --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
  --ts_out=service=grpc-web:$GENERATED_TYPES_DIR \
  --js_out=import_style=commonjs,binary:$GENERATED_TYPES_DIR \
  lightning.proto \
  walletunlocker.proto \
  autopilotrpc/autopilot.proto \
  chainrpc/chainnotifier.proto \
  invoicesrpc/invoices.proto \
  routerrpc/router.proto \
  signrpc/signer.proto \
  walletrpc/walletkit.proto \
  watchtowerrpc/watchtower.proto \
  wtclientrpc/wtclient.proto

echo "LOOP: running protoc..."
protoc/bin/protoc \
  --proto_path=protos/loop/${LOOP_RELEASE_TAG} \
  --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
  --ts_out=service=grpc-web:$GENERATED_TYPES_DIR \
  --js_out=import_style=commonjs,binary:$GENERATED_TYPES_DIR \
  client.proto \
  debug.proto \
  swapserverrpc/common.proto

echo "POOL: running protoc..."
protoc/bin/protoc \
  --proto_path=protos/pool/${POOL_RELEASE_TAG} \
  --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
  --ts_out=service=grpc-web:$GENERATED_TYPES_DIR \
  --js_out=import_style=commonjs,binary:$GENERATED_TYPES_DIR \
  trader.proto \
  auctioneerrpc/auctioneer.proto \
  auctioneerrpc/hashmail.proto

echo "FARADY: running protoc..."
protoc/bin/protoc \
  --proto_path=protos/faraday/${FARADAY_RELEASE_TAG} \
  --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
  --ts_out=service=grpc-web:$GENERATED_TYPES_DIR \
  --js_out=import_style=commonjs,binary:$GENERATED_TYPES_DIR \
  faraday.proto

# Cleanup proto directory/files
rm -rf *.proto protoc

# Remove 'List' from all generated Array type names
ts-node scripts/clean-repeated.ts

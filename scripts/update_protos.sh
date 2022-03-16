# RPC Servers
LND_URL="https://raw.githubusercontent.com/lightningnetwork/lnd"
LND_RELEASE_TAG="v0.14.2-beta"

LOOP_URL="https://raw.githubusercontent.com/lightninglabs/loop"
LOOP_RELEASE_TAG="v0.17.0-beta"

POOL_URL="https://raw.githubusercontent.com/lightninglabs/pool"
POOL_RELEASE_TAG="v0.5.5-alpha"

FARADAY_URL="https://raw.githubusercontent.com/lightninglabs/faraday"
FARADAY_RELEASE_TAG="v0.2.5-alpha"

curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/lightning.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/lightning.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/walletunlocker.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/walletunlocker.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/autopilotrpc/autopilot.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/autopilotrpc/autopilot.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/chainrpc/chainnotifier.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/chainrpc/chainnotifier.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/invoicesrpc/invoices.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/invoicesrpc/invoices.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/routerrpc/router.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/routerrpc/router.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/signrpc/signer.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/signrpc/signer.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/walletrpc/walletkit.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/walletrpc/walletkit.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/watchtowerrpc/watchtower.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/watchtowerrpc/watchtower.proto
curl ${LND_URL}/${LND_RELEASE_TAG}/lnrpc/wtclientrpc/wtclient.proto --create-dirs -o protos/lnd/${LND_RELEASE_TAG}/wtclientrpc/wtclient.proto

# Clean Invoices RPC Server
# sed -i '' 's/import "google\/api\/annotations\.proto";//g' protos/lnd/${LND_RELEASE_TAG}/invoicesrpc/invoices.proto

curl ${LOOP_URL}/${LOOP_RELEASE_TAG}/looprpc/client.proto --create-dirs -o protos/loop/${LOOP_RELEASE_TAG}/client.proto
curl ${LOOP_URL}/${LOOP_RELEASE_TAG}/looprpc/debug.proto --create-dirs -o protos/loop/${LOOP_RELEASE_TAG}/debug.proto
curl ${LOOP_URL}/${LOOP_RELEASE_TAG}/swapserverrpc/common.proto --create-dirs -o protos/loop/${LOOP_RELEASE_TAG}/swapserverrpc/common.proto
curl ${LOOP_URL}/${LOOP_RELEASE_TAG}/swapserverrpc/server.proto --create-dirs -o protos/loop/${LOOP_RELEASE_TAG}/swapserverrpc/server.proto

curl ${POOL_URL}/${POOL_RELEASE_TAG}/poolrpc/trader.proto --create-dirs -o protos/pool/${POOL_RELEASE_TAG}/trader.proto
curl ${POOL_URL}/${POOL_RELEASE_TAG}/auctioneerrpc/auctioneer.proto --create-dirs -o protos/pool/${POOL_RELEASE_TAG}/auctioneerrpc/auctioneer.proto
curl ${POOL_URL}/${POOL_RELEASE_TAG}/auctioneerrpc/hashmail.proto --create-dirs -o protos/pool/${POOL_RELEASE_TAG}/auctioneerrpc/hashmail.proto

curl ${FARADAY_URL}/${FARADAY_RELEASE_TAG}/frdrpc/faraday.proto --create-dirs -o protos/faraday/${FARADAY_RELEASE_TAG}/faraday.proto

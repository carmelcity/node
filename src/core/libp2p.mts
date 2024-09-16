import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { floodsub } from '@libp2p/floodsub'
import { noise } from '@chainsafe/libp2p-noise'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { bootstrap } from '@libp2p/bootstrap'
import { webRTC } from '@libp2p/webrtc'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { ping } from '@libp2p/ping'
import { kadDHT } from '@libp2p/kad-dht'

export const makeRelayNode = async ({
    peerId, port, announce, server
}: any) => createLibp2p({
    peerId,
    addresses: Object.assign({
        listen: [
            `/ip4/0.0.0.0/tcp/${port}/wss`,
        ]
    }, announce && { announce }),
    transports: [
        tcp(),
        circuitRelayTransport(),
        webSockets(Object.assign({
            filter: filters.all
        }, server && { server }))
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex(), yamux()],
    services: {
        pubsub: floodsub(),
        identify: identify(),
        relay: circuitRelayServer()
    }
})

export const makeSentinelNode = async ({
    peerId, relays, datastore
}: any) => createLibp2p({
    peerId,
    addresses: {
        listen: [
          '/webrtc',
        ]
    },
    peerDiscovery: [
        bootstrap({
            list: relays
        })
    ],
    transports: [
        circuitRelayTransport({
            discoverRelays: 1
        }),
        webRTC(),
        webSockets({
            filter: filters.all
        })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex(), yamux()],
    services: {
        ping: ping(),
        dht: kadDHT({
        }),
        pubsub: gossipsub(),
        identify: identify(),
    },  
    connectionManager: {
        maxConnections: 10,
        minConnections: 1,
        autoDialInterval: Infinity,
        inboundUpgradeTimeout: 10000
    },
})
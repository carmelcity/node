import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
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
import dotenv from 'dotenv'
import path from 'path'
import { createNodeKey } from 'src/utils/main.mts'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const makeRelayNode = async ({
    announce, server
}: any) => {
    const { privateKey }: any = await createNodeKey()

    return createLibp2p({
        privateKey,
        addresses: Object.assign({
            listen: [
                '/webrtc',
            ]
        }, announce && { announce }),
        transports: [
            tcp(),
            webRTC(),
            circuitRelayTransport(),
            webSockets(Object.assign({
                filter: filters.all
            }, server && { server }))
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            pubsub: gossipsub(),
            identify: identify(),
            relay: circuitRelayServer()
        }
    })
}

export const makeSentinelNode = async ({
    relays
}: any) => {
    const { privateKey }: any = await createNodeKey()

    const node = createLibp2p({
        privateKey,
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
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            ping: ping(),
            dht: kadDHT({
            }),
            pubsub: gossipsub(),
            identify: identify(),
        },  
        connectionManager: {
            maxConnections: 10,
            inboundUpgradeTimeout: 10000
        }
    })

    return node
}
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { webRTC } from '@libp2p/webrtc'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { ping } from '@libp2p/ping'
import dotenv from 'dotenv'
import path from 'path'
import { createNodeKey } from 'src/utils/main.mts'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const getRelays = async () => {
    const relays = [{
        domain: `r0.carmel.network`,
        port: 9009,
        peerId: `16Uiu2HAkzoD7NHWgVP8zJkSTubA4wrHSUphY7CMy736mamBDcemZ`
    }]

    const parsed = relays.map((relay: any) => `/dns4/${relay.domain}/tcp/${relay.port}/wss/p2p/${relay.peerId}`)

    return [
        ...parsed,

    ]
}

export const makeRelayNode = async ({
    announce, server, port
}: any) => {
    const { privateKey }: any = await createNodeKey()

    return createLibp2p({
        privateKey,
        start: true,
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
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            pubsub: gossipsub(),
            identify: identify(),
            relay: circuitRelayServer()
        }
    })
}

export const makeSentinelNode = async () => {
    const { privateKey }: any = await createNodeKey()

    return createLibp2p({
        privateKey,
        start: true,
        addresses: {
            listen: [
                '/webrtc',
            ]
        },
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
            pubsub: gossipsub(),
            identify: identify()
        },  
        connectionManager: {
            maxConnections: 10,
            inboundUpgradeTimeout: 10000
        }
    })
}
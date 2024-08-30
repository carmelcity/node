import path from 'path'
import dotenv from 'dotenv'
import { mplex } from '@libp2p/mplex'
import { createLibp2p } from 'libp2p'
import { webRTC } from '@libp2p/webrtc'
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from '@libp2p/identify'
import { floodsub } from '@libp2p/floodsub'
import { noise } from '@chainsafe/libp2p-noise'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import * as filters from '@libp2p/websockets/filters'
import { getPeerId, logger } from '../utils/main.mjs'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`
dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

const getRelays = async () => {
    const relays = [{
        domain: `r0.carmel.network`,
        port: 443,
        peerId: `16Uiu2HAkzoD7NHWgVP8zJkSTubA4wrHSUphY7CMy736mamBDcemZ`
    }]

    return relays.map((relay: any) => `/dns4/${relay.domain}/tcp/${relay.port}/wss/p2p/${relay.peerId}`)
}

export const start = async () => {
    const peerId = await getPeerId()
    logger(`Starting sentinel with peerId=${peerId} ...`)
    const relays = await getRelays()

    const node = await createLibp2p({
        peerId,
        addresses: Object.assign({
            listen: [
                `/webrtc`
            ]
        }),
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
            pubsub: floodsub(),
            identify: identify(),
        }
    })

    await node.start()
    console.log(`node started with id ${node.peerId.toString()}`)

    node.addEventListener('self:peer:update', (evt) => {
        console.log(evt)
    })
}
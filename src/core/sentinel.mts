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
import { multiaddr } from '@multiformats/multiaddr'
import { fromString, toString } from 'uint8arrays'
import { tcp } from '@libp2p/tcp'
import { mdns } from '@libp2p/mdns'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { kadDHT } from '@libp2p/kad-dht'
import { ping } from '@libp2p/ping'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`
dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

const getRelays = async () => {
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

const checkPeers = async (node: any) => {
    setTimeout(async () => {
        const peers = node.getPeers()
        // const subscribers = node.services.pubsub.getSubscribers('carmel')
        const meshPeers = node.services.pubsub.getPeers()
        // console.log("subscribers", subscribers.length)

        if (!peers || peers.length == 0) {
            console.log("no peers yet")
        } else {
            console.log(`${peers.length} peers`)
            // peers.map((peer: any) => {
            //     console.log("peer:", peer.toString())
            // })
        }

        if (!meshPeers || meshPeers.length == 0) {
            console.log("no meshPeers yet")
        } else {
            console.log(`${meshPeers.length} pubsub peers`)
            // meshPeers.map((meshPeer: any) => {
            //     console.log("meshPeer:", meshPeer.toString())
            // })
            // const msg = await node.services.pubsub.publish('carmel', fromString('test'))
            // console.log('sent msg')
        }

        await checkPeers(node)
    }, 2000)
}

export const start = async () => {
    const peerId = await getPeerId()
    logger(`Starting sentinel with peerId=${peerId} ...`)
    const relays = await getRelays()

    const node = await createLibp2p({
        peerId,
        addresses: {
            listen: [
              '/webrtc',
        //       '/ip4/0.0.0.0/tcp/0'
            ]
        },
        peerDiscovery: [
            // mdns(),
            bootstrap({
                list: relays
            })
        ],
        transports: [
            // tcp(),
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

    await node.start()

    console.log(`node started with id ${node.peerId.toString()}`)

    // node.services.pubsub.subscribe('carmel')
    // node.services.pubsub.addEventListener('message', async  (e: any) => {
    //     console.log("got message", e.detail)
    // })

    // node.addEventListener('self:peer:update', (evt: any) => {
    //     console.log(evt.detail)
    // })

    // const conn = await node.dial(multiaddr(relays[0]))
    // console.log(`Connected to the relay ${conn.remotePeer.toString()}`)

    node.services.pubsub.subscribe('carmel')  
    node.services.pubsub.addEventListener('message', (message: any) => {
        console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data))
    })

    // node.services.pubsub.publish('fruit', new TextEncoder().encode('banana'))

    node.addEventListener('self:peer:update', (evt) => {
        // Updated self multiaddrs?
        console.log(`Advertising with a relay address of ${node.getMultiaddrs()[0].toString()}`)
    })

    // if (peerId.toString() != "16Uiu2HAkvUBD3qThYptWx7eKm9xUCUtiPpBGLojaKU8aymv2wvqE") {
    //     const conn2 = await node.dial(multiaddr(`/dns4/r0.carmel.network/tcp/9009/wss/p2p/16Uiu2HAkzoD7NHWgVP8zJkSTubA4wrHSUphY7CMy736mamBDcemZ/p2p-circuit/p2p/16Uiu2HAkvUBD3qThYptWx7eKm9xUCUtiPpBGLojaKU8aymv2wvqE`))
    //     console.log(`Connected to the ppeer ${conn2.remotePeer.toString()}`)
    // }

    node.addEventListener('peer:discovery', (evt: any) => {
        console.log("discovered peer", evt.detail)
    })

    node.addEventListener('peer:connect', (evt: any) => {
        console.log("connected to peer", evt.detail)
    })

    node.addEventListener('peer:disconnect', (evt: any) => {
        console.log("disconnected from peer", evt.detail)
    })

    await checkPeers(node)
}
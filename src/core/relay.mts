import path from 'path'
import https from 'https'
import fs from 'fs-extra'
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
import dotenv from 'dotenv'
import { getPeerId, logger } from '../utils/main.mjs'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

const checkPeers = async (node: any) => {
    setTimeout(async () => {
        const peers = node.getPeers()
        const meshPeers = node.services.pubsub.getPeers()
        const subscribers = node.services.pubsub.getSubscribers('carmel')

        if (!peers || peers.length == 0) {
            console.log("no peers yet")
        } else {
            console.log(`${peers.length} peers`)
            peers.map((peer: any) => {
                console.log(peer)
            })
        }

        if (!meshPeers || meshPeers.length == 0) {
            console.log("no meshPeers yet")
        } else {
            console.log(`${meshPeers.length} meshPeers`)
            meshPeers.map((peer: any) => {
                console.log(peer)
            })
        }

        if (subscribers && subscribers.length > 0) {
            await node.services.pubsub.publish('carmel',  new TextEncoder().encode('hello from relay'))
            console.log(`sent message to ${subscribers.length} subscribers`)
        }

        await checkPeers(node)
    }, 2000)
}

export const start = async () => {
    const peerId = await getPeerId()

    const MAIN_SSL_NAME = `${process.env.MAIN_SSL_NAME}`
    const MAIN_SSL_DOMAIN = `${process.env.MAIN_SSL_DOMAIN}`
    const MAIN_SSL_PORT = `${process.env.MAIN_SSL_PORT}`

    const sslCertFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${MAIN_SSL_NAME}.cert`)
    const sslKeyFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${MAIN_SSL_NAME}.key`)

    if (!fs.existsSync(sslCertFile) || !fs.existsSync(sslKeyFile)) {
        logger(`error: could not find ssl certificate`)
        return
    }

    const cert: any = fs.readFileSync(sslCertFile, 'utf8')
    const key = fs.readFileSync(sslKeyFile, 'utf8')    
    const server = https.createServer({ cert, key })
    const announce = [`/dns4/${MAIN_SSL_DOMAIN}/tcp/${MAIN_SSL_PORT}/wss/p2p/${peerId}`]
    
    logger(`Starting relay with peerId=${peerId} ...`)

    const node = await createLibp2p({
        peerId,
        addresses: Object.assign({
            listen: [
                `/ip4/0.0.0.0/tcp/${MAIN_SSL_PORT}/wss`,
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

    await node.start()

    const listenAddrs = node.getMultiaddrs()
    
    if (!listenAddrs || listenAddrs.length == 0) {
        await node.stop()
        logger(`could not listen, stopped.`)
        return 
    }

    listenAddrs.map((addr: any) => {
        logger(`listening on ${addr} ...`)
    })

    console.log(`node started with id ${node.peerId.toString()}`)


    node.services.pubsub.subscribe('carmel')  
    
    node.services.pubsub.addEventListener('message', (message: any) => {
        console.log(`[${message.detail.topic}]:`, new TextDecoder().decode(message.detail.data))
    })

    node.addEventListener('self:peer:update', (evt: any) => {
        console.log("me:", evt.detail)
    })

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
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
                `/ip4/127.0.0.1/tcp/${MAIN_SSL_PORT}/wss`,
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
}
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { tcp } from '@libp2p/tcp'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import * as filters from '@libp2p/websockets/filters'
import { webRTC } from '@libp2p/webrtc'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { ping } from '@libp2p/ping'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { logger, createNodeId } from '../utils/index.mjs'
import https from 'https'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`
const CARMEL_NODE_TYPE = `${process.env.CARMEL_NODE_TYPE}`
const CARMEL_NODE_DOMAIN = `${process.env.MAIN_SSL_DOMAIN}`
const CARMEL_NODE_PORT = `${process.env.MAIN_SSL_PORT}`
const CARMEL_IPFS_ROOT = path.resolve(CARMEL_HOME, 'ipfs')
const CARMEL_BLOCKSTORE_ROOT = path.resolve(CARMEL_IPFS_ROOT, 'blockstore')
const CARMEL_DATASTORE_ROOT = path.resolve(CARMEL_IPFS_ROOT, 'datastore')

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

/**
 * 
 * @returns 
 */
const nodeType = () => {
    return CARMEL_NODE_TYPE
}

const loadSSL = async () => {
    const sslName = `${process.env.MAIN_SSL_NAME}`

    const sslCertFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${sslName}.cert`)
    const sslKeyFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${sslName}.key`)

    if (!fs.existsSync(sslCertFile) || !fs.existsSync(sslKeyFile)) {
        logger(`error: could not find ssl certificate`)
        return
    }

    const cert: any = fs.readFileSync(sslCertFile, 'utf8')
    const key = fs.readFileSync(sslKeyFile, 'utf8')    
    
    return {
        cert, key
    }
}

/**
 * 
 * @param privateKey
 * @param peerId
 * @param ssl
 * @returns 
 */
const relayConfig = ({
    privateKey, peerId, ssl,
}: any) => {
    const announce = [`/dns4/${CARMEL_NODE_DOMAIN}/tcp/${CARMEL_NODE_PORT}/wss/p2p/${peerId}`]
    const server = https.createServer(ssl)

    return { 
        p2p: {
            privateKey,
            start: true,
            addresses: Object.assign({
                listen: [
                    `/ip4/0.0.0.0/tcp/${CARMEL_NODE_PORT}/wss`,
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
        }
    }
}

/**
 * 
 * @param privateKey 
 * @returns 
 */
const sentinalConfig = ({
    privateKey
}: any) => {
    return {
        p2p: {
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
        }
    }
}

/**
 * 
 * @returns 
 */
export const makeConfig = async (): Promise<any> => {
    fs.existsSync(CARMEL_IPFS_ROOT) || fs.mkdirpSync(CARMEL_IPFS_ROOT)
    fs.existsSync(CARMEL_BLOCKSTORE_ROOT) || fs.mkdirpSync(CARMEL_BLOCKSTORE_ROOT)
    fs.existsSync(CARMEL_DATASTORE_ROOT) || fs.mkdirpSync(CARMEL_DATASTORE_ROOT)

    const type = nodeType()
    const { peerId, privateKey }: any = await createNodeId()
    const blockstore = new FsBlockstore(CARMEL_BLOCKSTORE_ROOT)
    const datastore = new FsDatastore(CARMEL_DATASTORE_ROOT)

    const base = { 
        peerId, type, blockstore, datastore
    }

    switch(type) {
        case "relay":
            const ssl: any = await loadSSL()
            
            if (!ssl) {
                logger("error: ssl required for relays")
                return 
            }

            return { ...base, ...relayConfig({ privateKey, peerId, ssl })}
        case "sentinel":
            return {...base, ...sentinalConfig({ privateKey })}
    }
}
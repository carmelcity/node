import path from 'path'
import https from 'https'
import dotenv from 'dotenv'
import { makeRelayNode } from 'src/core/libp2p.mts'
import { logger, createNodeKey } from '../utils/main.mjs'
import { loadSSL } from './config.mts'
import { startSession } from 'src/index.mts'
import { FsBlockstore } from 'blockstore-fs'
import { createHelia } from 'helia'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const start = async () => {
    const { peerId }: any = await createNodeKey()

    const domain = `${process.env.MAIN_SSL_DOMAIN}`
    const port = `${process.env.MAIN_SSL_PORT}`

    const ssl: any = await loadSSL()
    
    if (!ssl) {
        return
    }

    const server = https.createServer(ssl)
    const announce = [`/dns4/${domain}/tcp/${port}/wss/p2p/${peerId}`]
    
    logger(`starting relay (peerId=${peerId}) ...`)
    const ipfsRoot = path.resolve(CARMEL_HOME, 'ipfs')

    const libp2p: any = await makeRelayNode({
        announce, port, server
    })

    await libp2p.start()
    const blockstore = new FsBlockstore(path.resolve(ipfsRoot, 'blockstore'))

    const node = await createHelia({
        libp2p,
        blockstore
    })

    const listenAddrs = libp2p.getMultiaddrs()
    
    if (!listenAddrs || listenAddrs.length == 0) {
        await libp2p.stop()
        logger(`relay could not listen`)
        return 
    }

    listenAddrs.map((addr: any) => {
        logger(`relay listening on ${addr} ...`)
    })

    logger(`relay started with id ${libp2p.peerId.toString()}`)

    // start the session
    await startSession(node, 'relay')
}
import path from 'path'
import https from 'https'
import dotenv from 'dotenv'
import { makeRelayNode } from 'src/core/libp2p.mts'
import { getPeerId, logger } from '../utils/main.mjs'
import { loadSSL } from './config.mts'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const start = async () => {
    const peerId = await getPeerId()

    const domain = `${process.env.MAIN_SSL_DOMAIN}`
    const port = `${process.env.MAIN_SSL_PORT}`

    const ssl: any = await loadSSL()
    
    if (!ssl) {
        return
    }

    const server = https.createServer(ssl)
    const announce = [`/dns4/${domain}/tcp/${port}/wss/p2p/${peerId}`]
    
    logger(`starting relay with peerId=${peerId} ...`)

    const node = await makeRelayNode({
        peerId, announce, port, server
    })

    await node.start()

    const listenAddrs = node.getMultiaddrs()
    
    if (!listenAddrs || listenAddrs.length == 0) {
        await node.stop()
        logger(`relay could not listen`)
        return 
    }

    listenAddrs.map((addr: any) => {
        logger(`relay listening on ${addr} ...`)
    })

    logger(`relay started with id ${node.peerId.toString()}`)
}
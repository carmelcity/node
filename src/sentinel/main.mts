import path from 'path'
import dotenv from 'dotenv'
import { makeSentinelNode } from '../core/libp2p.mts'
import { createNodeKey, logger } from '../utils/main.mjs'
import { startSession } from '../index.mts'
import { createHelia } from 'helia'
import { FsBlockstore } from 'blockstore-fs'

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

export const start = async () => {
    const ipfsRoot = path.resolve(CARMEL_HOME, 'ipfs')
    const { peerId } = await createNodeKey()

    logger(`starting sentinel (peerId=${peerId}) ...`)

    const relays = await getRelays()
    
    const blockstore = new FsBlockstore(path.resolve(ipfsRoot, 'blockstore'))

    const libp2p: any = await makeSentinelNode({
        relays
    })

    await libp2p.start()

    logger(`sentinel started with id ${libp2p.peerId.toString()}`)
    
    const node = await createHelia({
        libp2p,
        blockstore
    })

    // start the session
    await startSession(node)
}
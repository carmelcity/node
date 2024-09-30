import path from 'path'
import dotenv from 'dotenv'
import { makeSentinelNode } from '../core/libp2p.mts'
import { createNodeKey, logger } from '../utils/main.mjs'
import { startSession } from '../index.mts'
import { createHelia } from 'helia'
import { FsBlockstore } from 'blockstore-fs'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const start = async () => {
    const ipfsRoot = path.resolve(CARMEL_HOME, 'ipfs')
    const { peerId } = await createNodeKey()

    logger(`starting sentinel (peerId=${peerId}) ...`)
     
    const blockstore = new FsBlockstore(path.resolve(ipfsRoot, 'blockstore'))

    const libp2p: any = await makeSentinelNode()

    logger(`sentinel started with id ${libp2p.peerId.toString()}`)
    
    const node = await createHelia({
        libp2p,
        blockstore
    })

    // start the session
    return startSession(node)
}
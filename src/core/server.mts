import { logger } from '../utils/index.mjs'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { makeConfig } from './config.mts'
import { session } from "@carmel/core"

export const startServer = async () => {
    const nodeConfig = await makeConfig()
    
    if (!nodeConfig) {
        logger('Error: could not make the config')
        return 
    }

    const { blockstore, datastore } = nodeConfig

    const libp2p: any = await createLibp2p(nodeConfig.p2p)
    const instance = await createHelia({
        libp2p,
        blockstore, 
        datastore
    })

    await session.start(instance, nodeConfig.type, logger)
}
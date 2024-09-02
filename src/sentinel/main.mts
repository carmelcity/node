import path from 'path'
import dotenv from 'dotenv'
import { makeSentinelNode } from 'src/core/libp2p.mts'
import { getPeerId, logger } from '../utils/main.mjs'
import { startSentinelSession } from 'src/index.mts'

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
    const peerId = await getPeerId()

    logger(`starting sentinel with peerId=${peerId} ...`)

    const relays = await getRelays()

    const node = await makeSentinelNode({
        peerId, relays
    })

    await node.start()

    logger(`sentinel started with id ${node.peerId.toString()}`)

    // start the session
    await startSentinelSession(node)
}
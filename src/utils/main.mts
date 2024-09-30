import debug from 'debug'
import dotenv from 'dotenv'
import path from 'path'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

const LOG = debug('carmel')
const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const logger = (msg: string, func: string = '') => msg.trim() && (func ? LOG(`[${func}]`, msg) : LOG(msg))

export const stopWithError = (msg: string, func: string = '') => {
    logger(`Error: ${msg}`, func)
    process.exit(1)
}

export const createNodeKey = async () => {
    const MAIN_ETH_PRIVATE_KEY = `${process.env.MAIN_ETH_PRIVATE_KEY}`
    const privateKeyBytes = Buffer.from(MAIN_ETH_PRIVATE_KEY.substring(2), 'hex')
    const privateKey = privateKeyFromRaw(privateKeyBytes)
    const peerId: any = await peerIdFromPrivateKey(privateKey)

    return { privateKey, peerId }
}
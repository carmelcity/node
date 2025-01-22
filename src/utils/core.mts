import dotenv from 'dotenv'
import path from 'path'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import debug from 'debug'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`
const LOG = debug('carmel')

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

/**
 * 
 * @returns 
 */
export const createNodeId = async () => {
    const MAIN_ETH_PRIVATE_KEY = `${process.env.MAIN_ETH_PRIVATE_KEY}`
    const privateKeyBytes = Buffer.from(MAIN_ETH_PRIVATE_KEY.substring(2), 'hex')
    const privateKey = privateKeyFromRaw(privateKeyBytes)
    const peerId: any = peerIdFromPrivateKey(privateKey)

    return { privateKey, peerId }
}

/**
 * 
 * @param msg 
 * @param func 
 * @returns 
 */
export const logger = (msg: string, func: string = '') => (func ? LOG(`[${func}]`, msg) : LOG(msg))

/**
 * 
 * @param msg 
 * @param func 
 */
export const error = (msg: string, func: string = '') => {
    logger(`Error: ${msg}`, func)
}
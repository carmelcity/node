import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { keys } from '@libp2p/crypto'
import debug from 'debug'
import dotenv from 'dotenv'
import path from 'path'

const LOG = debug('carmel')
const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const logger = (msg: string, func: string = '') => msg.trim() && (func ? LOG(`[${func}]`, msg) : LOG(msg))

export const stopWithError = (msg: string, func: string = '') => {
    logger(`Error: ${msg}`, func)
    process.exit(1)
}

export const getPeerId = async () => {
    const MAIN_ETH_PRIVATE_KEY = `${process.env.MAIN_ETH_PRIVATE_KEY}`
    const { unmarshalSecp256k1PrivateKey } = keys.supportedKeys.secp256k1
    const privateKey = unmarshalSecp256k1PrivateKey(Buffer.from(MAIN_ETH_PRIVATE_KEY.substring(2), 'hex'))
    const peerId = await createFromPrivKey(privateKey)

    return peerId
}
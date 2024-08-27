import path from 'path'
import https from 'https'
import fs from 'fs-extra'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { floodsub } from '@libp2p/floodsub'
import { noise } from '@chainsafe/libp2p-noise'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { keys } from '@libp2p/crypto'
import dotenv from 'dotenv'
import { JSONFilePreset } from 'lowdb/node'
import { logger } from '@/utils/main.mjs'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const start = () => {
    const MAIN_ETH_PRIVATE_KEY = `${process.env.MAIN_ETH_PRIVATE_KEY}`
   
    const { unmarshalSecp256k1PrivateKey } = keys.supportedKeys.secp256k1
    const peerId = unmarshalSecp256k1PrivateKey(Buffer.from(MAIN_ETH_PRIVATE_KEY.substring(2), 'hex'))

    console.log({
        MAIN_ETH_PRIVATE_KEY,
        peerId
    })

    logger(`Starting node with peerId=${peerId} ...`)
}
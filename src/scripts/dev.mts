import { utils, relay, sentinel } from '../index.mts'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs-extra'

const start = async () => {
    const CARMEL_HOME = `${process.env.CARMEL_HOME}`

    dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

    const CARMEL_NODE_TYPE = `${process.env.CARMEL_NODE_TYPE}`
   
    const ipfsRoot = path.resolve(CARMEL_HOME, 'ipfs')
    fs.existsSync(ipfsRoot) || fs.mkdirpSync(ipfsRoot)

    switch(CARMEL_NODE_TYPE) {
        case "relay":
            return relay.start()
        case "sentinel":
            return sentinel.start()
    }

    utils.logger(`invalid node type`)
}

(async () => {
   await start()
})()
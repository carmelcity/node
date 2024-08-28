import { relay, sentinel, utils } from '../index.mts'
import path from 'path'
import dotenv from 'dotenv'

const start = async () => {
    const CARMEL_HOME = `${process.env.CARMEL_HOME}`

    dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

    const CARMEL_NODE_TYPE = `${process.env.CARMEL_NODE_TYPE}`
    
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
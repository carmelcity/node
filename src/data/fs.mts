import { unixfs } from "@helia/unixfs"
import { jsonToBytes } from "../utils/data.mts"
import { logger } from "../utils/main.mts"
import { CID } from 'multiformats/cid'
import { dagJson } from '@helia/dag-json'
import { broadcastSwarmJSON, broadcastSwarmObject, broadcastSwarmFile } from "../core/messenger.mts"
import { dagCbor } from '@helia/dag-cbor'
import dotenv from 'dotenv'
import path from 'path'
import fsx from 'fs-extra'

let fs: any = undefined
let node: any = undefined
let json: any = undefined
let nodeType: string = "sentinel"
let cbor: any = undefined

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const initialize = async (n: any, nType: string = "sentinel") => {
    node = n
    fs = unixfs(node)
    json = dagJson(node)
    cbor = dagCbor(node)

    nodeType = nType

    logger(`initialized ✓`, 'fs')
}

export const putFile = async (filename: string) => {
    const file = path.resolve(CARMEL_HOME, 'cache', filename)
    
    if (!fs.existsSync(file)) {
        return 
    }

    const bytes = fsx.readFileSync(file, null)
    const res = await cbor.add(bytes)

    const cid = res.toString()

    logger(`→ sent file (${cid} ${filename}) ✓`, 'fs')
    
    await broadcastSwarmFile(node, { cid, filename }, nodeType)

    return cid
}

export const putObject = async (data: any) => {
    const res = await cbor.add(data)
    const cid = res.toString()

    logger(`→ sent object (${cid}) ✓`, 'fs')
    
    await broadcastSwarmObject(node, { cid }, nodeType)

    return cid
}

export const putJSON = async (data: any) => {
    const res = await json.add(data)
    const cid = res.toString()

    logger(`→ sent json (${cid}) ✓`, 'fs')
    
    await broadcastSwarmJSON(node, { cid }, nodeType)

    return cid
}

export const onObjectReceived = async (message: any) => {
    logger(`← got1 object (${message.data.cid}) ✓`, 'fs')
    const obj = await cbor.get(CID.parse(message.data.cid));
    logger(`← got2 object (${message.data.cid}) ✓`, 'fs')

    console.log("---", obj)
}

export const onJSONReceived = async (message: any) => {
    logger(`← got1 json (${message.data.cid}) ✓`, 'fs')
    const obj = await json.get(CID.parse(message.data.cid));
    logger(`← got2 json (${message.data.cid}) ✓`, 'fs')

    console.log("---", obj)
}

export const onFileReceived = async (message: any) => {
    logger(`← got1 file (${message.data.cid}) ✓`, 'fs')
    const obj = await cbor.get(CID.parse(message.data.cid));
    logger(`← got2 file (${message.data.cid}) ✓`, 'fs')
    
    console.log("---", obj)
}
import { unixfs } from "@helia/unixfs"
import { jsonToBytes } from "../utils/data.mts"
import { logger } from "../utils/main.mts"
import { CID } from 'multiformats/cid'
import { dagJson } from '@helia/dag-json'
import { broadcastSwarmJSONFile } from "../core/messenger.mts"

let fs: any = undefined
let node: any = undefined
let json: any = undefined
let nodeType: string = "sentinel"

export const initialize = async (n: any, nType: string = "sentinel") => {
    node = n
    fs = unixfs(node)
    json = dagJson(node)
    nodeType = nType

    logger(`initialized ✓`, 'fs')
}

export const putJSON = async (data: any) => {
    const cid = await json.add(data)

    logger(`→ sent json (${cid}) ✓`, 'fs')

    await broadcastSwarmJSONFile(node, { cid }, nodeType)

    return cid.toString()
}

export const onJSONReceived = async (message: any) => {
    logger(`← got json (${message.data.cid}) ✓`, 'fs')
    const obj = await json.get(CID.parse(message.data.cid));

    console.log(obj)
}
import { unixfs } from "@helia/unixfs"
import { jsonToBytes } from "../utils/data.mts"
import { logger } from "../utils/main.mts"
import { CID } from 'multiformats/cid'
import { dagJson } from '@helia/dag-json'

let fs: any = undefined
let node: any = undefined
let json: any = undefined

export const initialize = async (n: any) => {
    node = n
    fs = unixfs(node)
    json = dagJson(node)

    logger(`initialized ✓`, 'fs')
}

export const putObject = async (data: any) => {
    const cid = await json.add(data)

    logger(`sent data (${cid}) ✓`, 'fs')

    return cid.toString()
}

export const getObject = async (cid: string) => {
    const obj = await json.get(CID.parse(cid));
   
    console.log(obj)

    return obj
}
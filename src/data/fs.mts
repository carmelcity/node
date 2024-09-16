import { unixfs } from "@helia/unixfs"
import { jsonToBytes } from "../utils/data.mts"
import { logger } from "../utils/main.mts"
import { CID } from 'multiformats/cid'

let fs: any = undefined
let node: any = undefined

export const initialize = async (n: any) => {
    node = n
    fs = unixfs(node)

    logger(`initialized ✓`, 'fs')
}

export const putObject = async (data: any) => {
    const cid = await fs.addBytes(jsonToBytes(data))
    // const cid = await j.add(JSON.stringify(obj));

    logger(`sent data (${cid}) ✓`, 'fs')

    return cid
}

export const getObject = async (cid: string) => {
    // const decoder = new TextDecoder()
    // let text = ''

    const obj = await fs.get(CID.parse(cid))

    // for await (const chunk of fs.cat(cid)) {
    //     text += decoder.decode(chunk, {
    //         stream: true
    //     })
    // }

    return obj
}
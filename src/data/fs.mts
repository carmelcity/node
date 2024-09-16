import { unixfs } from "@helia/unixfs"
import { jsonToBytes } from "../utils/data.mts"
import { logger } from "../utils/main.mts"

let fs: any = undefined
let node: any = undefined

export const initialize = async (n: any) => {
    node = n
    fs = unixfs(node)

    logger(`initialized ✓`, 'fs')
}

export const broadcastJSON = async (data: any) => {
    const cid = await fs.addBytes(jsonToBytes(data))

    // for await (const event of node.libp2p.services.dht.provide(cid)) {
    //     console.log(event)
    // }

    logger(`sent data (${cid}) ✓`, 'fs')

    return cid
}

export const readRaw = async (cid: any) => {
    const decoder = new TextDecoder()
    let text = ''

    for await (const chunk of fs.cat(cid)) {
        text += decoder.decode(chunk, {
            stream: true
        })
    }

    return text
}
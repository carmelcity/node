import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'
import { base64 } from "multiformats/bases/base64"
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'
import { toUint8Array } from 'js-base64'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const jsonToBytes = (data: any) => {
    return json.encode(data)
}

export const jsonToCID = async (data: any) => {
    const bytes = json.encode(data)
    // const hashRaw = await sha256.digest(bytes)
    // const hash = Buffer.from(hashRaw.bytes).toString('hex')
    // const v1 = CID.create(1, json.code, hashRaw).toString()
    // const v0 = CID.createV0(hashRaw).toString()

    // return { v1, v0, hash }
}

export const cacheFileToCID = async (filename: string) => {
    const file = path.resolve(CARMEL_HOME, 'cache', filename)
    
    if (!fs.existsSync(file)) {
        return 
    }

    const bytes = fs.readFileSync(file, null)
    const hashRaw = await sha256.digest(bytes)
    const hash = Buffer.from(hashRaw.bytes).toString('hex')
    const v1 = CID.create(1, json.code, hashRaw).toString()
    const v0 = CID.createV0(hashRaw).toString()
 
    return { v1, v0, hash }
}

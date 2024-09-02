import path from 'path'
import fs from 'fs-extra'
import { logger } from '../utils/main.mjs'
import dotenv from 'dotenv'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

export const loadSSL = async () => {
    const sslName = `${process.env.MAIN_SSL_NAME}`

    const sslCertFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${sslName}.cert`)
    const sslKeyFile = path.resolve(CARMEL_HOME, '.carmel', 'ssl', `${sslName}.key`)

    if (!fs.existsSync(sslCertFile) || !fs.existsSync(sslKeyFile)) {
        logger(`error: could not find ssl certificate`)
        return
    }

    const cert: any = fs.readFileSync(sslCertFile, 'utf8')
    const key = fs.readFileSync(sslKeyFile, 'utf8')    
    
    return {
        cert, key
    }
}
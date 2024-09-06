import * as Y from 'yjs'
import { JSONFilePreset } from 'lowdb/node'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { fromUint8Array, toUint8Array } from 'js-base64'
import { logger } from '../utils/main.mts'

const CARMEL_HOME = `${process.env.CARMEL_HOME}`

dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

let main = new Y.Doc()

const dbRoot = path.resolve(CARMEL_HOME, 'db')
const mainDbFile = path.resolve(dbRoot, 'main.db.json')
// const messagesDbFile = path.resolve(dbRoot, 'messages.json')

export const initialize = async () => {
    fs.existsSync(dbRoot) || fs.mkdirpSync(dbRoot)

    if (!fs.existsSync(mainDbFile)) {
        // first time
        logger("initialized without history", "db")
        return 
    }

    logger("initialized with history", "db")

    const mainDb = await JSONFilePreset(mainDbFile, {} as any)
    const { stateBase64 } = mainDb.data
    const state = toUint8Array(stateBase64)

    Y.applyUpdate(main, state)
    // await saveModel()
}

export let addToCollection = async (msg: any, col: string) => {
   const now = `${Date.now()}`

   let messages = main.getArray(col)
   messages.push([{ ...msg, now }])

   await saveDb()
//    await saveModel()

   logger(`added a new element to [${col}] (new total ${messages.length})`, 'db')
}

export const getState = () => {
    const state = Y.encodeStateAsUpdate(main)
    const stateBase64 = fromUint8Array(state)
    const timestamp = `${Date.now()}`

    return { stateBase64, timestamp }
}

export let saveDb = async () => {
    const mainDb = await JSONFilePreset(mainDbFile, {} as any)
    const state = getState()

    mainDb.data = state

    await mainDb.write()
}

// export let saveModel = async () => {
//     const messages = main.getArray('messages').toArray()
//     const messagesDb = await JSONFilePreset(messagesDbFile, {} as any)
//     messagesDb.data = messages

//     await messagesDb.write()
// }

// import { PGlite } from "@electric-sql/pglite"
// import { adminpack } from '@electric-sql/pglite/contrib/adminpack'
// import { amcheck } from '@electric-sql/pglite/contrib/amcheck'
// import { bloom } from '@electric-sql/pglite/contrib/bloom'
// import { auto_explain } from '@electric-sql/pglite/contrib/auto_explain'
// import { btree_gin } from '@electric-sql/pglite/contrib/btree_gin';
// import path from 'path'
// import dotenv from 'dotenv'

// const CARMEL_HOME = `${process.env.CARMEL_HOME}`

// dotenv.config({ path: path.resolve(CARMEL_HOME, '.env') })

// const db = new PGlite(path.resolve(CARMEL_HOME, 'db'), {
//     extensions: { adminpack, amcheck, bloom, auto_explain, btree_gin }
// })

// await db.query("select 'Hello world' as message;");

// await db.exec(`
//     CREATE TABLE IF NOT EXISTS nodes (
//       id SERIAL PRIMARY KEY,
//       hash TEXT,
//       type
//       done BOOLEAN DEFAULT false
//     );
//     INSERT INTO todo (task, done) VALUES ('Install PGlite from NPM', true);
//     INSERT INTO todo (task, done) VALUES ('Load PGlite', true);
//     INSERT INTO todo (task, done) VALUES ('Create a table', true);
//     INSERT INTO todo (task, done) VALUES ('Insert some data', true);
//     INSERT INTO todo (task) VALUES ('Update a task');
// `)

// const ret = await db.query(`
//     SELECT * from nodes WHERE id = 1;
// `)

// const ret = await db.query(
//     'UPDATE todo SET task = $2, done = $3 WHERE id = $1',
//     [5, 'Update a task using parametrised queries', true],
// )
import { db, fs } from '../data/index.mts'
import { logger } from 'src/utils/main.mts'
import { onMessageReceived, broadcastSwarmPresence } from '../core/messenger.mts'
import Bree from 'bree'

const TICK_TIME_SEC = 1
let timer: any = undefined
let counter: number = 0
let stopSession: boolean = false 
let bree: any = undefined

export let swarm: any = {}

const nextTick = async () => {    
    console.log(counter)
    // const swarmers = node.libp2p.services.pubsub.getSubscribers('carmel:swarm')
    // console.log(swarmers)

    // if (swarmers && swarmers.length > 0) {
    //     await broadcastSwarmPresence(node, nodeType)
    //     await pruneSwarm()

    //     // await fs.putJSON({ from: `${node.libp2p.peerId}`, now: `${Date.now()}` })
    //     await fs.putFile("landscape-lg.webp")
    // }

    counter++
}

const pruneSwarm = async () => {
    const peerIds = Object.keys(swarm)

    logger(`✓ pruned swarm (new size ${peerIds.length})`, 'session')

    peerIds.map((peerId: any) => {
        logger(`  → peer ${peerId}`, 'session')
    })
}

export const getSwarmPeer = (peerId: string) => {
    return swarm[peerId]
}

export const addPeerToSwarm = (peerId: string, data: any = {}) => {
    if (getSwarmPeer(peerId)) {
        logger(`${peerId} is already part of the swarm`, 'session')
        return 
    }

    const since = `${Date.now()}`
    swarm[peerId] = ({ peerId, since, ...data })
}

export const updateSwarmPeer = async (peerId: string, data: any = { }) => {
    let peer = getSwarmPeer(peerId)

    if (!peer) {
        return addPeerToSwarm(peerId, data)
    }

    const lastUpdate = `${Date.now()}`
    swarm[peerId] = { ...peer, ...data, lastUpdate }

    logger(`✓ updated swarm peer ${peerId} (new swarm size: ${Object.keys(swarm).length})`, 'session')
}

export const removePeerFromSwarm = (peerId: string) => {
    if (!getSwarmPeer(peerId)) {
        logger(`${peerId} is not part of the swarm`, 'session')
        return 
    }

    delete swarm[peerId]

    logger(`✓ removed ${peerId} from the swarm`, 'session')
}

export const startSession = async (node: any, nodeType: string = "sentinel") => {
    node.libp2p.services.pubsub.subscribe(`carmel:swarm`)  
    node.libp2p.services.pubsub.addEventListener('message', onMessageReceived(node, nodeType))
    
    await db.initialize()
    await fs.initialize(node, nodeType)

    node.libp2p.addEventListener('peer:discovery', (evt: any) => {
        const peer = evt.detail
        console.log(`discovered peer ${peer.id.toString()}`)
    })
}
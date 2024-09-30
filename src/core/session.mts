import { db, fs } from '../data/index.mts'
import { logger } from 'src/utils/main.mts'
import { onMessageReceived, broadcastSwarmPresence, broadcastSwarmObject } from '../core/messenger.mts'
import Bree from 'bree'

const TICK_TIME_SEC = 3
let counter: number = 0

export let swarm: any = {}

const doNextTick =  async (node: any, nodeType: string = "sentinel") => {    
    setTimeout(async () => {
        await nextTick(node, nodeType)
    }, TICK_TIME_SEC * 1000)
}

const nextTick = async (node: any, nodeType: string = "sentinel") => {    
    const swarmers = node.libp2p.services.pubsub.getSubscribers('carmel:swarm')
    counter++

    if (!swarmers || swarmers.length <= 0) {
        logger('no swarmers yet', 'session')
        return doNextTick(node, nodeType)
    }

    logger(`found ${swarmers.length} swarmers`)

    await broadcastSwarmPresence(node, nodeType)
    await pruneSwarm()

    await fs.putJSON({ from: `${node.libp2p.peerId}`, now: `${Date.now()}` })
    // await fs.putFile("landscape-lg.webp")

   return doNextTick(node, nodeType)
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

    logger('started', 'session')

    return doNextTick(node, nodeType)
}
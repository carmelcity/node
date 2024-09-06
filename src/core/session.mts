import { onMessageReceived, broadcastSwarmPresence } from '../core/messenger.mts'
import { db } from '../data/index.mts'
import { logger } from 'src/utils/main.mts'

const TICK_TIME_SEC = 10

export let swarm: any = {}

const pruneSwarm = async () => {
    const peerIds = Object.keys(swarm)

    logger(`pruned swarm (new size ${peerIds.length})`, 'session')
}

const nextTick = async (node: any, nodeType: string) => {    
    const swarmers = node.services.pubsub.getSubscribers('carmel:swarm')
    
    if (swarmers && swarmers.length > 0) {
        await broadcastSwarmPresence(node, nodeType)
        await pruneSwarm()
    }

    setTimeout(async () => {
        await nextTick(node, nodeType)
    }, TICK_TIME_SEC * 1000)
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

    logger(`updated swarm peer ${peerId} (new swarm size: ${Object.keys(swarm).length})`, 'session')
}

export const removePeerFromSwarm = (peerId: string) => {
    if (!getSwarmPeer(peerId)) {
        logger(`${peerId} is not part of the swarm`, 'session')
        return 
    }

    delete swarm[peerId]

    logger(`remove ${peerId} from the swarm`, 'session')
}

export const startSession = async (node: any, nodeType: string = "sentinel") => {
    node.services.pubsub.subscribe(`carmel:swarm`)  
    node.services.pubsub.subscribe(`carmel:swarm:${node.peerId}`)  

    node.services.pubsub.addEventListener('message', onMessageReceived(node, nodeType))
    
    await db.initialize()

    await nextTick(node, nodeType)
}
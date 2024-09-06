import { onMessageReceived, broadcastSwarmPresence } from '../core/messenger.mts'
import { db } from '../data/index.mts'
import { logger } from 'src/utils/main.mts'

const TICK_TIME_SEC = 5

export let swarm: any = {}

const nextTick = async (node: any, nodeType: string) => {
    // const { peers, pubsubPeers, subscribers } = await nodeStatus(node, nodeType)
    
    const swarmers = node.services.pubsub.getSubscribers('carmel:swarm')
    
    if (swarmers && swarmers.length > 0) {
        await broadcastSwarmPresence(node, nodeType)
    }

    setTimeout(async () => {
        await nextTick(node, nodeType)
    }, TICK_TIME_SEC * 1000)
}

// export const nodeStatus = async (node: any, nodeType: string) => {
//     const peers = node.getPeers()
//     const pubsubPeers = node.services.pubsub.getPeers()

//     const subscribers = {
//         sync: node.services.pubsub.getSubscribers('carmel:swarm'),
//         me:  node.services.pubsub.getSubscribers(`carmel:swarm:${node.peerId}`)
//     }

//     return {
//         pubsubPeers, peers, subscribers
//     }
// }

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

export const updateSwarmPeer = (peerId: string, data: any = { }) => {
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
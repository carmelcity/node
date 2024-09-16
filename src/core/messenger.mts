import { logger } from "src/utils/main.mts"
import { getSwarmPeer, updateSwarmPeer } from "./session.mts"
import { getState } from "../data/db.mts"
import { fs } from '../data/index.mts'

export const broadcastSwarmPresence = async (node: any, nodeType: string = "sentinel") => {
    const msg =  {
        senderId: `${node.libp2p.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        channel: "swarm",
        messageType: "present"
    }

    await node.libp2p.services.pubsub.publish('carmel:swarm', new TextEncoder().encode(JSON.stringify(msg)))
    logger('✓ broadcasted swarm presence', 'messenger')
}

export const broadcastSwarmPeerSync = async (node: any, nodeType: string = "sentinel", peerId: string) => {
    const state = await getState()
    const msg =  {
        senderId: `${node.libp2p.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        channel: "swarm",
        messageType: "sync",
        data: { state, peerId }
    }

    await node.libp2p.services.pubsub.publish(`carmel:swarm`, new TextEncoder().encode(JSON.stringify(msg)))
    logger(`✓ broadcasted swarm peer sync with ${peerId}`, 'messenger')
}

export const broadcastSwarmJSONFile = async (node: any, data: any, nodeType: string = "sentinel") => {
    const state = await getState()
    const msg =  {
        senderId: `${node.libp2p.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        channel: "swarm",
        messageType: "json",
        data: { ...data }
    }

    await node.libp2p.services.pubsub.publish(`carmel:swarm`, new TextEncoder().encode(JSON.stringify(msg)))
    logger(`✓ broadcasted swarm file`, 'messenger')
}

const onSwarmPresenceReceived = async (node: any, nodeType: string, message: any) => {
    const { senderId, senderType } = message

    await updateSwarmPeer(senderId, {
        peerId: senderId,
        nodeType: senderType,
        status: "new"
    })

    return broadcastSwarmPeerSync(node, nodeType, senderId)
}

const onSwarmPeerSyncReceived = async (node: any, nodeType: string, message: any) => {
    const { senderId, data } = message

    const peer = getSwarmPeer(senderId)

    if (!peer || !data || !data.peerId || !data.state) {
        return 
    }

    const { peerId, state } = data 
    await updateSwarmPeer(peerId, { status: "synced" })

    // console.log(message)

    // await broadcastSwarmPresence(node, nodeType)
    // return updateSwarmPeer(senderId, {
    //     peerId: senderId,
    //     nodeType: senderType
    // })
}

export const onMessageReceived = (node: any, nodeType: string = "sentinel") => (message: any) => {
    const { detail } = message
    const { topic } = detail 
    const dataString = new TextDecoder().decode(detail.data)
    const data = JSON.parse(dataString)

    const { senderId, senderType, messageType, channel } = data 
    logger(`✓ got [${topic}] message (channel=${channel} senderId=${senderId} senderType=${senderType} messageType=${messageType})`, 'messenger')

    if (channel == "swarm" && messageType == "present") {
        return onSwarmPresenceReceived(node, nodeType, data)
    }

    if (channel == "swarm" && messageType == "sync") {
        return onSwarmPeerSyncReceived(node, nodeType, data)
    }

    if (channel == "swarm" && messageType == "json") {
        return fs.onJSONReceived(data)
    }
}
 
import { logger } from "src/utils/main.mts"
import { updateSwarmPeer } from "./session.mts"
import { getState } from "../data/db.mts"

export const broadcastSwarmPresence = async (node: any, nodeType: string = "sentinel") => {
    const msg =  {
        senderId: `${node.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        channel: "swarm",
        messageType: "present"
    }

    await node.services.pubsub.publish('carmel:swarm', new TextEncoder().encode(JSON.stringify(msg)))
    logger('broadcasted swarm presence', 'messenger')
}

export const syncSwarmPeer = async (node: any, nodeType: string = "sentinel", peerId: string) => {
    const state = await getState()
    const msg =  {
        senderId: `${node.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        channel: "swarm",
        messageType: "sync",
        data: { state, peerId }
    }

    await node.services.pubsub.publish(`carmel:swarm`, new TextEncoder().encode(JSON.stringify(msg)))
    logger(`synced swarm peer ${peerId}`, 'messenger')
}

const onSwarmPresenceReceived = async (node: any, nodeType: string, message: any) => {
    const { senderId, senderType } = message

    await updateSwarmPeer(senderId, {
        peerId: senderId,
        nodeType: senderType,
        status: "new"
    })

    return syncSwarmPeer(node, nodeType, senderId)
}

const onSwarmPeerSyncReceived = async (node: any, nodeType: string, message: any) => {
    const { senderId, senderType } = message

    console.log(message)
    
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
    logger(`got [${topic}] message (channel=${channel} senderId=${senderId} senderType=${senderType} messageType=${messageType})`, 'messenger')

    if (channel == "swarm" && messageType == "present") {
        return onSwarmPresenceReceived(node, nodeType, data)
    }

    if (channel == "swarm" && messageType == "sync") {
        return onSwarmPeerSyncReceived(node, nodeType, data)
    }
}
 
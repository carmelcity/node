import { logger } from "src/utils/main.mts"
import { updateSwarmPeer } from "./session.mts"

const onSwarmPresenceReceived = async (message: any) => {
    const { senderId, senderType } = message

    return updateSwarmPeer(senderId, {
        peerId: senderId,
        nodeType: senderType
    })
}

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

// export const respondWithPing = async (node: any, nodeType: string, peerId: string) => {
//     const ping =  {
//         senderId: `${node.peerId}`,
//         senderType: nodeType,
//         timestamp: `${Date.now()}`,
//         messageType: "ping"
//     }

//     node.services.pubsub.subscribe(`carmel:${peerId}`)  
//     await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify(ping)))

//     logger(`send ping back to ${peerId}`, 'messenger')
// }


// export const acknowledgePing = async (node: any, nodeType: string, peerId: string) => {
//     const ping =  {
//         senderId: `${node.peerId}`,
//         senderType: nodeType,
//         timestamp: `${Date.now()}`,
//         messageType: "ackping"
//     }

//     node.services.pubsub.subscribe(`carmel:${peerId}`)  
//     await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify(ping)))

//     logger(`acknowledged ping from ${peerId}`, 'messenger')
// }

export const onMessageReceived = (node: any, nodeType: string = "sentinel") => (message: any) => {
    const { detail } = message
    const { topic } = detail 
    const dataString = new TextDecoder().decode(detail.data)
    const data = JSON.parse(dataString)

    const { senderId, senderType, messageType, channel } = data 
    logger(`got [${topic}] message (channel=${channel} senderId=${senderId} senderType=${senderType} messageType=${messageType})`, 'messenger')

    if (channel == "swarm" && messageType == "present") {
        return onSwarmPresenceReceived(data)
    }
}
 
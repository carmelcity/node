import { addToCollection, getState } from "../data/db.mts"
import { logger } from "src/utils/main.mts"

export const broadcastPong = async (node: any, nodeType: string = "sentinel") => {
    const pong =  {
        senderId: `${node.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        messageType: "pong"
    }

    await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify(pong)))
    logger('broadcasted pong', 'messenger')
}

export const respondWithPing = async (node: any, nodeType: string, peerId: string) => {
    const ping =  {
        senderId: `${node.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        messageType: "ping"
    }

    node.services.pubsub.subscribe(`carmel:${peerId}`)  
    await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify(ping)))

    logger(`send ping back to ${peerId}`, 'messenger')
}


export const acknowledgePing = async (node: any, nodeType: string, peerId: string) => {
    const ping =  {
        senderId: `${node.peerId}`,
        senderType: nodeType,
        timestamp: `${Date.now()}`,
        messageType: "ackping"
    }

    node.services.pubsub.subscribe(`carmel:${peerId}`)  
    await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify(ping)))

    logger(`acknowledged ping from ${peerId}`, 'messenger')
}

export const onMessageReceived = (node: any, nodeType: string = "sentinel") => (message: any) => {
    const { detail } = message
    const { topic } = detail 
    const dataString = new TextDecoder().decode(detail.data)
    const data = JSON.parse(dataString)

    const { senderId, senderType, messageType, timestamp } = data
    logger(`got [${topic}] message (senderId=${senderId} senderType=${senderType} messageType=${messageType})`, 'messenger')

    switch(messageType) {
        case "pong":
            return respondWithPing(node, nodeType, senderId)
        case "ping":
            return acknowledgePing(node, nodeType, senderId)
    }
}
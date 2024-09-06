import { addToCollection, getState } from "../data/db.mts"

export const sendRelayMessage = async (node: any, message: any) => {
    const msg =  { ...message, 
        senderId: `${node.peerId}`,
        senderType: 'relay'
    }

    // await addSentinalMessage(msg)
    // await node.services.pubsub.publish('carmel', new TextEncoder().encode(JSON.stringify(msg)))
}

export const sendSentinelMessage = async (node: any, message: any) => {
    const msg =  { ...message, 
        senderId: `${node.peerId}`,
        senderType: 'relay'
    }

    await addToCollection(msg, 'messages')
    const state = getState()

    await node.services.pubsub.publish('carmel:sync', new TextEncoder().encode(JSON.stringify({
        ...message, 
        state,
        senderId: `${node.peerId}`,
        senderType: 'sentinel' 
    })))
}

export const onRelayMessageReceived = (message: any) => {
    const { detail } = message
    const { topic } = detail 
    const dataString = new TextDecoder().decode(detail.data)
    const data = JSON.parse(dataString)

    console.log(`Got relay message on ${topic} topic:`)
    console.log(data)
}

export const onSentinelMessageReceived = (message: any) => {
    const { detail } = message
    const { topic } = detail 
    const dataString = new TextDecoder().decode(detail.data)
    const data = JSON.parse(dataString)

    console.log(`Got sentinel message on ${topic} topic:`)
    console.log(data)
}
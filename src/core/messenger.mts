export const sendRelayMessage = async (node: any, message: any) => {
    await node.services.pubsub.publish('carmel', new TextEncoder().encode(JSON.stringify({ 
        ...message, 
        senderId: `${node.peerId}`,
        senderType: 'relay' 
    })))
}

export const sendSentinelMessage = async (node: any, message: any) => {
    await node.services.pubsub.publish('carmel', new TextEncoder().encode(JSON.stringify({
        ...message, 
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
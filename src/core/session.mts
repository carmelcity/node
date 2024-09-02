import { onRelayMessageReceived, onSentinelMessageReceived, sendRelayMessage, sendSentinelMessage } from 'src/core/messenger.mts'

const TICK_TIME_SEC = 5

export const nodeStatus = async (node: any) => {
    const peers = node.getPeers()
    const pubsubPeers = node.services.pubsub.getPeers()
    const subscribers = node.services.pubsub.getSubscribers('carmel')

    return {
        pubsubPeers, peers, subscribers
    }
}

const nextRelayTick = async (node: any) => {
    setTimeout(async () => {
        const { peers, pubsubPeers, subscribers } = await nodeStatus(node)
        
        if (subscribers && subscribers.length > 0) {
            await sendRelayMessage(node, { message: 'hello from relay' })
        }

        console.log(`relay status: ${peers.length} peers, ${pubsubPeers.length} pubsub peers, ${subscribers.length} subscribers`)

        await nextRelayTick(node)
    }, TICK_TIME_SEC * 1000)
}

const nextSentinelTick = async (node: any) => {
    setTimeout(async () => {
        const { peers, pubsubPeers, subscribers } = await nodeStatus(node)
        
        if (subscribers && subscribers.length > 0) {
            await sendSentinelMessage(node, { message: 'hello from sentinel' })
        }

        console.log(`sentinel status: ${peers.length} peers, ${pubsubPeers.length} pubsub peers, ${subscribers.length} subscribers`)

        await nextSentinelTick(node)
    }, TICK_TIME_SEC * 1000)
}

export const startRelaySession = async (node: any) => {
    node.services.pubsub.subscribe('carmel')  
    node.services.pubsub.addEventListener('message', onRelayMessageReceived)

    node.addEventListener('peer:discovery', (evt: any) => {
        console.log("relay discovered new peer", evt.detail)
    })

    node.addEventListener('peer:connect', (evt: any) => {
        console.log("relay connected to peer", evt.detail)
    })

    node.addEventListener('peer:disconnect', (evt: any) => {
        console.log("relay disconnected from peer", evt.detail)
    })

    await nextRelayTick(node)
}

export const startSentinelSession = async (node: any) => {
    node.services.pubsub.subscribe('carmel')  
    node.services.pubsub.addEventListener('message', onSentinelMessageReceived)

    node.addEventListener('peer:discovery', (evt: any) => {
        console.log("sentinel discovered new peer", evt.detail)
    })

    node.addEventListener('peer:connect', (evt: any) => {
        console.log("sentinel connected to peer", evt.detail)
    })

    node.addEventListener('peer:disconnect', (evt: any) => {
        console.log("sentinel disconnected from peer", evt.detail)
    })

    await nextSentinelTick(node)
}
import { session, config } from "@carmel/core/lib/index.mjs"

(async () => {
    await session.start(config)
})()
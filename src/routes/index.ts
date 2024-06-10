import express from "express"
import { instanceRouter } from "./instance.routes"
import { messageRouter } from "./messages.routes"
import { groupRouter } from "./group.routes"
import { miscRouter } from "./misc.routes"

export const router = express.Router()

router.use("/instance", instanceRouter)
router.use("/message", messageRouter)
router.use("/group", groupRouter)
router.use("/misc", miscRouter)
import express from "express"
import { deleteInstance, getChats, info, init, listInstances, logout, qrBase64 } from "../controllers/instance.controller"

export const instanceRouter = express.Router()

instanceRouter.route("/init").post(init)
instanceRouter.route("/info").get(info)
instanceRouter.route("/qr").get(qrBase64)
instanceRouter.route("/list").get(listInstances)
instanceRouter.route("/logout").delete(logout)
instanceRouter.route("/delete").delete(deleteInstance)
instanceRouter.route("/listchats").get(getChats)
import express from "express"
import { onWhatsApp } from "../controllers/misc.controller"

export const miscRouter = express.Router()

miscRouter.route("/onwhatsapp").get(onWhatsApp)
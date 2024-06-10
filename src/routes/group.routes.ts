import express from "express"
import { getGroups } from "../controllers/group.controller"

export const groupRouter = express.Router()

groupRouter.route("/allgroups").get(getGroups)
import express from "express"
import multer from "multer";
import { sendAudioMessage, sendButtonMessage, sendDocumentMessage, sendImageMessage, sendMediaUrl, sendTextMessage, sendVideoMessage } from "../controllers/messages.controller";

const upload = multer()
export const messageRouter = express.Router()


messageRouter.route("/text").post(sendTextMessage)
messageRouter.route("/audio").post(upload.single("file"), sendAudioMessage)
messageRouter.route("/image").post(upload.single("file"), sendImageMessage)
messageRouter.route("/video").post(upload.single("file"), sendVideoMessage)
messageRouter.route("/document").post(upload.single("file"), sendDocumentMessage)
messageRouter.route("/mediaUrl").post(sendMediaUrl)
messageRouter.route("/button").post(sendButtonMessage)
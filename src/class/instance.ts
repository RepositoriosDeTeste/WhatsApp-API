import pino from "pino";
import { uuid } from "uuidv4";
import { InstanceInterface } from "../interface/instance.interface";
import axios, { AxiosInstance } from "axios";
import { Collection, UpdateResult, WithId } from "mongodb";
import { authState, configHandlers } from "../database/helpers";
import makeWASocket, {DisconnectReason, BaileysEventMap, AnyMediaMessageContent, AnyMessageContent, WAPresence, downloadMediaMessage } from "baileys";
import EventEmitter from "events";
import { toDataURL } from "qrcode";
import { Boom } from "@hapi/boom";
import { Connection } from "mongoose";
import { processButtonMessages } from "../helper/processButton";
import { generateVc } from "../helper/genVc";
import { MessageObject } from "../interface/message.interface";
import { sleep } from "../helper/sleep";
import { MIMEType } from "util";
import { downloadMessage } from "../helper/donwloadMessageContent";


export class WhatsAppInstance {
    socketConfig: any = {
        printQRInTerminal: false,
        logger: pino({level: "silent"})
    }
    instance: InstanceInterface = {
        qrRetry: 0,
        chats: [],
        messages: []
    }
    collections: {api?: Collection, webhook?: Collection, chat?: Collection, files?: Collection} = {}
    authState: {
        state: any,
        saveCreds: (data: any, id: any) => any
    } | undefined
    configs: {
        writeConfig: (configData: { instanceKey: string; allowWebhook: boolean; webhookUrl: string|undefined; }) => any | undefined;
        readConfig: (instanceKey: string) => Promise<any>;
    } | undefined;
    axiosInstance?: AxiosInstance
    key: string
    allowWebhook: boolean
    webhook: string | undefined
    mongooseConnection: Connection | undefined

    constructor (allowWebhook: boolean = global.appCfg.webhookEnabled, webhookUrl: string | undefined = global.appCfg.webhookUrl, sessionKey?: string) {
        if (sessionKey) {
            this.key = sessionKey
        }else {
            this.key = uuid()
        }
        this.allowWebhook = allowWebhook
        if (this.allowWebhook === true) {
            if (webhookUrl) {
                this.webhook = webhookUrl
                this.instance.customWebhook = webhookUrl
                this.axiosInstance = axios.create({baseURL: webhookUrl})
            }
        }
        this.instance.key = this.key
    }

    async sendWebhook(type: string, body: {[keys: string]: any}, key: string) {
        if (this.axiosInstance) {
            console.log("customWebhook")
            this.axiosInstance.post('', {type, body, instanceKey: key})
        } else if( this.allowWebhook && !this.axiosInstance) {
            console.log("defaultWebhook")
            await this.collections.webhook?.insertOne({
                type, body, instanceKey: key
            })
        }
    } 

    async init() {
        this.collections.api = mongoClient.db("WhatsApp-API").collection(this.key)
        this.collections.chat = mongoClient.db("WhatsApp-Chats").collection(this.key)
        this.collections.webhook = this.allowWebhook !== undefined ? mongoClient.db("WhatsApp-Webhook").collection(this.key) : undefined;
        this.collections.files = this.allowWebhook !== undefined ? mongoClient.db("WhatsApp-Files").collection(this.key) : undefined
        this.configs = await configHandlers(this.collections.api)
        this.authState = await authState(this.collections.api)
        await this.configs.writeConfig({instanceKey: this.key, allowWebhook: this.allowWebhook, webhookUrl: this.webhook})
        this.socketConfig.auth = this.authState.state
        this.instance.sock = makeWASocket(this.socketConfig)
        await this.setHandler()
        await sleep(100)
        return this
    }

    async setHandler() {
        const sock = this.instance.sock
        sock?.ev.on('creds.update', (auth) => {
            this.authState?.saveCreds(auth, 'creds')
        })
        sock?.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) {
                toDataURL(qr).then((url) => {
                    this.instance.qr = url
                    this.instance.qrRetry++
                    if (this.instance.qrRetry >= appCfg.maxQrRetry) {
                        const eventNames: (keyof BaileysEventMap)[] = Object.keys(<BaileysEventMap>{}) as (keyof BaileysEventMap)[]
                        this.instance.sock?.ws.close()
                        for (let eventName of eventNames) {
                            this.instance.sock?.ev.removeAllListeners(eventName)
                        }
                        this.instance.qr = undefined
                    }
                })
            }
            if (connection === 'connecting') {
                return
            }
            if (connection === 'close') {
                if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                    await this.init()
                }else {
                    await this.collections.api?.drop()
                    await this.collections.webhook?.drop()
                    await this.collections.chat?.drop()
                    await this.collections.files?.drop()
                    this.instance.online = false
                }
            }else if (connection === 'open') {
                let alreadyThere = await this.collections.chat?.findOne({key: this.key})
                if (!alreadyThere) {
                    const saveChat = {key: this.key}
                    this.collections.chat?.insertOne(saveChat)
                }
                this.instance.online = true
            }
            await this.sendWebhook('connection', {connection: connection}, this.key)
        })
        sock?.ev.on('messaging-history.set', async ({chats}) => {
            const receivedChats = chats.map((chat) => {
                return {
                    ...chat,
                    messages: []
                }
            })
            this.instance.chats?.push(receivedChats)
            if (this.instance.chats) {
                await this.updateDb(this.instance.chats)
                await this.updateDbGroupsParticipants()
            }
        })
        sock?.ev.on('presence.update', async (json) => {
            await this.sendWebhook('presence', json, this.key)
        })
        sock?.ev.on('chats.upsert', (newChat) => {
            const chats = newChat.map((chat) => {
                return {
                    ...chat,
                    messages: []
                }
            })
            this.instance.chats?.push(...chats)
        })
        sock?.ev.on('chats.update', (changedChats) => {
            changedChats.map((chat) => {
                const index = this.instance.chats?.findIndex((pc) => pc.id === chat.id)
                const prevChat = this.instance.chats[index]
                this.instance.chats[index] = {
                    ...prevChat,
                    ...chat
                }
                
            })
        })
        sock?.ev.on('chats.delete', (deletedChats) => {
            deletedChats.map((chat) => {
                const index = this.instance.chats.findIndex((pc) => pc.id === chat)
                this.instance.chats.splice(index, 1)
            })
        })
        sock?.ev.on('messages.upsert', async ({messages}) => {
            messages.forEach(async (message) => {
                if (!message.message) {return}
                const keysMessage = Object.keys(message.message)
                const messageType = keysMessage[0]
                const buffer = await downloadMessage(message)
                if (buffer && this.collections.files) {
                    await this.collections.files.insertOne({
                        messageMime: messageType,
                        chatId: message.key.remoteJid,
                        messageData: Buffer.from(buffer).toString("base64"),
                    })
                }
                this.instance.messages.push(message)
                if (appCfg.markMessagesAsRead) {
                    const unreadMessage = {
                        remoteJid: message.key.remoteJid,
                        id: message.key.id,
                        participant: message.key?.participant
                    }
                    await sock.readMessages([unreadMessage])
                    await this.sendWebhook('message', message, this.key)
                }
            })
        })
    }

    async getInstanceInfo() {
        return {
            instance_key: this.instance.key,
            phone_connected: this.instance.online,
            webhook: this.webhook ? this.instance.customWebhook : undefined,
            user_details: this.instance.online ? this.instance.sock?.user : {} 
        }
    }
    
    async deleteInstance(key: string) {
        try {
            await this.collections.chat?.findOneAndDelete({key: key})
        } catch(_) {
            console.log(_)
        }
    }

    async getChat(): Promise<any[]> {
        let dbResult = await this.collections.chat?.findOne({key: this.key})
        let chatObj = dbResult?.chat
        return chatObj 
    }
    
    getWhatsAppId(id: string) {
        if (id.includes("@g.us") || id.includes("@s.whatsapp.net")) { return id}
        return id.includes("-") ? `${id}@g.us` : `${id}@s.whatsapp.net`
    }

    async verifyWhatsAppId(id: string) {
        if (id.includes("@g.us")) {return true}
        const result: {exists: boolean, jid: string}[] | undefined = await this.instance.sock?.onWhatsApp(id)
        if (result) {
            return true
        }
        throw new Error("Conta Inexistente")
    }

    async sendTextMessage(to: string, message: string) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            {text: message}
        )
        return result
    }
    
    async sendMediaMessage(to: string, file: any, type: "image" | "audio" | "video" | "document", caption?: string | boolean) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        let fileInfo: any = {
            mimetype: file.mimetype,
            fileName: file.originalname,
        }
        if (type === "image") {
            fileInfo["image"] = file.buffer
            fileInfo["caption"] = caption ? caption : ""
        }else if (type === "audio") {
            fileInfo["audio"] = file.buffer
            if (caption) {
                caption = Boolean(caption)
                fileInfo["ptt"] = caption ? caption : false
            }
        }else if (type === "video") {
            fileInfo["video"] = file.buffer
            fileInfo["caption"] = caption ? caption : ""
        }else if (type === "document") {
            fileInfo["document"] = file.buffer
            fileInfo["caption"] = caption ? caption : ""
        }
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            fileInfo
        )
        return result
    }

    async sendUrlMediaMessage(to: string, url: string, type: any, mimetype: any, caption?: string) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        let content: any = {
            [type]: {url: url},
            mimetype: mimetype,
            caption: caption && typeof caption !== "boolean" ? caption : undefined,
            ptt: caption && typeof caption === "boolean" ? caption : undefined
        }
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            content
        )
        console.log(result)
        return result
    }

    async sendButtonMessage(to: string, data: any) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            {
                templateButtons: processButtonMessages(data.buttons),
                text: data.text,
                footer: data.footerText ?? '',
                viewOnce: true
            }
        )
        return result
    }

    async sendContactMessage(to: string, data: any) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        const vcard = generateVc(data)
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            {
                contacts: {
                    displayName: data.fullName,
                    contacts: [{displayName: data.fullName, vcard}]
                }
            }
        )
        return result
    }

    async sendListMessage(to: string, data: any) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            {
                text: data.text,
                sections: data.sections,
                buttonText: data.buttonText,
                footer: data.description,
                title: data.title,
                viewOnce: true
            }
        )
        return result
    }
    
    async sendMediaButtonMessage(to: string, data: any) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        let send: any = {
            [data.mediaType]: {
                url: data.image
            },
            footer: data.footerText ?? '',
            caption: data.text,
            templateButtons: processButtonMessages(data.buttons),
            mimetype: data.mimeType,
            viewOnce: true
        }
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            send
        )
        return result
    }

    async reactMessage(id: string, key: any, emoji: string) {
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const reactionMessage = {
            react: {
                text: emoji,
                key: key
            }
        }
        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(id),
            reactionMessage
        )
        return result
    }

    async setStatus(status: any, to: string) {
        await this.verifyWhatsAppId(this.getWhatsAppId(to))
        const result = await this.instance.sock?.sendPresenceUpdate(status, this.getWhatsAppId(to))
        return result
    }

    // altera a imagem do seu perfil ou de um grupo
    async updateProfilePicture(id: string, url: string) {
        const image = await axios.get(url, {responseType: 'arraybuffer'})
        const res = await this.instance.sock?.updateProfilePicture(
            this.getWhatsAppId(id),
            image.data
        )
        return res
    }

    async getUserOrGroupById(id: string) {
        let Chats = await this.getChat()
        const group = Chats.find((c: any) => c.id === this.getWhatsAppId(id))
        if (!group) {
            throw new Error("Incapaz de encontrar o grupo, verifique se ele existe")
        }
        return group
    }

    parseParticipants(users: string[]) {
        return users.map((user) => {this.getWhatsAppId(user)})
    }

    async updateDbGroupsParticipants() {
        try {
            let groups = await this.groupFetchAllParticipating()
            let chats = await this.getChat()
            if (groups && chats) {
                for (const [key, value] of Object.entries(groups)) {
                    let group = chats.find((c: any) => c.id === value.id)
                    if (group) {
                        let participants = []
                        for (const [key_participant, participant] of Object.entries(value.participants)) {
                            participants.push(participant)
                        }
                        group.participant = participants
                        if (value.creation) {
                            group.creation = value.creation
                        }
                        if (value.subjectOwner) {
                            group.subjectOwner = value.subjectOwner
                        }
                        chats.filter((c: any) => c.id === value.id)[0] = group
                    }
                }
                await this.updateDb(chats)
            }
        }catch (e) {
            console.log(e)
        }
    }

    async updateDb(object: any[]) {
        try {
            await this.collections.chat?.updateOne({key: this.key}, {$set: {chat: object}}, {upsert: true})
        }catch (e){
            console.log(e)
        }
    }

    async groupFetchAllParticipating() {
        try {
            const result = await this.instance.sock?.groupFetchAllParticipating()
            return result
        } catch (e) {
            console.log('Error group fetch all participating failed')
        }
    }

    async createNewGroup(name: string, users: string[]) {
        const group = await this.instance.sock?.groupCreate(
            name,
            users.map(this.getWhatsAppId)
        )
        return group
    }

    async addNewParticipant(id: string, users: string[]) {
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const res = await this.instance.sock?.groupParticipantsUpdate(
            this.getWhatsAppId(id),
            users.map(this.getWhatsAppId),
            'add'
        )
    }

    async makeAdmin(id: string, users: string[]) {
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const res = await this.instance.sock?.groupParticipantsUpdate(
            this.getWhatsAppId(id),
            users.map(this.getWhatsAppId),
            'promote'
        )
    }
    
    async demoteAdmin(id: string, users: string[]) {
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const res = await this.instance.sock?.groupParticipantsUpdate(
            this.getWhatsAppId(id),
            users.map(this.getWhatsAppId),
            'demote'
        )
    }

    async getAllGroup() {
        let Chats = await this.getChat()
        let results: any[] = []
        for (let chat of Chats) {
            for (let data of chat) {
                if (data.id.includes("@g.us")) {
                    results.push({
                        name: data.name,
                        jid: data.id
                    })
                }
            }
        }
        return results
    }

    async leaveGroup(id: string) {
        let Chats = await this.getChat()
        const group = Chats.find((c: any) => c.id === this.getWhatsAppId(id))
        if (!group) {throw new Error("Grupo inexistente")}
        return await this.instance.sock?.groupLeave(this.getWhatsAppId(id))
    }

    async groupSettingsUpdate(id: string, setting: any){
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const result = await this.instance.sock?.groupSettingUpdate(
            this.getWhatsAppId(id),
            setting
        )
        return result
    }

    async groupUpdateDescription(id: string, description: string) {
        await this.verifyWhatsAppId(this.getWhatsAppId(id))
        const result = await this.instance.sock?.groupUpdateDescription(
            this.getWhatsAppId(id),
            description
        )
        return result
    }

    async readMessage(msgObject: MessageObject) {
        const result = await this.instance.sock?.readMessages([msgObject])
        return result
    }
 }
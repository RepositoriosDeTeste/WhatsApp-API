import { Request, Response } from "express";
import { WhatsAppInstance } from "../class/instance";
import { sleep } from "../helper/sleep";

export async function init(req: Request, res: Response) {
    const allowWebhook = req.query.webhook === 'true' || false
    const webhookUrl = !req.query.webhookUrl ? undefined : req.query.webhookUrl.toString()
    const appUrl = `${appCfg.appUrl}` || `${req.protocol}://${req.headers.host}`
    const instance = new WhatsAppInstance(allowWebhook, webhookUrl)
    const data = await instance.init()
    whatsAppInstances[data.key] = instance
    res.json({
        error: false,
        message: "Instancia inicializada",
        key: data.key,
        webhook: {
            enabled: allowWebhook,
            webhookUrl: webhookUrl
        },
        qrcode: {
            url: `${appUrl}/instance/qr?key=${data.key}`
        }
    })
}

export async function info(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try{
            const info = await whatsAppInstances[key].getInstanceInfo()
            res.json({
                error: false,
                message: "Informações da Instancia encontradas",
                instanceData: info
            })
        }catch(e) {
            return res.status(500).json({
                error: true,
                message: "Erro ao Buscar informações da Instancia"
            })
        }
    }else {
        return res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function qrBase64(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            while ( !whatsAppInstances[key]?.instance.qr){
                console.log(whatsAppInstances[key]?.instance.qr)
                await sleep(100)
            }
            const qr = whatsAppInstances[key]?.instance.qr
            res.json({
                error: false,
                messages: "QRCode gerado com sucesso",
                qrcode: qr
            })
        }catch(e) {
            res.status(500).json({
                error: true,
                message: "Erro ao gerar o QRCode, verifique a key tente novamente mais tarde"
            })
        }
    }else {
        return res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function logout(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            await whatsAppInstances[key].instance.sock?.logout()
            return res.json(
                {
                    error: false,
                    message: "Logout da instancia realizado com sucesso, o socket ira parar de escutar os eventos"
                }
            )
        } catch (e){
            return res.status(500).json({
                error: true,
                message: "Erro ao deslogar da instancia, verifique a key informada"
            })
        }
    } else {
        return res.status(404).json({
            error: true,
            message: "Informe a key da instancia que sera deslogada"
        })
    }
}

export async function deleteInstance(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            await whatsAppInstances[key].deleteInstance(key)
            delete whatsAppInstances[key]
            return res.json({
                error: false,
                message: "Instancia deletada com sucesso"
            })
        }catch(e) {
            res.status(500).json({
                error: true,
                message: "Erro ao deletar a instancia"
            })
        }
    } else {
        return res.status(404).json({
            error: true,
            message: "Informe a key da instancia que sera deletada"
        })
    }
}

export async function listInstances(req: Request, res: Response) {
    try {
        let listInstanceInfos: {[key: string]: any} = {}
        for await(let key of Object.keys(whatsAppInstances)) {
            listInstanceInfos[key] = (await whatsAppInstances[key]?.getInstanceInfo())
        }
        if (Object.keys(listInstanceInfos).length !== 0) {
            return res.json({
                error: false,
                message: 'Todas as instancias listadas',
                data: listInstanceInfos
            })
        }else {
            return res.json({
                error: false,
                message: "Nenhuma instancia encontrada"
            })
        }
        
    }catch(e) {
        return res.status(500).json({
            error: true,
            message: "Erro ao recuperar as informações da instancia"
        })
    }
}

export async function getChats(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            const allChats = await whatsAppInstances[key].buildChatList()
            return res.json({
                error: false,
                message: "Todas as conversas da Instancia",
                data: allChats
            })
        }catch(e) {
            res.status(500).json({
                error: true,
                message: "Erro ao recuperar as conversas"
            })
        }
    } else {
        return res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}
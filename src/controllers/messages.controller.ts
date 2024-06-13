import e, { Request, Response } from "express";
import { WhatsAppInstance } from "../class/instance";
export async function sendTextMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            const data = await whatsAppInstances[key].sendTextMessage(req.body.id, req.body.message)
            res.status(201).json({
                error: false,
                data: data
            })
        }catch(e) {
            res.status(500).json(
                {
                    error: true,
                    message: "Erro ao enviar a mensagem, verifique a key e o status da instancia para tentar novamente"
                }
            )
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendImageMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        if (req.file) {
            try {
                const data = await whatsAppInstances[key].sendMediaMessage(req.body.id, req.file, 'image', req.body?.caption)
                res.status(201).json({
                    error: false,
                    data: data
                })
            }catch(e) {
                res.status(500).json({
                    error: true,
                    message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
                })
            }
        }else {
            return res.status(404).json({
                error: true,
                message: "Informe um arquivo"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendAudioMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        if (req.file) {
            try {
                const data = await whatsAppInstances[key].sendMediaMessage(req.body.id, req.file, 'audio', req.body?.ptt)
                res.status(201).json({
                    error: false,
                    data: data
                })
            }catch(e) {
                res.status(500).json({
                    error: true,
                    message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
                })
            }
        }else {
            return res.status(404).json({
                error: true,
                message: "Informe um arquivo"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendVideoMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        if (req.file) {
            try {
                const data = await whatsAppInstances[key].sendMediaMessage(req.body.id, req.file, 'video', req.body?.caption)
                res.status(201).json({
                    error: false,
                    data: data
                })
            }catch(e) {
                res.status(500).json({
                    error: true,
                    message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
                })
            }
        }else {
            return res.status(404).json({
                error: true,
                message: "Informe um arquivo"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendDocumentMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        if (req.file) {
            try {
                const data = await whatsAppInstances[key].sendMediaMessage(req.body.id, req.file, 'document', req.body?.caption)
                res.status(201).json({
                    error: false,
                    data: data
                })
            }catch(e) {
                res.status(500).json({
                    error: true,
                    message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
                })
            }
        }else {
            return res.status(404).json({
                error: true,
                message: "Informe um arquivo"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendMediaUrl(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            const data = await whatsAppInstances[key].sendUrlMediaMessage(req.body.id, req.body.url, req.body.type, req.body.mimetype, req.body?.caption)
            res.status(201).send({
                error: false,
                data: data
            })
        }catch(e) {
            res.status(500).json({
                error: true,
                message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}

export async function sendButtonMessage(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        try {
            const data = await whatsAppInstances[key].sendButtonMessage(req.body.id, req.body.btnda)
            res.status(201).send({
                error: false,
                data: data
            })
        }catch(e) {
            res.status(500).json({
                error: true,
                message: "Verifique a chave da instancia e seu status de conexão para tentar novamente"
            })
        }
    }else {
        res.status(404).json({
            error: true,
            message: "Informe a key da instancia"
        })
    }
}
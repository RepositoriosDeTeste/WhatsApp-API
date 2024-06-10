import { Request, Response } from "express";

export async function onWhatsApp(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        const verifyId = req.body.verifyId
        try {
            const data = await whatsAppInstances[key].verifyWhatsAppId(whatsAppInstances[key].getWhatsAppId(verifyId ? verifyId : key))
            res.send({
                error: false,
                data: data
            })
        }catch(e) {
            return res.status(500).json({
                error: true,
                message: "Erro ao Buscar informações da Instancia"
            })
        }
    }else {
        res.status(404).send({
            error: true,
            message: "informe a key da instancia"
        })
    }
}

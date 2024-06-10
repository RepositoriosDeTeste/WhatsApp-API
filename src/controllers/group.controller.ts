import { Request, Response } from "express";

export async function getGroups(req: Request, res: Response) {
    const key = req.query.key
    if (typeof key === 'string') {
        const data = await whatsAppInstances[key].getAllGroup()
        res.send({
            error: false,
            message: "Grupos retornados",
            data: data
        })
    }else {
        res.status(422).send({
            error: true,
            message: "Informe uma Instancia valida"
        })
    }
}
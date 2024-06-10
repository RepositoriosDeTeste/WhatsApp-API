import './config/globals.config';
import express from "express";
import { Session } from './class/session';
import { router } from './routes';

const app = express()
app.use(express.json())
app.use(express.json({limit: '50mb'}))
app.use("/", router)

app.listen(appCfg.port, async () => {
    console.log(`Rodando na url: ${appCfg.appUrl}`)
    if (appCfg.restoreSessionOnStart) {
        console.log("Restaurando instancias")
        const session = new Session()
        await session.restoreInstances()
        console.log("Instancias restauradas")
    }
})

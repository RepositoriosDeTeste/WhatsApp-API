import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "dotenv";
import mongoose from "mongoose";
import { connect } from "tls";
config();

async function initMongooseClient() {
    const connect = await mongoose.connect(appCfg.mongoDBURI)
    return connect.connection
}


namespace appConfig {
    export const token: string = process.env.TOKEN || '1a2b7c8d9e';
    export const protectRoutes: boolean = process.env.PROTECT_ROUTES === 'true' || false;
    export const port: number = Number(process.env.PORT) || 8080;
    export const appUrl: string = process.env.APP_URL || `http://localhost:${port}`;
    export const restoreSessionOnStart: boolean = process.env.RESTORE_SESSIONS_ON_START === 'true' || true;
    export const logLevel: string = process.env.LOG_LEVEL || 'silent';
    export const maxQrRetry: number = Number(process.env.MAX_QR_RETRY) || 2;
    export const webhookEnabled: boolean = process.env.WEBHOOK_ENABLED === 'true' || false;
    export const webhookUrl: string | undefined = process.env.WEBHOOK_URL || undefined;
    export const saveBase64: boolean = process.env.SAVE_BASE_64 === 'true' || false;
    export const markMessagesAsRead: boolean = process.env.MARK_MESSAGES_READ === 'true' || false;
    export const mongoDBURI: string = process.env.DB_URI || "";
}

global.appCfg = appConfig;

global.mongoClient = new MongoClient(appCfg.mongoDBURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

global.whatsAppInstances = {}
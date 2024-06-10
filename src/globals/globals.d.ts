import { MongoClient, ServerApiVersion } from "mongodb";
import { Connection} from "mongoose"
import { appConfig } from "../config/app.config";
import { WhatsAppInstance } from "../class/instance";

declare namespace appConfig {
    var token: string;
    var protectRoutes: boolean;
    var port: number;
    var appUrl: string;
    var restoreSessionOnStart: boolean;
    var logLevel: string;
    var maxQrRetry: number;
    var webhookEnabled: boolean;
    var webhookUrl: string | undefined;
    var saveBase64: boolean;
    var markMessagesAsRead: boolean;
    var mongoDBURI: string;
}

declare global {
    var mongoClient: MongoClient;
    var appCfg: typeof appConfig;
    var whatsAppInstances: {[instanceKey: string]: WhatsAppInstance};
}

export {};

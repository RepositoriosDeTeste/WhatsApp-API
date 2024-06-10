import { WASocket } from "baileys"

export interface InstanceInterface {
    messages: any[],
    qrRetry: number,
    chats: any[], 
    customWebhook?: string,
    key?: string,
    sock?: WASocket,
    qr?: string,
    online?: boolean
}
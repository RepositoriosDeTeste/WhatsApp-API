import { configHandlers } from "../database/helpers"
import { WhatsAppInstance } from "./instance"

export class Session {
    async restoreInstances() {
        let restoredInstances: string[] = []
        let allCollections: string[] = []
        try {
            const db = mongoClient.db("WhatsApp-API")
            const result = await db.listCollections().toArray()
            result.forEach((collection) => {
                allCollections.push(collection.name)
            })
            allCollections.forEach(async (collection) => {
                const instanceConfig = await db.collection(collection).findOne({instanceKey: collection})
                if (instanceConfig) {
                    const instance = new WhatsAppInstance(instanceConfig.allowWebhook, instanceConfig.webhookUrl, instanceConfig.instanceKey)
                    await instance.init()
                    whatsAppInstances[collection] = instance
                }
                restoredInstances.push(collection)
            })
        }catch (e) {
            console.log("erro ao restaurar as instancias")
        }
        return restoredInstances
    }
}
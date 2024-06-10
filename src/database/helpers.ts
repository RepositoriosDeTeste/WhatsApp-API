import { Collection } from "mongodb";
import { BufferJSON } from "./bufferJson";
import { initAuthCreds, proto } from "baileys";

export async function configHandlers(collection: Collection) {
    const writeConfig = (configData: {instanceKey: string, allowWebhook: boolean, webhookUrl: string| undefined}) => {
        return collection.updateOne({instanceKey: configData.instanceKey}, {$set: configData}, {upsert: true})
    }
    const readConfig = async (instanceKey: string) => {
        try {
            const config = JSON.stringify(await collection.findOne({instanceKey: instanceKey}))
            return JSON.parse(config, BufferJSON.reviver)
        } catch(error) {
            return null
        }
    }
    return {
        writeConfig: writeConfig,
        readConfig: readConfig
    }
}

export async function authState(collection: Collection) {
    const writeData = (data: any, id: any) => {
        return collection.replaceOne({_id: id}, JSON.parse(JSON.stringify(data, BufferJSON.replacer)), {upsert: true})
    }
    const readData = async (id: any) => {
        try {
            const data = JSON.stringify(await collection.findOne({_id: id}))
            return JSON.parse(data, BufferJSON.reviver)
        }catch(err) {}
    }
    const removeData = async (id: any) => {
        try {
            await collection.deleteOne({_id: id})
        } catch (_) {}
    }
    const creds = (await readData('creds')) || initAuthCreds()
    return {
        state: {
            creds,
            keys: {
                get: async (type: any, ids: any[]) => {
                    const data: any = {}
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`)
                        if (type === "app-state-sync-key") {
                            value = proto.Message.AppStateSyncKeyData.fromObject(data)
                        }
                        data[id] = value
                    }))
                    return data
                },
                set: async (data: any) => {
                    const tasks = []
                    for (const category of Object.keys(data)) {
                        for (const id of Object.keys(data[category])) {
                            const value = data[category][id]
                            const key = `${category}-${id}`
                            tasks.push(value ? writeData(value, key) : removeData(key))
                        }
                    }
                    await Promise.all(tasks)
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds')
        }
    }
}
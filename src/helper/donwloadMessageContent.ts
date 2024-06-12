import { downloadMediaMessage, proto} from "baileys";

export async function downloadMessage(message: proto.IWebMessageInfo) {
    if (!message.message) {return}
    const keysMessage = Object.keys(message.message)
    const messageType = keysMessage[0]
    if (["imageMessage", "audioMessage", "videoMessage"].includes(messageType) || keysMessage.find((key) => ["viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extenciosn"].includes(key))) {
        try {
            const buffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
                // {
                //     logger: r,
                //     reuploadRequest: sock.updateMediaMessage
                // }
            )
            return buffer
        }catch(e) {
            console.error("Erro ao baixar o conteudo da mensagem:", e)
        }
    }
}
import { Curve, generateRegistrationId, signedKeyPair } from "baileys"
import { randomBytes } from "crypto"

export const initAuthCreds = () => {
    const chaveIdentidade = Curve.generateKeyPair()
    return {
        noiseKey: Curve.generateKeyPair(),
        signedIdentityKey: chaveIdentidade,
        signedPreKey: signedKeyPair(chaveIdentidade, 1),
        registrationId: generateRegistrationId(),
        advSecretKey: randomBytes(32).toString("base64"),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSettings: {
            unarchiveChats: false,
        },
    }
}
export interface ProcessedButton {
    urlButton?: {
        displayText: string,
        url: string
    }
    callButton?: {
        displayText: string,
        phoneNumber: string
    }
    quickReplyButton?: {
        displayText: string
    }
}
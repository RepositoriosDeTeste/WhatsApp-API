import { ProcessedButton } from "../interface/buttons.interface"

export function processButtonMessages(buttons: any[]) {
    const preparedButtons: ProcessedButton[] = []
    
    buttons.map((button) => {
        if (button.type == 'replyButton') {
            preparedButtons.push({
                quickReplyButton: {
                    displayText: button.title ?? ''
                }
            })
        }
        if (button.type == 'callButton') {
            preparedButtons.push({
                callButton: {
                    displayText: button.title ?? '',
                    phoneNumber: button.payload ?? ''
                }
            })
        }
        if (button.type == 'urlButton') {
            preparedButtons.push({
                urlButton: {
                    displayText: button.title ?? '',
                    url: button.payload ?? ''
                }
            })
        }
    })
    return preparedButtons
}
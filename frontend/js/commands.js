/**
 * Office Add-in Commands
 * Functions that can be called from the Office ribbon buttons
 */


Office.onReady(() => {
    console.log('🏢 Office.js ready for commands');
});

/**
 * Quick enrich function - called from ribbon button
 * @param {Office.AddinCommands.Event} event - The add-in command event
 */
function enrichContact(event) {
    try {
        console.log('🚀 Quick enrich command triggered');
        

        const item = Office.context.mailbox.item;
        
        if (item && item.from && item.from.emailAddress) {
            const senderEmail = item.from.emailAddress;
            console.log('📧 Enriching contact:', senderEmail);
            

            Office.context.mailbox.item.notificationMessages.addAsync(
                'enriching',
                {
                    type: 'informationalMessage',
                    message: `Enriching contact information for ${senderEmail}...`,
                    icon: 'icon1',
                    persistent: false
                }
            );
            

            setTimeout(() => {
                Office.context.mailbox.item.notificationMessages.addAsync(
                    'enriched',
                    {
                        type: 'informationalMessage',
                        message: `Contact information retrieved for ${senderEmail}. Open the task pane to view details.`,
                        icon: 'icon1',
                        persistent: true
                    }
                );
                

                Office.context.mailbox.item.notificationMessages.removeAsync('enriching');
            }, 2000);
            
        } else {

            Office.context.mailbox.item.notificationMessages.addAsync(
                'no-sender',
                {
                    type: 'errorMessage',
                    message: 'No sender information found in this email.',
                    icon: 'icon1',
                    persistent: true
                }
            );
        }
        

        event.completed();
        
    } catch (error) {
        console.error('❌ Error in enrichContact command:', error);
        

        if (Office.context.mailbox.item) {
            Office.context.mailbox.item.notificationMessages.addAsync(
                'error',
                {
                    type: 'errorMessage',
                    message: 'Failed to enrich contact information. Please try again.',
                    icon: 'icon1',
                    persistent: true
                }
            );
        }
        
        event.completed();
    }
}

/**
 * Register the function with Office
 */
if (typeof Office !== 'undefined') {
    Office.actions = Office.actions || {};
    Office.actions.enrichContact = enrichContact;
} 
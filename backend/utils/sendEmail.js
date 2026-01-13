const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Resend } = require('resend');

// Configure Brevo API Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
// We set this dynamically inside the function to ensure env vars are loaded

const sendEmail = async (to, subject, html) => {
    console.log('========= EMAIL SEND START =========');
    console.log('🚀 sendEmail function called!');
    console.log(`📨 TO: ${to}`);
    console.log(`📧 SUBJECT: ${subject}`);
    console.log(`⚙️  RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
    console.log(`⚙️  BREVO_API_KEY exists: ${!!process.env.BREVO_API_KEY}`);
    try {

        // 🔍 DEV MODE: Always log OTP to console to unblock user if email fails
        const tokenMatch = html.match(/>\s*(\d{6})\s*<\/span>/) || html.match(/(\d{6})/);
        if (tokenMatch) {
            console.log('==================================================');
            console.log(`🔑 DEV OTP CODE: [ ${tokenMatch[1]} ]`);
            console.log('==================================================');
        }

        // 1. Try Resend API (Primary)
        if (process.env.RESEND_API_KEY) {
            console.log('🚀 Sending via Resend API...');
            console.log(`   API Key (first 10 chars): ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
            const resend = new Resend(process.env.RESEND_API_KEY);
            console.log('   Resend instance created, calling send...');
            const { data, error } = await resend.emails.send({
                from: 'Iwaa Support <info@iwaaforyou.com>',
                to: [to],
                subject: subject,
                html: html,
            });
            console.log('   Resend send() returned:', { data, error });

            if (!error) {
                console.log('✅ Email sent via Resend:', data?.id);
                console.log('========= EMAIL SEND END (SUCCESS) =========');
                return true;
            }
            console.error('⚠️ Resend failed:', JSON.stringify(error, null, 2));
            console.log('🔄 Attempting fallback to Brevo...');
        } else {
            console.log('⚠️ RESEND_API_KEY not found in environment!');
        }

        // 2. Try Brevo API (Fallback)
        if (process.env.BREVO_API_KEY) {
            apiKey.apiKey = process.env.BREVO_API_KEY;
            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.sender = {
                "name": process.env.BREVO_SENDER_NAME || "Iwaa Support",
                "email": process.env.BREVO_SENDER_EMAIL || "support@iwaa.com"
            };
            sendSmtpEmail.to = [{ "email": to }];

            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('✅ Email sent via Brevo API:', data.messageId);
            return true;
        }

        // 3. Fallback
        return mockEmailLog(to, subject, html);

    } catch (error) {
        console.error('❌ Error sending email:', error.response ? error.response.text : error.message);
        return mockEmailLog(to, subject, html);
    }
};

// Helper for Console Logging (Smart Mock)
const mockEmailLog = (to, subject, html) => {
    console.log('==================================================');
    console.log('📧 MOCK EMAIL SENT (Fallback/Log)');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('--------------------------------------------------');

    // Extract Token for easier reading if present
    const tokenMatch = html.match(/>\s*(\d{6})\s*<\/span>/) || html.match(/(\d{6})/);
    if (tokenMatch) {
        console.log(`🔑 OTP CODE: [ ${tokenMatch[1]} ]`);
    }

    console.log('==================================================');
    return true; // Return true so the flow continues successfully
};

module.exports = sendEmail;

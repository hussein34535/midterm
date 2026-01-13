const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Resend } = require('resend');

// Configure Brevo API Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
// We set this dynamically inside the function to ensure env vars are loaded

const sendEmail = async (to, subject, html) => {
    try {
        // 1. Try Resend API (Primary)
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const { data, error } = await resend.emails.send({
                from: 'إيواء <info@iwaaforyou.com>',
                to: [to],
                subject: subject,
                html: html,
            });

            if (!error) {
                console.log(`📧 Email sent to ${to}`);
                return true;
            }
            console.error('Resend failed, trying Brevo...');
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
            console.log(`📧 Email sent via Brevo to ${to}`);
            return true;
        }

        // 3. Fallback - log only
        console.log(`📧 [DEV] Email to ${to}: ${subject}`);
        return true;

    } catch (error) {
        console.error('Email error:', error.message);
        return false;
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

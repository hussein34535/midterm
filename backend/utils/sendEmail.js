const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Resend } = require('resend');

// Configure Brevo API Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
// We set this dynamically inside the function to ensure env vars are loaded

const sendEmail = async (to, subject, html) => {
    try {
        // 🎨 Branded Template Wrapper
        const logoUrl = 'https://iwaaforyou.com/logo.png';
        const brandedHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eaeaea; }
        .header { background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #fce7f3; }
        .logo { height: 50px; width: auto; object-fit: contain; }
        .content { padding: 30px 25px; color: #333333; line-height: 1.6; text-align: right; direction: rtl; }
        .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; }
        a { color: #E85C3F; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="إيواء | Iwaa" class="logo">
        </div>
        <div class="content">
            ${html}
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} إيواء - مساحتك الآمنة للدعم النفسي</p>
            <p style="margin: 5px 0 0 0; font-size: 11px;">Iwaa for Mental Health Support</p>
        </div>
    </div>
</body>
</html>
        `;

        // 1. Try Resend API (Primary)
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const { data, error } = await resend.emails.send({
                from: 'إيواء <info@iwaaforyou.com>',
                to: [to],
                subject: subject,
                html: brandedHtml,
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
            sendSmtpEmail.htmlContent = brandedHtml;
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

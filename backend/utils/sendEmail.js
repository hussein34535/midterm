const { Resend } = require('resend');

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📨 Attempting to send email to: ${to}`);

        // 1. Try Resend API (HTTP - Bypasses SMTP ports)
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const { data, error } = await resend.emails.send({
                from: 'Sakina <onboarding@resend.dev>', // Only works for verified email without custom domain
                to: [to],
                subject: subject,
                html: html,
            });

            if (error) {
                console.warn('⚠️ Resend API Warning:', error.name, error.message);

                // Smart Fallback: If domain not verified (403 or validation_error), log as mock
                if (error.name === 'validation_error' || error.statusCode === 403) {
                    console.log('💡 Falling back to MOCK email (domain not verified).');
                    return mockEmailLog(to, subject, html);
                }
                return false;
            }

            console.log('✅ Email sent via Resend:', data.id);
            return true;
        }

        // 2. Mock (No API Key)
        else {
            return mockEmailLog(to, subject, html);
        }

    } catch (error) {
        console.error('❌ Error sending email:', error);
        // Final safety net: Log content so user can proceed even if mailer fails
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

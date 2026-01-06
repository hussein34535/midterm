const { Resend } = require('resend');

const sendEmail = async (to, subject, html) => {
    try {
        // Check if Resend API key exists
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const { data, error } = await resend.emails.send({
                from: 'إيواء <onboarding@resend.dev>', // Use your verified domain in production
                to: [to],
                subject,
                html
            });

            if (error) {
                console.error('Resend error:', error);
                return false;
            }

            console.log('Email sent via Resend:', data.id);
            return true;
        } else {
            // Mock Email (Console Log)
            console.log('==================================================');
            console.log('📧 MOCK EMAIL SENT (No RESEND_API_KEY)');
            console.log(`TO: ${to}`);
            console.log(`SUBJECT: ${subject}`);
            console.log('--------------------------------------------------');
            console.log(html);
            console.log('==================================================');
            return true;
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = sendEmail;

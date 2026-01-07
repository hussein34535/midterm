const { Resend } = require('resend');

const sendEmail = async (to, subject, html) => {
    try {
        // Check if Resend API Key exists
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const { data, error } = await resend.emails.send({
                from: 'Sakina <onboarding@resend.dev>', // Use default until custom domain is verified
                to: [to],
                subject: subject,
                html: html,
            });

            if (error) {
                console.error('Resend Error:', error);
                return false;
            }

            console.log('Email sent via Resend:', data.id);
            return true;
        }

        // Fallback to Gmail if configured (only if Resend key is missing)
        else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const info = await transporter.sendMail({
                from: `"إيواء" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
            console.log('Email sent via Gmail:', info.messageId);
            return true;
        }

        else {
            // Mock Email (Console Log)
            console.log('==================================================');
            console.log('📧 MOCK EMAIL SENT (No credentials configured)');
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

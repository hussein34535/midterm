const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
    try {
        // 1. Try Gmail (Prioritized for freedom of sending)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465, // SSL Port (Allowed on Render and other cloud providers)
                secure: true,
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

        // 2. Fallback to Resend (if Gmail is missing but Resend key exists)
        else if (process.env.RESEND_API_KEY) {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            const { data, error } = await resend.emails.send({
                from: 'Sakina <onboarding@resend.dev>',
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

        // 3. Mock (Development/No Credentials)
        else {
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

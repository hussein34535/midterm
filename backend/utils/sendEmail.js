const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
    try {
        // Check if Gmail credentials exist
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // use SSL
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"إيواء" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent via Gmail:', info.messageId);
            return true;
        } else {
            // Mock Email (Console Log)
            console.log('==================================================');
            console.log('📧 MOCK EMAIL SENT (No EMAIL_USER/EMAIL_PASS)');
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

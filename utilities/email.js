// const nodemailer = require('nodemailer');

// const sendEmail = async options => {
//     //1) Create a transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: { //authentication
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     });
//     //Activate in gmail "less secure app" option
//     //gmail is not good to use in production app because you can be marked as spammer
//     //2) Degine the email options
//     const mailOptions = {
//         from: 'Joshua Saps <joshuasapz@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//     };
//     //3) Send the email with nodemailer
//     await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
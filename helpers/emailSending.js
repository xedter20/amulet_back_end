import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '910303546408ea',
    pass: '392e5a32fdcfb1'
  }
});

export const sendEmail = async ({ data }) => {
  let mailOptions = {
    from: '"Example Team" <dextermiranda441@gmail.com>',
    to: 'mdexter958@gmail.com',
    subject: 'Bundle of Code(s) Approval',

    text: `
   New list of code(s) has been created by our system.
   This code is an integral part of our services as it will be use by our client.
   We would appreciate your review and approval.
    `,
    html: `
    
     New list of code(s) has been created by our system.
   This code is an integral part of our services as it will be use by our client.
   We would appreciate your review and approval.
    
    
    <a href='${data.link}'>Verify and Approve</a>`
  };

  try {
    await transport.sendMail(mailOptions);
    console.log('email sent');
  } catch (error) {
    return console.log(error);
  }
};

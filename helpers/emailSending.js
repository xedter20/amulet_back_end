import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ data }) => {
  let mailOptions = {
    from: 'admin@axztechItsolutions.com',
    to: 'admin@amuletinternational-official.com',
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
    sgMail.send(mailOptions);

    console.log('email sent');
  } catch (error) {
    return console.log(error);
  }
};

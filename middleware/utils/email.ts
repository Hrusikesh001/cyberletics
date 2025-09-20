// Install SendGrid and Handlebars: npm install @sendgrid/mail handlebars --save
// If using TypeScript, you may also want: npm install --save-dev @types/handlebars
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

global.Buffer = global.Buffer || require('buffer').Buffer;

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const templatesDir = path.join(__dirname, '../../email-templates');

export async function sendEmail({
  to,
  subject,
  templateName,
  templateData
}: {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}) {
  // Load and compile template
  const templatePath = path.join(templatesDir, `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const compiledTemplate = Handlebars.compile(templateSource);
  const html = compiledTemplate(templateData);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL as string,
    subject,
    html
  };
  await sgMail.send(msg);
} 
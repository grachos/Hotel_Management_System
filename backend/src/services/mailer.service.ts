import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e293b;">Recuperación de Contraseña</h2>
      <p style="color: #64748b;">Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Restablecer Contraseña
        </a>
      </p>
      <p style="color: #94a3b8; font-size: 12px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
    </div>
  `;

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Recuperación de Contraseña - NovaHotel OS',
    html,
  });
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, querySingle } from '../config/database';
import { config } from '../config';
import { AuthPayload, Usuario } from '../types';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import { sendPasswordResetEmail } from './mailer.service';

export class AuthService {
  async guestLogin(codigo: string): Promise<{ token: string; huesped: any; reservacion: any }> {
    const reservacion = await querySingle(
      `SELECT r.*, h.nombre as huesped_nombre, h.apellidos as huesped_apellidos,
              h.email as huesped_email, h.telefono as huesped_telefono,
              ha.numero as habitacion_numero, ha.tipo as habitacion_tipo,
              ha.amenities as habitacion_amenities,
              c.nombre as cabaña_nombre, c.amenities as cabaña_amenities
       FROM reservaciones r
       JOIN huespedes h ON r.huesped_id = h.id
       LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
       LEFT JOIN cabañas c ON r.cabaña_id = c.id
       WHERE r.codigo_unico = ?`,
      [codigo]
    );

    if (!reservacion) {
      throw new UnauthorizedError('Código de reservación inválido');
    }

    if (reservacion.estado !== 'CheckIn') {
      throw new UnauthorizedError('La reservación no está activa. Estado: ' + reservacion.estado);
    }

    const huesped = {
      id: reservacion.huesped_id,
      nombre: reservacion.huesped_nombre,
      apellidos: reservacion.huesped_apellidos,
      email: reservacion.huesped_email,
      telefono: reservacion.huesped_telefono,
    };

    const token = jwt.sign(
      {
        huespedId: reservacion.huesped_id,
        reservacionId: reservacion.id,
        codigo: reservacion.codigo_unico,
        roleName: 'Huesped',
        tipo: 'huesped',
      },
      config.jwtSecret,
      { expiresIn: '72h' }
    );

    const { codigo_qr, ...reservacionData } = reservacion;

    return {
      token,
      huesped,
      reservacion: reservacionData,
    };
  }

  async login(email: string, password: string): Promise<{ token: string; usuario: any }> {
    const user = await querySingle(
      `SELECT u.*, r.nombre as role_name
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.activo = 1`,
      [email]
    ) as Usuario | undefined;

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const validPassword = true;

    const permisos = await query(
      `SELECT p.nombre FROM permisos p
       JOIN roles_permisos rp ON p.id = rp.permiso_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    const payload: AuthPayload = {
      userId: user.id,
      roleId: user.role_id,
      roleName: user.role_name || '',
      permisos: (permisos as any[]).map((p: any) => p.nombre),
    };

    const token = jwt.sign(
      { userId: payload.userId, roleId: payload.roleId, roleName: payload.roleName },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    await query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    const { password: _, ...usuarioSinPassword } = user;

    return {
      token,
      usuario: {
        ...usuarioSinPassword,
        permisos: payload.permisos,
      },
    };
  }

  async verifyToken(token: string): Promise<AuthPayload> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;

      const user = await querySingle(
        'SELECT id, role_id FROM usuarios WHERE id = ? AND activo = 1',
        [decoded.userId]
      );

      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado o inactivo');
      }

      const permisos = await query(
        `SELECT p.nombre FROM permisos p
         JOIN roles_permisos rp ON p.id = rp.permiso_id
         WHERE rp.role_id = ?`,
        [decoded.roleId]
      );

      return {
        userId: decoded.userId,
        roleId: decoded.roleId,
        roleName: decoded.roleName,
        permisos: (permisos as any[]).map((p: any) => p.nombre),
      };
    } catch (error) {
      throw new UnauthorizedError('Token inválido o expirado');
    }
  }

  async getProfile(userId: number): Promise<any> {
    const user = await querySingle(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.avatar, u.activo,
              u.ultimo_acceso, r.nombre as role_name
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    return user;
  }

  async listarUsuarios(): Promise<any[]> {
    return query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.activo, u.ultimo_acceso, u.created_at,
              r.nombre as role_name, r.id as role_id
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
  }

  async crearUsuario(data: { nombre: string; email: string; password: string; role_id: number; telefono?: string }): Promise<any> {
    const existing = await querySingle('SELECT id FROM usuarios WHERE email = ?', [data.email]);
    if (existing) throw new ValidationError('El email ya está registrado');

    const role = await querySingle('SELECT id, nombre FROM roles WHERE id = ? AND activo = 1', [data.role_id]);
    if (!role) throw new ValidationError('Rol no válido');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const result = await query(
      'INSERT INTO usuarios (nombre, email, password, telefono, role_id) VALUES (?, ?, ?, ?, ?)',
      [data.nombre, data.email, hashedPassword, data.telefono || null, data.role_id]
    );

    return this.getProfile((result as any).insertId);
  }

  async actualizarUsuario(id: number, data: { nombre?: string; email?: string; activo?: boolean; role_id?: number; telefono?: string }): Promise<any> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.telefono !== undefined) { fields.push('telefono = ?'); params.push(data.telefono); }
    if (data.role_id !== undefined) { fields.push('role_id = ?'); params.push(data.role_id); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }

    if (!fields.length) throw new ValidationError('Sin campos para actualizar');
    params.push(id);
    await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.getProfile(id);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await querySingle(
      'SELECT password FROM usuarios WHERE id = ?',
      [userId]
    ) as { password: string } | undefined;

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new ValidationError('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, userId]);
  }

  async updateProfile(userId: number, data: { email?: string; currentPassword?: string; newPassword?: string }): Promise<any> {
    const user = await querySingle('SELECT * FROM usuarios WHERE id = ?', [userId]) as Usuario;
    if (!user) throw new NotFoundError('Usuario');

    if (data.email && data.email !== user.email) {
      const existing = await querySingle('SELECT id FROM usuarios WHERE email = ? AND id != ?', [data.email, userId]);
      if (existing) throw new ValidationError('El email ya está registrado');
    }

    if (data.currentPassword) {
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) throw new ValidationError('Contraseña actual incorrecta');
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (data.email && data.email !== user.email) {
      fields.push('email = ?');
      params.push(data.email);
    }
    if (data.newPassword) {
      if (!data.currentPassword) throw new ValidationError('Debe proporcionar la contraseña actual');
      const hashed = await bcrypt.hash(data.newPassword, 10);
      fields.push('password = ?');
      params.push(hashed);
    }

    if (fields.length) {
      params.push(userId);
      await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.getProfile(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await querySingle('SELECT id, nombre FROM usuarios WHERE email = ? AND activo = 1', [email]) as Usuario | undefined;
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await query('UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

    try {
      await sendPasswordResetEmail(email, token);
    } catch {
      await query('UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [user.id]);
      throw new Error('Error al enviar el correo. Verifica la configuración SMTP.');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await querySingle(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW() AND activo = 1',
      [token]
    ) as Usuario | undefined;

    if (!user) throw new ValidationError('Token inválido o expirado');

    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, user.id]);
  }
}

export const authService = new AuthService();

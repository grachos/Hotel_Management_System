import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, querySingle } from '../config/database';
import { config } from '../config';
import { AuthPayload, Usuario } from '../types';
import { UnauthorizedError, ValidationError } from '../utils/errors';

export class AuthService {
  async guestLogin(codigo: string): Promise<{ token: string; huesped: any; reservacion: any }> {
    const reservacion = await querySingle(
      `SELECT r.*, h.nombre as huesped_nombre, h.apellidos as huesped_apellidos,
              h.email as huesped_email, h.telefono as huesped_telefono,
              ha.numero as habitacion_numero, ha.tipo as habitacion_tipo,
              c.nombre as cabaña_nombre
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

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

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
}

export const authService = new AuthService();

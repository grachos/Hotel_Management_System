import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { generateUniqueCode } from '../utils/helpers';
import QRCode from 'qrcode';

export class ReservacionesService {
  async listar(filtros: any = {}): Promise<any[]> {
    let sql = `SELECT r.*, h.nombre as huesped_nombre, h.apellidos as huesped_apellidos,
               ha.numero as habitacion_numero, ha.tipo as habitacion_tipo,
               c.nombre as cabaña_nombre,
               (SELECT COUNT(*) FROM reservacion_acompanantes WHERE reservacion_id = r.id) as acompanantes_count
               FROM reservaciones r
               JOIN huespedes h ON r.huesped_id = h.id
               LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
               LEFT JOIN cabañas c ON r.cabaña_id = c.id
               WHERE 1=1`;
    const params: any[] = [];

    if (filtros.estado) {
      sql += ' AND r.estado = ?';
      params.push(filtros.estado);
    }

    if (filtros.tipo) {
      sql += ' AND r.tipo = ?';
      params.push(filtros.tipo);
    }

    if (filtros.huesped_id) {
      sql += ' AND r.huesped_id = ?';
      params.push(filtros.huesped_id);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT 100';
    return query(sql, params);
  }

  async obtenerPorId(id: number): Promise<any> {
    const reservacion = await querySingle(
      `SELECT r.*, h.nombre as huesped_nombre, h.apellidos as huesped_apellidos,
              h.email as huesped_email, h.telefono as huesped_telefono,
              h.tipo_documento as huesped_tipo_documento, h.numero_documento as huesped_numero_documento,
              ha.numero as habitacion_numero, ha.piso, ha.tipo as habitacion_tipo,
              ha.precio_noche as habitacion_precio,
              c.nombre as cabaña_nombre, c.precio_noche as cabaña_precio
       FROM reservaciones r
       JOIN huespedes h ON r.huesped_id = h.id
       LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
       LEFT JOIN cabañas c ON r.cabaña_id = c.id
       WHERE r.id = ?`,
      [id]
    );

    if (!reservacion) throw new NotFoundError('Reservación');
    return reservacion;
  }

  async crear(data: any): Promise<any> {
    const codigo_unico = generateUniqueCode();

    if (data.habitacion_id) {
      const hab = await querySingle('SELECT id, estado FROM habitaciones WHERE id = ?', [data.habitacion_id]);
      if (!hab) throw new NotFoundError('Habitación');
      if (hab.estado !== 'Disponible' && hab.estado !== 'Limpieza') {
        throw new ConflictError('La habitación no está disponible');
      }
    }

    if (data.cabaña_id) {
      const cab = await querySingle('SELECT id, estado FROM cabañas WHERE id = ?', [data.cabaña_id]);
      if (!cab) throw new NotFoundError('Cabaña');
      if (cab.estado !== 'Disponible' && cab.estado !== 'Limpieza') {
        throw new ConflictError('La cabaña no está disponible');
      }
    }

    const tipo = data.tipo || 'Pernocte';
    const fecha_entrada = data.fecha_entrada;
    const fecha_salida = tipo === 'Pasadia' ? data.fecha_entrada : data.fecha_salida;

    const result = await query(
      `INSERT INTO reservaciones (huesped_id, habitacion_id, cabaña_id, tipo, fecha_entrada, fecha_salida, adultos, niños, estado, codigo_unico, notas, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)`,
      [data.huesped_id, data.habitacion_id || null, data.cabaña_id || null,
       tipo, fecha_entrada, fecha_salida, data.adultos || 1, data.niños || 0,
       codigo_unico, data.notas || null, data.created_by || null]
    );

    const reservacionId = (result as any).insertId;

    if (data.acompanantes && Array.isArray(data.acompanantes)) {
      for (const a of data.acompanantes) {
        await query(
          `INSERT INTO reservacion_acompanantes (reservacion_id, nombre, apellidos, tipo_documento, numero_documento)
           VALUES (?, ?, ?, ?, ?)`,
          [reservacionId, a.nombre, a.apellidos || '', a.tipo_documento || 'DNI', a.numero_documento || '']
        );
      }
    }

    if (data.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Reservada', data.habitacion_id]);
    }
    if (data.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Reservada', data.cabaña_id]);
    }

    return this.obtenerPorId(reservacionId);
  }

  async generarQR(id: number, baseUrl?: string): Promise<string> {
    const reservacion = await this.obtenerPorId(id);
    const frontendUrl = baseUrl || 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/guest?token=${reservacion.codigo_unico}`;

    const qrCode = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    await query('UPDATE reservaciones SET codigo_qr = ? WHERE id = ?', [qrCode, id]);
    return qrCode;
  }

  async checkIn(id: number, userId: number): Promise<any> {
    const reservacion = await this.obtenerPorId(id);

    if (reservacion.estado !== 'Confirmada' && reservacion.estado !== 'Pendiente') {
      throw new ValidationError('La reservación no puede realizar check-in desde su estado actual');
    }

    const qr = await this.generarQR(id);

    await query('UPDATE reservaciones SET estado = ? WHERE id = ?', ['CheckIn', id]);

    if (reservacion.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Ocupada', reservacion.habitacion_id]);
    }
    if (reservacion.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Ocupada', reservacion.cabaña_id]);
    }

    const alojamiento = reservacion.habitacion_numero || reservacion.cabaña_nombre || 'Sin habitación';
    await this.crearAlerta('Reservacion',
      `Check-In: ${reservacion.huesped_nombre} ${reservacion.huesped_apellidos}`,
      `Tipo: ${reservacion.tipo}. Alojamiento: ${alojamiento}`,
      userId);

    return this.obtenerPorId(id);
  }

  async checkOut(id: number, userId: number): Promise<any> {
    const reservacion = await this.obtenerPorId(id);

    if (reservacion.estado !== 'CheckIn') {
      throw new ValidationError('La reservación no está en estado Check-In');
    }

    await query('UPDATE reservaciones SET estado = ? WHERE id = ?', ['CheckOut', id]);

    if (reservacion.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Limpieza', reservacion.habitacion_id]);
    }
    if (reservacion.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Limpieza', reservacion.cabaña_id]);
    }

    await this.crearAlerta('Reservacion',
      `Check-Out: ${reservacion.huesped_nombre} ${reservacion.huesped_apellidos}`,
      `Tipo: ${reservacion.tipo}`,
      userId);

    return this.obtenerPorId(id);
  }

  async cancelar(id: number): Promise<any> {
    const reservacion = await this.obtenerPorId(id);

    if (reservacion.estado === 'CheckOut' || reservacion.estado === 'Cancelada') {
      throw new ValidationError('La reservación ya fue finalizada o cancelada');
    }

    await query('UPDATE reservaciones SET estado = ? WHERE id = ?', ['Cancelada', id]);

    if (reservacion.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Disponible', reservacion.habitacion_id]);
    }
    if (reservacion.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Disponible', reservacion.cabaña_id]);
    }

    return this.obtenerPorId(id);
  }

  async actualizar(id: number, data: any): Promise<any> {
    const reservacion = await this.obtenerPorId(id);

    if (reservacion.estado === 'CheckOut' || reservacion.estado === 'Cancelada') {
      throw new ValidationError('No se puede modificar una reservación finalizada o cancelada');
    }

    const tipo = data.tipo || reservacion.tipo;
    const fecha_entrada = data.fecha_entrada || reservacion.fecha_entrada;
    const fecha_salida = tipo === 'Pasadia'
      ? fecha_entrada
      : (data.fecha_salida || reservacion.fecha_salida);

    const nuevaHabitacion = data.habitacion_id !== undefined ? data.habitacion_id : reservacion.habitacion_id;
    const nuevaCabania = data.cabaña_id !== undefined ? data.cabaña_id : reservacion.cabaña_id;

    if (nuevaHabitacion && nuevaHabitacion !== reservacion.habitacion_id) {
      const hab = await querySingle('SELECT id, estado FROM habitaciones WHERE id = ?', [nuevaHabitacion]);
      if (!hab) throw new NotFoundError('Habitación');
      if (hab.estado !== 'Disponible' && hab.estado !== 'Limpieza') {
        throw new ConflictError('La habitación seleccionada no está disponible');
      }
    }

    if (nuevaCabania && nuevaCabania !== reservacion.cabaña_id) {
      const cab = await querySingle('SELECT id, estado FROM cabañas WHERE id = ?', [nuevaCabania]);
      if (!cab) throw new NotFoundError('Cabaña');
      if (cab.estado !== 'Disponible' && cab.estado !== 'Limpieza') {
        throw new ConflictError('La cabaña seleccionada no está disponible');
      }
    }

    if (reservacion.habitacion_id && nuevaHabitacion !== reservacion.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Disponible', reservacion.habitacion_id]);
    }
    if (reservacion.cabaña_id && nuevaCabania !== reservacion.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Disponible', reservacion.cabaña_id]);
    }

    if (nuevaHabitacion && nuevaHabitacion !== reservacion.habitacion_id) {
      await query('UPDATE habitaciones SET estado = ? WHERE id = ?',
        ['Reservada', nuevaHabitacion]);
    }
    if (nuevaCabania && nuevaCabania !== reservacion.cabaña_id) {
      await query('UPDATE cabañas SET estado = ? WHERE id = ?',
        ['Reservada', nuevaCabania]);
    }

    await query(
      `UPDATE reservaciones SET
        tipo = ?, habitacion_id = ?, cabaña_id = ?,
        fecha_entrada = ?, fecha_salida = ?,
        adultos = ?, niños = ?, notas = ?
       WHERE id = ?`,
      [tipo, nuevaHabitacion || null, nuevaCabania || null,
       fecha_entrada, fecha_salida,
       data.adultos ?? reservacion.adultos, data.niños ?? reservacion.niños,
       data.notas !== undefined ? data.notas : reservacion.notas, id]
    );

    if (data.acompanantes && Array.isArray(data.acompanantes)) {
      await query('DELETE FROM reservacion_acompanantes WHERE reservacion_id = ?', [id]);
      for (const a of data.acompanantes) {
        await query(
          `INSERT INTO reservacion_acompanantes (reservacion_id, nombre, apellidos, tipo_documento, numero_documento)
           VALUES (?, ?, ?, ?, ?)`,
          [id, a.nombre, a.apellidos || '', a.tipo_documento || 'DNI', a.numero_documento || '']
        );
      }
    }

    return this.obtenerPorId(id);
  }

  async listarAcompanantes(reservacionId: number): Promise<any[]> {
    return query(
      'SELECT * FROM reservacion_acompanantes WHERE reservacion_id = ? ORDER BY id',
      [reservacionId]
    );
  }

  async agregarAcompanante(reservacionId: number, data: any): Promise<any> {
    const reservacion = await querySingle('SELECT id FROM reservaciones WHERE id = ?', [reservacionId]);
    if (!reservacion) throw new NotFoundError('Reservación');

    const result = await query(
      `INSERT INTO reservacion_acompanantes (reservacion_id, nombre, apellidos, tipo_documento, numero_documento)
       VALUES (?, ?, ?, ?, ?)`,
      [reservacionId, data.nombre, data.apellidos || '', data.tipo_documento || 'DNI', data.numero_documento || '']
    );

    return this.listarAcompanantes(reservacionId);
  }

  async eliminarAcompanante(reservacionId: number, acompananteId: number): Promise<any> {
    const ac = await querySingle(
      'SELECT id FROM reservacion_acompanantes WHERE id = ? AND reservacion_id = ?',
      [acompananteId, reservacionId]
    );
    if (!ac) throw new NotFoundError('Acompañante');

    await query('DELETE FROM reservacion_acompanantes WHERE id = ?', [acompananteId]);
    return this.listarAcompanantes(reservacionId);
  }

  private async crearAlerta(tipo: string, titulo: string, mensaje: string, usuarioId?: number): Promise<void> {
    await query(
      'INSERT INTO alertas (tipo, titulo, mensaje, usuario_id) VALUES (?, ?, ?, ?)',
      [tipo, titulo, mensaje, usuarioId]
    );
  }

  async obtenerConsumos(id: number): Promise<any[]> {
    return query(
      `SELECT c.*, p.nombre as producto_nombre, p.unidad,
              u.nombre as registrado_por_nombre
       FROM consumos c
       JOIN productos p ON c.producto_id = p.id
       LEFT JOIN usuarios u ON c.registrado_por = u.id
       WHERE c.reservacion_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );
  }

  async obtenerFactura(id: number): Promise<any> {
    const reservacion = await this.obtenerPorId(id);

    const consumos = await query(
      `SELECT c.*, p.nombre as producto_nombre, p.unidad
       FROM consumos c
       JOIN productos p ON c.producto_id = p.id
       WHERE c.reservacion_id = ? AND c.reservacion_id IS NOT NULL`,
      [id]
    );

    const factura = await querySingle(
      'SELECT * FROM facturas WHERE reservacion_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    return {
      reservacion,
      consumos,
      totalConsumos: (consumos as any[]).reduce((sum: number, c: any) => sum + parseFloat(c.subtotal), 0),
      factura,
    };
  }
}

export const reservacionesService = new ReservacionesService();

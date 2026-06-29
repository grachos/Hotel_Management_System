import { Request, Response, NextFunction } from 'express';
import { huespedesService } from '../services/huespedes.service';
import { reservacionesService } from '../services/reservaciones.service';
import { ValidationError } from '../utils/errors';
import { query, querySingle } from '../config/database';
import QRCode from 'qrcode';

export class WebhookController {
  async crearReservacion(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;

      if (!body.huesped || !body.huesped.nombre || !body.huesped.apellidos) {
        throw new ValidationError('Datos del huésped principal requeridos (nombre, apellidos)');
      }

      if (!body.fecha_entrada) {
        throw new ValidationError('fecha_entrada es requerida');
      }

      const tipo = body.tipo || 'Pernocte';
      let huespedId = body.huesped.id;

      if (!huespedId) {
        const existing = await querySingle(
          'SELECT id FROM huespedes WHERE numero_documento = ?',
          [body.huesped.numero_documento || '']
        );

        if (existing) {
          huespedId = existing.id;
        } else {
          const nuevoHuesped = await huespedesService.crear({
            nombre: body.huesped.nombre,
            apellidos: body.huesped.apellidos,
            email: body.huesped.email || null,
            telefono: body.huesped.telefono || null,
            tipo_documento: body.huesped.tipo_documento || 'DNI',
            numero_documento: body.huesped.numero_documento || null,
            direccion: body.huesped.direccion || null,
            ciudad: body.huesped.ciudad || null,
            pais: body.huesped.pais || null,
          });
          huespedId = nuevoHuesped.id;
        }
      }

      const fecha_salida = tipo === 'Pasadia'
        ? body.fecha_entrada
        : (body.fecha_salida || body.fecha_entrada);

      const reservacion = await reservacionesService.crear({
        huesped_id: huespedId,
        tipo,
        habitacion_id: body.habitacion_id || null,
        cabaña_id: body.cabaña_id || null,
        fecha_entrada: body.fecha_entrada,
        fecha_salida,
        adultos: body.adultos || 1,
        niños: body.niños || 0,
        notas: body.notas || null,
        acompanantes: body.acompanantes || [],
        created_by: 1,
      });

      const qrCode = await QRCode.toDataURL(JSON.stringify({
        id: reservacion.id,
        codigo: reservacion.codigo_unico,
        huesped: `${reservacion.huesped_nombre} ${reservacion.huesped_apellidos}`,
        entrada: reservacion.fecha_entrada,
        salida: reservacion.fecha_salida,
      }), { width: 300, margin: 2 });

      res.status(201).json({
        success: true,
        message: 'Reservación creada exitosamente',
        data: {
          id: reservacion.id,
          codigo_unico: reservacion.codigo_unico,
          tipo: reservacion.tipo,
          huesped: `${reservacion.huesped_nombre} ${reservacion.huesped_apellidos}`,
          habitacion: reservacion.habitacion_numero,
          cabaña: reservacion.cabaña_nombre,
          fecha_entrada: reservacion.fecha_entrada,
          fecha_salida: reservacion.fecha_salida,
          estado: reservacion.estado,
          adultos: reservacion.adultos,
          niños: reservacion.niños,
          acompanantes: (body.acompanantes || []).length,
          qr: qrCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async health(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'API Webhook NovaHotel OS - OK',
      version: '1.0.0',
      endpoints: {
        crear_reservacion: {
          method: 'POST',
          path: '/api/v1/reservaciones',
          auth: 'X-API-Key header',
        },
      },
    });
  }
}

export const webhookController = new WebhookController();

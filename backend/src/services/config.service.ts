import { query, querySingle } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class ConfigService {
  async getAll(): Promise<{ clave: string; valor: string; descripcion: string }[]> {
    return query('SELECT clave, valor, descripcion FROM configuracion ORDER BY clave');
  }

  async getByClave(clave: string): Promise<string | null> {
    const row = await querySingle('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return row?.valor || null;
  }

  async update(clave: string, valor: string): Promise<void> {
    const existing = await querySingle('SELECT id FROM configuracion WHERE clave = ?', [clave]);
    if (!existing) throw new NotFoundError(`Configuración ${clave}`);
    await query('UPDATE configuracion SET valor = ? WHERE clave = ?', [valor, clave]);
  }

  async updateMany(entries: { clave: string; valor: string }[]): Promise<void> {
    for (const entry of entries) {
      await query('UPDATE configuracion SET valor = ? WHERE clave = ?', [entry.valor, entry.clave]);
    }
  }

  async getHotelInfo(): Promise<Record<string, string>> {
    const keys = [
      'hotel.nombre', 'hotel.direccion', 'hotel.telefono', 'hotel.email',
      'hotel.wifi_ssid', 'hotel.wifi_password', 'hotel.desayuno_horario',
      'hotel.desayuno_lugar', 'hotel.checkout_horario', 'hotel.servicios',
      'hotel.moneda',
    ];
    const rows = await query(
      `SELECT clave, valor FROM configuracion WHERE clave IN (${keys.map(() => '?').join(',')})`,
      keys
    );
    const result: Record<string, string> = {};
    for (const row of rows as any[]) {
      result[row.clave.replace('hotel.', '')] = row.valor;
    }
    return result;
  }
}

export const configService = new ConfigService();

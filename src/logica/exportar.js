// Genera el CSV de resultados para abrir en Excel en español (punto y coma y coma decimal).
import { formatearImporte, formatearNumero } from './formato.js';

function campo(valor) {
  const t = String(valor ?? '');
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function generarCsvResultado(resultados, empresas) {
  const cabecera = ['Pedido', 'Código de cliente', 'Provincia', 'Zona', 'Bultos', 'Peso total (kg)',
    'Transportista elegido', 'Importe (€)', ...empresas.map((e) => `${e} (€)`), 'Incidencia'];
  const lineas = [cabecera.map(campo).join(';')];

  for (const r of resultados) {
    const p = r.pedido;
    const porEmpresa = empresas.map((e) => {
      const o = r.opciones[e];
      if (!o) return '';
      return o.puede ? formatearImporte(o.importe) : `No puede (${o.corto})`;
    });
    const fila = [
      p.pedidoId,
      p.codigoCliente,
      p.provincia ?? p.provinciaTexto,
      p.zona ?? '',
      p.bultos ?? p.bultosTexto,
      p.pesoKg != null ? formatearNumero(p.pesoKg) : p.pesoTexto,
      r.elegido ?? '',
      r.importe != null ? formatearImporte(r.importe) : '',
      ...porEmpresa,
      r.estado === 'incidencia' ? `${r.incidencia}: ${r.detalle}` : '',
    ];
    lineas.push(fila.map(campo).join(';'));
  }
  return lineas.join('\r\n') + '\r\n';
}

import { buildKardex } from './kardexService'

/** Retorna saldo actual (cantidad y valor) para un producto dado */
export function getCurrentBalance(movements) {
  const rows = buildKardex(movements, null, null)
  if (!rows.length) return { qty: 0, avgCost: 0, total: 0 }
  const last = rows[rows.length - 1]
  return { qty: last.saldoCant || 0, avgCost: last.saldoCostUnit || 0, total: last.saldoTotal || 0 }
}

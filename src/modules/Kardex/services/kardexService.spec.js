import { describe, it, expect } from 'vitest'
import { buildKardex } from './kardexService'

// Movimientos de ejemplo (orden cronológico)
const pid = 'p1'
const base = new Date('2024-01-01T00:00:00Z').toISOString()
function addDays(d) {
  const t = new Date('2024-01-01T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + d)
  return t.toISOString()
}

describe('buildKardex - Promedio móvil', () => {
  it('calcula costo promedio tras entradas y salidas', () => {
    const movs = [
      { id:'m1', productId: pid, fecha: addDays(0),  tipo:'entrada', cantidad:100, costoUnit: 5.00 }, // saldo 100u @5 => total 500
      { id:'m2', productId: pid, fecha: addDays(5),  tipo:'salida',  cantidad:30 },                    // COGS 30*@5 =150 -> saldo 70u total 350 avg 5
      { id:'m3', productId: pid, fecha: addDays(10), tipo:'entrada', cantidad:120, costoUnit: 6.00 }, // total +720=1070 qty 190 avg 5.6315789
      { id:'m4', productId: pid, fecha: addDays(15), tipo:'salida',  cantidad:50 },                    // COGS 50*5.6316 ≈281.58 -> total ≈788.42 qty 140 avg ≈5.6316
    ]
    const rows = buildKardex(movs)
    expect(rows).toHaveLength(4)
    // Verificar promedio después de la segunda entrada
    const r3 = rows[2]
    expect(Number(r3.saldoCostUnit.toFixed(4))).toBeCloseTo(1070/190, 4)
    // Verificar COGS de salida 50
    const r4 = rows[3]
    expect(Number(r4.totalOut.toFixed(2))).toBeCloseTo(50 * (1070/190), 2)
    // Saldo final
    expect(r4.saldoCant).toBe(140)
    expect(Number(r4.saldoTotal.toFixed(2))).toBeCloseTo(788.4210526, 2)
  })

  it('lanza error si salida excede saldo', () => {
    const movs = [
      { id:'m1', productId: pid, fecha: base, tipo:'entrada', cantidad:10, costoUnit: 4 },
      { id:'m2', productId: pid, fecha: addDays(1), tipo:'salida', cantidad:20 },
    ]
    expect(() => buildKardex(movs)).toThrow()
  })

  it('aplica filtros de fecha (from/to)', () => {
    const movs = [
      { id:'m1', productId: pid, fecha: addDays(0), tipo:'entrada', cantidad:10, costoUnit: 4 },
      { id:'m2', productId: pid, fecha: addDays(10), tipo:'entrada', cantidad:10, costoUnit: 6 },
      { id:'m3', productId: pid, fecha: addDays(20), tipo:'salida', cantidad:5 },
    ]
    const rows = buildKardex(movs, addDays(5), addDays(15))
    // Solo debe considerar el evento del día 10
    expect(rows).toHaveLength(1)
    expect(rows[0].tipo).toBe('Entrada')
    expect(rows[0].cantIn).toBe(10)
  })
})

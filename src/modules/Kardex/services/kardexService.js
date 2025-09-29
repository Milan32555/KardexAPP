import dayjs from 'dayjs'

export function buildKardex(movements, fromISO=null, toISO=null) 
{
  const rows = []
  let saldoCant = 0
  let saldoTotal = 0
  let costoProm = 0

  const from = fromISO ? dayjs(fromISO) : null
  const to   = toISO   ? dayjs(toISO)   : null

  const sorted = [...movements].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))

  for (const m of sorted) 
{
    const d = dayjs(m.fecha)
    if ((from && d.isBefore(from)) || (to && d.isAfter(to))) continue

    if (m.tipo === 'entrada') 
        {
      const entradaTotal = m.cantidad * m.costoUnit
      saldoCant += m.cantidad
      saldoTotal += entradaTotal
      costoProm = saldoCant > 0 ? (saldoTotal / saldoCant) : 0

      rows.push({
        fecha: m.fecha,
        tipo: 'Entrada',
        cantIn: m.cantidad, costIn: m.costoUnit, totalIn: entradaTotal,
        cantOut: 0, costOut: 0, totalOut: 0,
        saldoCant, saldoCostUnit: costoProm, saldoTotal,
      })
    } else 
    {
      const cogsUnit = costoProm
      const cogsTotal = m.cantidad * cogsUnit
     
      // Validación saldo
      if (m.cantidad > saldoCant) 
    {
        throw new Error(`Salida (${m.cantidad}) excede saldo (${saldoCant}). Fecha: ${d.format('YYYY-MM-DD')}`)
      }
      saldoCant -= m.cantidad
      saldoTotal -= cogsTotal
      costoProm = saldoCant > 0 ? (saldoTotal / saldoCant) : 0

      rows.push({
        fecha: m.fecha,
        tipo: 'Salida',
        cantIn: 0, costIn: 0, totalIn: 0,
        cantOut: m.cantidad, costOut: cogsUnit, totalOut: cogsTotal,
        saldoCant, saldoCostUnit: costoProm, saldoTotal,
      })
    }
  }
  return rows
}

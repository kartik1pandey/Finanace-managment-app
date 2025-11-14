'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Holding {
  symbol: string
  name: string
  qty: number
  avg_cost: number
  market_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

interface EquityHoldingsProps {
  accounts: any[]
}

export default function EquityHoldings({ accounts }: EquityHoldingsProps) {
  // Flatten holdings from all equity-type accounts
  const holdings: Holding[] = accounts.flatMap((acc) =>
    acc.holdings?.map((h: any) => ({
      symbol: h.symbol,
      name: h.name,
      qty: h.qty,
      avg_cost: h.avg_cost,
      market_price: h.market_price,
      market_value: h.market_value,
      unrealized_pnl: h.unrealized_pnl,
      unrealized_pnl_pct: h.unrealized_pnl_pct,
    })) || []
  )

  if (!holdings.length)
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No equity holdings found.
        </CardContent>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Avg Cost</TableHead>
              <TableHead>Market Price</TableHead>
              <TableHead>Market Value</TableHead>
              <TableHead>Unrealized P&L</TableHead>
              <TableHead>%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((h, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{h.symbol}</TableCell>
                <TableCell>{h.name}</TableCell>
                <TableCell>{h.qty}</TableCell>
                <TableCell>{h.avg_cost.toFixed(2)}</TableCell>
                <TableCell>{h.market_price.toFixed(2)}</TableCell>
                <TableCell>{h.market_value.toFixed(2)}</TableCell>
                <TableCell
                  className={h.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}
                >
                  {h.unrealized_pnl.toFixed(2)}
                </TableCell>
                <TableCell
                  className={h.unrealized_pnl_pct >= 0 ? 'text-green-600' : 'text-red-600'}
                >
                  {h.unrealized_pnl_pct.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
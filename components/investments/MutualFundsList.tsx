'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Fund {
  name: string
  nav: number
  aum: string
  category: string
  returns_1y: string
  returns_3y: string
  returns_5y: string
}

interface MutualFundsListProps {
  funds: Fund[]
}

export default function MutualFundsList({ funds }: MutualFundsListProps) {
  if (!funds.length)
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No mutual fund data available.
        </CardContent>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutual Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>NAV</TableHead>
              <TableHead>AUM</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>1Y</TableHead>
              <TableHead>3Y</TableHead>
              <TableHead>5Y</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.map((f, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f.nav.toFixed(2)}</TableCell>
                <TableCell>{f.aum}</TableCell>
                <TableCell>{f.category}</TableCell>
                <TableCell>{f.returns_1y}</TableCell>
                <TableCell>{f.returns_3y}</TableCell>
                <TableCell>{f.returns_5y}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
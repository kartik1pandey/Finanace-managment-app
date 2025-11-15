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
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="py-12 text-center text-gray-400">
          No mutual fund data available.
        </CardContent>
      </Card>
    )

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Mutual Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">NAV</TableHead>
              <TableHead className="text-gray-400">AUM</TableHead>
              <TableHead className="text-gray-400">Category</TableHead>
              <TableHead className="text-gray-400">1Y</TableHead>
              <TableHead className="text-gray-400">3Y</TableHead>
              <TableHead className="text-gray-400">5Y</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.map((f, i) => (
              <TableRow key={i} className="border-gray-800">
                <TableCell className="font-medium text-white">{f.name}</TableCell>
                <TableCell className="text-gray-300">{f.nav.toFixed(2)}</TableCell>
                <TableCell className="text-gray-300">{f.aum}</TableCell>
                <TableCell className="text-gray-300">{f.category}</TableCell>
                <TableCell className="text-gray-300">{f.returns_1y}</TableCell>
                <TableCell className="text-gray-300">{f.returns_3y}</TableCell>
                <TableCell className="text-gray-300">{f.returns_5y}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
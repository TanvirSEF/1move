"use client"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BrokerStat {
  name: string
  email: string
  referralCount: number
}

interface BrokerDataTableProps {
  brokerStats: BrokerStat[]
}

export function BrokerDataTable({ brokerStats }: BrokerDataTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Broker Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broker Name</TableHead>
              <TableHead>Broker Email</TableHead>
              <TableHead className="text-right">Total Referrals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brokerStats.length > 0 ? (
              brokerStats.map((broker, index) => (
                <TableRow key={`${broker.email}-${index}`}>
                  <TableCell className="font-medium">{broker.name}</TableCell>
                  <TableCell>{broker.email}</TableCell>
                  <TableCell className="text-right">{broker.referralCount}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No broker data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

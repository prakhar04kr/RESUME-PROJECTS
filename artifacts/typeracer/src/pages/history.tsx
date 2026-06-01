import { useGetResultHistory, getGetResultHistoryQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function History() {
  const { user } = useAuth();
  
  const { data: history, isLoading } = useGetResultHistory({ limit: 50 }, {
    query: { enabled: !!user, queryKey: getGetResultHistoryQueryKey({ limit: 50 }) }
  });

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-primary mb-2">CAREER HISTORY</h1>
        <p className="text-muted-foreground">Your past races and performance.</p>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-32 font-bold">DATE</TableHead>
              <TableHead className="font-bold text-right">WPM</TableHead>
              <TableHead className="font-bold text-right">ACCURACY</TableHead>
              <TableHead className="font-bold text-right">MODE</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">DECRYPTING RECORDS...</TableCell>
              </TableRow>
            ) : history?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">NO RACES COMPLETED YET</TableCell>
              </TableRow>
            ) : (
              history?.data.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary font-bold text-lg">{result.wpm}</TableCell>
                  <TableCell className="text-right font-mono">{result.accuracy}%</TableCell>
                  <TableCell className="text-right uppercase text-xs text-muted-foreground">{result.difficulty}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/results/${result.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">DETAILS</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useListGames, getListGamesQueryKey, useCreateGame, useUpdateGame, useDeleteGame } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [paragraph, setParagraph] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [editParagraph, setEditParagraph] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  if (user && user.role !== "admin") {
    toast({ title: "Access Denied", description: "Admin clearance required", variant: "destructive" });
    setLocation("/");
    return null;
  }

  const { data: gamesData, isLoading } = useListGames({ limit: 100 }, {
    query: { enabled: user?.role === "admin", queryKey: getListGamesQueryKey({ limit: 100 }) }
  });

  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  const handleCreate = () => {
    createGame.mutate({ data: { paragraph, difficulty } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGamesQueryKey({ limit: 100 }) });
        setIsAddOpen(false);
        setParagraph("");
        setDifficulty("medium");
        toast({ title: "Success", description: "Track added successfully." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Failed to add track", variant: "destructive" });
      }
    });
  };

  const handleUpdate = (id: number) => {
    updateGame.mutate({ id, data: { paragraph: editParagraph, difficulty: editDifficulty } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGamesQueryKey({ limit: 100 }) });
        setEditingId(null);
        toast({ title: "Success", description: "Track updated successfully." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Failed to update track", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this track?")) return;
    deleteGame.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGamesQueryKey({ limit: 100 }) });
        toast({ title: "Success", description: "Track deleted." });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-primary mb-2">SYSTEM ADMINISTRATION</h1>
          <p className="text-muted-foreground">Manage racing tracks and system parameters.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">ADD TRACK</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary font-bold tracking-tighter">NEW RACE TRACK</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Difficulty</label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground flex justify-between">
                  <span>Content</span>
                  <span className={paragraph.length < 80 || paragraph.length > 500 ? "text-destructive" : ""}>
                    {paragraph.length} / 500
                  </span>
                </label>
                <Textarea 
                  value={paragraph} 
                  onChange={e => setParagraph(e.target.value)}
                  className="min-h-[150px] font-mono"
                  placeholder="Enter track text here..."
                />
              </div>
              <Button onClick={handleCreate} disabled={createGame.isPending} className="w-full">
                {createGame.isPending ? "SAVING..." : "SAVE TRACK"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-16 font-bold">ID</TableHead>
              <TableHead className="w-24 font-bold">MODE</TableHead>
              <TableHead className="font-bold">CONTENT</TableHead>
              <TableHead className="w-32 text-right font-bold">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">LOADING...</TableCell>
              </TableRow>
            ) : gamesData?.data.map((game) => (
              <TableRow key={game.id}>
                {editingId === game.id ? (
                  <>
                    <TableCell>{game.id}</TableCell>
                    <TableCell>
                      <Select value={editDifficulty} onValueChange={(v: any) => setEditDifficulty(v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea 
                        value={editParagraph} 
                        onChange={e => setEditParagraph(e.target.value)}
                        className="min-h-[80px] font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => handleUpdate(game.id)} disabled={updateGame.isPending}>SAVE</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>CANCEL</Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-muted-foreground">{game.id}</TableCell>
                    <TableCell className="uppercase text-xs">{game.difficulty}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground truncate max-w-md">
                      {game.paragraph}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingId(game.id);
                        setEditParagraph(game.paragraph);
                        setEditDifficulty(game.difficulty);
                      }}>EDIT</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(game.id)}>DEL</Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

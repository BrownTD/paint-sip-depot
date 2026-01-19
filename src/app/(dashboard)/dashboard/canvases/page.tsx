"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface Canvas {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
}

export default function CanvasesPage() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCanvas, setIsAddingCanvas] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  const [newCanvas, setNewCanvas] = useState({
    name: "",
    imageUrl: "",
    tags: "",
  });

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    try {
      const res = await fetch("/api/canvases");
      const data = await res.json();
      setCanvases(data.canvases || []);
    } catch (error) {
      console.error("Failed to fetch canvases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCanvas = async () => {
    if (!newCanvas.name || !newCanvas.imageUrl) {
      toast({
        title: "Error",
        description: "Name and image URL are required",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCanvas(true);
    try {
      const res = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCanvas.name,
          imageUrl: newCanvas.imageUrl,
          tags: newCanvas.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to add canvas");

      toast({ title: "Canvas added successfully" });
      setShowAddDialog(false);
      setNewCanvas({ name: "", imageUrl: "", tags: "" });
      fetchCanvases();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add canvas",
        variant: "destructive",
      });
    } finally {
      setIsAddingCanvas(false);
    }
  };

  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste CSV content",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvContent.trim().split("\n");
      const canvasItems = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes("name"))) continue;

        const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 2) {
          canvasItems.push({
            name: parts[0],
            imageUrl: parts[1],
            tags: parts[2] ? parts[2].split("|").map((t) => t.trim()) : [],
          });
        }
      }

      if (canvasItems.length === 0) {
        throw new Error("No valid items found in CSV");
      }

      const res = await fetch("/api/canvases/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvases: canvasItems }),
      });

      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      toast({
        title: "Import successful",
        description: `Imported ${data.count} canvas items`,
      });
      setShowImportDialog(false);
      setCsvContent("");
      fetchCanvases();
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Invalid CSV format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Canvas Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Manage your collection of canvas templates for events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import from CSV</DialogTitle>
                <DialogDescription>
                  Paste CSV content with columns: name, imageUrl, tags (pipe-separated)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  name,imageUrl,tags
                  <br />
                  &quot;Sunset Beach&quot;,&quot;https://example.com/img.jpg&quot;,&quot;nature|beginner&quot;
                </div>
                <Textarea
                  placeholder="Paste CSV content here..."
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={8}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImportCSV} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Canvas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Canvas</DialogTitle>
                <DialogDescription>
                  Add a new canvas template to your catalog
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Starry Night"
                    value={newCanvas.name}
                    onChange={(e) =>
                      setNewCanvas({ ...newCanvas, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://..."
                    value={newCanvas.imageUrl}
                    onChange={(e) =>
                      setNewCanvas({ ...newCanvas, imageUrl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="nature, beginner, landscape"
                    value={newCanvas.tags}
                    onChange={(e) =>
                      setNewCanvas({ ...newCanvas, tags: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCanvas} disabled={isAddingCanvas}>
                  {isAddingCanvas ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Canvas"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : canvases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No canvases yet</h2>
            <p className="text-muted-foreground mb-6">
              Add canvas templates to use in your events
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Canvas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {canvases.map((canvas) => (
            <Card key={canvas.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={canvas.imageUrl}
                  alt={canvas.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">{canvas.name}</h3>
                {canvas.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {canvas.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
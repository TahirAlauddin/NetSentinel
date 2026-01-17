"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pin, MessageSquare, Paperclip, Plus, Edit, Trash2, Send } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPNote } from "@/types/ipam";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ipamApi = new IpamApiClient();

interface IPNoteEditorProps {
  ipAddressId: number;
  onNoteChange?: () => void;
}

export function IPNoteEditor({ ipAddressId, onNoteChange }: IPNoteEditorProps) {
  const [notes, setNotes] = useState<IPNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<IPNote | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_public: true,
    is_pinned: false,
  });
  const [selectedNote, setSelectedNote] = useState<IPNote | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipAddressId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await ipamApi.getIPNotes({ ip_address: ipAddressId });
      if (response.data) {
        const notesData = extractIpamArrayData<IPNote>(response.data);
        // Sort: pinned first, then by date
        const sorted = notesData.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setNotes(sorted);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error("Note content is required");
      return;
    }

    try {
      if (editingNote) {
        await ipamApi.updateIPNote(editingNote.id, {
          ...formData,
          ip_address: ipAddressId,
        });
        toast.success("Note updated successfully");
      } else {
        await ipamApi.createIPNote({
          ...formData,
          ip_address: ipAddressId,
        });
        toast.success("Note created successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadNotes();
      onNoteChange?.();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      await ipamApi.deleteIPNote(id);
      toast.success("Note deleted successfully");
      loadNotes();
      onNoteChange?.();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handlePin = async (note: IPNote) => {
    try {
      await ipamApi.pinIPNote(note.id);
      toast.success(note.is_pinned ? "Note unpinned" : "Note pinned");
      loadNotes();
    } catch (error) {
      console.error("Error pinning note:", error);
      toast.error("Failed to pin note");
    }
  };

  const handleAddComment = async (noteId: number) => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await ipamApi.createIPNoteComment({
        note: noteId,
        content: commentText,
      });
      toast.success("Comment added");
      setCommentText("");
      loadNotes();
      if (selectedNote?.id === noteId) {
        // Reload selected note to get updated comments
        const response = await ipamApi.getIPNote(noteId);
        if (response.data) {
          setSelectedNote(response.data as IPNote);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      is_public: true,
      is_pinned: false,
    });
  };

  const handleEdit = (note: IPNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title || "",
      content: note.content,
      is_public: note.is_public,
      is_pinned: note.is_pinned,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Update note details" : "Add a note to this IP address"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title (optional)</Label>
                <Input
                  id="note-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Content *</Label>
                <Textarea
                  id="note-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter note content..."
                  rows={8}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_public" className="cursor-pointer">
                    Public (visible to all users)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_pinned" className="cursor-pointer">
                    Pin to top
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No notes yet. Create your first note to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className={note.is_pinned ? "border-yellow-300 bg-yellow-50/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {note.title || "Untitled Note"}
                      </CardTitle>
                      {note.is_pinned && (
                        <Badge variant="outline" className="border-yellow-300">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {!note.is_public && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      By {note.created_by_full_name || note.created_by_username || "Unknown"} •{" "}
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      {note.updated_at !== note.created_at && (
                        <> • Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePin(note)}
                    >
                      <Pin className={`w-4 h-4 ${note.is_pinned ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(note)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {note.content}
                </div>
                {note.attachments && note.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {note.attachments.map((attachment) => (
                        <Badge key={attachment.id} variant="outline" className="gap-1">
                          <Paperclip className="w-3 h-3" />
                          {attachment.filename}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {note.comments_count !== undefined && note.comments_count > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {note.comments_count} comment{note.comments_count !== 1 ? "s" : ""}
                    </Button>
                  </div>
                )}
                {selectedNote?.id === note.id && note.comments && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="space-y-2">
                      {note.comments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <div className="font-medium">
                            {comment.author_full_name || comment.author_username || "Unknown"}
                          </div>
                          <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
                            {comment.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(note.id)}
                        disabled={!commentText.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
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

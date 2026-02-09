import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Trash2, MessageCircle, User } from "lucide-react";
import { RoleBadges } from "@/components/RoleBadge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CommentSection({ targetType, targetId, token, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/comments`, { params: { target_type: targetType, target_id: targetId } });
      setComments(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [targetType, targetId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handlePost = async () => {
    if (!newComment.trim() || !token) return;
    setPosting(true);
    try {
      const res = await axios.post(`${API}/comments`, {
        content: newComment.trim(),
        target_type: targetType,
        target_id: targetId,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to post comment");
    } finally { setPosting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`${API}/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment removed");
    } catch { toast.error("Failed to delete"); }
  };

  const canDelete = (comment) => {
    if (!currentUser) return false;
    if (comment.user_id === currentUser.id) return true;
    const roles = currentUser.roles || [];
    return roles.includes('Creator') || roles.includes('Admin') || roles.includes('Moderator') || currentUser.is_owner;
  };

  return (
    <div className="mt-8" data-testid="comment-section">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 font-['Outfit']">
        <MessageCircle className="w-5 h-5 text-primary" />Comments ({comments.length})
      </h3>

      {token ? (
        <div className="flex gap-2 mb-6">
          <Input value={newComment} onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
            placeholder="Write a comment..." data-testid="comment-input"
            className="bg-secondary/30 border-border/50" maxLength={500} />
          <Button onClick={handlePost} disabled={posting || !newComment.trim()} data-testid="post-comment-btn" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">Login to leave a comment</p>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => {
            const author = c.author || {};
            const avatarUrl = author.custom_avatar || author.avatar_url || c.avatar_url;
            return (
              <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30" data-testid={`comment-${c.id}`}>
                <div className="shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{author.display_name || author.username || c.username}</span>
                    <RoleBadges roles={author.roles} />
                    <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mt-1 text-foreground/90 break-words">{c.content}</p>
                </div>
                {canDelete(c) && (
                  <button onClick={() => handleDelete(c.id)} data-testid={`delete-comment-${c.id}`}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-6">No comments yet</p>
      )}
    </div>
  );
}

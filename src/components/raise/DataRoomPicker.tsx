import { useState, useEffect } from "react";
import { X, FolderLock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DataRoomItem } from "@/pages/raise/Outreach";

interface Props {
  onSelect: (room: DataRoomItem) => void;
  onClose: () => void;
  excludeIds: string[];
}

export function DataRoomPicker({ onSelect, onClose, excludeIds }: Props) {
  const [rooms, setRooms] = useState<DataRoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("data_rooms")
      .select("id, title, slug, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRooms(data as DataRoomItem[]);
        setLoading(false);
      });
  }, []);

  const available = rooms.filter(r => !excludeIds.includes(r.id));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FolderLock className="h-4 w-4 text-electric" /> Attach from Data Room
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-electric border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && available.length === 0 && (
            <div className="text-center py-8">
              <FolderLock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No data rooms available to attach.</p>
              <p className="text-xs text-muted-foreground mt-1">Create a data room first from the Data Room tab.</p>
            </div>
          )}
          {!loading && available.length > 0 && (
            <div className="space-y-2">
              {available.map(room => (
                <button key={room.id} onClick={() => onSelect(room)}
                  className="w-full text-left px-4 py-3 rounded-sm border border-border hover:border-electric/30 hover:bg-electric/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{room.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">/room/{room.slug}</p>
                    </div>
                    <Check className="h-4 w-4 text-electric opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

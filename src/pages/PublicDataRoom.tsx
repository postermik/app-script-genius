import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, FileText, ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";
import type { NarrativeOutputData, FundraisingOutput, BoardUpdateOutput, StrategyOutput, ProductVisionOutput, InvestorUpdateOutput } from "@/types/narrative";

interface DataRoomData {
  id: string;
  title: string;
  custom_intro: string | null;
  password_protected: boolean;
  is_active: boolean;
  included_projects: string[];
}

interface ProjectData {
  id: string;
  title: string;
  mode: string;
  output_data: NarrativeOutputData | null;
}

export default function PublicDataRoom() {
  const { slug } = useParams<{ slug: string }>();
  const [room, setRoom] = useState<DataRoomData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const viewStartRef = useRef(Date.now());
  const viewLoggedRef = useRef(false);

  // Load room data
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("data_rooms")
        .select("id, title, custom_intro, password_protected, is_active, included_projects, password_hash")
        .eq("slug", slug)
        .single();
      if (err || !data) { setError("Data room not found."); setLoading(false); return; }
      if (!data.is_active) { setError("This data room is no longer active."); setLoading(false); return; }

      const roomData = data as any;
      setRoom({
        id: roomData.id,
        title: roomData.title,
        custom_intro: roomData.custom_intro,
        password_protected: roomData.password_protected,
        is_active: roomData.is_active,
        included_projects: roomData.included_projects || [],
      });

      if (!roomData.password_protected) {
        setUnlocked(true);
        await loadProjects(roomData.included_projects || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const loadProjects = async (projectIds: string[]) => {
    if (projectIds.length === 0) return;
    const { data } = await supabase
      .from("projects")
      .select("id, title, mode, output_data")
      .in("id", projectIds);
    if (data) setProjects(data as ProjectData[]);
  };

  // Log view on unmount
  useEffect(() => {
    return () => {
      if (room && !viewLoggedRef.current) {
        viewLoggedRef.current = true;
        const duration = Math.round((Date.now() - viewStartRef.current) / 1000);
        supabase.from("data_room_views").insert({
          data_room_id: room.id,
          duration_seconds: duration,
          viewed_at: new Date().toISOString(),
        }).then(() => {});
      }
    };
  }, [room]);

  const handlePasswordSubmit = async () => {
    if (!room || !slug) return;
    const { data } = await supabase
      .from("data_rooms")
      .select("password_hash")
      .eq("slug", slug)
      .single();
    if (data && (data as any).password_hash === passwordInput) {
      setUnlocked(true);
      setWrongPassword(false);
      await loadProjects(room.included_projects);
    } else {
      setWrongPassword(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <Logo variant="full" size={28} className="mb-6" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (room && room.password_protected && !unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <Logo variant="full" size={28} className="mb-8" />
        <div className="w-full max-w-sm">
          <div className="p-6 rounded-sm border border-border card-gradient text-center">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-base font-bold text-foreground mb-1">{room.title}</h2>
            <p className="text-xs text-muted-foreground mb-5">This data room is password protected.</p>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePasswordSubmit()}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40 mb-3"
              placeholder="Enter password"
            />
            {wrongPassword && <p className="text-xs text-destructive mb-3">Incorrect password.</p>}
            <button onClick={handlePasswordSubmit}
              className="w-full py-2.5 bg-electric text-primary-foreground rounded-sm font-medium text-sm hover:opacity-90 transition-opacity">
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-5">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Logo variant="full" size={28} />
          <span className="text-xs text-muted-foreground">Data Room</span>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">{room?.title}</h1>

        {room?.custom_intro && (
          <p className="text-sm text-secondary-foreground leading-relaxed mb-8 max-w-[700px]">{room.custom_intro}</p>
        )}

        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground py-8">No materials available.</p>
        )}

        <div className="space-y-8">
          {projects.map(project => (
            <ProjectSection key={project.id} project={project} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 mt-16">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Logo variant="mark" size={20} />
          <p className="text-[10px] text-muted-foreground">Powered by Rhetoric</p>
        </div>
      </footer>
    </div>
  );
}

function ProjectSection({ project }: { project: ProjectData }) {
  const output = project.output_data;
  if (!output) return null;

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-electric" />
          <h2 className="text-base font-bold text-foreground">{project.title}</h2>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-electric/10 text-electric uppercase">{output.mode?.replace("_", " ")}</span>
        </div>
      </div>
      <div className="p-6 space-y-5">
        {output.mode === "fundraising" && <FundraisingView data={output.data as FundraisingOutput} />}
        {output.mode === "board_update" && <BoardView data={output.data as BoardUpdateOutput} />}
        {output.mode === "strategy" && <StrategyView data={output.data as StrategyOutput} />}
        {output.mode === "product_vision" && <ProductView data={output.data as ProductVisionOutput} />}
        {output.mode === "investor_update" && <InvestorUpdateView data={output.data as InvestorUpdateOutput} />}
      </div>
    </div>
  );
}

function Section({ label, content }: { label: string; content: string | string[] | undefined | null }) {
  if (!content) return null;
  const text = Array.isArray(content) ? content.join("\n• ") : content;
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</h3>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

function FundraisingView({ data }: { data: FundraisingOutput }) {
  return (
    <>
      <Section label="Investment Thesis" content={data.thesis?.content} />
      {data.thesis?.coreInsight && (
        <blockquote className="border-l-2 border-electric pl-4 py-2 text-sm text-foreground/80 italic">{data.thesis.coreInsight}</blockquote>
      )}
      <Section label="Why Now" content={data.whyNow} />
      <Section label="Market Logic" content={data.marketLogic} />
      <Section label="Risks" content={data.risks} />
    </>
  );
}

function BoardView({ data }: { data: BoardUpdateOutput }) {
  return (
    <>
      <Section label="Executive Summary" content={data.executiveSummary} />
      <Section label="Metrics" content={data.metricsNarrative} />
      <Section label="Risks & Focus" content={data.risksFocus} />
    </>
  );
}

function StrategyView({ data }: { data: StrategyOutput }) {
  return (
    <>
      <Section label="Thesis" content={data.thesis} />
      <Section label="Positioning" content={data.positioning} />
      <Section label="Market Analysis" content={data.marketAnalysis} />
      <Section label="Competitive Framework" content={data.competitiveFramework} />
    </>
  );
}

function ProductView({ data }: { data: ProductVisionOutput }) {
  return (
    <>
      <Section label="Vision" content={data.vision} />
      <Section label="User Problem" content={data.userProblem} />
      <Section label="Solution" content={data.solutionFramework} />
      <Section label="Roadmap" content={data.roadmapNarrative} />
    </>
  );
}

function InvestorUpdateView({ data }: { data: InvestorUpdateOutput }) {
  return (
    <>
      <Section label="Headline" content={data.headline} />
      <Section label="Progress" content={data.progress} />
      <Section label="Metrics" content={data.metrics} />
      <Section label="Challenges" content={data.challenges} />
      <Section label="Next Milestones" content={data.nextMilestones} />
    </>
  );
}

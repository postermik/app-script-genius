import { useState, useEffect, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
    Mic, Layout, Target, CheckCircle, HelpCircle, Mail,
    FileText, BookOpen, BarChart3, Lightbulb, Compass, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface OutputStep {
    key: string;
    label: string;
    icon: LucideIcon;
}

const OUTPUT_STEP_MAP: Record<string, OutputStep> = {
    core_narrative:     { key: "core_narrative",     label: "Core Narrative",  icon: Compass    },
    elevator_pitch:     { key: "elevator_pitch",     label: "Elevator pitch",  icon: Mic        },
    investor_qa:        { key: "investor_qa",        label: "Investor Q&A",    icon: HelpCircle },
    pitch_email:        { key: "pitch_email",        label: "Pitch emails",    icon: Mail       },
    investment_memo:    { key: "investment_memo",    label: "Investment memo", icon: FileText   },
    slide_framework:    { key: "slide_framework",    label: "Slide framework", icon: Layout     },
    board_memo:         { key: "board_memo",         label: "Board memo",      icon: BookOpen   },
    key_metrics_summary:{ key: "key_metrics_summary",label: "Key metrics",     icon: BarChart3  },
    strategic_memo:     { key: "strategic_memo",     label: "Strategic memo",  icon: Lightbulb  },
};

export function GenerationStepper() {
    const { isGenerating, isGeneratingSlides, intakeSelections, completedOutputs, isGeneratingOutputs } = useDecksmith();
    const [collapsed, setCollapsed] = useState(false);
    const prevCompletedSizeRef = useRef(0);

  const completedKeys = new Set<string>(completedOutputs);

  const fromIntake = intakeSelections?.outputs;
    const selectedOutputs: string[] = fromIntake && fromIntake.length > 0
      ? fromIntake
          : ["slide_framework"];

  const steps: OutputStep[] = [OUTPUT_STEP_MAP.core_narrative];
    for (const o of selectedOutputs) {
          if (o !== "core_narrative" && OUTPUT_STEP_MAP[o]) steps.push(OUTPUT_STEP_MAP[o]);
    }
    steps.push({ key: "_scoring", label: "Scoring", icon: Target });

  const stillRunning = isGenerating || isGeneratingSlides || isGeneratingOutputs;
    const allDone = !stillRunning && completedKeys.has("_scoring");

  useEffect(() => {
        if (isGenerating) setCollapsed(false);
  }, [isGenerating]);

  useEffect(() => {
        if (allDone) setCollapsed(true);
  }, [allDone]);

  // Find the first step not yet complete — no index math, no race condition
  const activeStepKey = stillRunning
      ? (steps.find(s => !completedKeys.has(s.key))?.key ?? null)
        : null;

  return (
        <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
          {allDone && (
                  <button
                              onClick={() => setCollapsed(prev => !prev)}
                              className="flex items-center gap-2 py-1 mb-1 w-full text-left group"
                            >
                            <div className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
                                        <CheckCircle className="w-2.5 h-2.5" />
                            </div>div>
                            <span className="text-[10px] leading-tight text-emerald-400/80 font-medium flex-1">
                                        All outputs ready
                            </span>span>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
                  </button>button>
              )}
        
          {!collapsed && (
                  <div className="space-y-0.5">
                    {steps.map((steipm)p o=r>t  {{
                      u s e S t a t e ,   u sceoEnfsfte ccto,m pulseetRee f=  }c ofmrpolme t"erdeKaecyts".;h
                  aism(psotretp .{k euys)e;D
                  e c k s m i t h   }   f rcoomn s"t@ /icsoAnctteixvte/ D=e c!kcsommiptlheCtoen t&e&x ts"t;e
                  pi.mkpeoyr t= ={=
                    a cMtiicv,e SLtaeypoKuety,; 
                  T a r g e t ,   C h e c kcCoinrsctl ei,s PHeenldpiCnigr c=l e!,c oMmapille,t
                  e   &F&i l!eiTseAxctt,i vBeo;o
                  k O p e n ,   B a r C h acrotn3s,t  LSitgehptIbcuolnb ,=  Csotmeppa.sisc,o nC;h
                  e
                  v r o n D o w n , 
                    }   frreotmu r"nl u(c
                  i d e - r e a c t " ; 
                   i m p<odritv 
                          t y p e   {   L u c i d e I c o nk e}y =f{rsotme p".lkuecyi}d
                  e - r e a c t " ; 
                   
                   i n t e r fcalcaes sONuatmpeu=t{S`tfelpe x{ 
                   i t ekmesy-:c esnttreirn gg;a
                   p - 2l apbye-l0:. 5s ttrrianngs;i
                   t i oinc-oanl:l  LduucriadteiIocno-n3;0
                   0} 
                   $
                   {ciosnPsetn dOiUnTgP U?T _"SoTpEaPc_iMtAyP-:4 0R"e c:o r"da<nsitmraitneg-,f aOduet-piunt"S}t`e}p
                  >   =   { 
                         c o r e _ n a>r
                  r a t i v e :           {   k e y<:d i"vc ocrlea_snsaNrarmaet=i{v`ef"l,e x   i t elmasb-ecle:n t"eCro rjeu sNtairfrya-tcievnet"e,r   wi-c4o nh:- 4C ormopuansdse d - f u}l,l
                    s herlienvka-t0o rt_rpaintsciht:i o n - a l{l  kdeuyr:a t"ieolne-v3a0t0o
                    r _ p i t c h " ,           l a b e l$:{ c"oEmlpelveatteo r  ?p i"tbcgh-"e,m e riaclodn-:5 0M0i/c2 0   t e x t - e}m,e
                    r a lidn-v4e0s0t"o r:_ q"a":} 
                                  {   k e y :   " i n v e$s{tiosrA_cqtai"v,e     ?   " b g -lparbiemla:r y"/I1n5v etsetxotr- pQr&iAm"a,r y "   :i c"o"n}:
                                    H e l p C i r c l e   } , 
                                         p i$t{cihs_Peemnadiiln:g   ?   " b g - m{u tkeedy/:3 0" ptietxcth-_meumtaeidl-"f,o r e g r o u n dl"a b:e l":" }"
                                         P i t c h   e m a i l s " ,      ` }i>c
                  o n :   M a i l               } , 
                    { cionmvpelsettmee
                      n t _ m e m o :         {   k e y :   " i?n v<eCshtemceknCti_rmcelmeo "c,l a s s Nlaambee=l":w -"2I.n5v ehs-t2m.e5n"t  /m>e
                  m o " ,   i c o n :   F i l e T e x t    :  }<,S
                  t e psIlciodne _cflraasmseNwaomrek=:{ ` w - 2{. 5k ehy-:2 ."5s l$i{dies_Afcrtaimveew o?r k""a,n i m a tlea-bpeull:s e""S l:i d"e" }f`r}a m/e>w
                  o r k " ,   i c o n :   L a y o u t  } 
                    } , 
                       b o a r d _ m e m<o/:d i v > 
                    {   k e y :   " b o a r<ds_pmaenm oc"l,a s s N a m e = { `ltaebxetl-:[ 1"0Bpoxa]r dl emaedmion"g,- t i g h t  itcroann:s iBtoiooknO-paelnl   d u}r,a
                    t i okne-y3_0m0e
                    t r i c s _ s u m m a r y : {   k e y$:{ c"okmepyl_emteet r i?c s"_tseuxmtm-aermye"r,alladb-e4l0:0 /"8K0e"y  :m e"t"r}i
                    c s " ,           i c o n :   B a r C$h{airstA3c t i}v,e
                        ?s t"rtaetxetg-ipcr_immeamroy:  f o n t -{m ekdeiyu:m "" s:t r"a"t}e
                        g i c _ m e m o " ,           l a b e$l{:i s"PSetnrdaitnegg i?c  "mteemxot"-,m u tiecdo-nf:o rLeiggrhotubnudl"b  :  }","
                        }}
                        ; 
                         
                          e x p o r t   f u n c t i o`n} >G
                  e n e r a t i o n S t e p p e r ( )  {{s
                    t e pc.olnasbte l{} 
                  i s G e n e r a t i n g ,   i s G<e/nsepraant>i
                  n g S l i d e s ,   i n t a k e S{eilseAccttiiovnes ,& &c osmtpilleltReudnOnuitnpgu t&s&,  (i
                  s G e n e r a t i n g O u t p u t s  <}d i=v  ucsleaDsescNkasmmei=t"hf(l)e;x
                    i tceomnss-tc e[nctoelrl agpaspe-d0,. 5s esthCroilnlka-p0s"e>d
                  ]   =   u s e S t a t e ( f a l s e ) ; 
                  < s pcaonn sctl apsrseNvaCmoem=p"lwe-t0e.d5S ihz-e0R.e5f  b=g -upsreiRmeafr(y0 )r;o
                  u
                  n d ecdo-nfsutl lc oamnpilmeatteed-Kbeoyusn c=e "n eswt ySleet=<{s{t rainnigm>a(tcioomnpDleeltaeyd:O u"t0pmust"s )};}
                   
                  / > 
                  c o n s t   f r o m I n t a k e   =   i n<tsapkaenS eclleacstsiNoanmse?=."owu-t0p.u5t sh;-
                  0 . 5c obngs-tp rsiemlaercyt erdoOuuntdpeudt-sf:u lslt rainnigm[a]t e=- bforuonmcIen"t asktey l&e&= {f{r oamnIinmtaatkieo.nlDeenlgatyh:  >" 105
                  0 m s "  ?} }f r/o>m
                  I n t a k e 
                           :   [ " s l i d e _<fsrpaamne wcolraks"s]N;a
                  m
                  e = "cwo-n0s.t5  sht-e0p.s5:  bOgu-tppruitmSatreyp [r]o u=n d[eOdU-TfPuUlTl_ SaTnEiPm_aMtAeP-.bcoournec_en"a rsrtaytliev=e{]{; 
                  a n ifmoart i(ocnoDneslta yo:  o"f3 0s0emlse"c t}e}d O/u>t
                  p u t s )   { 
                             i f   ( o   !<=/=d i"vc>o
                             r e _ n a r r a t i v e "   & &  )O}U
                             T P U T _ S T E P _ M A P [ o<]/)d isvt>e
                             p s . p u s h ( O U T P U)T;_
                             S T E P _ M A P [ o ]}));}
                             
                               } 
                                  s t e<p/sd.ipvu>s
                             h ( {   k e y):} 
                             " _ s c o<r/idnigv">,
                               l a)b;e
                             l}: "Scoring", icon: Target });
                             
                               const stillRunning = isGenerating || isGeneratingSlides || isGeneratingOutputs;
                               const allDone = !stillRunning && completedKeys.has("_scoring");
                             
                               useEffect(() => {
                                     if (isGenerating) setCollapsed(false);
                               }, [isGenerating]);
                             
                               useEffect(() => {
                                     if (allDone) setCollapsed(true);
                               }, [allDone]);
                             
                               // Find the first step not yet complete — no index math, no race condition
                               const activeStepKey = stillRunning
                                 ? (steps.find(s => !completedKeys.has(s.key))?.key ?? null)
                                 : null;
                             
                               return (
                                 <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
                                   {allDone && (
                            <button
                                        onClick={() => setCollapsed(prev => !prev)}
                                        className="flex items-center gap-2 py-1 mb-1 w-full text-left group"
                                      >
                                      <div className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
                                                  <CheckCircle className="w-2.5 h-2.5" />
                                      </div>div>
                                      <span className="text-[10px] leading-tight text-emerald-400/80 font-medium flex-1">
                                                  All outputs ready
                                      </span>span>
                                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
                            </button>button>
                                       )}
                                 
                                   {!collapsed && (
                            <div className="space-y-0.5">
                              {steps.map((step) => {
                                          const complete = completedKeys.has(step.key);
                                          const isActive = !complete && step.key === activeStepKey;
                                          const isPending = !complete && !isActive;
                                          const StepIcon = step.icon;
                              
                                          return (
                                                          <div
                                                                            key={step.key}
                                                                            className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${isPending ? "opacity-40" : "animate-fade-in"}`}
                                                                          >
                                                                          <div className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-300
                                                                                            ${complete  ? "bg-emerald-500/20 text-emerald-400" : ""}
                                                                                                              ${isActive  ? "bg-primary/15 text-primary" : ""}
                                                                                                                                ${isPending ? "bg-muted/30 text-muted-foreground" : ""}
                                                                                                                                                `}>
                                                                            {complete
                                                                                                  ? <CheckCircle className="w-2.5 h-2.5" />
                                                                                                  : <StepIcon className={`w-2.5 h-2.5 ${isActive ? "animate-pulse" : ""}`} />
                                                                            }
                                                                          </div>div>
                                                                          <span className={`text-[10px] leading-tight transition-all duration-300
                                                                                            ${complete  ? "text-emerald-400/80" : ""}
                                                                                                              ${isActive  ? "text-primary font-medium" : ""}
                                                                                                                                ${isPending ? "text-muted-foreground" : ""}
                                                                                                                                                `}>
                                                                            {step.label}
                                                                          </span>span>
                                                            {isActive && stillRunning && (
                                                                                              <div className="flex items-center gap-0.5 shrink-0">
                                                                                                                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                                                                                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                                                                                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                                                                </div>div>
                                                                          )}
                                                          </div>div>
                                                        );
                            })}
                            </div>div>
                                       )}
                                 </div>div>
                               );
                               }</button>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  sectors?: string[];
  stages?: string[];
  locations?: string[];
  keywords?: string;
  page?: number;
  per_page?: number;
}

// Map internal sector keys to Apollo-friendly keywords
const SECTOR_KEYWORDS: Record<string, string> = {
  ai_ml: "artificial intelligence machine learning",
  saas: "SaaS software",
  fintech: "fintech financial technology",
  enterprise: "enterprise software B2B",
  consumer: "consumer",
  healthtech: "healthcare health technology",
  edtech: "education technology",
  marketplace: "marketplace",
  creator_tools: "creator economy",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloKey) {
      return new Response(
        JSON.stringify({ error: 'Apollo API key not configured', skipped: true, people: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SearchRequest = await req.json();
    const page = body.page || 1;
    const perPage = Math.min(body.per_page || 50, 100);

    // Build keyword string from sectors + freeform keywords
    const sectorKeywords = (body.sectors || [])
      .map(s => SECTOR_KEYWORDS[s] || s)
      .join(" ");
    const combinedKeywords = [sectorKeywords, body.keywords || ""].filter(Boolean).join(" ").trim();

    // Build person_locations from user geography
    const locations = (body.locations || []).filter(Boolean);

    // Build Apollo search payload
    const apolloPayload: Record<string, any> = {
      person_titles: [
        "Partner",
        "General Partner",
        "Managing Partner",
        "Principal",
        "Managing Director",
        "Venture Partner",
        "Investment Partner",
      ],
      q_organization_keyword_tags: ["venture capital", "investment management"],
      page,
      per_page: perPage,
    };

    if (combinedKeywords) {
      apolloPayload.q_keywords = combinedKeywords;
    }

    if (locations.length > 0) {
      apolloPayload.person_locations = locations;
    }

    console.log("Apollo search payload:", JSON.stringify(apolloPayload));

    const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify(apolloPayload),
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      console.error('Apollo API error:', apolloRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Apollo API error', status: apolloRes.status, people: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apolloData = await apolloRes.json();
    const people = apolloData?.people || [];
    const totalEntries = apolloData?.pagination?.total_entries || 0;
    const totalPages = apolloData?.pagination?.total_pages || 1;

    // Transform Apollo results into our investor format
    const investors = people.map((person: any) => ({
      first_name: person.first_name || "",
      last_name: person.last_name || "",
      contact_name: [person.first_name, person.last_name].filter(Boolean).join(" "),
      contact_email: person.email || null,
      linkedin_url: person.linkedin_url || null,
      title: person.title || null,
      firm_name: person.organization?.name || "Unknown Firm",
      website_url: person.organization?.website_url || null,
      location_city: person.city || person.organization?.city || null,
      location_state: person.state || person.organization?.state || null,
      location_country: person.country || person.organization?.country || null,
      apollo_id: person.id || null,
      organization_id: person.organization?.id || null,
      // Apollo doesn't directly provide stage/sector/check-size,
      // but we can infer investor_type from title
      investor_type: inferInvestorType(person.title, person.organization?.name),
    }));

    return new Response(
      JSON.stringify({
        people: investors,
        pagination: {
          page,
          per_page: perPage,
          total_entries: totalEntries,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Search error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', people: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function inferInvestorType(title?: string, orgName?: string): string {
  const t = (title || "").toLowerCase();
  const o = (orgName || "").toLowerCase();

  if (o.includes("accelerator") || o.includes("techstars") || o.includes("y combinator")) return "accelerator";
  if (t.includes("angel") || o.includes("angel")) return "angel";
  if (o.includes("corporate venture") || o.includes("cvc")) return "corporate_vc";
  // Micro VCs typically have smaller teams / specific naming
  return "vc";
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ApolloRequest {
  first_name: string;
  last_name: string;
  organization_name: string;
  investor_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloKey) {
      return new Response(
        JSON.stringify({ error: 'Apollo API key not configured', skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { first_name, last_name, organization_name, investor_id } = await req.json() as ApolloRequest;

    if (!first_name || !last_name || !organization_name) {
      return new Response(
        JSON.stringify({ error: 'first_name, last_name, and organization_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first via Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (investor_id) {
      const cacheCheck = await fetch(
        `${supabaseUrl}/rest/v1/investors?id=eq.${investor_id}&select=contact_email,linkedin_url,last_enriched_at`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const cacheData = await cacheCheck.json();
      if (cacheData?.[0]?.last_enriched_at) {
        const enrichedAt = new Date(cacheData[0].last_enriched_at);
        const daysSince = (Date.now() - enrichedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          return new Response(
            JSON.stringify({
              cached: true,
              email: cacheData[0].contact_email,
              linkedin_url: cacheData[0].linkedin_url,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Call Apollo API
    const apolloRes = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        first_name,
        last_name,
        organization_name,
        reveal_personal_emails: false,
      }),
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      console.error('Apollo API error:', apolloRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Apollo API error', status: apolloRes.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apolloData = await apolloRes.json();
    const person = apolloData?.person;

    const result = {
      email: person?.email || null,
      linkedin_url: person?.linkedin_url || null,
      title: person?.title || null,
      website_url: person?.organization?.website_url || null,
    };

    // Cache result in database
    if (investor_id) {
      await fetch(
        `${supabaseUrl}/rest/v1/investors?id=eq.${investor_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            contact_email: result.email,
            linkedin_url: result.linkedin_url,
            last_enriched_at: new Date().toISOString(),
          }),
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Enrichment error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Shared CORS utility for all edge functions
// Uses environment-based origin validation with fallback for development

const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://kuppel.lovable.app',
  'https://app.kuppel.co',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';
  const frontendUrl = Deno.env.get('FRONTEND_URL');
  
  // Build allowed origins list
  const allowedOrigins = [...ALLOWED_ORIGINS];
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }
  
  // In development or if origin matches, allow the request
  let allowOrigin: string;
  if (isDev) {
    allowOrigin = origin || '*';
  } else if (allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  } else if (origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')) {
    // Allow Lovable preview/staging domains
    allowOrigin = origin;
  } else {
    // Fallback to first allowed origin for security
    allowOrigin = allowedOrigins[0];
  }
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

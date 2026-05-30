// Redirect Worker — agencyos.network → mekongmind.com
// Handles: agencyos.network, www.agencyos.network, docs.agencyos.network

const REDIRECTS: Record<string, string> = {
  'agencyos.network': 'https://mekongmind.com',
  'www.agencyos.network': 'https://www.mekongmind.com',
  'docs.agencyos.network': 'https://docs.mekongmind.com',
}

const PERMANENT = 301

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const host = url.hostname

    const target = REDIRECTS[host]
    if (!target) {
      return new Response(`No redirect configured for ${host}`, { status: 404 })
    }

    const dest = target + url.pathname + url.search
    return new Response(null, {
      status: PERMANENT,
      headers: { Location: dest },
    })
  },
}

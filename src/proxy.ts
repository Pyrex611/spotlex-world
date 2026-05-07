import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Use a try-catch to prevent UND_ERR_CONNECT_TIMEOUT from crashing the whole app
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
    const isProtectedRoute = 
      request.nextUrl.pathname.startsWith('/client') || 
      request.nextUrl.pathname.startsWith('/driver') || 
      request.nextUrl.pathname.startsWith('/admin')

    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (user && isAuthRoute) {
      const role = user.user_metadata?.role || 'client'
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    }
  } catch (e) {
    // If Supabase times out, we allow the request to continue rather than hanging.
    // The individual pages will handle the missing session.
    console.error('[Proxy] Supabase connection timeout, skipping check.')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
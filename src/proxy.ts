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

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/client') || 
    request.nextUrl.pathname.startsWith('/driver') || 
    request.nextUrl.pathname.startsWith('/admin')

  try {
    // Attempt to verify the session
    const { data: { user }, error } = await supabase.auth.getUser()

    // If no user and trying to access a secure area, kick to login
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If user is logged in and trying to view the login/register page, send them to their dashboard
    if (user && isAuthRoute) {
      const role = user.user_metadata?.role || 'client'
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    }

  } catch (e) {
    // ENTERPRISE FIX: If a DNS/Network error (EAI_AGAIN) occurs, log it and FAIL OPEN.
    // Do not crash the router. The target page will handle the offline state.
    console.error('[Proxy] Network timeout resolving Supabase. Failsafe activated.', e)
  }

  return response
}

export const config = {
  matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
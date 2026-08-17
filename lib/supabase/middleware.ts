import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder-project');
  if (isPlaceholder) {
    return supabaseResponse;
  }

  // Refresh the session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  const isAuthPage = url.pathname.startsWith('/login');
  const isApiRoute = url.pathname.startsWith('/api');
  const isStaticAsset =
    url.pathname.includes('.') ||
    url.pathname.startsWith('/_next') ||
    url.pathname === '/favicon.ico';

  // If user is not authenticated and is accessing a protected page, redirect to login
  if (!user && !isAuthPage && !isApiRoute && !isStaticAsset && url.pathname !== '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check their role and protect routes
  if (user) {
    // If they go to login page, redirect to home
    if (isAuthPage) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Role-based route gating (defense in depth)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (url.pathname.startsWith('/admin') && profile.role !== 'admin') {
        url.pathname = '/employee/dashboard';
        return NextResponse.redirect(url);
      }
      if (url.pathname.startsWith('/employee') && profile.role !== 'employee') {
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

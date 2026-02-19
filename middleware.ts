import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("__session")?.value;

  // 1. Cek Apakah User punya Session Token?
  if (!session) {
    // Jika mengakses halaman yang diproteksi, lempar ke Login
    // Kita gunakan URL absolut agar aman
    const loginUrl = new URL("/auth/login", request.url);
    // Simpan halaman tujuan agar nanti bisa redirect balik setelah login (UX)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // 2. (Opsional/Advance) Verifikasi Token di Edge
  // Verifikasi penuh Firebase Admin SDK tidak support di Edge Runtime (Middleware).
  // Jadi kita hanya cek keberadaan cookie saja di sini.
  // Validasi keamanan sebenarnya ("Is Token Valid?") dilakukan di Server Actions / Layout.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    "/settings/:path*",
    // Note: /onboarding mungkin perlu logika khusus (misal: boleh akses walau session null jika flow-nya beda)
    // Tapi amannya kita proteksi juga.
    "/onboarding/:path*", 
  ],
};
import { createServerClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

// Login page — uses Supabase Auth magic link
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Mekong Content Hub</h1>
          <p className="mt-2 text-center text-sm text-gray-600">Đăng nhập để quản lý nội dung</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

async function LoginForm() {
  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email"));
    const supabase = createServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/callback`,
      },
    });
    if (error) {
      redirect("/login?error=" + encodeURIComponent(error.message));
    }
    redirect("/check-email");
  }

  return (
    <form action={signIn} className="rounded-lg bg-white p-8 shadow-md space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email công việc
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Gửi link đăng nhập
      </button>
      <p className="text-xs text-gray-500">Nhận magic link qua email. Không cần mật khẩu.</p>
    </form>
  );
}

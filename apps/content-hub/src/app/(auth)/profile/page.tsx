// @ts-nocheck
// @ts-nocheck
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/client";
import ProfileForm from "./profile-form";

// Lazy supabase init
let cachedClient: ReturnType<typeof createServerClient> | null = null;
function getSupabase() {
  if (!cachedClient) {
    cachedClient = createServerClient();
  }
  return cachedClient;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  // Load departments for role assignment
  const supabase = getSupabase();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, slug")
    .order("name");

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem trang này.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
      <p className="mt-2 text-gray-600">
        Quản lý thông tin tài khoản và vai trò của bạn.
      </p>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <ProfileForm
          user={user}
          profile={profile}
          departments={departments ?? []}
        />
      </div>
    </div>
  );
}

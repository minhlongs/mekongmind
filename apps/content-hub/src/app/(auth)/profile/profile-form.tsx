"use client";

import { useState } from "react";

type User = { id: string; email: string; name?: string };
type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  department_id: string | null;
} | null;
type Department = { id: string; name: string; slug: string };

export default function ProfileForm({
  user,
  profile,
  departments,
}: {
  user: User;
  profile: Profile;
  departments: Department[];
}) {
  const [name, setName] = useState(user.name ?? user.email?.split("@")[0] ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [role, setRole] = useState(profile?.role ?? "employee");
  const [deptId, setDeptId] = useState(profile?.department_id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        full_name: fullName,
        role,
        department_id: deptId || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Đã cập nhật thành công.");
    } else {
      const { error } = await res.json();
      setMessage(error ?? "Có lỗi xảy ra.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <p className="mt-1 text-gray-900">{user.email}</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tên hiển thị
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Họ và tên
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Vai trò
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="employee">Nhân viên (Employee)</option>
          <option value="manager">Quản lý (Manager)</option>
          <option value="admin">Quản trị (Admin)</option>
        </select>
      </div>

      <div>
        <label htmlFor="dept" className="block text-sm font-medium text-gray-700">
          Phòng ban
        </label>
        <select
          id="dept"
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Chọn phòng ban —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("lỗi") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}

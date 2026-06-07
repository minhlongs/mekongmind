export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="text-6xl mb-4">↩️</div>
        <h1 className="text-3xl font-bold text-white">Đã hủy thanh toán</h1>
        <p className="mt-4 text-slate-400">
          Không sao cả — bạn có thể quay lại bất cứ lúc nào.
        </p>
        <a
          href="/templates"
          className="mt-8 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400"
        >
          Xem Templates
        </a>
      </div>
    </div>
  );
}

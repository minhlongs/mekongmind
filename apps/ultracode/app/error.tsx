"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-gray-500">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

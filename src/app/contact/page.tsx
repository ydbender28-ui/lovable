export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f8] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Get in touch</h1>
          <p className="mt-2 text-gray-400 text-sm">We usually reply within a few hours.</p>
        </div>

        <div className="space-y-4">
          <a
            href="mailto:support@thatcode.dev"
            className="flex items-center gap-3 rounded-xl border border-[#ececf1] bg-white px-5 py-4 hover:bg-white/[0.06] transition-colors group"
          >
            <span className="text-xl">✉️</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-fuchsia-300 transition-colors">support@thatcode.dev</p>
              <p className="text-xs text-gray-500 mt-0.5">Email support</p>
            </div>
          </a>

          <a
            href="https://feedback.thatcode.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-[#ececf1] bg-white px-5 py-4 hover:bg-white/[0.06] transition-colors group"
          >
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-fuchsia-300 transition-colors">Feature requests & feedback</p>
              <p className="text-xs text-gray-500 mt-0.5">Vote on ideas, report bugs</p>
            </div>
          </a>
        </div>

        <p className="text-xs text-gray-600">
          For billing issues, include your account email. For bug reports, describe what you were doing and paste any error messages.
        </p>
      </div>
    </div>
  );
}

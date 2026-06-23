"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-[#71717f] hover:text-[#17171c] transition-colors"
    >
      Sign out
    </button>
  );
}

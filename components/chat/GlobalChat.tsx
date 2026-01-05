"use client";

import dynamic from "next/dynamic";

// Dynamically import to prevent SSR issues
const SupportChat = dynamic(() => import("./SupportChat"), { ssr: false });

export default function GlobalChat() {
    return <SupportChat />;
}

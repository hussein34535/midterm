import SpecialistGuard from "@/components/auth/SpecialistGuard";

export default function SpecialistLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SpecialistGuard>
            {children}
        </SpecialistGuard>
    );
}


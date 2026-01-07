import Link from "next/link"

export default function Footer() {
    return (
        <footer className="bg-primary/5 py-32 border-t border-primary/10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-20">
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-serif font-bold text-xl">
                                س
                            </div>
                            <span className="text-3xl font-serif font-bold tracking-tight text-foreground">إيواء</span>
                        </Link>
                        <p className="text-xl text-foreground/60 max-w-md leading-relaxed font-medium">
                            مساحة دافئة تسكنها المودة، تهدف لتمكين كل روح من العثور على راحتها من خلال الدعم والاحتواء.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-serif font-bold mb-8 text-xl text-primary italic">المودة</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                                    تصفح الجلسات
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                                    كيفية العمل
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    للأخصائيين
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    الأسعار
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">المجتمع</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    المدونة
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    الأسئلة الشائعة
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    الخصوصية
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    الشروط
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-primary/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} إيواء. جميع الحقوق محفوظة.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-muted-foreground hover:text-primary">
                            X
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">
                            LinkedIn
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">
                            Instagram
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

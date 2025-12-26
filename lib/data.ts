// Mock data for courses
export interface Course {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    sessionsCount: number;
    seatsTotal: number;
    seatsRemaining: number;
    price: number;
    schedule: string;
    startDate: string;
    color: string;
    specialist: {
        nickname: string;
        title: string;
    };
    sessions: {
        number: number;
        theme: string;
        date: string;
        time: string;
    }[];
}

export const courses: Course[] = [
    {
        id: "1",
        title: "التعامل مع القلق",
        description: "تعلم تقنيات فعالة للتحكم في القلق والتوتر اليومي",
        longDescription: "في هذا الكورس، ستتعلم تقنيات عملية ومثبتة علمياً للتعامل مع القلق. من خلال 8 جلسات جماعية، ستكتسب أدوات للتحكم في أفكارك القلقة وتحسين جودة حياتك اليومية.",
        sessionsCount: 8,
        seatsTotal: 10,
        seatsRemaining: 3,
        price: 450,
        schedule: "كل أحد 8:00 مساءً",
        startDate: "2025-01-05",
        color: "#8B5CF6",
        specialist: {
            nickname: "د. أمل",
            title: "أخصائية نفسية"
        },
        sessions: [
            { number: 1, theme: "فهم القلق وأسبابه", date: "2025-01-05", time: "20:00" },
            { number: 2, theme: "تقنيات التنفس والاسترخاء", date: "2025-01-12", time: "20:00" },
            { number: 3, theme: "تحدي الأفكار السلبية", date: "2025-01-19", time: "20:00" },
            { number: 4, theme: "العيش في اللحظة الحالية", date: "2025-01-26", time: "20:00" },
            { number: 5, theme: "بناء عادات صحية", date: "2025-02-02", time: "20:00" },
            { number: 6, theme: "التعامل مع نوبات القلق", date: "2025-02-09", time: "20:00" },
            { number: 7, theme: "الدعم الاجتماعي", date: "2025-02-16", time: "20:00" },
            { number: 8, theme: "خطة الاستمرارية", date: "2025-02-23", time: "20:00" },
        ]
    },
    {
        id: "2",
        title: "بناء الثقة بالنفس",
        description: "رحلة لاكتشاف قيمتك الحقيقية وبناء ثقة راسخة",
        longDescription: "هذا الكورس مصمم لمساعدتك على فهم جذور عدم الثقة بالنفس والعمل على بناء صورة ذاتية إيجابية من خلال تمارين عملية وجلسات جماعية داعمة.",
        sessionsCount: 6,
        seatsTotal: 10,
        seatsRemaining: 0,
        price: 350,
        schedule: "كل ثلاثاء 9:00 مساءً",
        startDate: "2025-01-07",
        color: "#14B8A6",
        specialist: {
            nickname: "أ. نور",
            title: "معالج نفسي"
        },
        sessions: [
            { number: 1, theme: "استكشاف الذات", date: "2025-01-07", time: "21:00" },
            { number: 2, theme: "تحدي المعتقدات السلبية", date: "2025-01-14", time: "21:00" },
            { number: 3, theme: "قبول الذات", date: "2025-01-21", time: "21:00" },
            { number: 4, theme: "وضع الحدود الصحية", date: "2025-01-28", time: "21:00" },
            { number: 5, theme: "الاحتفال بالإنجازات", date: "2025-02-04", time: "21:00" },
            { number: 6, theme: "خطة المستقبل", date: "2025-02-11", time: "21:00" },
        ]
    },
    {
        id: "3",
        title: "تحسين جودة النوم",
        description: "استعد نومك الصحي واستيقظ بحيوية كل يوم",
        longDescription: "برنامج متكامل لفهم مشاكل النوم وتطبيق تقنيات علمية لتحسين جودة نومك وطاقتك اليومية.",
        sessionsCount: 6,
        seatsTotal: 10,
        seatsRemaining: 5,
        price: 350,
        schedule: "كل خميس 10:00 مساءً",
        startDate: "2025-01-09",
        color: "#F59E0B",
        specialist: {
            nickname: "د. سلام",
            title: "أخصائي نوم"
        },
        sessions: [
            { number: 1, theme: "فهم دورة النوم", date: "2025-01-09", time: "22:00" },
            { number: 2, theme: "بيئة النوم المثالية", date: "2025-01-16", time: "22:00" },
            { number: 3, theme: "روتين ما قبل النوم", date: "2025-01-23", time: "22:00" },
            { number: 4, theme: "التعامل مع الأرق", date: "2025-01-30", time: "22:00" },
            { number: 5, theme: "النوم والتوتر", date: "2025-02-06", time: "22:00" },
            { number: 6, theme: "خطة نوم صحي دائم", date: "2025-02-13", time: "22:00" },
        ]
    },
    {
        id: "4",
        title: "تجاوز الفقدان والحزن",
        description: "دعم لمن يمرون بتجربة الفقدان والحزن",
        longDescription: "مساحة آمنة لمشاركة مشاعر الحزن والفقدان مع آخرين يفهمون ما تمر به، مع توجيه متخصص للتعافي.",
        sessionsCount: 8,
        seatsTotal: 8,
        seatsRemaining: 2,
        price: 500,
        schedule: "كل سبت 7:00 مساءً",
        startDate: "2025-01-11",
        color: "#EC4899",
        specialist: {
            nickname: "د. رحمة",
            title: "أخصائية حزن وفقدان"
        },
        sessions: [
            { number: 1, theme: "فهم مراحل الحزن", date: "2025-01-11", time: "19:00" },
            { number: 2, theme: "التعبير عن المشاعر", date: "2025-01-18", time: "19:00" },
            { number: 3, theme: "الذكريات والتعامل معها", date: "2025-01-25", time: "19:00" },
            { number: 4, theme: "الذنب والغضب", date: "2025-02-01", time: "19:00" },
            { number: 5, theme: "إعادة بناء الحياة", date: "2025-02-08", time: "19:00" },
            { number: 6, theme: "إيجاد المعنى", date: "2025-02-15", time: "19:00" },
            { number: 7, theme: "الدعم المستمر", date: "2025-02-22", time: "19:00" },
            { number: 8, theme: "المضي قدماً", date: "2025-03-01", time: "19:00" },
        ]
    }
];

export function getCourseById(id: string): Course | undefined {
    return courses.find(course => course.id === id);
}

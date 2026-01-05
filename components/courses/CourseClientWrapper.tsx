"use client";

import { useEffect, useState } from "react";
import CourseChat from "./CourseChat";

interface CourseClientWrapperProps {
    courseId: string;
    courseTitle: string;
}

export default function CourseClientWrapper({ courseId, courseTitle }: CourseClientWrapperProps) {
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkEnrollment();
    }, [courseId]);

    const checkEnrollment = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (!token || !user) {
                setLoading(false);
                return;
            }

            const userData = JSON.parse(user);

            // Specialists and owners always have access
            if (userData.role === 'specialist' || userData.role === 'owner') {
                setIsEnrolled(true);
                setLoading(false);
                return;
            }

            // Check if enrolled via API
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/user/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const enrolled = data.enrollments?.some((e: any) => e.course?.id === courseId);
                setIsEnrolled(enrolled);
            }
        } catch (err) {
            console.error('Enrollment check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Only show chat if enrolled
    if (loading || !isEnrolled) return null;

    return <CourseChat courseId={courseId} courseTitle={courseTitle} />;
}

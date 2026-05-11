'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/tenant-admin/email-templates');
    }, [router]);
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
            <p>Redirecting to Email Templates...</p>
        </div>
    );
}

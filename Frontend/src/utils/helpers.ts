
import { BASE_URL } from '../lib/api';

export function getImageUrl(path: string | null | undefined): string {
    if (!path) return 'https://placehold.co/800x400/png?text=No+Image';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

export function timeUntil(dateString: string): string {
    const now = new Date();
    const expires = new Date(dateString);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "انتهى العرض";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 1) return `ينتهي خلال ${days} أيام`;
    if (days === 1) return `ينتهي خلال يوم واحد`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 1) return `ينتهي خلال ${hours} ساعات`;
    if (hours === 1) return `ينتهي خلال ساعة واحدة`;

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "ينتهي قريباً جداً";
    return `ينتهي خلال ${minutes} دقيقة`;
}
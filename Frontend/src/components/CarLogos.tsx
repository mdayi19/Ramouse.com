
import React from 'react';

// Using simplified or generic representations for logos.
// In a real-world app, these would be the actual brand SVGs.

const BmwLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#000"/><circle cx="50" cy="50" r="38" fill="#fff"/><path d="M50 12v38H12a38 38 0 0138-38z" fill="#0092D8"/><path d="M50 12a38 38 0 0138 38H50V12z" fill="#0092D8"/><path d="M50 50h38a38 38 0 01-38 38V50z" fill="#0092D8"/><path d="M50 50V88a38 38 0 01-38-38h38z" fill="#0092D8"/><circle cx="50" cy="50" r="38" stroke="#ccc" strokeWidth="1" fill="none"/></svg>;
const MercedesLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"/><path d="M50 10v40L93.3 75M50 50L6.7 75" stroke="currentColor" strokeWidth="8"/></svg>;
const AudiLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 35"><circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="5"/><circle cx="39" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="5"/><circle cx="61" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="5"/><circle cx="83" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="5"/></svg>;
const VwLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"/><path d="M20 30l15 40L50 30l15 40L80 30" stroke="currentColor" strokeWidth="8" fill="none"/><path d="M30 60h40" stroke="currentColor" strokeWidth="8" fill="none"/></svg>;
const ToyotaLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 70"><ellipse cx="50" cy="35" rx="48" ry="33" fill="none" stroke="currentColor" strokeWidth="7"/><ellipse cx="50" cy="35" rx="18" ry="33" fill="none" stroke="currentColor" strokeWidth="7"/><path d="M20 35h60" stroke="currentColor" strokeWidth="7" fill="none"/></svg>;
const FordLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 40"><ellipse cx="50" cy="20" rx="48" ry="18" fill="#003478"/><text x="50" y="28" fontFamily="serif" fontSize="24" fill="white" textAnchor="middle" fontStyle="italic">Ford</text></svg>;
const HyundaiLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 60"><ellipse cx="50" cy="30" rx="45" ry="28" fill="none" stroke="currentColor" strokeWidth="6"/><path d="M35 15c10 10 20 20 30 30" stroke="currentColor" strokeWidth="8"/><path d="M30 40c5-15 25-20 40-10" stroke="currentColor" strokeWidth="8" fill="none"/></svg>;
const KiaLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 50"><text x="50" y="40" fontFamily="sans-serif" fontSize="40" fill="currentColor" textAnchor="middle" fontWeight="bold">KIA</text></svg>;
const ChevroletLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 30"><path d="M0 15h35l15-15 15 15h35v0H65L50 30 35 15H0z" fill="#BDBDBD"/><path d="M50 0l15 15H35L50 0z M50 30L35 15h30L50 30z" fill="#D4AF37"/></svg>;
const FiatLogo = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#A60000"/><text x="50" y="65" fontFamily="sans-serif" fontSize="50" fill="white" textAnchor="middle" fontWeight="bold">FIAT</text></svg>;
const GenericCarLogo = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8"/><path d="M10 16.5V8"/><path d="M2 12h20"/><path d="M5 12v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2Z"/></svg>;


const LOGO_MAP: { [key: string]: React.FC<{ className?: string }> } = {
    'بي إم دبليو': BmwLogo,
    'مرسيدس-بنز': MercedesLogo,
    'أودي': AudiLogo,
    'فولكس فاجن': VwLogo,
    'تويوتا': ToyotaLogo,
    'فورد': FordLogo,
    'شيفروليه': ChevroletLogo,
    'هيونداي': HyundaiLogo,
    'كيا': KiaLogo,
    'فيات': FiatLogo,
};

export const CarLogo: React.FC<{ brand: string, className?: string }> = ({ brand, className }) => {
    const LogoComponent = LOGO_MAP[brand] || GenericCarLogo;
    return <LogoComponent className={className} />;
};

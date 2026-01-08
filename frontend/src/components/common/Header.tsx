import DashboardHeader from '@/components/common/DashboardHeader';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

type HeaderLink = {
    label: string;
    to: string;
    external?: boolean;
};

type HeaderProps = {
    links?: HeaderLink[];
    showThemeToggle?: boolean;
};

const defaultLinks: HeaderLink[] = [
    { label: 'Projects', to: '/projects' },
    { label: 'How It Works', to: '/#how-it-works', external: true },
    { label: 'Categories', to: '/#categories', external: true },
    { label: 'Testimonials', to: '/#testimonials', external: true },
];

export default function Header({ links = defaultLinks, showThemeToggle = true }: HeaderProps) {
    const { unreadCount } = useRealtimeNotifications();

    return (
        <DashboardHeader
            unreadCount={unreadCount}
            links={links}
            showBrand
            useContainer
            showThemeToggle={showThemeToggle}
        />
    );
}

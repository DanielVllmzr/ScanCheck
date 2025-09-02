import dynamic from 'next/dynamic';
const ScanCheck = dynamic(() => import('@/components/ScanCheck'), { ssr: false });

export default function Page() {
  return <ScanCheck />;
}

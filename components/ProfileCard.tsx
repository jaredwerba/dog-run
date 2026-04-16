import Link from 'next/link';
import Image from 'next/image';

interface Props {
  id: string;
  photoUrl?: string | null;
  title: string;
  subtitle: string;
  tags: { label: string; value: string }[];
  viewing: 'runners' | 'dogs';
}

const PACE_COLOR: Record<string, string> = {
  casual: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  fast: 'bg-red-100 text-red-700',
};

export default function ProfileCard({ id, photoUrl, title, subtitle, tags, viewing }: Props) {
  return (
    <Link
      href={`/profile/${id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-transform"
    >
      <div className="relative h-40 bg-orange-50">
        {photoUrl ? (
          <Image src={photoUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {viewing === 'dogs' ? '🐶' : '🏃'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.label}
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                t.label === 'Pace' ? (PACE_COLOR[t.value.toLowerCase()] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.label === 'Pace' ? `${t.value} pace` : t.value}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

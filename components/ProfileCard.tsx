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

export default function ProfileCard({ id, photoUrl, title, subtitle, tags, viewing }: Props) {
  return (
    <Link
      href={`/profile/${id}`}
      className="block bg-white rounded-lg apple-shadow overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="relative h-40 bg-light-gray">
        {photoUrl ? (
          <Image src={photoUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {viewing === 'dogs' ? '🐶' : '🏃'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">{title}</h3>
        <p className="text-sm text-black/48 mb-3 tracking-[-0.014em]">{subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.label}
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-light-gray text-near-black tracking-[-0.008em]"
            >
              {t.label === 'Pace' ? `${t.value} pace` : t.value}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

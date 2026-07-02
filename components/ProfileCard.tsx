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
      className="block bg-linen rounded-xl border border-soil/10 shadow-sm overflow-hidden hover:shadow-md hover:border-pine/40 active:scale-[0.98] transition-all"
    >
      <div className="relative h-40 bg-moss/25">
        {photoUrl ? (
          <Image src={photoUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {viewing === 'dogs' ? '🐶' : '🏃'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-soil text-[16px]">{title}</h3>
        <p className="text-sm text-soil/55 mb-3">{subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t.label}
              className="font-data text-[10px] tracking-[0.08em] uppercase px-2 py-1 rounded-md bg-oat text-bark border border-soil/10"
            >
              {t.label === 'Pace' ? `${t.value} pace` : t.value}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

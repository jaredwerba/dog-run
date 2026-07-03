import Link from 'next/link';
import Image from 'next/image';

interface Props {
  id: string;
  photoUrl?: string | null;
  title: string;
  subtitle: string;
  tags: { label: string; value: string }[];
  viewing: 'runners' | 'dogs';
  /* Match-quality badges, e.g. "4 shared times", "Same pace" */
  badges?: string[];
  /* Override destination (e.g. guests get funneled to /register) */
  href?: string;
  /* Heart / favorite — omit onToggleFavorite to hide the heart entirely */
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProfileCard({
  id,
  photoUrl,
  title,
  subtitle,
  tags,
  viewing,
  badges = [],
  href,
  favorited,
  onToggleFavorite,
}: Props) {
  return (
    <Link
      href={href ?? `/profile/${id}`}
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
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={favorited ? 'Remove favorite' : 'Add favorite'}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-soil/40 backdrop-blur-sm flex items-center justify-center hover:bg-soil/55 transition-colors"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={favorited ? '#bd6b44' : 'none'}
              stroke={favorited ? '#bd6b44' : '#f6eedd'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        )}
        {badges.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="bg-pine text-oat text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-soil text-[16px]">{title}</h3>
        <p className="text-sm text-soil/55 mb-3">{subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.filter((t) => t.value?.trim()).map((t) => (
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

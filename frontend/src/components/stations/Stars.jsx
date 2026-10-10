export default function Stars({ value = 0, size = 'h-3.5 w-3.5' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <svg key={i} viewBox="0 0 24 24" className={size} aria-hidden>
            <defs>
              <linearGradient id={`star-${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
                <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,.15)" />
              </linearGradient>
            </defs>
            <path fill={`url(#star-${i}-${fill})`}
              d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
        );
      })}
    </span>
  );
}

import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { dailyQuote } from '../utils/quotes';

export function DailyQuote() {
  const [quote, setQuote] = useState(() => dailyQuote());
  useEffect(() => {
    const update = () => setQuote(dailyQuote());
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  return (
    <section className="daily-quote" aria-label="Daily quote about optimism">
      <Quote className="daily-quote-icon" size={25} aria-hidden="true" />
      <div>
        <p className="daily-quote-label">A LITTLE HOPE FOR TODAY</p>
        <blockquote cite={quote.source}>{quote.text}</blockquote>
        <p className="daily-quote-attribution">
          — {quote.author}, <a href={quote.source} target="_blank" rel="noreferrer"><cite>{quote.work}</cite></a>
        </p>
      </div>
    </section>
  );
}

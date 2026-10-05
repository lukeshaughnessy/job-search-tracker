export interface InspirationalQuote {
  text: string;
  author: string;
  work: string;
  source: string;
}

// Public-domain excerpts, checked against the linked original works.
// Bundled locally; daily rotation works without fetching an external service.
const quotes: InspirationalQuote[] = [
  {
    text: 'Optimism is the faith that leads to achievement; nothing can be done without hope.',
    author: 'Helen Keller',
    work: 'Optimism (1903)',
    source: 'https://www.gutenberg.org/files/31622/31622-h/31622-h.htm',
  },
  {
    text: 'Nothing great was ever achieved without enthusiasm.',
    author: 'Ralph Waldo Emerson',
    work: 'Circles, Essays: First Series',
    source: 'https://www.gutenberg.org/cache/epub/2944/pg2944-images.html',
  },
  {
    text: 'I’m not afraid of storms, for I’m learning how to sail my ship.',
    author: 'Louisa May Alcott',
    work: 'Little Women, Chapter 44',
    source: 'https://www.gutenberg.org/files/514/514-h/514-h.htm',
  },
  {
    text: 'Only that day dawns to which we are awake. There is more day to dawn.',
    author: 'Henry David Thoreau',
    work: 'Walden, Conclusion',
    source: 'https://www.gutenberg.org/files/205/205-h/205-h.htm',
  },
  {
    text: 'Hope is the thing with feathers\nThat perches in the soul,',
    author: 'Emily Dickinson',
    work: 'Hope is the thing with feathers',
    source: 'https://poets.org/poem/hope-thing-feathers-254',
  },
  {
    text: 'Our doubts are traitors\nAnd makes us lose the good we oft might win\nBy fearing to attempt.',
    author: 'William Shakespeare',
    work: 'Measure for Measure, Act 1, Scene 4',
    source: 'https://www.folger.edu/explore/shakespeares-works/measure-for-measure/read/1/4/',
  },
  {
    text: 'If Winter comes, can Spring be far behind?',
    author: 'Percy Bysshe Shelley',
    work: 'Ode to the West Wind',
    source: 'https://www.poetryfoundation.org/poems/45134/ode-to-the-west-wind',
  },
  {
    text: 'However, the Sun himself is weak when he first rises, and gathers strength and courage as the day gets on.',
    author: 'Charles Dickens',
    work: 'The Old Curiosity Shop, Chapter 40',
    source: 'https://www.gutenberg.org/files/700/700-h/700-h.htm',
  },
  {
    text: 'Let us, then, be up and doing,\nWith a heart for any fate;',
    author: 'Henry Wadsworth Longfellow',
    work: 'A Psalm of Life',
    source: 'https://poets.org/poem/psalm-life',
  },
  {
    text: 'Be not afraid of life. Believe that life is worth living, and your belief will help create the fact.',
    author: 'William James',
    work: 'Is Life Worth Living?, The Will to Believe',
    source: 'https://www.gutenberg.org/files/26659/26659-h/26659-h.htm',
  },
];

export function dailyQuote(date = new Date()): InspirationalQuote {
  // Calendar arithmetic keeps the selection stable across daylight-saving changes.
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return quotes[((day % quotes.length) + quotes.length) % quotes.length];
}

import memoryArchive from './memory-archive.json';

const requestedTitles = [
  '溫媽媽的織布工作室',
  '一起募款蓋新會堂',
  '和家人們一起去教會',
  '製作陷阱',
  '金洋國小100週年入山尋根',
];

export const memoryFeaturedStories = requestedTitles
  .map(title => memoryArchive.find(memory => memory.title === title))
  .filter(Boolean)
  .map((memory, index) => ({
    ...memory,
    number: String(index + 1).padStart(2, '0'),
    titleLines: memory.title === '溫媽媽的織布工作室' ? ['溫媽媽的織布', '工作室'] : [memory.title],
    titleSingleLine: memory.title === '一起募款蓋新會堂',
    // Keep the story wording exactly as it appears in the approved memory
    // record. The presentation may scroll, but it must not paraphrase it.
    excerpt: memory.info || '',
  }));

export default memoryFeaturedStories;

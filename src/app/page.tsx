import { getAllPosts } from '@/lib/posts';
import HomeContent from './HomeContent';

export default function HomePage() {
  const recentPosts = getAllPosts().slice(0, 5);
  return <HomeContent recentPosts={recentPosts} />;
}

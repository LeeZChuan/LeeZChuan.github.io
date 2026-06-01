import { getAllPosts } from '@/lib/posts';
import HomeContent from './HomeContent';

export default function HomePage() {
  const recentPosts = getAllPosts();
  return <HomeContent recentPosts={recentPosts} />;
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { blogPosts } from '../data/blogPosts';

const BlogPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Blog!</h1>
        <p className="text-lg mb-8">This is where you'll find all our latest articles and updates.</p>

        <div className="space-y-12">
          {blogPosts.map((post) => (
            <div key={post.slug} className="border-b pb-8 last:border-b-0 last:pb-0">
              <Link to={`/blog/${post.slug}`} className="group block">
                <h2 className="text-3xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{post.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Published on {post.date}</p>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.content }}></p>
                <span className="text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block">Read More →</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;



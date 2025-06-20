import React from 'react';
import { Layout } from '../components/layout/Layout';

const BlogPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Blog!</h1>
        <p className="text-lg">This is where you'll find all our latest articles and updates.</p>
        {/* Blog content will go here */}
      </div>
    </Layout>
  );
};

export default BlogPage;

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { 
  Palette, 
  PenTool, 
  Layers, 
  Download, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';

const featuresList = [
  {
    icon: <Palette className="h-6 w-6 text-brand-600" />,
    title: 'AI-Powered Color Palettes',
    description: 'Generate harmonious color schemes that perfectly match your brand personality and industry.',
  },
  {
    icon: <PenTool className="h-6 w-6 text-brand-600" />,
    title: 'Logo Concept Generation',
    description: 'Create professional logo concepts based on your brand name and industry in seconds.',
  },
  {
    icon: <Layers className="h-6 w-6 text-brand-600" />,
    title: 'Complete Brand Guidelines',
    description: 'Compile comprehensive brand guidelines including typography, spacing, and usage examples.',
  },
  {
    icon: <Download className="h-6 w-6 text-brand-600" />,
    title: 'Export & Share',
    description: 'Download your brand assets in multiple formats or share them directly with your team.',
  },
];

const testimonials = [
  {
    quote: "Brandii helped us create a cohesive brand identity in minutes instead of weeks. The AI suggestions were spot on!",
    author: "Sarah Johnson",
    role: "Founder, TechStart",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
  {
    quote: "As a solo entrepreneur, I couldn't afford a design agency. Brandii gave me professional results at a fraction of the cost.",
    author: "Michael Chen",
    role: "Independent Consultant",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
  {
    quote: "The brand kit we created with Brandii has received countless compliments. It's impressive how consistent our materials look now.",
    author: "Emma Rodriguez",
    role: "Marketing Director, GreenLife",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg pattern-dots opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Create Beautiful Brand Identities with AI
            </motion.h1>
            
            <motion.p 
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Generate professional color palettes, logo concepts, and brand guidelines 
              in minutes with our AI-powered brand kit generator.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/create')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Create Your Brand Kit
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate('/library')}
              >
                View Examples
              </Button>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-16 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
              <img 
                src="https://images.pexels.com/photos/4125349/pexels-photo-4125349.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                alt="Brandii Dashboard Preview" 
                className="w-full h-auto object-cover object-top"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Powerful Features for Your Brand
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to create a cohesive and professional brand identity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresList.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <CardContent className="p-6">
                    <div className="bg-brand-100 dark:bg-brand-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              How Brandii Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create your brand kit in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: '01',
                title: 'Describe Your Brand',
                description: 'Tell us about your business, your target audience, and your brand personality.',
                icon: <Sparkles className="h-6 w-6 text-brand-600" />
              },
              {
                number: '02',
                title: 'Review AI Suggestions',
                description: 'Get AI-generated color palettes, logo concepts, and typography pairings.',
                icon: <Palette className="h-6 w-6 text-brand-600" />
              },
              {
                number: '03',
                title: 'Export Your Brand Kit',
                description: 'Download your complete brand guidelines and assets for immediate use.',
                icon: <Download className="h-6 w-6 text-brand-600" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 relative z-10">
                  <div className="text-5xl font-bold text-brand-100 dark:text-brand-900/50 mb-4">
                    {step.number}
                  </div>
                  <div className="bg-brand-100 dark:bg-brand-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-12 transform -translate-y-1/2 text-brand-300 dark:text-brand-800">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              onClick={() => navigate('/create')}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Start Creating Now
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their brand identity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.author}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-16 sm:p-16 md:px-20 md:py-16 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Ready to transform your brand?
                </h2>
                <p className="text-xl text-white/90 mb-8 sm:mb-0">
                  Create your professional brand kit in minutes with our AI-powered tools.
                </p>
              </div>
              <Button 
                size="lg" 
                className="bg-white text-brand-600 hover:bg-gray-100"
                onClick={() => navigate('/create')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { 
  Palette, 
  PenTool, 
  Layers, 
  Download, 
  ArrowRight, 
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Check,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex justify-between items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 pt-0 bg-white dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-300">{answer}</p>
        </div>
      )}
    </div>
  );
};

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
    icon: <ImageIcon className="h-6 w-6 text-brand-600" />,
    title: 'AI Image Generation',
    description: 'Create custom/product images that match your brand style with AI-powered image generation.',
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
  {
    icon: <Wand2 className="h-6 w-6 text-brand-600" />,
    title: 'Smart Variations',
    description: 'Generate multiple design variations with different styles and layouts in seconds.',
  }
];

const testimonials = [
  {
    quote: "Brandii helped me establish a cohesive brand identity in minutes instead of weeks. Generating images that matched my brand were spot on!",
    author: "K. Montaque",
    role: "Content Creator",
    avatar: "#"
  },
  {
    quote: "As a solopreneur, I couldn't afford a design agency. Brandii gives me great results at a fraction of the cost & time.",
    author: "K. Thompson",
    role: "Independent Consultant",
    avatar: "#"
  },
  {
    quote: "The brand kit we created with Brandii has received countless compliments. It's impressive how consistent our materials look now.",
    author: "D. Beckford",
    role: "Marketing Specialist",
    avatar: "#"
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  // Handle hash-based scrolling on initial load
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          // Small timeout to ensure all elements are rendered
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    // Initial check
    handleHash();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHash);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="splash-shapes">
          <div className="splash-shape splash-shape-1"></div>
          <div className="splash-shape splash-shape-2"></div>
          <div className="splash-shape splash-shape-3"></div>
        </div>

        <div className="absolute inset-0 gradient-bg pattern-dots opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-12">
            <div className="dark:bg-black/20 bg-white backdrop-blur-md border border-black/20 dark:border-white/20 rounded-full py-2 px-4 flex items-center gap-2">
              <span className="text-brand-500 text-lg">🚀</span>
              <span className="dark:text-white/90 text-black/90 md:text-sm font-medium text-xs">Brand Kit, Logo Maker & Image&nbsp;Generator</span>
              <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Think&nbsp;it. Brand&nbsp;it. Launch&nbsp;it.
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-800 dark:text-white/90 mb-8 max-w-2xl mx-auto drop-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Generate professional logos, images, and color schemes that work seamlessly together. 
              Build your complete brand kit in seconds and <span className="text-brand-400">create consistent brand assets</span>. 
              Ready to dominate your market?
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
                className="bg-white/10 backdrop-blur-sm border-white/20 text-gray-900 dark:text-white hover:bg-white/20"
                onClick={() => navigate('/gallery')}
              >
                View Examples
              </Button>
            </motion.div>
            <motion.div 
              className="grid grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-white/10 mt-20 pt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center">
                <div className="text-4xl font-bold dark:text-white text-black mb-1">100+</div>
                <div className="text-gray-400 text-sm">Brand Kits Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold dark:text-white text-black mb-1">98%</div>
                <div className="text-gray-400 text-sm">Client Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold dark:text-white text-black mb-1">2.1k+</div>
                <div className="text-gray-400 text-sm">Assets Generated</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pb-20 pt-5 bg-gray-50 dark:bg-gray-900">
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {[
              {
                number: '01',
                title: 'Describe Your Brand',
                description: 'Tell us about your business, your target audience, and your brand personality.',
                icon: <Sparkles className="h-6 w-6 text-brand-600" />
              },
              {
                number: '02',
                title: 'Choose Your Perfect Match',
                description: 'Get AI-generated color palettes, logo concepts, and typography pairings.',
                icon: <Palette className="h-6 w-6 text-brand-600" />
              },
              {
                number: '03',
                title: 'Generate & Download Assets',
                description: 'Generate custom images that perfectly match your brand style and promote your brand identity.',
                icon: <ImageIcon className="h-6 w-6 text-brand-600" />
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
                  <div className="text-5xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(139,92,246,0.3)] mb-4">
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
                  <div className="hidden md:flex absolute top-1/2 -right-16 transform -translate-y-1/2 z-20 items-center justify-center w-24">
                    <ArrowRight className="h-8 w-8 text-brand-300 dark:text-brand-800" />
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
                      {/* <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      /> */}
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
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Pricing 
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your needs, cancel anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                price: 0,
                description: 'Perfect for trying out Brandii',
                monthlyCredits: 10,
                features: [
                  '10 one-time credits',
                  'All assets generated are public',
                  'Community support',
                ],
                buttonText: 'Get Started',
                popular: false
              },
              {
                name: 'Pro',
                price: 15,
                description: 'For growing brands',
                monthlyCredits: 90,
                features: [
                  '40 monthly credits',
                  '60 bonus credits (special offer)',
                  'Unlimited brand kits',
                  'Private and public image options',
                  'All premium features',
                  'Priority support',
                  'Email support'
                ],
                buttonText: 'Get Started',
                popular: true
              },
              {
                name: 'Elite',
                price: 99,
                description: 'For large work loads',
                monthlyCredits: 500,
                features: [
                  '300 monthly credits',
                  '200 bonus credits (special offer)',
                  'Unlimited brand kits',
                  'Private and public image options',
                  'All premium features',
                  'Priority support',
                  'Email support'
                ],
                buttonText: 'Get Started',
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <Card className={`h-full ${plan.popular ? 'border-2 border-brand-500 shadow-lg' : ''}`}>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center mb-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <Zap className="h-4 w-4 text-brand-500 mr-1" />
                        {plan.monthlyCredits} credits included
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className={`w-full ${plan.popular ? 'shadow-lg shadow-brand-500/20' : ''}`}
                      onClick={() => {
                        if (profile) {
                          navigate('/profile');
                        } else {
                          navigate('/create');
                        }
                      }}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Need more? <a href={`mailto:${import.meta.env.VITE_APP_EMAIL}?subject=Custom%20Plan%20Inquiry&body=I%20am%20interested%20in%20a%20custom%20plan.`} className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 font-medium">Contact sales</a> for custom plans.
            </p>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faqs" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about Brandii
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                question: 'What is a credit?',
                answer: 'A credit is used each time you generate a new asset (like a color palette, logo, or image) with Brandii. Different types of generations may use different amounts of credits.'
              },
              {
                question: 'Can I cancel my subscription?',
                answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.'
              },
              {
                question: 'Do unused credits roll over?',
                answer: 'Only purchased credits roll over each month. Unused monthly credits from the previous month will not roll over to the next month.'
              },
              {
                question: 'Do I get bonus credits? (Limited time special offer)',
                answer: 'Yes, you can get up to 50 or 200 in bonus credits (limited time special offer) with our Pro and Elite plans. Bonus credits will be added to your account within 24 hours of purchase and will be available as purchased credits. These bonus credits will roll over each month until they are used up.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards including Visa, Mastercard, American Express, and Discover. We also support payments through PayPal.'
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes! You can try Brandii for free with our Starter plan which includes free one-time credits (set as purchased credits and will roll over each month until they are used up). No credit card required to get started.'
              },
              {
                question: 'How do I upgrade or change my plan?',
                answer: 'You can upgrade, downgrade, or change your plan at any time from your account settings. Changes will be reflected in your next billing cycle.'
              },
              {
                question: 'Can I purchase credits?',
                answer: 'Yes! You can purchase credits at any time from your account settings. Credits will be added to your account within 24 hours of purchase and will be available as purchased credits. These credits will roll over each month until they are used up.'
              }
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
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
                <p className="text-xl text-white/90 mb-4">
                  Create your professional brand kit in seconds and generate consistent assets for your brand.
                </p>
                <div className="text-white/80 text-sm mb-8 sm:mb-0 flex flex-wrap gap-3 sm:gap-6">
                  <span>✓ No design skills needed</span>
                  <span>✓ Professional results</span>
                  <span>✓ New or existing brand</span>
                  <span>✓ Manage multiple brand kits</span>
                  <span>✓ Downloadable assets</span>
                </div>
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
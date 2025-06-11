import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Badge,
  Progress 
} from '../components/ui';
import { useUser } from '../context/UserContext';
import { updateUserProfile, supabase } from '../lib/supabase';
import { ArrowLeft, Save, Twitter, Github, Linkedin, CreditCard, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Types for subscription and credit data
type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  monthly_credits: number;
  price: number;
  is_active: boolean;
};

type UserSubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
};

type UserCredits = {
  purchased_credits: number;
  monthly_credits: number;
  credits_used: number;
  available_credits: number;
  subscription_status: string | null;
  subscription_ends_at: string | null;
};

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
    social_links: {
      twitter: profile?.social_links?.twitter || '',
      github: profile?.social_links?.github || '',
      linkedin: profile?.social_links?.linkedin || '',
    },
    preferences: {
      emailNotifications: profile?.preferences?.emailNotifications ?? true,
      darkMode: profile?.preferences?.darkMode ?? null,
    },
  });

  // Fetch subscription plans and user credits
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Fetch subscription plans
        const { data: plans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });
        
        if (plansError) throw plansError;
        setSubscriptionPlans(plans || []);
        
        // Fetch user credits
        const { data: credits, error: creditsError } = await supabase
          .from('user_available_credits')
          .select('*')
          .eq('user_id', profile?.id)
          .single();
        
        if (creditsError && creditsError.code !== 'PGRST116') throw creditsError;
        setUserCredits(credits);
        
        // Fetch user subscription
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', profile?.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subError && subError.code !== 'PGRST116') throw subError;
        setUserSubscription(subscription);
        
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription data');
      }
    };
    
    if (profile?.id) {
      fetchSubscriptionData();
    }
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUserProfile({
        ...formData,
        id: profile!.id,
        email: profile!.email,
      });
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      // In a real app, this would redirect to Stripe checkout
      toast.success('Redirecting to payment gateway...');
      // For this example, we'll simulate a successful upgrade
      navigate('/checkout?plan=' + planId);
    } catch (error) {
      console.error('Error initiating upgrade:', error);
      toast.error('Failed to initiate plan upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!userSubscription?.id) return;
    
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    setIsLoading(true);
    try {
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          status: 'canceled'
        })
        .eq('id', userSubscription.id);
      
      toast.success('Subscription canceled successfully');
      
      // Refresh subscription data
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', userSubscription.id)
        .single();
      
      setUserSubscription(data);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Section references for navigation
  const creditsSectionRef = React.useRef<HTMLDivElement>(null);
  const userInfoSectionRef = React.useRef<HTMLDivElement>(null);
  const accountSettingsSectionRef = React.useRef<HTMLDivElement>(null);
  const subscriptionSectionRef = React.useRef<HTMLDivElement>(null);

  // Function to scroll to a section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="md:w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Profile Navigation</h3>
                <nav className="space-y-2">
                  <button 
                    onClick={() => scrollToSection(creditsSectionRef)}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Credits & Subscription
                  </button>
                  
                  {profile?.user_type !== 'pro' && (
                    <button 
                      onClick={() => scrollToSection(subscriptionSectionRef)}
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </button>
                  )}
                  
                  <button 
                    onClick={() => scrollToSection(userInfoSectionRef)}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    User Information
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection(accountSettingsSectionRef)}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Account Settings
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center justify-between mb-8">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="mb-4"
                >
                  Back
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Profile Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </div>
              
              {userCredits && (
                <div className="text-right">
                  <div className="flex items-center justify-end mb-1 gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-xl font-semibold text-gray-900 dark:text-white">
                      {userCredits.available_credits} credits
                    </span>
                  </div>
                  <Badge variant={profile?.user_type === 'pro' ? 'secondary' : 'outline'} className="ml-2">
                    {profile?.user_type?.toUpperCase() || 'FREE'} ACCOUNT
                  </Badge>
                </div>
              )}
            </div>

            {/* Credits & Subscription Status Card */}
            <Card className="mb-8" ref={creditsSectionRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credits & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userCredits ? (
                  <div className="space-y-6">
                    {/* Credits display */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Credits</h3>
                        <span className="text-lg font-semibold">{userCredits.available_credits}</span>
                      </div>
                      <Progress
                        value={userCredits.credits_used}
                        max={userCredits.monthly_credits + userCredits.purchased_credits}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Used: {userCredits.credits_used}</span>
                        <span>Total: {userCredits.monthly_credits + userCredits.purchased_credits}</span>
                      </div>
                    </div>
                    
                    {/* Credits breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Credits</div>
                        <div className="text-xl font-semibold">{userCredits.monthly_credits}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {userCredits.subscription_status === 'active' ? 'Renews monthly' : 'No active subscription'}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchased Credits</div>
                        <div className="text-xl font-semibold">{userCredits.purchased_credits}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Never expire</div>
                      </div>
                    </div>
                    
                    {/* Subscription info */}
                    {userSubscription && (
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium mb-2">Current Subscription</h3>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Plan</span>
                          <span className="font-medium">
                            {subscriptionPlans.find(p => p.id === userSubscription.plan_id)?.name || 'Pro Plan'}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Status</span>
                          <Badge variant={userSubscription.status === 'active' ? 'success' : 'outline'}>
                            {userSubscription.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Renews on</span>
                          <span>
                            {new Date(userSubscription.current_period_end).toLocaleDateString()}
                          </span>
                        </div>
                        {userSubscription.status === 'active' && !userSubscription.cancel_at_period_end && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-4" 
                            onClick={handleCancelSubscription}
                            isLoading={isLoading}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                        {userSubscription.cancel_at_period_end && (
                          <div className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                            Your subscription will end on {new Date(userSubscription.current_period_end).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    Loading credit information...
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Subscription Plans */}
            {profile?.user_type !== 'pro' && (
              <Card className="mb-8 border-2 border-dashed border-brand-300 bg-brand-50 dark:bg-transparent dark:border-brand-800" ref={subscriptionSectionRef}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Upgrade Your Plan
                  </CardTitle>
                  <CardDescription>
                    Get more credits and features with a Pro subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subscriptionPlans.map(plan => (
                      <Card key={plan.id} className={`overflow-hidden ${plan.name === 'Pro' ? 'border-brand-500 shadow-md' : ''}`}>
                        <div className={`px-6 py-3 ${plan.name === 'Pro' ? 'bg-brand-100 dark:bg-brand-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{plan.description}</div>
                        </div>
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <span className="text-3xl font-bold">${plan.price}</span>
                            <span className="text-gray-600 dark:text-gray-400">/month</span>
                          </div>
                          <ul className="space-y-2 mb-6">
                            <li className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-brand-500" />
                              {plan.monthly_credits} monthly credits
                            </li>
                            {plan.name === 'Pro' && (
                              <li className="flex items-center gap-2 text-sm">
                                <Zap className="h-4 w-4 text-brand-500" />
                                Priority support
                              </li>
                            )}
                          </ul>
                          <Button
                            variant={plan.name === 'Pro' ? 'primary' : 'outline'}
                            className="w-full"
                            onClick={() => handleUpgrade(plan.id)}
                            isLoading={isUpgrading}
                            disabled={plan.name === 'Free' || (userSubscription?.plan_id === plan.id && userSubscription?.status === 'active')}
                          >
                            {plan.name === 'Free' ? 'Current Plan' : 
                              (userSubscription?.plan_id === plan.id && userSubscription?.status === 'active') ? 'Current Plan' : 'Upgrade'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <form onSubmit={handleSubmit}>
              <Card className="mb-8" ref={userInfoSectionRef}>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Your full name"
                      />

                      <Input
                        label="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Choose a username"
                      />
                    </div>

                    <Textarea
                      label="Bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                    />

                    <Input
                      label="Website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Your website URL"
                    />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Social Links
                      </h3>

                      <Input
                        leftIcon={<Twitter className="h-4 w-4" />}
                        value={formData.social_links.twitter}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            twitter: e.target.value
                          }
                        })}
                        placeholder="Twitter profile URL"
                      />

                      <Input
                        leftIcon={<Github className="h-4 w-4" />}
                        value={formData.social_links.github}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            github: e.target.value
                          }
                        })}
                        placeholder="GitHub profile URL"
                      />

                      <Input
                        leftIcon={<Linkedin className="h-4 w-4" />}
                        value={formData.social_links.linkedin}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            linkedin: e.target.value
                          }
                        })}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>

                    <div className="space-y-4" ref={accountSettingsSectionRef}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Preferences
                      </h3>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          checked={formData.preferences.emailNotifications}
                          onChange={(e) => setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              emailNotifications: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="emailNotifications"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Receive email notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  leftIcon={<Save className="h-4 w-4" />}
                  isLoading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
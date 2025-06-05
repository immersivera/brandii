import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { updateUserProfile } from '../lib/supabase';
import { ArrowLeft, Save, Twitter, Github, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
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
            </div>

            <form onSubmit={handleSubmit}>
              <Card className="mb-8">
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

                    <div className="space-y-4">
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
    </Layout>
  );
};
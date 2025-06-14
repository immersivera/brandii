import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Last updated: June 14, 2025
            </p>

            <div className="prose dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4"> 
                  Welcome to Brandii, a service provided by Immersive Solutions ("Company", "we", "us", or "our"). By accessing or using our platform at brandii.app or any related services (collectively, the "Service"), you agree to comply with and be bound by this Privacy Policy.
                </p> 
                <p className="mb-4">
                  This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <p className="mb-4">We may collect, use, store, and transfer different kinds of personal data about you, which we have grouped together as follows:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li><strong>Identity Data</strong> includes first name, last name, username, or similar identifier.</li>
                  <li><strong>Contact Data</strong> includes email address.</li>
                  <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                  <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                <p className="mb-4">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>To register you as a new customer.</li>
                  <li>To process and deliver your orders.</li>
                  <li>To manage your account and profile.</li>
                  <li>To provide customer support.</li>
                  <li>To improve our website, products/services, marketing, or customer relationships.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="mb-4">
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <p className="mb-4">
                  We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Your Legal Rights</h2>
                <p className="mb-4">
                  Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Request access to your personal data.</li>
                  <li>Request correction of your personal data.</li>
                  <li>Request erasure of your personal data.</li>
                  <li>Object to processing of your personal data.</li>
                  <li>Request restriction of processing your personal data.</li>
                  <li>Request transfer of your personal data.</li>
                  <li>Right to withdraw consent.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about this privacy policy or our privacy practices, please contact us at:
                </p>
                <p>
                  Email: {import.meta.env.VITE_APP_EMAIL}
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;

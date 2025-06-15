import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';

export const TermsOfServicePage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Last updated: June 14, 2025
            </p>

            <div className="prose dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction and Acceptance</h2>
                <p className="mb-4">
                  Welcome to Brandii, a service provided by Immersive Solutions ("Company", "we", "us", or "our"). By accessing or using our platform at brandii.app or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms").
                </p>
                <p className="mb-4">
                  Please read these Terms carefully. If you do not agree with any part of these Terms, you must not access or use the Service. By using the Service, you represent that you are at least 18 years of age or the legal age of majority in your jurisdiction.
                </p>
              </section>

              <section className="mb-8">
              <p className="mb-4">
                Brandii provides an AI-powered platform for creating and managing brand assets, including but not limited to color palettes, typography, logos, and marketing materials (the "Service").
              </p>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Brandii provides an AI-powered platform for creating and managing brand assets, including but not limited to color palettes, typography, logos, and marketing materials (the "Service").
              </p>
            </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <p className="mb-4">When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>You must be at least 18 years of age to use this Service.</li>
                  <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                  <li>You agree to accept responsibility for all activities that occur under your account.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Subscriptions and Billing</h2>
                <p className="mb-4">
                  Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly or annual basis.
                </p>
                <p className="mb-4">
                  A valid payment method, including credit card, is required to process the payment for your Subscription. You shall provide accurate and complete billing information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
                <p className="mb-4">
                  Our Service allows you to generate with AI, post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
                </p>
                <p className="mb-4">
                  By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                <p className="mb-4">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Brandii and its licensors. The Service is protected by copyright, trademark, and other laws of {import.meta.env.VITE_APP_COUNTRY_INFO}.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
                <p className="mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
                <p className="mb-4">
                  All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="mb-4">
                  In no event shall Brandii, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about these Terms, please contact us at:
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

export default TermsOfServicePage;

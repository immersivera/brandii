import React, { useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';

export const TermsOfServicePage: React.FC = () => {
  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Update URL without page reload
      window.history.pushState(null, '', `#${sectionId}`);
    }
  }, []);
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sticky Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
                <nav className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                  <a 
                    key={`section${num}`}
                    href={`#section${num}`}
                    onClick={(e) => scrollToSection(e, `section${num}`)}
                    className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors py-1 cursor-pointer"
                  >
                    Section {num}: {
                      ["Introduction and Acceptance", "Description of Service", "User Accounts", 
                      "Subscriptions and Billing", "Refund Policy", "Intellectual Property", "Platform Intellectual Property Rights", "Termination",
                      "Limitation of Liability", "Changes to Terms", "Disclaimer", "Dispute Resolution", "Governing Law", "Contact Us"][num-1]
                    }
                    <div className="mb-[-15px]">&nbsp;</div>
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Last updated: June 17, 2025
                </p>
            <div className="prose dark:prose-invert max-w-none">
              <section id="section1" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction and Acceptance</h2>
                <p className="mb-4">
                  Welcome to Brandii, a service provided by Immersive Solutions ("Company", "we", "us", or "our"). By accessing or using our platform at brandii.app or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms").
                </p>
                <p className="mb-4">
                  Please read these Terms carefully. If you do not agree with any part of these Terms, you must not access or use the Service. 
                </p>
              </section>

              <section id="section2" className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Brandii provides an AI-powered platform for creating and managing brand assets, including but not limited to color palettes, typography, logos, and marketing materials (the "Service").
              </p>
            </section>

              <section id="section3" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <p className="mb-4">When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>You must be at least 18 years of age to use this Service.</li>
                  <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                  <li>You agree to accept responsibility for all activities that occur under your account.</li>
                </ul>
                <section id="section3.1" className="mb-8">
                <h3 className="text-xl font-semibold mb-4">3.1. User Conduct and Prohibitions</h3>
                <p className="mb-4">
                  When using the Service, you agree not to engage in any of the following prohibited activities:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Use the Service for any illegal purpose or in violation of any laws or regulations.</li>
                  <li>Infringe on the intellectual property rights of others, including using our Service to generate content that violates copyright or trademark laws.</li>
                  <li>Upload or transmit viruses, malware, or other malicious code.</li>
                  <li>Attempt to gain unauthorized access to any part of the Service or its related systems.</li>
                  <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                  <li>Harass, abuse, or harm another person through use of the Service.</li>
                  <li>Use the Service to generate content that is discriminatory, obscene, hateful, or violent.</li>
                  <li>Resell, duplicate, or distribute any part of the Service in a way that violates our Image License and any usage outside of these terms would need additional permission from the Company.</li>
                </ul>
                <p className="mb-4">
                  We reserve the right to terminate or suspend access to the Service immediately, without prior notice, for users who violate these prohibitions or who generate or upload images that violate our content policies, including but not limited to images containing pornographic, violent, copyrighted material or otherwise objectionable content or intended to offend any person or that is otherwise objectionable to Company in its sole discretion.
                </p>

                <h3 className="text-xl font-semibold mb-4">3.2. Reporting Abuse</h3>
                <p className="mb-4">
                  If you encounter any content that violates these Terms of Service or witness any prohibited activities, please report it immediately to <a href={`mailto:${import.meta.env.VITE_APP_EMAIL}`} className="text-blue-600 dark:text-blue-400 hover:underline">{import.meta.env.VITE_APP_EMAIL}</a>. Please include as much detail as possible about the violation to help us investigate and address the issue promptly.
                </p>

              </section>

              </section>

              <section id="section4" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Subscriptions and Billing</h2>
                <p className="mb-4">
                  Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly or annual basis.
                </p>
                <p className="mb-4">
                  A valid payment method, including credit card, is required to process the payment for your Subscription. You shall provide accurate and complete billing information.
                </p>
              </section>
              <section id="section5" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
                <p className="mb-4">
                  The Company maintains a limited refund policy. Customers may submit a refund request within 14 days of their initial purchase. All such requests are subject to review and approval at the Company's sole discretion.
                </p>
                <p className="mb-4">
                  Refunds will not be processed after the 14-day period has expired. The Company reserves the right to decline refund requests for any reason, including but not limited to extensive service usage or terms of service violations.
                </p>
                <p className="mb-4">
                  This refund policy is without prejudice to any statutory rights that may be applicable under relevant laws. For more information on the refund process, please contact our customer support.
                </p>
              </section>

              <section id="section6" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights in Images, Matterials and Assets</h2>
                <h3 className="text-xl font-semibold mb-4">6.1 Intellectual Property Rights</h3>
                <p className="mb-4">
                  Our Service respects intellectual property rights. When you use our platform:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>You retain ownership of content you upload, provided you have the legal right to do so.</li>
                  <li>You may only upload and use content that you own or have proper rights to use.</li>
                  <li>When you create brand assets using our Service, you receive the license rights described in Section 6.2.</li>
                  <li>While we provide the tools to generate images and brand assets, you are responsible for ensuring your use of these assets complies with applicable laws.</li>
                  <li>The Company reserves the right to remove any content that appears to violate intellectual property rights.</li>
                  <li>By using our Service, you represent that your actions will not infringe upon the intellectual property rights of others.</li>
                </ul>
                <h3 className="text-xl font-semibold mb-4">6.2 Image License</h3>
                <p className="mb-4">
                  Images and assets generated through our Service are provided under the following license terms:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>You are granted a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the generated images for both personal and commercial purposes.</li>
                  <li>This license does not permit you to resell or redistribute the generated images as stock images or templates.</li>
                  <li>You may not use the generated images in any way that violates these Terms of Service or applicable laws.</li>
                  <li>You may not claim copyright or exclusive ownership of images generated by our Service.</li>
                  <li>Attribution to Brandii is appreciated but not required for standard usage.</li>
                </ul>
                <p className="mb-4">
                  We reserve the right to revoke this license for any images used in violation of our Terms of Service or for any illegal, harmful, or objectionable purposes as determined by the Company in its sole discretion.
                </p>
                <h3 className="text-xl font-semibold mb-4">6.3 Licenses for Public Generated Assets</h3>
                <p className="mb-4">
                  Assets generated and marked as public may be used by the Company in the following ways:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Displayed as examples in our gallery and promotional materials</li>
                  <li>Used for service improvement and training purposes</li>
                  <li>Featured in marketing communications</li>
                </ul>
                <p className="mb-4">
                  By marking your generated assets as public, you grant the Company a non-exclusive, royalty-free, worldwide license to use these assets for the purposes mentioned above. You retain all other rights granted under Section 6.2.
                </p>
                <p className="mb-4">
                  The Company reserves the right to remove any assets that violate our content policies or infringe upon intellectual property rights.
                </p>
              </section>
              <section id="section7" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Platform Intellectual Property Rights</h2>
                <p className="mb-4">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of the Company and its licensors. The Service is protected by copyright, trademark, and other laws of {import.meta.env.VITE_APP_COUNTRY_INFO}.
                </p>
              </section>
              <section id="section8" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                <p className="mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
                <p className="mb-4">
                  All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
                </p>
              </section>

              <section id="section9" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                <p className="mb-4">
                  In no event shall the Company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                </p>
              </section>

              <section id="section10" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Disclaimer</h2>
                <p className="mb-4">
                  The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. Your use of the Service is at your sole risk. Immersive Solutions does not warrant that the Service will be uninterrupted, timely, secure, or error-free, nor does it make any warranty as to the accuracy or reliability of any content accessible through the Service.
                </p>
                <p className="mb-4">
                  To the fullest extent permitted by law, we disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement. We make no warranty that: (a) the Service will meet your requirements; (b) the quality of any products, services, information, or other material purchased or obtained through the Service will meet your expectations; and (c) any errors in the Service will be corrected.
                </p>
                <p className="mb-4">
                  Some jurisdictions do not allow the exclusion of certain warranties or limitations on applicable statutory rights, so the above exclusions and limitations may not apply to you.
                </p>
              </section>

              <section id="section11" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>


              <section id="section12" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
                <p className="mb-4">
                  If a dispute arises between the Company and a User regarding these Terms of Service:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Either party may submit a detailed written Dispute Notice within 10 business days of the incident.</li>
                  <li>Within 10 business days after receiving the Dispute Notice, authorized representatives from both parties must meet (virtually or in person) to attempt to resolve the dispute.</li>
                  <li>Nothing in this dispute resolution process prevents either party from pursuing legal action in accordance with the Governing Law provisions in Section 12.</li>
                  <li>We encourage users to contact our support team first to resolve any issues informally before initiating the formal dispute resolution process.</li>
                </ul>
              </section>



              <section id="section13" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
                <p className="mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of Jamaica.
                </p>
              </section>


              <section id="section14" className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
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
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfServicePage;

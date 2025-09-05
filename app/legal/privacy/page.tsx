/* eslint-disable react/no-unescaped-entities */
import LegalLayout from "@/components/landing/legal-layout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 2025">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Introduction
          </h2>
          <p className="mb-4">
            Welcome to Calari ("we," "our," or "us"). This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application and services. We are
            committed to protecting your privacy and ensuring the security of
            your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Information We Collect
          </h2>

          <h3 className="text-xl font-medium mb-3 mt-6">Image Data</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Photos of food items you upload for calorie analysis</li>
            <li>
              Metadata associated with images (timestamp, device information)
            </li>
            <li>Processed image data for nutritional analysis</li>
            <li>
              Images are temporarily stored for processing and may be retained
              for service improvement
            </li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">Text Data</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Profile information you provide (dietary preferences, fitness
              goals, activity levels)
            </li>
            <li>Food descriptions and meal logs</li>
            <li>Custom notes and additional details about your meals</li>
            <li>Search queries and app interactions</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">
            Automatically Collected Information
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Device information (model, operating system, unique identifiers)
            </li>
            <li>
              Usage data (features used, time spent, interaction patterns)
            </li>
            <li>Technical data (IP address, browser type, app version)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Use of Large Language Models (LLM)
          </h2>
          <p className="mb-4">
            Calari uses advanced AI and Large Language Model technology to
            provide personalized nutrition insights and recommendations. Here's
            how we use LLM:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Food Recognition:</strong> AI analyzes your food images to
              identify ingredients and estimate nutritional content
            </li>
            <li>
              <strong>Personalized Recommendations:</strong> LLM processes your
              profile data to provide tailored dietary suggestions
            </li>
            <li>
              <strong>Natural Language Processing:</strong> AI understands and
              responds to your text inputs and questions
            </li>
            <li>
              <strong>Data Processing:</strong> Your data may be processed by
              third-party AI services (with appropriate safeguards)
            </li>
            <li>
              <strong>Model Training:</strong> Anonymized and aggregated data
              may be used to improve AI model accuracy
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide calorie counting and nutritional analysis services</li>
            <li>
              Generate personalized meal recommendations and dietary insights
            </li>
            <li>Improve app functionality and user experience</li>
            <li>Analyze usage patterns to enhance our AI models</li>
            <li>Communicate with you about app updates and features</li>
            <li>Ensure app security and prevent misuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Data Storage and Security
          </h2>
          <p className="mb-4">
            We implement industry-standard security measures to protect your
            information:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Encryption:</strong> Data is encrypted in transit and at
              rest
            </li>
            <li>
              <strong>Secure Servers:</strong> Information is stored on secure,
              monitored servers
            </li>
            <li>
              <strong>Access Controls:</strong> Limited access to personal data
              on a need-to-know basis
            </li>
            <li>
              <strong>Data Retention:</strong> Images are typically deleted
              after processing; profile data is retained while your account is
              active
            </li>
            <li>
              <strong>Third-Party Services:</strong> We use reputable cloud
              providers with strong security practices
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Data Sharing and Disclosure
          </h2>
          <p className="mb-4">
            We do not sell your personal information. We may share data in these
            limited circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>AI Service Providers:</strong> Trusted partners who help
              process images and text for analysis
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In case of merger,
              acquisition, or sale of assets
            </li>
            <li>
              <strong>Anonymized Data:</strong> Aggregated, non-identifiable
              data for research and improvement
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">
            Contact Us
          </h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Email:</strong> admin@polygot.tech
            </p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

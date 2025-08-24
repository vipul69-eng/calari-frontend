/* eslint-disable react/no-unescaped-entities */
import LegalLayout from "@/components/legal-layout"

export default function TermsAndConditions() {
  return (
    <LegalLayout title="Terms and Conditions" lastUpdated="January 2025">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Agreement to Terms</h2>
          <p className="mb-4">
            By accessing and using Calari ("the App"), you accept and agree to be bound by the terms and provision of
            this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Description of Service</h2>
          <p className="mb-4">
            Calari is a mobile application that provides calorie counting and nutritional analysis services using
            artificial intelligence and image recognition technology. The service includes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Food image analysis and calorie estimation</li>
            <li>Personalized dietary recommendations</li>
            <li>Meal tracking and nutritional insights</li>
            <li>AI-powered food recognition and analysis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">User Responsibilities</h2>

          <h3 className="text-xl font-medium mb-3 mt-6">Account Security</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You must provide accurate and complete information</li>
            <li>You must notify us immediately of any unauthorized use</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">Acceptable Use</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Use the app only for personal, non-commercial purposes</li>
            <li>Do not upload inappropriate, offensive, or copyrighted content</li>
            <li>Do not attempt to reverse engineer or hack the application</li>
            <li>Do not use the service to violate any laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">AI and Data Processing</h2>
          <p className="mb-4">By using Calari, you acknowledge and agree that:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your images and text data will be processed by AI systems</li>
            <li>AI analysis may not be 100% accurate and should not replace professional medical advice</li>
            <li>We use third-party AI services that may process your data according to their terms</li>
            <li>Nutritional information is provided for informational purposes only</li>
            <li>You should consult healthcare professionals for dietary and medical advice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Intellectual Property</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>The app and its original content are owned by Calari and protected by copyright laws</li>
            <li>You retain ownership of images and content you upload</li>
            <li>By uploading content, you grant us a license to use it for service provision</li>
            <li>You may not reproduce, distribute, or create derivative works without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Medical Disclaimer</h2>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">Important Medical Disclaimer:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calari is not a medical device and should not be used for medical diagnosis</li>
              <li>Nutritional information is estimated and may not be completely accurate</li>
              <li>Always consult healthcare professionals for dietary and medical advice</li>
              <li>Do not rely solely on the app for managing medical conditions</li>
              <li>Individual nutritional needs vary and require professional assessment</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Limitation of Liability</h2>
          <p className="mb-4">
            To the fullest extent permitted by law, Calari shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Loss of profits, data, or use</li>
            <li>Health-related issues arising from app use</li>
            <li>Inaccurate nutritional information</li>
            <li>Service interruptions or technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Service Availability</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>We strive to maintain service availability but cannot guarantee uninterrupted access</li>
            <li>We may modify, suspend, or discontinue features at any time</li>
            <li>We will provide reasonable notice of significant changes when possible</li>
            <li>AI processing times may vary based on system load and complexity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account and access to the service at our sole discretion, without prior
            notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. We will notify users of significant changes through
            the app or email. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-200 pb-2">Contact Information</h2>
          <p className="mb-4">For questions about these Terms and Conditions, please contact us at:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Email:</strong> admin@polygot.tech </p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

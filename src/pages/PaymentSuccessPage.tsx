import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '../components/ui';
import { useUser } from '../context/UserContext';
import { addPurchasedCredits, createPaymentRecord, fetchUserCredits, supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, ArrowRight, SearchCheck, Plus } from 'lucide-react';
import toast from 'react-hot-toast';


export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [userCredits, setUserCredits] = useState<number | null>(null);
 const [actionMyPayment, setActionMyPayment] = useState(false);
//   useEffect(() => {
    const processPayment = async () => {
      try {
        //localstorage check
        if (localStorage.getItem('creditsUpdatedTx')) {
            navigate('/profile');
        }
        // Get parameters from URL
        const transactionId = searchParams.get('tx');
        const status = searchParams.get('st');
        const amount = searchParams.get('amt');  
        const currency = searchParams.get('cc'); 
        const itemNumber = searchParams.get('item_number');

        // Validate required parameters
        if (!transactionId || !status || !itemNumber) {
          setErrorMessage('Missing required payment information');
          setSuccess(false);
          setIsProcessing(false);
          return;
        }

        // Check if payment was successful
        if (status !== 'Completed') {
          setErrorMessage(`Payment was not completed. Status: ${status}`);
          setSuccess(false);
          setIsProcessing(false);
          return;
        }

        // Get the number of credits to add based on the item_number
        const creditsToAdd = import.meta.env.VITE_BRANDII_CREDITS;
        if (!creditsToAdd) {
          setErrorMessage(`Invalid item number: ${itemNumber}`);
          setSuccess(false);
          setIsProcessing(false);
          return;
        }

        // Make sure we have a user profile
        if (!profile?.id) {
          setErrorMessage('User not authenticated');
          setSuccess(false);
          setIsProcessing(false);
          return;
        }

        // Add credits to the user's account
        // await addPurchasedCredits(profile.id, creditsToAdd, transactionId);
        
        // // Refresh user profile to get updated credit information
        // await refreshProfile();
        
        // // Get updated credit information
        // const updatedCredits = await fetchUserCredits();
        // setUserCredits(updatedCredits?.available_credits || null);
        
        //create payment record
        
         const paymentRecord = await createPaymentRecord({
            user_id: profile.id,
            provider: 'paypal',
            provider_payment_id: transactionId,
            amount: Number(amount),
            currency: currency || 'USD',
            status: 'completed',
            metadata: { payment_method: 'paypal', product_id: itemNumber, credits_added: creditsToAdd }
          });

          if (!paymentRecord) {
            throw new Error('Failed to create payment record');
          }

        //savetolocalstorage
        localStorage.setItem('creditsUpdatedTx', transactionId);
        // Set success state
        setCreditsAdded(creditsToAdd);
        setSuccess(true);
        refreshProfile();
        // console.log('Payment processed successfully');
        toast.success(`Successfully added ${creditsToAdd} credits to your account!`);
      } catch (error) {
        console.error('Error processing payment:', error);
        setErrorMessage('An error occurred while processing your payment. Please contact support.');
        setSuccess(false);
      } finally {
        setIsProcessing(false);
      }
    };

    //localstorage check
    useEffect(() => {
    if (localStorage.getItem('creditsUpdatedTx')) {
      navigate('/profile');
    }
    }, [refreshProfile]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {isProcessing ? (
                  'Processing Payment...'
                ) : success && !isProcessing ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Payment Successful
                  </>
                ) : !actionMyPayment && !isProcessing ? (
                  <>
                    <Plus className="h-6 w-6 text-blue-500" />
                    Add My Credits

                   
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    Payment Issue
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {isProcessing
                  ? 'Please wait while we process your payment...'
                  : success
                  ? 'Your credits have been added to your account'
                  : !actionMyPayment && !isProcessing ? 'Click the button below to add credits to your account' : 'There was an issue with your payment'}
              </CardDescription>

        {!actionMyPayment && (
                <CardContent>   
                    <Button 
                    variant="primary"
                    className="w-full"
                    onClick={processPayment}>Process My Payment</Button>
                </CardContent>
                )}
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
              ) : success ? (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      Thank you for your purchase! We've added {creditsAdded} credits to your account.
                    </p>
                  </div>
                  
                  {userCredits !== null && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your current balance</p>
                      <p className="text-xl font-semibold">{userCredits} credits</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={() => navigate('/profile')}
                      variant="outline"
                      className="flex-1"
                    >
                      View My Account
                    </Button>
                    <Button
                      onClick={() => navigate('/image-generator')}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      Start Creating
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) :  actionMyPayment && !success ? (
                <div className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                    <p className="text-red-800 dark:text-red-300">
                      {errorMessage || 'There was an error processing your payment.'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={() => navigate('/profile')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back to My Account
                    </Button>
                    <Button
                      onClick={() => window.location.href = `${import.meta.env.VITE_ADDITIONAL_CREDITS_URL}`}
                      className="flex-1"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <></>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

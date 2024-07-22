'use client';

import { useQuery } from '@tanstack/react-query';
import { getPaymentStatus } from './actions';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ThankYou = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  const { data } = useQuery({
    queryKey: ['get-payment-status'],
    queryFn: async () => await getPaymentStatus({ orderId }),
    retry: true,
    retryDelay: 500,
  });

  if (data === undefined) {
    return (
      <div className='w-full mt-24 flex justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
          <h3 className='font-semibold text-xl'>Loading your order...</h3>
          <p>This won't take long.</p>
        </div>
      </div>
    );
  }
  if (data === false) {
    return (
      <div className='w-full mt-24 flex justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
          <h3 className='font-semibold text-xl'>Verify your payment...</h3>
          <p>This might take a moment.</p>
        </div>
      </div>
    );
  }

  const { configuration, billingAddress, shippingAddress, amount } = data;
  const { color } = configuration;

  return (
    <div className='bg-white'>
      <div className='mx-auto max-w-3xl px-4 py-16 sm:px-5 sm:py-24 lg:px-8'>
        <div className='max-w-xl'>
          <p className='text-base font-medium text-primary'>Thank You!</p>
          <h1 className='mt-2 text-4xl font-bold tracking-tight sm:text-5xl'>
            Your case is on the way!
          </h1>
          <p className='mt-2 text-base text-zinc-500'>
            We've received your order and are noew processing it.
          </p>
          <div className='mt-12 text-sm font-medium'>
            <p className='text-zinc-900'>Order number:</p>
            <p className='mt-2 text-zinc-500'>{orderId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ThankYou;

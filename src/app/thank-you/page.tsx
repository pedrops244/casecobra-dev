import { Suspense } from 'react';
import ThankYou from './ThankYou';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <Suspense>
      <ThankYou user={user!} />
    </Suspense>
  );
};

export default Page;

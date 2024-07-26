'use server';

import { db } from '@/db';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';

export const getPaymentStatus = async ({
  orderId,
  user,
}: {
  orderId: string;
  user: KindeUser;
}) => {
  if (!user?.id || !user.email) {
    throw new Error('You need to be logged in to view this page');
  }

  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      billingAddress: true,
      configuration: true,
      shippingAddress: true,
      user: true,
    },
  });
  if (!order) throw new Error('This order does not exist.');

  if (order.isPaid) {
    return order;
  } else {
    return false;
  }
};

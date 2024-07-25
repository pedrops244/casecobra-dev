import { db } from '@/db';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import OrderReceivedEmail from '@/components/emails/OrderReceivedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': `${process.env.NEXT_PUBLIC_SERVER_URL}`,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, stripe-signature',
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing signature');
      return new NextResponse('Invalid signature', {
        status: 400,
        headers: corsHeaders,
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error('Error constructing Stripe event:', err);
      return new NextResponse('Error constructing event', {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { customer_details } = session;

      if (!customer_details?.email) {
        throw new Error('Missing user email');
      }

      const { userId, orderId } = session.metadata || {
        userId: null,
        orderId: null,
      };

      if (!userId || !orderId) {
        throw new Error('Invalid request metadata');
      }

      const billingAddress = customer_details!.address;
      const shippingAddress = session.shipping_details!.address;

      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: customer_details!.name!,
              city: shippingAddress!.city!,
              country: shippingAddress!.country!,
              postalCode: shippingAddress!.postal_code!,
              street: shippingAddress!.line1!,
              state: shippingAddress!.state,
            },
          },
          billingAddress: {
            create: {
              name: customer_details!.name!,
              city: billingAddress!.city!,
              country: billingAddress!.country!,
              postalCode: billingAddress!.postal_code!,
              street: billingAddress!.line1!,
              state: billingAddress!.state,
            },
          },
        },
      });

      await resend.emails.send({
        from: 'CaseCobra <pedrops244@hotmail.com>',
        to: [customer_details.email],
        subject: 'Thanks for your order!',
        react: OrderReceivedEmail({
          orderId,
          orderDate: updatedOrder.createdAt.toLocaleDateString(),
          // @ts-ignore
          shippingAddress: {
            name: customer_details!.name!,
            city: shippingAddress!.city!,
            country: shippingAddress!.country!,
            postalCode: shippingAddress!.postal_code!,
            street: shippingAddress!.line1!,
            state: shippingAddress!.state,
          },
        }),
      });
    }

    return new NextResponse(JSON.stringify({ result: event, ok: true }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);

    return new NextResponse(
      JSON.stringify({ message: 'Something went wrong', ok: false }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// Função para lidar com requisições OPTIONS para CORS
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

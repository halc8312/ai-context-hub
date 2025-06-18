import { BaseApiCollector, ApiFunction } from '../base-collector'

export class StripeCollector extends BaseApiCollector {
  constructor() {
    super('stripe')
  }

  async collect(): Promise<void> {
    console.log('Collecting Stripe API documentation...')
    
    // Stripe APIの主要な機能をハードコードで定義
    // 実際のプロダクションでは、Stripe APIドキュメントをスクレイピングまたはAPIで取得
    const functions = await this.getStripeFunctions()
    
    // 各カテゴリごとにMarkdownファイルを生成
    await this.generatePaymentIntentsDoc(functions.paymentIntents)
    await this.generateCustomersDoc(functions.customers)
    await this.generateSubscriptionsDoc(functions.subscriptions)
    
    console.log('Stripe API documentation collection completed!')
  }

  private async getStripeFunctions() {
    return {
      paymentIntents: [
        {
          name: 'Create a PaymentIntent',
          description: 'Creates a PaymentIntent object to track a payment from start to finish.',
          endpoint: '/v1/payment_intents',
          method: 'POST',
          parameters: [
            {
              name: 'amount',
              type: 'integer',
              required: true,
              description: 'Amount intended to be collected by this PaymentIntent (in cents)'
            },
            {
              name: 'currency',
              type: 'string',
              required: true,
              description: 'Three-letter ISO currency code (e.g., usd)'
            },
            {
              name: 'payment_method_types',
              type: 'array',
              required: false,
              description: 'Payment method types to be used (e.g., ["card"])'
            },
            {
              name: 'description',
              type: 'string',
              required: false,
              description: 'Description of the payment'
            }
          ],
          example: `const stripe = require('stripe')('sk_test_...');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00
  currency: 'usd',
  payment_method_types: ['card'],
  description: 'Order #12345'
});`,
          response: `{
  "id": "pi_1234567890",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "requires_payment_method",
  "client_secret": "pi_1234567890_secret_abcdef"
}`
        },
        {
          name: 'Retrieve a PaymentIntent',
          description: 'Retrieves the details of a PaymentIntent that has previously been created.',
          endpoint: '/v1/payment_intents/:id',
          method: 'GET',
          parameters: [
            {
              name: 'id',
              type: 'string',
              required: true,
              description: 'The identifier of the PaymentIntent to be retrieved'
            }
          ],
          example: `const paymentIntent = await stripe.paymentIntents.retrieve(
  'pi_1234567890'
);`,
          response: `{
  "id": "pi_1234567890",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "succeeded"
}`
        }
      ],
      customers: [
        {
          name: 'Create a Customer',
          description: 'Creates a new customer object.',
          endpoint: '/v1/customers',
          method: 'POST',
          parameters: [
            {
              name: 'email',
              type: 'string',
              required: false,
              description: 'Customer\'s email address'
            },
            {
              name: 'name',
              type: 'string',
              required: false,
              description: 'Customer\'s full name or business name'
            },
            {
              name: 'phone',
              type: 'string',
              required: false,
              description: 'Customer\'s phone number'
            },
            {
              name: 'metadata',
              type: 'object',
              required: false,
              description: 'Set of key-value pairs for storing additional information'
            }
          ],
          example: `const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  metadata: {
    user_id: '12345'
  }
});`,
          response: `{
  "id": "cus_1234567890",
  "object": "customer",
  "email": "customer@example.com",
  "name": "John Doe",
  "created": 1234567890
}`
        }
      ],
      subscriptions: [
        {
          name: 'Create a Subscription',
          description: 'Creates a new subscription on an existing customer.',
          endpoint: '/v1/subscriptions',
          method: 'POST',
          parameters: [
            {
              name: 'customer',
              type: 'string',
              required: true,
              description: 'The identifier of the customer to subscribe'
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              description: 'List of subscription items, each with an attached price'
            },
            {
              name: 'trial_period_days',
              type: 'integer',
              required: false,
              description: 'Number of trial period days before charging'
            }
          ],
          example: `const subscription = await stripe.subscriptions.create({
  customer: 'cus_1234567890',
  items: [
    {price: 'price_1234567890'},
  ],
  trial_period_days: 14
});`,
          response: `{
  "id": "sub_1234567890",
  "object": "subscription",
  "customer": "cus_1234567890",
  "status": "trialing",
  "current_period_end": 1234567890
}`
        }
      ]
    }
  }

  private async generatePaymentIntentsDoc(functions: ApiFunction[]) {
    let markdown = `# Stripe Payment Intents API

Payment Intents API is the recommended way to handle complex payment flows. It tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required.

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('payment-intents.md', markdown)
  }

  private async generateCustomersDoc(functions: ApiFunction[]) {
    let markdown = `# Stripe Customers API

The Customers API allows you to create and manage customers. You can store multiple payment methods on a customer to charge at a later time.

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('customers.md', markdown)
  }

  private async generateSubscriptionsDoc(functions: ApiFunction[]) {
    let markdown = `# Stripe Subscriptions API

The Subscriptions API allows you to create and manage recurring payments. Subscriptions automatically generate invoices and charge customers on a recurring basis.

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('subscriptions.md', markdown)
  }
}
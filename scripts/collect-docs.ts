import { StripeCollector } from './collectors/stripe-collector'
import { SendGridCollector } from './collectors/sendgrid-collector'
import { TwilioCollector } from './collectors/twilio-collector'
import { SupabaseCollector } from './collectors/supabase-collector'

async function main() {
  const collectors = [
    new StripeCollector(),
    new SendGridCollector(),
    new TwilioCollector(),
    new SupabaseCollector(),
  ]

  for (const collector of collectors) {
    try {
      await collector.collect()
    } catch (error) {
      console.error(`Error collecting ${collector.constructor.name}:`, error)
    }
  }
}

main().catch(console.error)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Content Generator Hub</h1>
          <p className="text-muted-foreground">
            AI-powered social media content generator voor jouw merk
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Welkom</h2>
            <p className="text-sm text-muted-foreground">
              Log in of maak een account aan om te beginnen met het genereren van content.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors text-center"
            >
              Inloggen
            </Link>
            <Link
              href="/auth/sign-up"
              className="w-full py-3 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-xl transition-colors text-center"
            >
              Account aanmaken
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Genereer professionele social media content met AI
        </p>
      </div>
    </main>
  )
}

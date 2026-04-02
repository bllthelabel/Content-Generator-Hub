import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <i className="fa-solid fa-check text-2xl text-primary"></i>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Check je e-mail</h1>
            <p className="text-sm text-muted-foreground">
              We hebben een bevestigingslink naar je e-mailadres gestuurd. 
              Klik op de link om je account te activeren.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/auth/login"
              className="text-primary hover:underline text-sm"
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

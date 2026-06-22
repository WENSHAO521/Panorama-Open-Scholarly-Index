import { redirect } from 'next/navigation'

// OJQF has been renamed to PQF in POSI 2.0
export default function OjqfRedirect() {
  redirect('/pqf')
}

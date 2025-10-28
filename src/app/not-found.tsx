import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ZapOffIcon } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyContent,
  EmptyDescription,
} from '@/components/ui/empty'

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ZapOffIcon />
        </EmptyMedia>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </EmptyDescription>
      </EmptyContent>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </Empty>
  )
}

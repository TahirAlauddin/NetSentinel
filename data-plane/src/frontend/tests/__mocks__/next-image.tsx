/**
 * Mock for next/image
 * Provides test implementation for Next.js Image component
 */

import React from 'react'

export default function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />
}


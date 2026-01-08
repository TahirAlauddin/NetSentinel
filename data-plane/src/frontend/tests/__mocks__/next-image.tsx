/**
 * Mock for next/image
 * Provides test implementation for Next.js Image component
 */

import React from 'react'

export default function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} alt={props.alt || ''} />
}


'use client';

import { AppProgressBar as ProgressBarComponent } from 'next-nprogress-bar';

export default function ProgressBar() {
  return (
    <ProgressBarComponent
      height='2px'
      color='#000'
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}

import Image from 'next/image';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 40, className = '' }: LogoIconProps) {
  return (
    <>
      <Image
        src="/images/logo-dark.svg"
        width={size}
        height={size}
        alt="Clodeb"
        className={`dark:hidden ${className}`}
      />
      <Image
        src="/images/logo-white.svg"
        width={size}
        height={size}
        alt="Clodeb"
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}

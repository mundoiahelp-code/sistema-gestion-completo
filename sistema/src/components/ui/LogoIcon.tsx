import Image from 'next/image';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 40, className = '' }: LogoIconProps) {
  return (
    <Image
      src="/images/logo.png"
      width={size}
      height={size}
      alt="Clodeb"
      className={className}
    />
  );
}

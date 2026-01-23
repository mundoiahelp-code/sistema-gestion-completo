import { LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Props {
  data: {
    title: string;
    icon: LucideIcon;
    value: number;
    color: string;
  }[];
}

type colors = { [key: string]: string };

export default function Cards({ data }: Props) {
  const backgroundIcon: colors = {
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
  };
  const colorIcon: colors = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
  };

  return (
    <section className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4'>
      {data.map((item, i) => (
        <article
          key={i}
          className='rounded-md p-3 sm:p-4 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row justify-between gap-2'
        >
          <div>
            <span
              className={twMerge(
                backgroundIcon[item.color],
                'rounded-lg h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center mb-2'
              )}
            >
              <item.icon
                className={twMerge(
                  colorIcon[item.color],
                  'stroke-[1.5] h-6 w-6 sm:h-8 sm:w-8'
                )}
              />
            </span>
            <span className='font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base'>{item.title}</span>
          </div>
          <span className='font-medium text-2xl sm:text-4xl dark:text-white'>{item.value}</span>
        </article>
      ))}
    </section>
  );
}

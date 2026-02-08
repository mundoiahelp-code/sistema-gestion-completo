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
    <section className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
      {data.map((item, i) => (
        <article
          key={i}
          className='rounded-xl p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow'
        >
          <div className="flex flex-col gap-3">
            <span
              className={twMerge(
                backgroundIcon[item.color],
                'rounded-xl h-12 w-12 flex items-center justify-center flex-shrink-0'
              )}
            >
              <item.icon
                className={twMerge(
                  colorIcon[item.color],
                  'stroke-[1.5] h-6 w-6'
                )}
              />
            </span>
            <div className="flex flex-col gap-1">
              <span className='font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-tight'>{item.title}</span>
              <span className='font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white'>{item.value}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

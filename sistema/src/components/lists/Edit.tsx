import { IList } from '@/interfaces/schemas.interfaces';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';
import { CheckIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import axios, { AxiosRequestConfig } from 'axios';
import { API } from '@/config/api';
import { useRouter } from 'next/navigation';
import useCookie from '@/hooks/useCookie';

interface Props {
  data: IList;
  setState: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Edit({ data, setState }: Props) {
  const [loading, setLoading] = useState(false);

  const [text, setText] = useState<string>(
    data.text.replace(/<br\s?\/?>/g, '\n')
  );

  const [accessToken, setAccessToken] = useCookie('accessToken', false);

  const router = useRouter();

  const handleConfirm = () => {
    if (!text) return;

    setLoading(true);
    const config: AxiosRequestConfig = {
      url: `${API}/list/${data.type}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        text: text.replace(/\r\n|\r|\n/g, '<br />'),
      },
    };
    axios(config)
      .then(() => {
        setLoading(false);
        setState(false);
        router.refresh();
      })
      .catch(() => {});
  };

  return (
    <div className={twMerge(loading ? 'opacity-60' : '', 'bg-white dark:bg-zinc-900')}>
      <div className='relative'>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={50}
          className='pt-10'
          disabled={loading}
        />
        <div className='absolute top-0 right-0 flex items-center'>
          <Button
            variant={'outline'}
            className='rounded-r-none'
            disabled={loading}
            onClick={handleConfirm}
          >
            <CheckIcon className='stroke-1 text-green-500' />
          </Button>
          <Button
            variant={'outline'}
            className='rounded-l-none'
            disabled={loading}
            onClick={() => {
              setText(data.text);
              setState(false);
            }}
          >
            <XIcon className='stroke-1 text-red-500' />
          </Button>
        </div>
      </div>
    </div>
  );
}

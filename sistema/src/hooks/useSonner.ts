import { toast } from 'sonner';

export default function useSonner() {
  const handleErrorSonner = (msg: string): void => {
    toast(msg, {
      duration: 2000,
      style: {
        backgroundColor: '#f27474',
        fontWeight: 'bolder',
        borderWidth: '0',
        color: 'white',
      },
    });
  };

  const handleSuccessSonner = (msg: string): void => {
    toast(msg, {
      duration: 2000,
      style: {
        backgroundColor: '#20bf6b',
        fontWeight: 'bolder',
        borderWidth: '0',
        color: 'white',
      },
    });
  };

  return { handleErrorSonner, handleSuccessSonner };
}

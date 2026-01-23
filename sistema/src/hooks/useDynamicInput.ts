type CB<T> = React.Dispatch<React.SetStateAction<T>>;

export default function useDynamicInput<T>() {
  const handleAdd = (structure: T, cb: CB<T[]>) => {
    cb((prev) => [...prev, structure]);
  };

  const handleUpdate = (
    key: string,
    value: string,
    index: number,
    cb: CB<T[]>
  ) => {
    cb((prev) => {
      const items = [...prev];
      items[index] = { ...items[index], [key]: value };

      return [...items];
    });
  };

  const handleDelete = (index: number, cb: CB<T[]>) => {
    cb((prev) => {
      const items = [...prev];

      items.splice(index, 1);

      return [...items];
    });
  };

  return { handleAdd, handleUpdate, handleDelete };
}

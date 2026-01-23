import Single from '@/components/sales/single/Single';

const PageVentasSingle = ({ params }: { params: { id: string } }) => {
  return <Single id={params.id} />;
};

export default PageVentasSingle;

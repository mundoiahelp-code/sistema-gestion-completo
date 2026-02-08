import SingleOrder from '@/components/orders/single/Single';

const PageIngresosIndividual = ({ params }: { params: { id: string } }) => {
  return <SingleOrder id={params.id} />;
};

export default PageIngresosIndividual;

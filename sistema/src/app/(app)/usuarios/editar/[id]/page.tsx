import EditUser from '@/components/users/EditUser';

interface Props {
  params: { id: string };
}

const PageUsuariosEditar = ({ params }: Props) => {
  return <EditUser userId={params.id} />;
};

export default PageUsuariosEditar;

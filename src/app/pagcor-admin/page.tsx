import { redirect } from 'next/navigation';

export default function PagcorAdminIndex() {
  redirect('/pagcor-admin/game-records/all-plat-records');
}

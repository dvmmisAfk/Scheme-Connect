import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Column, TopBar } from '@/components/ui';

export function NotFound() {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <>
      <TopBar back="/" />
      <Column>
        <p className="py-12 text-lg">{t('common.notFound')}</p>
        <Button className="w-full" onClick={() => nav('/')}>
          {t('common.home')}
        </Button>
      </Column>
    </>
  );
}


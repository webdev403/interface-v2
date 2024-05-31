import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useActiveWeb3React } from 'hooks';
import { HypeLabAds } from 'components';
import 'pages/styles/farm.scss';
// import V3Farms from 'pages/FarmPage/V3';
// import { getConfig } from '../../config/index';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

const FarmPage = (
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { chainId } = useActiveWeb3React();
  const router = useRouter();
  // const config = getConfig(chainId);
  // const farmAvailable = config['farm']['available'];

  // useEffect(() => {
  //   if (!farmAvailable) {
  //     router.push('/');
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [farmAvailable]);

  return (
    <Box width='100%' mb={3} id='farmPage'>
      <Box margin='0 auto 24px'>
        <HypeLabAds />
      </Box>
      {/* <V3Farms /> */}
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default FarmPage;
